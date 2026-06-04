const pool = require('../../config/db');

const REPORT_TYPES = [
  { id_tipo_informe: 1, codigo: 'PVV-02-F-005', nombre: 'Informe mensual supervisor', frecuencia: 'MENSUAL', rol_nombre: 'Supervisor', estado: 'ACTIVO' },
  { id_tipo_informe: 2, codigo: 'PVV-02-F-008', nombre: 'Informe trimestral supervisor', frecuencia: 'TRIMESTRAL', rol_nombre: 'Supervisor', estado: 'ACTIVO' },
  { id_tipo_informe: 3, codigo: 'PVV-02-F-006', nombre: 'Informe semestral supervisor', frecuencia: 'SEMESTRAL', rol_nombre: 'Supervisor', estado: 'ACTIVO' },
  { id_tipo_informe: 4, codigo: 'PVV-02-F-005', nombre: 'Informe mensual líder', frecuencia: 'MENSUAL', rol_nombre: 'Líder de proyecto', estado: 'ACTIVO' },
  { id_tipo_informe: 5, codigo: 'PVV-02-F-008', nombre: 'Informe trimestral líder', frecuencia: 'TRIMESTRAL', rol_nombre: 'Líder de proyecto', estado: 'ACTIVO' },
  { id_tipo_informe: 6, codigo: 'PVV-02-F-006', nombre: 'Informe semestral líder', frecuencia: 'SEMESTRAL', rol_nombre: 'Líder de proyecto', estado: 'ACTIVO' },
  { id_tipo_informe: 7, codigo: 'PVV-02-F-005', nombre: 'Informe mensual responsable', frecuencia: 'MENSUAL', rol_nombre: 'Responsable de vinculación', estado: 'ACTIVO' },
  { id_tipo_informe: 8, codigo: 'PVV-02-F-008', nombre: 'Informe trimestral responsable', frecuencia: 'TRIMESTRAL', rol_nombre: 'Responsable de vinculación', estado: 'ACTIVO' },
  { id_tipo_informe: 9, codigo: 'PVV-02-F-006', nombre: 'Informe final semestral responsable', frecuencia: 'FINAL', rol_nombre: 'Responsable de vinculación', estado: 'ACTIVO' },
  { id_tipo_informe: 10, codigo: 'PVV-02-F-007', nombre: 'Consolidado mensual responsable', frecuencia: 'CONSOLIDADO', rol_nombre: 'Responsable de vinculación', estado: 'ACTIVO' },
];

const DEFAULT_OBSERVATION_TEMPLATE = [
  { id_plantilla_observacion: 1, titulo: 'Socialización del proyecto de vinculación', orden: 1 },
  { id_plantilla_observacion: 2, titulo: 'Asignación de estudiantes', orden: 2 },
  { id_plantilla_observacion: 3, titulo: 'Fotografías en el Punto Digital', orden: 3 },
  { id_plantilla_observacion: 4, titulo: 'Registro de asistencia de estudiantes al Punto Digital', orden: 4 },
];

const VINCULACION_FUNCION_ID = 3;

function mapStatus(row) {
  if (row.fecha_cierre) return 'cerrado';
  if (row.fecha_descarga_pdf) return 'descargado';
  if (row.estado === 'RECHAZADO') return 'incumplido';
  if (row.estado === 'BORRADOR') return 'pendiente';
  return 'generado';
}

function normalizeReport(row) {
  return {
    id_informe: row.id_informe_mensual,
    id_usuario: row.id_usuario_vinculacion || row.id_usuario,
    id_periodo: row.id_periodo,
    id_carrera: row.id_carrera,
    id_proyecto: row.id_informe_semestral,
    id_tipo_informe: row.id_tipo_informe || REPORT_TYPES.find((type) => type.nombre === row.tipo_informe_vinculacion)?.id_tipo_informe || null,
    rol_nombre: row.rol_vinculacion,
    periodo_clave: row.periodo_clave_vinculacion,
    mes: row.mes,
    trimestre: row.trimestre_vinculacion,
    semestre: row.semestre_vinculacion,
    estado: mapStatus(row),
    datos_json: row.datos_vinculacion || {},
    nombre_pdf: row.nombre_archivo,
    ruta_pdf: row.ruta_repositorio,
    fecha_generacion: row.fecha_entrega || row.fecha_generacion,
    fecha_descarga_pdf: row.fecha_descarga_pdf,
    fecha_cierre: row.fecha_cierre,
    docente: row.docente,
    carrera: row.carrera,
    proyecto: row.nombre_proyecto,
    tipo_informe: row.tipo_informe_vinculacion,
  };
}

const repository = {
  reportTypes: REPORT_TYPES,

  async query(text, params) {
    return pool.query(text, params);
  },

  async findActiveUserById(userId) {
    const { rows } = await pool.query(
      `
      SELECT id_usuario, nombres, apellidos, email
      FROM seguimiento.usuario
      WHERE id_usuario = $1 AND estado = 'ACTIVO'
      LIMIT 1
      `,
      [userId],
    );
    return rows[0] || null;
  },

  async findRoleByName(roleName) {
    const { rows } = await pool.query(
      `
      SELECT id_rol, nombre
      FROM seguimiento.rol
      WHERE nombre = $1
      LIMIT 1
      `,
      [roleName],
    );
    return rows[0] || null;
  },

  async userHasRole(userId, roleName, periodId) {
    const params = [userId, roleName];
    const periodFilter = periodId ? 'AND ar.id_periodo = $3' : '';
    if (periodId) params.push(periodId);

    const { rows } = await pool.query(
      `
      SELECT 1
      FROM seguimiento.asignacion_rol ar
      INNER JOIN seguimiento.rol r ON r.id_rol = ar.id_rol
      WHERE ar.id_usuario = $1
        AND r.nombre = $2
        ${periodFilter}
        AND (ar.fecha_fin IS NULL OR ar.fecha_fin >= CURRENT_DATE)
      LIMIT 1
      `,
      params,
    );
    return rows.length > 0;
  },

  async assignRole(data) {
    const { rows } = await pool.query(
      `
      INSERT INTO seguimiento.asignacion_rol
        (id_usuario, id_rol, id_carrera, id_periodo, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6)
      ON CONFLICT (id_usuario, id_rol, id_carrera, id_periodo)
      DO UPDATE SET
        fecha_inicio = EXCLUDED.fecha_inicio,
        fecha_fin = EXCLUDED.fecha_fin
      RETURNING *
      `,
      [
        data.id_usuario,
        data.id_rol,
        data.id_carrera,
        data.id_periodo,
        data.fecha_inicio,
        data.fecha_fin || null,
      ],
    );
    return rows[0];
  },

  async listRoleAssignments(filters = {}) {
    const params = [];
    const where = [];
    if (filters.id_periodo) {
      params.push(filters.id_periodo);
      where.push(`ar.id_periodo = $${params.length}`);
    }
    if (filters.rol_nombre) {
      params.push(filters.rol_nombre);
      where.push(`r.nombre = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `
      SELECT ar.*, r.nombre AS rol_nombre, pa.nombre AS periodo,
             c.nombre AS carrera, u.nombres || ' ' || u.apellidos AS docente, u.email
      FROM seguimiento.asignacion_rol ar
      INNER JOIN seguimiento.rol r ON r.id_rol = ar.id_rol
      INNER JOIN seguimiento.periodo_academico pa ON pa.id_periodo = ar.id_periodo
      INNER JOIN seguimiento.carrera c ON c.id_carrera = ar.id_carrera
      INNER JOIN seguimiento.usuario u ON u.id_usuario = ar.id_usuario
      ${whereSql}
      ORDER BY pa.fecha_inicio DESC, r.nombre, u.apellidos, u.nombres
      `,
      params,
    );
    return rows;
  },

  async listCatalogs() {
    const [periodos, carreras, proyectos] = await Promise.all([
      pool.query(`
        SELECT id_periodo, nombre, fecha_inicio, fecha_fin, tipo, estado
        FROM seguimiento.periodo_academico
        ORDER BY fecha_inicio DESC
      `),
      pool.query(`
        SELECT id_carrera, nombre, codigo, estado
        FROM seguimiento.carrera
        WHERE estado = 'ACTIVO'
        ORDER BY nombre
      `),
      pool.query(`
        SELECT isem.id_informe_semestral AS id_proyecto,
               isem.id_carrera,
               c.nombre AS carrera,
               isem.nombre_proyecto AS nombre,
               isem.tipo_proyecto AS descripcion,
               pa.fecha_inicio,
               pa.fecha_fin,
               COALESCE(isem.estado, 'BORRADOR') AS estado
        FROM seguimiento.informe_semestral isem
        INNER JOIN seguimiento.carrera c ON c.id_carrera = isem.id_carrera
        INNER JOIN seguimiento.periodo_academico pa ON pa.id_periodo = isem.id_periodo
        WHERE isem.id_funcion = $1
          AND isem.nombre_proyecto IS NOT NULL
        ORDER BY c.nombre, isem.nombre_proyecto
      `, [VINCULACION_FUNCION_ID]),
    ]);

    return {
      periodos: periodos.rows,
      carreras: carreras.rows,
      proyectos: proyectos.rows.map((project) => ({ ...project, estado: 'ACTIVO' })),
      tiposInforme: REPORT_TYPES,
    };
  },

  async listActiveTeachers(search) {
    const params = [];
    let searchSql = '';
    if (search) {
      params.push(`%${search}%`);
      searchSql = `
        AND (
          u.nombres ILIKE $1 OR
          u.apellidos ILIKE $1 OR
          u.email ILIKE $1 OR
          u.cedula ILIKE $1
        )
      `;
    }

    const { rows } = await pool.query(
      `
      SELECT u.id_usuario, u.cedula, u.nombres, u.apellidos, u.email,
             u.tipo_vinculacion, u.dedicacion, u.estado
      FROM seguimiento.usuario u
      WHERE u.estado = 'ACTIVO'
        AND u.rol = 'DOCENTE'
        ${searchSql}
      ORDER BY u.apellidos, u.nombres
      LIMIT 200
      `,
      params,
    );
    return rows;
  },

  async findPeriodById(periodId) {
    const { rows } = await pool.query(
      `
      SELECT id_periodo, nombre, fecha_inicio, fecha_fin, estado
      FROM seguimiento.periodo_academico
      WHERE id_periodo = $1
      LIMIT 1
      `,
      [periodId],
    );
    return rows[0] || null;
  },

  async findProjectById(projectId) {
    const { rows } = await pool.query(
      `
      SELECT isem.id_informe_semestral AS id_proyecto,
             isem.id_informe_semestral,
             isem.id_usuario,
             isem.id_carrera,
             c.nombre AS carrera,
             isem.nombre_proyecto AS nombre,
             COALESCE(isem.estado, 'BORRADOR') AS estado
      FROM seguimiento.informe_semestral isem
      INNER JOIN seguimiento.carrera c ON c.id_carrera = isem.id_carrera
      WHERE isem.id_informe_semestral = $1
        AND isem.id_funcion = $2
      LIMIT 1
      `,
      [projectId, VINCULACION_FUNCION_ID],
    );
    return rows[0] || null;
  },

  async findReportTypeById(reportTypeId) {
    return REPORT_TYPES.find((type) => type.id_tipo_informe === Number(reportTypeId)) || null;
  },

  async listObservationTemplate() {
    return DEFAULT_OBSERVATION_TEMPLATE;
  },

  async createObservationTemplate(data) {
    return {
      id_plantilla_observacion: Date.now(),
      titulo: data.titulo,
      orden: data.orden || DEFAULT_OBSERVATION_TEMPLATE.length + 1,
      estado: 'ACTIVO',
    };
  },

  async updateObservationTemplateStatus(templateId, status) {
    return {
      id_plantilla_observacion: Number(templateId),
      estado: status,
    };
  },

  async createProject(data, authUser) {
    const periodId = data.id_periodo;
    const { rows } = await pool.query(
      `
      INSERT INTO seguimiento.informe_semestral
        (id_usuario, id_funcion, id_carrera, id_periodo, nombre_proyecto, tipo_proyecto,
         estado, rol_vinculacion, datos_vinculacion)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'VINCULACION'), 'BORRADOR', $7, $8::jsonb)
      RETURNING id_informe_semestral AS id_proyecto, id_carrera, nombre_proyecto AS nombre,
                tipo_proyecto AS descripcion, estado
      `,
      [
        authUser.id_usuario,
        VINCULACION_FUNCION_ID,
        data.id_carrera,
        periodId,
        data.nombre,
        data.descripcion || 'VINCULACION',
        authUser.roleName,
        JSON.stringify({ fecha_inicio: data.fecha_inicio, fecha_fin: data.fecha_fin }),
      ],
    );
    return rows[0];
  },

  async updateProjectStatus(projectId, status) {
    const estado = status === 'ACTIVO' ? 'BORRADOR' : status === 'CERRADO' ? 'APROBADO' : 'RECHAZADO';
    const { rows } = await pool.query(
      `
      UPDATE seguimiento.informe_semestral
      SET estado = $2
      WHERE id_informe_semestral = $1
      RETURNING id_informe_semestral AS id_proyecto, id_carrera, nombre_proyecto AS nombre,
                tipo_proyecto AS descripcion, estado
      `,
      [projectId, estado],
    );
    return rows[0] || null;
  },

  async userHasProjectAssignment() {
    return true;
  },

  async assignProject(data) {
    return data;
  },

  async listProjectAssignments() {
    return [];
  },

  async listDeadlines() {
    return [];
  },

  async upsertDeadline(data) {
    return data;
  },

  async findReportByUnique(data) {
    const { rows } = await pool.query(
      `
      SELECT im.id_informe_mensual, im.estado
      FROM seguimiento.informe_mensual im
      WHERE im.id_informe_semestral = $1
        AND im.periodo_clave_vinculacion = $2
        AND im.tipo_informe_vinculacion = $3
        AND im.id_usuario_vinculacion = $4
      LIMIT 1
      `,
      [data.id_proyecto, data.periodo_clave, data.tipo_informe, data.id_usuario],
    );
    return rows[0] || null;
  },

  async createReport(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const mensual = await client.query(
        `
        INSERT INTO seguimiento.informe_mensual
          (id_informe_semestral, mes, estado, fecha_entrega, rol_vinculacion,
           tipo_informe_vinculacion, frecuencia_vinculacion, periodo_clave_vinculacion,
           trimestre_vinculacion, semestre_vinculacion, datos_vinculacion, id_usuario_vinculacion)
        VALUES ($1, $2, 'ENVIADO', CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
        RETURNING *
        `,
        [
          data.id_proyecto,
          data.mes || data.trimestre * 3 || data.semestre * 6 || 1,
          data.rol_nombre,
          data.tipo_informe.nombre,
          data.tipo_informe.frecuencia,
          data.periodo_clave,
          data.trimestre,
          data.semestre,
          JSON.stringify(data.datos_json),
          data.id_usuario,
        ],
      );
      const report = mensual.rows[0];

      const activityMap = new Map();
      for (const [index, activity] of data.actividades.entries()) {
        const inserted = await client.query(
          `
          INSERT INTO seguimiento.actividad
            (id_informe_mensual, titulo, descripcion, fecha, horas, orden,
             beneficiarios, zona_vinculacion, datos_vinculacion)
          VALUES ($1, $2, $3, CURRENT_DATE, 1, $4, $5, $6, $7::jsonb)
          RETURNING *
          `,
          [
            report.id_informe_mensual,
            activity.titulo,
            activity.descripcion || '',
            index + 1,
            activity.beneficiarios || null,
            activity.zona || null,
            JSON.stringify({
              frontendId: activity.id || null,
              evidencia_textual: activity.evidencia_textual || '',
            }),
          ],
        );
        activityMap.set(activity.id || String(index), inserted.rows[0]);

        for (const evidence of activity.evidencias || []) {
          await client.query(
            `
            INSERT INTO seguimiento.evidencia
              (id_actividad, nombre_archivo, ruta_archivo, mime_type, incluida_en_pdf, datos_vinculacion)
            VALUES ($1, $2, $3, $4, TRUE, $5::jsonb)
            `,
            [
              inserted.rows[0].id_actividad,
              evidence.nombre,
              `PDF_EMBEBIDO:${evidence.nombre}`,
              evidence.mimeType,
              JSON.stringify({ origen: 'actividad' }),
            ],
          );
        }
      }

      for (const [index, observation] of data.observaciones.entries()) {
        const linkedActivity = observation.id_actividad ? activityMap.get(observation.id_actividad) : null;
        const insertedObservation = await client.query(
          `
          INSERT INTO seguimiento.observacion
            (id_informe_mensual, id_usuario, titulo, detalle, estado, orden, id_actividad, datos_vinculacion)
          VALUES ($1, $2, $3, $4, 'PENDIENTE', $5, $6, $7::jsonb)
          RETURNING *
          `,
          [
            report.id_informe_mensual,
            data.id_usuario,
            observation.titulo,
            observation.detalle || 'Sin detalle',
            index + 1,
            linkedActivity?.id_actividad || null,
            JSON.stringify({ evidencias_relacionadas: (observation.evidencias || []).map((item) => item.nombre) }),
          ],
        );

        const targetActivity = linkedActivity || [...activityMap.values()][0];
        for (const evidence of observation.evidencias || []) {
          await client.query(
            `
            INSERT INTO seguimiento.evidencia
              (id_actividad, id_observacion, nombre_archivo, ruta_archivo, mime_type, incluida_en_pdf, datos_vinculacion)
            VALUES ($1, $2, $3, $4, $5, TRUE, $6::jsonb)
            `,
            [
              targetActivity.id_actividad,
              insertedObservation.rows[0].id_observacion,
              evidence.nombre,
              `PDF_EMBEBIDO:${evidence.nombre}`,
              evidence.mimeType,
              JSON.stringify({ origen: 'observacion' }),
            ],
          );
        }
      }

      await client.query(
        `
        INSERT INTO seguimiento.archivo_pdf
          (id_informe_mensual, nombre_archivo, ruta_repositorio, ruta_respaldo_carpeta,
           tipo, estado, periodo_clave_vinculacion, tipo_informe_vinculacion, rol_vinculacion)
        VALUES ($1, $2, $3, $4, 'PDF', 'VIGENTE', $5, $6, $7)
        `,
        [
          report.id_informe_mensual,
          data.nombre_pdf,
          data.ruta_pdf,
          data.ruta_pdf,
          data.periodo_clave,
          data.tipo_informe.nombre,
          data.rol_nombre,
        ],
      );

      await client.query('COMMIT');
      return this.findReportById(report.id_informe_mensual);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async listReports(filters = {}, authUser) {
    const params = [];
    const where = [`isem.id_funcion = ${VINCULACION_FUNCION_ID}`];
    if (authUser.roleName !== 'Responsable de vinculación') {
      params.push(authUser.id_usuario);
      where.push(`im.id_usuario_vinculacion = $${params.length}`);
    }
    if (filters.id_periodo) {
      params.push(filters.id_periodo);
      where.push(`isem.id_periodo = $${params.length}`);
    }
    if (filters.id_carrera) {
      params.push(filters.id_carrera);
      where.push(`isem.id_carrera = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `
      SELECT im.*, isem.id_usuario, isem.id_periodo, isem.id_carrera, isem.id_informe_semestral,
             isem.nombre_proyecto, COALESCE(uv.nombres || ' ' || uv.apellidos, u.nombres || ' ' || u.apellidos) AS docente,
             c.nombre AS carrera, ap.nombre_archivo, ap.ruta_repositorio
      FROM seguimiento.informe_mensual im
      INNER JOIN seguimiento.informe_semestral isem ON isem.id_informe_semestral = im.id_informe_semestral
      INNER JOIN seguimiento.usuario u ON u.id_usuario = isem.id_usuario
      LEFT JOIN seguimiento.usuario uv ON uv.id_usuario = im.id_usuario_vinculacion
      INNER JOIN seguimiento.carrera c ON c.id_carrera = isem.id_carrera
      LEFT JOIN LATERAL (
        SELECT nombre_archivo, ruta_repositorio
        FROM seguimiento.archivo_pdf ap
        WHERE ap.id_informe_mensual = im.id_informe_mensual
        ORDER BY ap.fecha_subida DESC
        LIMIT 1
      ) ap ON true
      ${whereSql}
      ORDER BY im.fecha_entrega DESC NULLS LAST, im.id_informe_mensual DESC
      `,
      params,
    );
    return rows.map(normalizeReport);
  },

  async findReportById(reportId) {
    const { rows } = await pool.query(
      `
      SELECT im.*, isem.id_usuario, isem.id_periodo, isem.id_carrera, isem.id_informe_semestral,
             isem.nombre_proyecto, COALESCE(uv.nombres || ' ' || uv.apellidos, u.nombres || ' ' || u.apellidos) AS docente,
             c.nombre AS carrera, ap.nombre_archivo, ap.ruta_repositorio
      FROM seguimiento.informe_mensual im
      INNER JOIN seguimiento.informe_semestral isem ON isem.id_informe_semestral = im.id_informe_semestral
      INNER JOIN seguimiento.usuario u ON u.id_usuario = isem.id_usuario
      LEFT JOIN seguimiento.usuario uv ON uv.id_usuario = im.id_usuario_vinculacion
      INNER JOIN seguimiento.carrera c ON c.id_carrera = isem.id_carrera
      LEFT JOIN LATERAL (
        SELECT nombre_archivo, ruta_repositorio
        FROM seguimiento.archivo_pdf ap
        WHERE ap.id_informe_mensual = im.id_informe_mensual
        ORDER BY ap.fecha_subida DESC
        LIMIT 1
      ) ap ON true
      WHERE im.id_informe_mensual = $1
      LIMIT 1
      `,
      [reportId],
    );
    return rows[0] ? normalizeReport(rows[0]) : null;
  },

  async markPdfDownloaded(reportId) {
    await pool.query(
      `
      UPDATE seguimiento.informe_mensual
      SET fecha_descarga_pdf = CURRENT_TIMESTAMP
      WHERE id_informe_mensual = $1
      `,
      [reportId],
    );
    await pool.query(
      `
      UPDATE seguimiento.archivo_pdf
      SET fecha_descarga_pdf = CURRENT_TIMESTAMP
      WHERE id_informe_mensual = $1
      `,
      [reportId],
    );
    return this.findReportById(reportId);
  },

  async closeExpiredReports() {
    return [];
  },

  async createMissingDeadlinesAsNonCompliance() {
    return [];
  },

  async createZipDownload(data) {
    await this.logAction({
      id_usuario: data.id_usuario,
      accion: 'DESCARGAR_ZIP_VINCULACION',
      detalle_json: data,
    });
    return { id_descarga_zip: Date.now(), ...data };
  },

  async logAction(data) {
    const { rows } = await pool.query(
      `
      INSERT INTO seguimiento.bitacora_auditoria
        (id_usuario, accion, tabla_afectada, ip_origen)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        data.id_usuario || null,
        data.accion,
        'vinculacion',
        data.ip_origen || null,
      ],
    );
    return rows[0];
  },

  async listLogs(filters = {}) {
    const params = [];
    const where = [`tabla_afectada = 'vinculacion'`];
    if (filters.id_usuario) {
      params.push(filters.id_usuario);
      where.push(`ba.id_usuario = $${params.length}`);
    }
    const { rows } = await pool.query(
      `
      SELECT ba.*, u.nombres || ' ' || u.apellidos AS usuario
      FROM seguimiento.bitacora_auditoria ba
      LEFT JOIN seguimiento.usuario u ON u.id_usuario = ba.id_usuario
      WHERE ${where.join(' AND ')}
      ORDER BY ba.fecha_hora DESC
      LIMIT 200
      `,
      params,
    );
    return rows;
  },
};

module.exports = repository;
