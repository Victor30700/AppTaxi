import path from 'node:path';
import dotenv from 'dotenv';
import { createAdminClient } from '@supabase/server/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const SCHEMA_NAME_REGEX = /^[a-z_][a-z0-9_]*$/;

async function ensureBucket(
  supabaseAdmin: SupabaseClient,
  bucketName: string,
  options: {
    public: boolean;
    fileSizeLimit: number;
    allowedMimeTypes: string[];
  },
): Promise<void> {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(`No se pudieron listar buckets: ${listError.message}`);
  }

  const exists = buckets.some((bucket) => bucket.name === bucketName);
  if (exists) {
    console.log(`- Bucket "${bucketName}" ya existe`);
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(
    bucketName,
    options,
  );
  if (createError) {
    throw new Error(
      `No se pudo crear bucket "${bucketName}": ${createError.message}`,
    );
  }
  console.log(
    `+ Bucket "${bucketName}" creado (${options.public ? 'público' : 'privado'})`,
  );
}

async function runSeed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  const schema = (process.env.DB_SCHEMA ?? 'taxiapp').trim();
  if (!SCHEMA_NAME_REGEX.test(schema)) {
    throw new Error(`DB_SCHEMA inválido: "${schema}"`);
  }

  const avatarsBucket = (
    process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars'
  ).trim();
  const documentsBucket = (
    process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'driver-documents'
  ).trim();

  const supabaseAdmin = createAdminClient();

  await ensureBucket(supabaseAdmin, avatarsBucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  await ensureBucket(supabaseAdmin, documentsBucket, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Sucursal inicial (La Paz - LP)
    await pool.query(
      `
      INSERT INTO "${schema}"."branches" (department_code, name, tariff_strategy)
      VALUES ($1, $2, $3)
      ON CONFLICT (department_code) DO NOTHING
      `,
      ['LP', 'Sucursal La Paz', 'ZONE'],
    );
    console.log('+ Sucursal inicial verificada: LP (Sucursal La Paz)');

    // 2. Usuario ADMIN general inicial
    const adminEmail = (
      process.env.SEED_ADMIN_EMAIL ?? 'admin@taxiapp.bo'
    ).toLowerCase();
    const adminPhone = process.env.SEED_ADMIN_PHONE ?? '+59170000000';
    const adminPassword =
      process.env.SEED_ADMIN_PASSWORD ?? 'AdminTaxi2026*';

    const existingDbAdmin = await pool.query<{ id: string }>(
      `SELECT id FROM "${schema}"."users" WHERE email = $1 OR phone = $2 LIMIT 1`,
      [adminEmail, adminPhone],
    );

    if (existingDbAdmin.rowCount && existingDbAdmin.rowCount > 0) {
      console.log(`- Usuario ADMIN ya registrado (${adminEmail})`);
      return;
    }

    let authUserId: string | null = null;
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    const existingAuthUser = listData?.users.find(
      (u) => u.email?.toLowerCase() === adminEmail || u.phone === adminPhone,
    );

    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        app_metadata: { role: 'ADMIN', branchId: null },
      });
    } else {
      const { data: createdAuth, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword,
          email_confirm: true,
          phone_confirm: true,
          app_metadata: { role: 'ADMIN', branchId: null },
        });
      if (authError || !createdAuth.user) {
        throw new Error(
          `Error creando ADMIN en Supabase Auth: ${authError?.message ?? 'desconocido'}`,
        );
      }
      authUserId = createdAuth.user.id;
    }

    await pool.query(
      `
      INSERT INTO "${schema}"."users" (
        id, role, branch_id, first_name, last_name, email, phone, status
      )
      VALUES ($1, 'ADMIN', NULL, $2, $3, $4, $5, 'ACTIVE')
      ON CONFLICT (id) DO NOTHING
      `,
      [authUserId, 'Administrador', 'General', adminEmail, adminPhone],
    );

    console.log(
      `+ Usuario ADMIN inicial listo: ${adminEmail} / ${adminPhone}`,
    );
  } finally {
    await pool.end();
  }
}

runSeed().catch((err) => {
  console.error('Error ejecutando seed:', err);
  process.exit(1);
});
