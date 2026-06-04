const pool = require('../src/config/db');

async function main() {
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'seguimiento'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  for (const table of tables.rows) {
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'seguimiento'
        AND table_name = $1
      ORDER BY ordinal_position
    `, [table.table_name]);

    console.log(`\n${table.table_name}`);
    columns.rows.forEach((column) => {
      console.log(`  - ${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
