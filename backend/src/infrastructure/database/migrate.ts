import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const SCHEMA_NAME_REGEX = /^[a-z_][a-z0-9_]*$/;

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  const schema = (process.env.DB_SCHEMA ?? 'taxiapp').trim();
  if (!SCHEMA_NAME_REGEX.test(schema)) {
    throw new Error(`DB_SCHEMA inválido: "${schema}"`);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log(`Preparando schema "${schema}" (sin tocar public)...`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schema}"."schema_migrations" (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        `SELECT 1 FROM "${schema}"."schema_migrations" WHERE filename = $1`,
        [file],
      );
      if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
        console.log(`- Saltando ${file} (ya aplicada)`);
        continue;
      }

      const rawSql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      const compiledSql = rawSql.replace(/\{\{SCHEMA\}\}/g, `"${schema}"`);

      await client.query('BEGIN');
      try {
        await client.query(compiledSql);
        await client.query(
          `INSERT INTO "${schema}"."schema_migrations" (filename) VALUES ($1)`,
          [file],
        );
        await client.query('COMMIT');
        console.log(`+ Migración aplicada: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log(`Migraciones completadas en schema "${schema}".`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Error ejecutando migraciones:', err);
  process.exit(1);
});
