const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // ← Supabase exige SSL
});

// Esto le dice a PostgreSQL que busque primero en tu esquema "seguimiento"
pool.on('connect', (client) => {
  client.query('SET search_path TO seguimiento, public');
});

module.exports = pool;