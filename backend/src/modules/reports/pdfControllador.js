const PDFGenerator = require('./pdfGenerator');
const pool = require('../../config/db');

const pdfGen = new PDFGenerator();

exports.getPeriods = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (nombre) 
        id_periodo, nombre, fecha_inicio, fecha_fin, estado
      FROM seguimiento.periodo_academico
      ORDER BY nombre, fecha_inicio DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo períodos:', error);
    res.status(500).json({ error: 'Error obteniendo períodos' });
  }
};

// ============================================
// FUNCIÓN ACTUALIZADA: Generar reporte PDF con meses dinámicos
// ============================================
exports.generateReport = async (req, res) => {
  try {
    const { period, oficioNumber } = req.body;
    
    // 1. Obtener periodo académico
    const periodQuery = `
      SELECT id_periodo, nombre, fecha_inicio, fecha_fin
      FROM seguimiento.periodo_academico
      WHERE nombre = $1 AND estado = 'ACTIVO'
      LIMIT 1
    `;
    const { rows: periodRows } = await pool.query(periodQuery, [period]);
    
    if (periodRows.length === 0) {
      return res.status(404).json({ error: `Período ${period} no encontrado o no está activo` });
    }
    
    const periodId = periodRows[0].id_periodo;
    const periodName = periodRows[0].nombre;
    const fechaInicio = new Date(periodRows[0].fecha_inicio);
    const fechaFin = new Date(periodRows[0].fecha_fin);
    
    // 2. Calcular meses dinámicos del período
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
    const dynamicMonths = [];
    const current = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const end = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), 1);
    
    while (current <= end) {
      dynamicMonths.push({
        num: current.getMonth() + 1,        // 1-12
        short: monthNames[current.getMonth()], // Ene, Feb...
        full: current.toLocaleString('es-EC', { month: 'long' }) // enero, febrero...
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    // 3. Obtener TODAS las carreras activas
    const careersQuery = `
      SELECT 
        c.id_carrera,
        c.nombre as name,
        COUNT(DISTINCT ar.id_profesor) as teacher_count,
        COUNT(DISTINCT te.id_estudiante) as student_count
      FROM seguimiento.carrera c
      LEFT JOIN seguimiento.asignacion_rol ar 
        ON ar.id_carrera = c.id_carrera 
        AND ar.id_periodo = $1
      LEFT JOIN seguimiento.informe_mensual im
        ON im.id_carrera = c.id_carrera
        AND im.id_periodo = $1
        AND im.id_funcion = 1
      LEFT JOIN seguimiento.tutoria_estudiante te
        ON te.id_informe = im.id_informe
      WHERE c.estado = 'ACTIVO'
      GROUP BY c.id_carrera, c.nombre
      ORDER BY c.nombre
    `;
    const { rows: careers } = await pool.query(careersQuery, [periodId]);
    
    // 4. Para cada carrera, obtener docentes
    for (let career of careers) {
      if (career.teacher_count === 0) {
        career.teachers = [];
        continue;
      }
      
      const teachersQuery = `
        SELECT 
          p.id_profesor,
          p.nombres || ' ' || p.apellidos as full_name,
          p.dedicacion,
          p.tipo_vinculacion
        FROM seguimiento.profesor p
        INNER JOIN seguimiento.asignacion_rol ar 
          ON ar.id_profesor = p.id_profesor
        WHERE ar.id_carrera = $1 
          AND ar.id_periodo = $2
          AND p.estado = 'ACTIVO'
        ORDER BY p.apellidos, p.nombres
      `;
      const { rows: teachers } = await pool.query(teachersQuery, [career.id_carrera, periodId]);
      
      career.teachers = [];
      for (let teach of teachers) {
        const informesQuery = `
          SELECT 
            mes,
            estado,
            fecha_generacion,
            fecha_firma
          FROM seguimiento.informe_mensual
          WHERE id_profesor = $1
            AND id_funcion = 1
            AND id_periodo = $2
            AND id_carrera = $3
          ORDER BY mes
        `;
        const { rows: informes } = await pool.query(informesQuery, [
          teach.id_profesor, 
          periodId, 
          career.id_carrera
        ]);
        
        // Meses dinámicos: crear objeto con keys basadas en los meses del período
        const mesesCumplidos = {};
        dynamicMonths.forEach(m => {
          mesesCumplidos[m.num] = false;
        });
        
        let observation = '';
        
        for (let inf of informes) {
          // Solo marcar si el mes del informe está dentro de los meses del período
          if (mesesCumplidos.hasOwnProperty(inf.mes)) {
            mesesCumplidos[inf.mes] = (inf.estado === 'APROBADO' || inf.fecha_firma !== null);
          }
        }
        
        if (teach.dedicacion !== 'TIEMPO_COMPLETO') {
          observation = `Docente ${teach.dedicacion.toLowerCase().replace('_', ' ')} - ${teach.tipo_vinculacion.toLowerCase()}`;
        }
        
        // Crear array de cumplimiento en el orden de los meses dinámicos
        const monthCompliance = dynamicMonths.map(m => ({
          month: m.num,
          complied: mesesCumplidos[m.num]
        }));
           
        career.teachers.push({
          fullName: teach.full_name,
          monthCompliance: monthCompliance, // Array dinámico [{month: 9, complied: true}, ...]
          observation: observation
        });
      }
    }
    
    // 5. Generar PDF con meses dinámicos
    const pdfBuffer = await pdfGen.generateReport({
      oficioNumber: oficioNumber || `ULEAM-022-DPGA-TA-${period}`,
      date: new Date().toLocaleDateString('es-EC', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }),
      destinatario: 'Lic. Líder Lanche MSc.',
      memoRef: 'ULEAM--CGAC-LBLO-002-2026',
      responsibleName: 'Responsable Tutorías Académicas',
      period: periodName,
      careers: careers,
      months: dynamicMonths // <-- NUEVO: pasa los meses dinámicos
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=informe-tutorias-${period}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ 
      error: 'Error generando informe',
      details: error.message 
    });
  }
};