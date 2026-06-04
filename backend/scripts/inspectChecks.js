const pool = require('../src/config/db');

async function main() {
  const { rows } = await pool.query(`
    SELECT t.relname AS tabla, c.conname, pg_get_constraintdef(c.oid) AS definicion
    FROM pg_constraint c
    INNER JOIN pg_class t ON t.oid = c.conrelid
    INNER JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'seguimiento'
      AND t.relname IN ('informe_mensual', 'informe_semestral', 'archivo_pdf', 'observacion')
      AND c.contype = 'c'
    ORDER BY t.relname, c.conname
  `);

  rows.forEach((row) => {
    console.log(`${row.tabla} | ${row.conname} | ${row.definicion}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
