const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL local normalmente no usa SSL. Supabase/servidores cloud suelen requerirlo.
// Controlarlo por variable evita romper cualquiera de los dos ambientes.
const useSSL = process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  options: '-c search_path=seguimiento,public',
});

module.exports = pool;
