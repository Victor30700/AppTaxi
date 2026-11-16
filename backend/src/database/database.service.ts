import path from 'node:path';
import dotenv from 'dotenv';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export interface DatabaseConnectionStatus {
  connected: boolean;
  postgresVersion?: string;
  postgisVersion?: string | null;
  error?: string;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly supabase: SupabaseClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'Falta la variable DATABASE_URL en backend/.env para conectar a Supabase PostgreSQL.',
      );
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Faltan SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) en backend/.env.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  getSupabase(): SupabaseClient {
    return this.supabase;
  }

  async checkConnection(): Promise<DatabaseConnectionStatus> {
    try {
      const versionRes = await this.pool.query<{ version: string }>(
        'SELECT version() AS version',
      );
      let postgisVersion: string | null = null;
      try {
        const postgisRes = await this.pool.query<{ postgis: string }>(
          'SELECT PostGIS_Version() AS postgis',
        );
        postgisVersion = postgisRes.rows[0]?.postgis ?? null;
      } catch {
        postgisVersion = null;
      }

      return {
        connected: true,
        postgresVersion: versionRes.rows[0]?.version,
        postgisVersion,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
