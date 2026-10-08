// ============================================================================
// db_reset.js — Executes SQL Migrations in Sequential Order
// ============================================================================
const fs = require('fs');
const path = require('path');
const { pool } = require('./loaders/db_pool');

async function runMigrations() {
    console.log('🔄 Initializing Company Brain Database Migrations...');
    const client = await pool.connect();

    try {
        const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`Found ${files.length} migration files in db/migrations/`);

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            console.log(`⏳ Applying migration: ${file}...`);
            const sql = fs.readFileSync(filePath, 'utf8');
            await client.query(sql);
            console.log(`✅ Applied migration: ${file}`);
        }

        console.log('🎉 All database migrations applied successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
