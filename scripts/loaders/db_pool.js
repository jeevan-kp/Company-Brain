// ============================================================================
// db_pool.js — PostgreSQL Connection Pool (Enforces max 3 connections)
// ============================================================================
const { Pool } = require('pg');
require('dotenv').config();

const maxConnections = parseInt(process.env.PG_MAX_CONNECTIONS || '3', 10);
const sslMode = process.env.PGSSLMODE || 'disable';

let sslConfig = false;
if (sslMode === 'require' || sslMode === 'verify-full') {
    sslConfig = {
        rejectUnauthorized: sslMode === 'verify-full'
    };
}

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'hackathon_team_20',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    max: maxConnections, // Hard constraint: max 3 connections
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS || '10000', 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT_MS || '5000', 10),
    ssl: sslConfig
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};
