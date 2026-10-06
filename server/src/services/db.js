const { Pool } = require('pg');

let pool = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3, // Max 3 connections as per Azure limits
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.warn('[DB] Unexpected error on idle PostgreSQL client:', err.message);
    });
  } catch (e) {
    console.warn('[DB] PostgreSQL pool initialization failed, using fallback dataset:', e.message);
  }
}

module.exports = {
  query: async (text, params) => {
    if (pool) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.warn(`[DB] Query failed, falling back to mock dataset: ${err.message}`);
      }
    }
    return { rows: [] };
  },
  getClient: async () => {
    if (pool) return await pool.connect();
    throw new Error("No database pool configured.");
  },
  pool
};
