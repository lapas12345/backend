const pool = require('../src/config/db');

async function main() {
  const users = await pool.query(
    `
    SELECT id_usuario, nombres, apellidos, email
    FROM seguimiento.usuario
    WHERE estado = 'ACTIVO'
    ORDER BY apellidos, nombres
    LIMIT 10
    `,
  );

  const periods = await pool.query(
    `
    SELECT id_periodo, nombre, fecha_inicio, fecha_fin, estado
    FROM seguimiento.periodo_academico
    ORDER BY fecha_inicio DESC
    LIMIT 10
    `,
  );

  const careers = await pool.query(
    `
    SELECT id_carrera, nombre, codigo
    FROM seguimiento.carrera
    WHERE estado = 'ACTIVO'
    ORDER BY nombre
    LIMIT 10
    `,
  );

  console.log('Docentes activos:');
  users.rows.forEach((row) => console.log(`- ${row.id_usuario}: ${row.apellidos} ${row.nombres} <${row.email}>`));

  console.log('\nPeriodos:');
  periods.rows.forEach((row) => console.log(`- ${row.id_periodo}: ${row.nombre} (${row.estado})`));

  console.log('\nCarreras:');
  careers.rows.forEach((row) => console.log(`- ${row.id_carrera}: ${row.nombre} [${row.codigo}]`));
}

main()
  .catch((error) => {
    console.error('Error listando datos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
