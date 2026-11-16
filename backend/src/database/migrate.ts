import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Conectando a Supabase PostgreSQL...');
    const localSqlPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const fallbackSqlPath = path.resolve(
      __dirname,
      '../../src/database/migrations/001_initial_schema.sql',
    );
    const sqlPath = fs.existsSync(localSqlPath) ? localSqlPath : fallbackSqlPath;
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query(sql);

      const postgisRes = await client.query<{ postgis: string }>(
        'SELECT PostGIS_Version() AS postgis',
      );
      const tablesRes = await client.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
      );

      console.log('Migración 001_initial_schema.sql aplicada correctamente.');
      console.log('PostGIS activo:', postgisRes.rows[0]?.postgis);
      console.log(
        'Tablas en esquema public:',
        tablesRes.rows.map((row) => row.table_name).join(', '),
      );
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Error ejecutando migraciones:', error);
  process.exit(1);
});
