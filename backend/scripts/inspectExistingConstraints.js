const pool = require('../src/config/db');

const tables = [
  'informe_semestral',
  'informe_mensual',
  'actividad',
  'evidencia',
  'observacion',
  'archivo_pdf',
  'asignacion_rol',
  'bitacora_auditoria',
  'rol',
  'usuario',
  'carrera',
  'periodo_academico',
  'funcion_sustantiva',
];

async function main() {
  const constraints = await pool.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'seguimiento'
      AND tc.table_name = ANY($1)
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position
  `, [tables]);

  const defaults = await pool.query(`
    SELECT table_name, column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'seguimiento'
      AND table_name = ANY($1)
      AND column_default IS NOT NULL
    ORDER BY table_name, ordinal_position
  `, [tables]);

  console.log('CONSTRAINTS');
  constraints.rows.forEach((row) => {
    const fk = row.foreign_table_name ? ` -> ${row.foreign_table_name}.${row.foreign_column_name}` : '';
    console.log(`${row.table_name}.${row.column_name || '-'} | ${row.constraint_type} | ${row.constraint_name}${fk}`);
  });

  console.log('\nDEFAULTS');
  defaults.rows.forEach((row) => {
    console.log(`${row.table_name}.${row.column_name} = ${row.column_default}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
