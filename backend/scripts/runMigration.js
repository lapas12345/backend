const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Runner sencillo para aplicar migraciones SQL sin depender de psql.
 * Uso:
 *   node scripts/runMigration.js database/migrations/001_vinculacion.sql
 */
async function main() {
  const migrationPath = process.argv[2];
  if (!migrationPath) {
    throw new Error('Debe indicar la ruta del archivo SQL de migracion');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no esta definido. Cree backend/.env o exporte la variable.');
  }

  const absolutePath = path.resolve(process.cwd(), migrationPath);
  const sql = fs.readFileSync(absolutePath, 'utf8');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query(sql);
    console.log(`Migracion aplicada: ${absolutePath}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Error aplicando migracion:', error.message);
  process.exit(1);
});
