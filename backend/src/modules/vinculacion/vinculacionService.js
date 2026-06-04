const fs = require('fs');
const path = require('path');
const repository = require('./vinculacionRepository');
const VinculacionPdfGenerator = require('./vinculacionPdfGenerator');
const ZipBuilder = require('./zipBuilder');
const { buildPeriodoClave, monthName } = require('./periodUtils');

const MAX_EVIDENCES = 30;
const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_EVIDENCE_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const RESPONSABLE_ROLE = 'Responsable de vinculación';
const STORAGE_ROOT = process.env.VINCULACION_STORAGE_ROOT
  || path.join(__dirname, '..', '..', '..', 'storage', 'vinculacion');

/**
 * Servicio de reglas de negocio del modulo de vinculacion.
 * El controlador solo traduce HTTP; aqui se valida y se coordina BD/PDF/ZIP.
 */
class VinculacionService {
  constructor() {
    this.pdfGenerator = new VinculacionPdfGenerator();
  }

  async getCatalogs() {
    return repository.listCatalogs();
  }

  async listTeachers(search, authUser) {
    await this.assertResponsable(authUser);
    return repository.listActiveTeachers(search);
  }

  async createProject(data, authUser) {
    await this.assertResponsable(authUser);
    this.requireFields(data, ['id_periodo', 'id_carrera', 'nombre', 'fecha_inicio', 'fecha_fin']);
    return repository.createProject(data, authUser);
  }

  async updateProjectStatus(projectId, status, authUser) {
    await this.assertResponsable(authUser);
    if (!['ACTIVO', 'CERRADO', 'INACTIVO'].includes(status)) {
      throw this.httpError(400, 'Estado invalido para proyecto');
    }
    const project = await repository.updateProjectStatus(projectId, status);
    if (!project) throw this.httpError(404, 'Proyecto no encontrado');
    return project;
  }

  async assignRole(data, authUser) {
    await this.assertResponsable(authUser);
    this.requireFields(data, ['id_usuario', 'rol_nombre', 'id_periodo', 'id_carrera']);
    const role = await repository.findRoleByName(data.rol_nombre);
    if (!role) throw this.httpError(404, 'Rol no encontrado');

    return repository.assignRole({
      id_usuario: data.id_usuario,
      id_rol: role.id_rol,
      id_carrera: data.id_carrera,
      id_periodo: data.id_periodo,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      estado: data.estado,
    });
  }

  async listRoleAssignments(filters, authUser) {
    await this.assertResponsable(authUser);
    return repository.listRoleAssignments(filters);
  }

  async assignProject(data, authUser) {
    await this.assertResponsable(authUser);
    this.requireFields(data, ['id_usuario', 'id_proyecto', 'id_periodo', 'rol_nombre']);
    const project = await repository.findProjectById(data.id_proyecto);
    if (!project) throw this.httpError(404, 'Proyecto no encontrado');

    const role = await repository.findRoleByName(data.rol_nombre);
    if (!role) throw this.httpError(404, 'Rol no encontrado');

    return repository.assignProject(data);
  }

  async listProjectAssignments(filters, authUser) {
    await this.assertResponsable(authUser);
    return repository.listProjectAssignments(filters);
  }

  async getObservationTemplate(reportTypeId, projectId) {
    return repository.listObservationTemplate(reportTypeId, projectId);
  }

  async createObservationTemplate(data, authUser) {
    await this.assertResponsable(authUser);
    if (!data.id_tipo_informe || !data.titulo) {
      throw this.httpError(400, 'id_tipo_informe y titulo son obligatorios');
    }
    return repository.createObservationTemplate(data);
  }

  async updateObservationTemplateStatus(templateId, status, authUser) {
    await this.assertResponsable(authUser);
    if (!['ACTIVO', 'INACTIVO'].includes(status)) {
      throw this.httpError(400, 'Estado invalido para plantilla');
    }
    const template = await repository.updateObservationTemplateStatus(templateId, status);
    if (!template) throw this.httpError(404, 'Plantilla no encontrada');
    return template;
  }

  async listDeadlines(filters, authUser) {
    await this.assertResponsable(authUser);
    return repository.listDeadlines(filters);
  }

  async upsertDeadline(payload, authUser) {
    await this.assertResponsable(authUser);
    this.requireFields(payload, ['id_periodo', 'id_tipo_informe', 'fecha_limite']);
    const reportType = await repository.findReportTypeById(payload.id_tipo_informe);
    if (!reportType) throw this.httpError(404, 'Tipo de informe no encontrado');

    const periodoClave = buildPeriodoClave({
      frecuencia: reportType.frecuencia,
      mes: payload.mes,
      trimestre: payload.trimestre,
      semestre: payload.semestre,
    });

    return repository.upsertDeadline({
      ...payload,
      periodo_clave: periodoClave,
    });
  }

  async generateReport(payload, authUser, ip) {
    await this.assertUserRole(authUser);
    this.requireFields(payload, ['id_periodo', 'id_carrera', 'id_proyecto', 'id_tipo_informe', 'actividades']);

    const [period, project, reportType] = await Promise.all([
      repository.findPeriodById(payload.id_periodo),
      repository.findProjectById(payload.id_proyecto),
      repository.findReportTypeById(payload.id_tipo_informe),
    ]);

    if (!period) throw this.httpError(404, 'Periodo no encontrado');
    if (!project) throw this.httpError(404, 'Proyecto no encontrado');
    if (project.estado === 'RECHAZADO') throw this.httpError(404, 'Proyecto no encontrado o inactivo');
    if (!reportType || reportType.estado !== 'ACTIVO') throw this.httpError(404, 'Tipo de informe no encontrado o inactivo');
    if (project.id_carrera !== payload.id_carrera) {
      throw this.httpError(400, 'El proyecto no pertenece a la carrera indicada');
    }
    if (reportType.rol_nombre !== authUser.roleName) {
      throw this.httpError(403, 'El rol autenticado no puede generar este tipo de informe');
    }

    const hasPeriodRole = await repository.userHasRole(authUser.id_usuario, authUser.roleName, period.id_periodo);
    if (!hasPeriodRole) {
      throw this.httpError(403, 'El usuario no tiene el rol indicado para este periodo');
    }

    if (authUser.roleName !== RESPONSABLE_ROLE) {
      const hasProjectAssignment = await repository.userHasProjectAssignment(
        authUser.id_usuario,
        authUser.roleName,
        period.id_periodo,
        project.id_proyecto,
      );
      if (!hasProjectAssignment) {
        throw this.httpError(403, 'El usuario no esta asignado a este proyecto');
      }
    }

    const periodoClave = buildPeriodoClave({
      frecuencia: reportType.frecuencia,
      mes: payload.mes,
      trimestre: payload.trimestre,
      semestre: payload.semestre,
    });

    const actividades = this.normalizeActivities(payload.actividades);
    const observaciones = this.normalizeObservations(payload.observaciones, actividades);
    if (actividades.some((activity) => activity.beneficiarios === null)) {
      throw this.httpError(400, 'Beneficiarios es obligatorio');
    }
    if (actividades.some((activity) => !activity.descripcion.trim())) {
      throw this.httpError(400, 'Cada actividad debe tener una descripcion');
    }
    if (actividades.some((activity) => !activity.evidencia_textual.trim())) {
      throw this.httpError(400, 'Cada actividad debe tener una evidencia textual');
    }

    const existingReport = await repository.findReportByUnique({
      id_usuario: authUser.id_usuario,
      id_periodo: period.id_periodo,
      id_proyecto: project.id_proyecto,
      id_tipo_informe: reportType.id_tipo_informe,
      tipo_informe: reportType.nombre,
      periodo_clave: periodoClave,
    });
    if (existingReport) {
      throw this.httpError(409, 'Ya existe un informe para este docente, proyecto, tipo y periodo seleccionado');
    }

    const allEvidences = this.collectEvidences({ actividades: { items: actividades }, observaciones });
    this.validateEvidences(allEvidences);

    const user = await repository.findActiveUserById(authUser.id_usuario);
    const pdfData = {
      tipoInforme: reportType,
      periodoTexto: this.periodText(reportType.frecuencia, payload),
      fechaEmision: new Date().toLocaleDateString('es-EC'),
      rolNombre: authUser.roleName,
      docente: {
        id_usuario: user.id_usuario,
        nombreCompleto: `${user.nombres} ${user.apellidos}`,
      },
      carrera: { id_carrera: project.id_carrera, nombre: project.carrera },
      proyecto: { id_proyecto: project.id_proyecto, nombre: project.nombre },
      actividades: {
        desarrollo: actividades[0]?.descripcion || '',
        beneficiarios: actividades[0]?.beneficiarios ?? '',
        zona: actividades[0]?.zona || '',
        evidencias: actividades[0]?.evidencias || [],
        items: actividades,
      },
      observaciones,
    };

    const pdfBuffer = await this.pdfGenerator.generate(pdfData);
    const pdfName = this.buildPdfName(reportType, user, period, payload, periodoClave);
    const pdfPath = this.savePdf(pdfBuffer, period.nombre, project.carrera, pdfName);

    const report = await repository.createReport({
      id_usuario: authUser.id_usuario,
      id_periodo: period.id_periodo,
      id_carrera: project.id_carrera,
      id_proyecto: project.id_proyecto,
      id_tipo_informe: reportType.id_tipo_informe,
      rol_nombre: authUser.roleName,
      periodo_clave: periodoClave,
      mes: payload.mes || null,
      trimestre: payload.trimestre || null,
      semestre: payload.semestre || null,
      datos_json: this.stripEvidencePayload({ ...payload, actividades: { ...payload.actividades, items: actividades }, observaciones }),
      tipo_informe: reportType,
      actividades,
      observaciones,
      nombre_pdf: pdfName,
      ruta_pdf: pdfPath,
    });

    await repository.logAction({
      id_usuario: authUser.id_usuario,
      accion: 'GENERAR_INFORME_VINCULACION',
      id_informe: report.id_informe,
      detalle_json: { nombre_pdf: pdfName, periodo_clave: periodoClave },
      ip_origen: ip,
    });

    return report;
  }

  async listReports(filters, authUser) {
    return repository.listReports(filters, authUser);
  }

  async downloadPdf(reportId, authUser, ip) {
    const report = await repository.findReportById(reportId);
    if (!report) throw this.httpError(404, 'Informe no encontrado');
    this.assertCanAccessReport(report, authUser);

    if (!report.ruta_pdf || !fs.existsSync(report.ruta_pdf)) {
      throw this.httpError(404, 'Archivo PDF no encontrado en el servidor');
    }

    await repository.markPdfDownloaded(reportId);
    await repository.logAction({
      id_usuario: authUser.id_usuario,
      accion: 'DESCARGAR_PDF_VINCULACION',
      id_informe: report.id_informe,
      detalle_json: { nombre_pdf: report.nombre_pdf },
      ip_origen: ip,
    });

    return {
      path: report.ruta_pdf,
      filename: report.nombre_pdf,
    };
  }

  async downloadZip(filters, authUser, ip) {
    const reports = await repository.listReports(
      {
        id_periodo: filters.id_periodo,
        estado: filters.estado || undefined,
      },
      authUser,
    );

    const selectedReports = reports.filter((report) =>
      report.periodo_clave === filters.periodo_clave && report.ruta_pdf && fs.existsSync(report.ruta_pdf),
    );

    if (!selectedReports.length) {
      throw this.httpError(404, 'No existen PDFs para el respaldo solicitado');
    }

    const zip = new ZipBuilder();
    selectedReports.forEach((report) => {
      zip.addFileFromPath(report.nombre_pdf, report.ruta_pdf);
    });

    const zipRecord = await repository.createZipDownload({
      id_usuario: authUser.id_usuario,
      id_periodo: filters.id_periodo,
      tipo_descarga: filters.tipo_descarga,
      periodo_clave: filters.periodo_clave,
      cantidad_pdfs: selectedReports.length,
    });

    await repository.logAction({
      id_usuario: authUser.id_usuario,
      accion: 'DESCARGAR_ZIP_VINCULACION',
      detalle_json: {
        id_descarga_zip: zipRecord.id_descarga_zip,
        tipo_descarga: filters.tipo_descarga,
        periodo_clave: filters.periodo_clave,
        cantidad_pdfs: selectedReports.length,
      },
      ip_origen: ip,
    });

    return {
      buffer: zip.build(),
      filename: `RESPALDO_VINCULACION_${filters.tipo_descarga}_${filters.periodo_clave}.zip`,
    };
  }

  async evaluateDeadlines(referenceDate, authUser) {
    await this.assertResponsable(authUser);
    const closed = await repository.closeExpiredReports(referenceDate);
    const incumplidos = await repository.createMissingDeadlinesAsNonCompliance(referenceDate);
    return { cerrados: closed.length, incumplidos: incumplidos.length };
  }

  async listLogs(filters, authUser) {
    await this.assertResponsable(authUser);
    return repository.listLogs(filters);
  }

  normalizeActivities(activitiesPayload = {}) {
    const rawItems = Array.isArray(activitiesPayload.items) && activitiesPayload.items.length
      ? activitiesPayload.items
      : [{
        id: 'actividad-1',
        titulo: 'Desarrollo de actividades',
        descripcion: activitiesPayload.desarrollo || '',
        evidencia_textual: activitiesPayload.evidencia_textual || '',
        beneficiarios: activitiesPayload.beneficiarios,
        zona: activitiesPayload.zona || '',
        evidencias: activitiesPayload.evidencias || [],
      }];

    return rawItems.map((item, index) => {
      const beneficiaries = item.beneficiarios === '' || item.beneficiarios === undefined || item.beneficiarios === null
        ? null
        : Number(item.beneficiarios);

      if (beneficiaries !== null && (!Number.isInteger(beneficiaries) || beneficiaries < 0 || beneficiaries > 999999)) {
        throw this.httpError(400, 'Beneficiarios debe ser un numero entero entre 0 y 999999');
      }

      return {
        id: item.id || `actividad-${index + 1}`,
        titulo: item.titulo || `Actividad ${index + 1}`,
        descripcion: item.descripcion || '',
        evidencia_textual: item.evidencia_textual || item.evidenciaTexto || '',
        beneficiarios: beneficiaries,
        zona: item.zona || '',
        evidencias: item.evidencias || [],
      };
    });
  }

  normalizeObservations(observationsPayload = [], activities = []) {
    const firstActivityId = activities[0]?.id || 'actividad-1';

    return observationsPayload.map((item, index) => ({
      id: item.id || `observacion-${index + 1}`,
      titulo: item.titulo || `Observacion ${index + 1}`,
      detalle: item.detalle || '',
      id_actividad: item.id_actividad || item.idActividad || firstActivityId,
      evidencias: item.evidencias || [],
    }));
  }

  collectEvidences(payload) {
    const activityItems = payload.actividades?.items || [];
    const activityEvidences = activityItems.length
      ? activityItems.flatMap((item) => item.evidencias || [])
      : payload.actividades?.evidencias || [];
    const observationEvidences = (payload.observaciones || []).flatMap((item) => item.evidencias || []);
    return [...activityEvidences, ...observationEvidences];
  }

  validateEvidences(evidences) {
    if (evidences.length > MAX_EVIDENCES) {
      throw this.httpError(400, `Maximo ${MAX_EVIDENCES} evidencias por informe`);
    }

    let totalSize = 0;

    evidences.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
        throw this.httpError(400, 'Solo se permiten imagenes JPG, JPEG y PNG');
      }

      const base64 = String(file.dataUrl || '').split(',')[1] || '';
      const size = Buffer.byteLength(base64, 'base64');
      totalSize += size;
      if (size > MAX_EVIDENCE_BYTES) {
        throw this.httpError(400, `Cada evidencia debe pesar maximo ${MAX_EVIDENCE_BYTES / 1024 / 1024} MB`);
      }
    });

    if (totalSize > MAX_TOTAL_EVIDENCE_BYTES) {
      throw this.httpError(400, `El total de evidencias debe pesar maximo ${MAX_TOTAL_EVIDENCE_BYTES / 1024 / 1024} MB`);
    }
  }

  stripEvidencePayload(payload) {
    const clone = JSON.parse(JSON.stringify(payload));
    if (clone.actividades?.items) {
      clone.actividades.items = clone.actividades.items.map((item) => ({
        ...item,
        evidencias: (item.evidencias || []).map((file) => ({
          nombre: file.nombre,
          mimeType: file.mimeType,
        })),
      }));
    }
    if (clone.actividades?.evidencias) {
      clone.actividades.evidencias = clone.actividades.evidencias.map((file) => ({
        nombre: file.nombre,
        mimeType: file.mimeType,
      }));
    }
    if (clone.observaciones) {
      clone.observaciones = clone.observaciones.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        detalle: item.detalle,
        id_actividad: item.id_actividad,
        evidencias: (item.evidencias || []).map((file) => ({
          nombre: file.nombre,
          mimeType: file.mimeType,
        })),
      }));
    }
    return clone;
  }

  periodText(frequency, payload) {
    if (frequency === 'MENSUAL' || frequency === 'CONSOLIDADO') return monthName(payload.mes);
    if (frequency === 'TRIMESTRAL') return `TRIMESTRE ${payload.trimestre}`;
    return `SEMESTRE ${payload.semestre || 1}`;
  }

  buildPdfName(reportType, user, period, payload, periodoClave) {
    const person = `${user.nombres}_${user.apellidos}`;
    const raw = `${reportType.codigo}_${reportType.nombre}_${person}_${period.nombre}_${periodoClave}.pdf`;
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .toUpperCase();
  }

  savePdf(buffer, periodName, careerName, filename) {
    const safePeriod = String(periodName).replace(/[^A-Za-z0-9._-]+/g, '_');
    const safeCareer = String(careerName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_');
    const dir = path.join(STORAGE_ROOT, 'pdfs', safePeriod, safeCareer);
    fs.mkdirSync(dir, { recursive: true });
    const outputPath = path.join(dir, filename);
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async assertUserRole(authUser) {
    const role = await repository.findRoleByName(authUser.roleName);
    if (!role) throw this.httpError(403, 'Rol no existe en la base de datos');

    const hasRole = await repository.userHasRole(authUser.id_usuario, authUser.roleName);
    if (!hasRole) throw this.httpError(403, 'El usuario no tiene el rol indicado');
  }

  async assertResponsable(authUser) {
    if (authUser.roleName !== RESPONSABLE_ROLE) {
      throw this.httpError(403, 'Solo el Responsable de vinculación puede realizar esta accion');
    }
    await this.assertUserRole(authUser);
  }

  assertCanAccessReport(report, authUser) {
    if (authUser.roleName === RESPONSABLE_ROLE) return;
    if (report.id_usuario !== authUser.id_usuario) {
      throw this.httpError(403, 'No puede acceder a informes de otro docente');
    }
  }

  httpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  requireFields(payload, fields) {
    const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
    if (missing.length) {
      throw this.httpError(400, `Faltan campos obligatorios: ${missing.join(', ')}`);
    }
  }
}

module.exports = new VinculacionService();
