import path from 'node:path';
import dotenv from 'dotenv';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  createAdminClient,
  createContextClient,
} from '@supabase/server/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const SCHEMA_NAME_REGEX = /^[a-z_][a-z0-9_]*$/;

export interface DatabaseConnectionStatus {
  connected: boolean;
  schema: string;
  postgresVersion?: string;
  postgisVersion?: string | null;
  error?: string;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly schema: string;
  private readonly supabaseAdmin: SupabaseClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'Falta la variable DATABASE_URL en backend/.env para conectar a PostgreSQL.',
      );
    }

    const configuredSchema = (process.env.DB_SCHEMA ?? 'taxiapp').trim();
    if (!SCHEMA_NAME_REGEX.test(configuredSchema)) {
      throw new Error(
        `Nombre de schema inválido en DB_SCHEMA: "${configuredSchema}". Usa solo minúsculas, números y guion bajo.`,
      );
    }
    this.schema = configuredSchema;

    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(
        'Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en backend/.env.',
      );
    }

    this.supabaseAdmin = createAdminClient();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  getSchema(): string {
    return this.schema;
  }

  /**
   * Devuelve el nombre de tabla calificado con el schema configurado en DB_SCHEMA.
   * Garantiza que nunca se escriba por accidente en el schema public.
   */
  table(tableName: string): string {
    if (!SCHEMA_NAME_REGEX.test(tableName)) {
      throw new Error(`Nombre de tabla inválido: "${tableName}".`);
    }
    return `"${this.schema}"."${tableName}"`;
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

  getSupabaseAdmin(): SupabaseClient {
    return this.supabaseAdmin;
  }

  getSupabaseClient(accessToken?: string): SupabaseClient {
    return createContextClient(
      accessToken ? { auth: { token: accessToken } } : undefined,
    );
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
        schema: this.schema,
        postgresVersion: versionRes.rows[0]?.version,
        postgisVersion,
      };
    } catch (error) {
      return {
        connected: false,
        schema: this.schema,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
