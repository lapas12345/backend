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

exports.generateReport = async (req, res) => {
  try {
    console.log('[CTRL] Petición recibida:', req.body);
    const { period, oficioNumber } = req.body;
    
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
    
    console.log('[CTRL] Período BD:', periodName, 'Inicio:', fechaInicio, 'Fin:', fechaFin);
    
    // Calcular meses dinámicos del período
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
    const dynamicMonths = [];
    
    let current = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
    const end = new Date(fechaFin.getFullYear(), fechaFin.getMonth() + 1, 0);
    
    while (current <= end) {
      dynamicMonths.push({
        num: current.getMonth() + 1,
        short: monthNames[current.getMonth()],
        full: current.toLocaleString('es-EC', { month: 'long' })
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    console.log('[CTRL] Meses dinámicos:', dynamicMonths);
    
    // CORRECCIÓN: Query de carreras con conteo correcto de estudiantes tutorados
    // Se cuenta estudiantes DISTINCT desde informe_semestral donde hay tutoría (id_funcion = 1)
    const careersQuery = `
      SELECT 
        c.id_carrera,
        c.nombre as name,
        COUNT(DISTINCT ar.id_usuario) as teacher_count,
        COUNT(DISTINCT isem.id_estudiante) as student_count
      FROM seguimiento.carrera c
      LEFT JOIN seguimiento.asignacion_rol ar 
        ON ar.id_carrera = c.id_carrera 
        AND ar.id_periodo = $1
      LEFT JOIN seguimiento.informe_semestral isem
        ON isem.id_carrera = c.id_carrera
        AND isem.id_periodo = $1
        AND isem.id_funcion = 1
        AND isem.id_estudiante IS NOT NULL
      WHERE c.estado = 'ACTIVO'
      GROUP BY c.id_carrera, c.nombre
      ORDER BY c.nombre
    `;
    const { rows: careers } = await pool.query(careersQuery, [periodId]);
    console.log('[CTRL] Carreras encontradas:', careers.length);
    
    for (let career of careers) {
      if (career.teacher_count === 0) {
        career.teachers = [];
        continue;
      }
      
      const teachersQuery = `
        SELECT 
          u.id_usuario,
          u.nombres || ' ' || u.apellidos as full_name,
          u.dedicacion,
          u.tipo_vinculacion
        FROM seguimiento.usuario u
        INNER JOIN seguimiento.asignacion_rol ar 
          ON ar.id_usuario = u.id_usuario
        WHERE ar.id_carrera = $1 
          AND ar.id_periodo = $2
          AND u.estado = 'ACTIVO'
        ORDER BY u.apellidos, u.nombres
      `;
      const { rows: teachers } = await pool.query(teachersQuery, [career.id_carrera, periodId]);
      
      career.teachers = [];
      for (let teach of teachers) {
        const informesQuery = `
          SELECT 
            im.mes,
            im.estado,
            im.fecha_entrega as fecha_generacion,
            im.fecha_firma
          FROM seguimiento.informe_mensual im
          INNER JOIN seguimiento.informe_semestral isem
            ON isem.id_informe_semestral = im.id_informe_semestral
          WHERE isem.id_usuario = $1
            AND isem.id_funcion = 1
            AND isem.id_periodo = $2
            AND isem.id_carrera = $3
          ORDER BY im.mes
        `;
        const { rows: informes } = await pool.query(informesQuery, [
          teach.id_usuario, 
          periodId, 
          career.id_carrera
        ]);
        
        const mesesCumplidos = {};
        dynamicMonths.forEach(m => {
          mesesCumplidos[m.num] = false;
        });
        
        let observation = '';
        
        for (let inf of informes) {
          if (mesesCumplidos.hasOwnProperty(inf.mes)) {
            mesesCumplidos[inf.mes] = (inf.estado === 'APROBADO' || inf.fecha_firma !== null);
          }
        }
        
        if (teach.dedicacion && teach.dedicacion !== 'TIEMPO_COMPLETO') {
          const ded = (teach.dedicacion || '').toLowerCase().replace('_', ' ');
          const vin = (teach.tipo_vinculacion || '').toLowerCase();
          observation = `Docente ${ded} - ${vin}`;
        }

        const monthCompliance = dynamicMonths.map(m => ({
          month: m.num,
          complied: mesesCumplidos[m.num]
        }));
           
        career.teachers.push({
          fullName: teach.full_name,
          monthCompliance: monthCompliance,
          observation: observation
        });
      }
    }
    
    console.log('[CTRL] Enviando datos a PDFGenerator...');
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
      months: dynamicMonths
    });
    
    console.log('[CTRL] PDF listo. Enviando al cliente...');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=informe-tutorias-${period}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('[CTRL] ERROR generando PDF:', error);
    res.status(500).json({ 
      error: 'Error generando informe',
      details: error.message 
    });
  }
};