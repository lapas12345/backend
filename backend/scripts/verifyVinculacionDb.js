const pool = require('../src/config/db');

async function main() {
  const tables = await pool.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1
      AND table_name LIKE $2
    ORDER BY table_name
    `,
    ['seguimiento', '%vinculacion%'],
  );

  const roles = await pool.query(
    `
    SELECT nombre
    FROM seguimiento.rol
    WHERE nombre IN ($1, $2, $3)
    ORDER BY nombre
    `,
    ['Responsable de vinculación', 'Líder de proyecto', 'Supervisor'],
  );

  const reportTypes = await pool.query(
    `
    SELECT nombre, rol_nombre, frecuencia
    FROM seguimiento.tipo_informe_vinculacion
    ORDER BY rol_nombre, nombre
    `,
  );

  console.log('Tablas vinculacion:');
  tables.rows.forEach((row) => console.log(`- ${row.table_name}`));

  console.log('\nRoles vinculacion:');
  roles.rows.forEach((row) => console.log(`- ${row.nombre}`));

  console.log('\nTipos de informe:', reportTypes.rowCount);
  reportTypes.rows.forEach((row) => {
    console.log(`- ${row.rol_nombre} | ${row.frecuencia} | ${row.nombre}`);
  });
}

main()
  .catch((error) => {
    console.error('Error verificando base:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
