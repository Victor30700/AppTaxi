import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

interface BrandSeed {
  brand: string;
  models: string[];
}

const VEHICLE_CATALOG_SEED: BrandSeed[] = [
  { brand: 'Toyota', models: ['Corolla', 'Probox', 'Yaris', 'Succeed', 'Fielder'] },
  { brand: 'Suzuki', models: ['Alto', 'Dzire', 'Celerio', 'Swift'] },
  { brand: 'Nissan', models: ['Versa', 'Tiida', 'AD Wagon', 'March'] },
  { brand: 'Hyundai', models: ['Accent', 'Grand i10', 'Elantra'] },
  { brand: 'Kia', models: ['Rio', 'Picanto', 'Soluto'] },
];

async function ensureStorageBucket(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET ?? 'taxiapp-media';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY para configurar Storage.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Error listando buckets en Supabase Storage: ${listError.message}`);
  }

  const exists = buckets?.some((b) => b.name === bucketName);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (createError) {
      throw new Error(`Error creando bucket "${bucketName}": ${createError.message}`);
    }
    console.log(`Bucket Supabase Storage creado: ${bucketName}`);
  } else {
    console.log(`Bucket Supabase Storage ya existe: ${bucketName}`);
  }
}

async function runSeed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  await ensureStorageBucket();

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const defaultPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AppTaxi2026';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      // 1. Seed de los 3 SuperAdmins (tenant_id = NULL)
      const superAdmins = [
        {
          fullName: process.env.SEED_SUPERADMIN_1_NAME ?? 'Germany Saldaña',
          email: process.env.SEED_SUPERADMIN_1_EMAIL ?? 'gsaldana709@gmail.com',
        },
        {
          fullName: process.env.SEED_SUPERADMIN_2_NAME ?? 'Desarrollador 2 (TaxiApp)',
          email: process.env.SEED_SUPERADMIN_2_EMAIL ?? 'superadmin2@taxiapp.bo',
        },
        {
          fullName: process.env.SEED_SUPERADMIN_3_NAME ?? 'Desarrollador 3 (TaxiApp)',
          email: process.env.SEED_SUPERADMIN_3_EMAIL ?? 'superadmin3@taxiapp.bo',
        },
      ];

      for (const admin of superAdmins) {
        await client.query(
          `INSERT INTO users (tenant_id, full_name, email, password_hash, role, is_active)
           VALUES (NULL, $1, $2, $3, 'SUPERADMIN', true)
           ON CONFLICT (email) DO NOTHING`,
          [admin.fullName, admin.email, passwordHash],
        );
      }
      console.log(
        `3 SuperAdmins verificados/insertados: ${superAdmins.map((a) => a.email).join(', ')}`,
      );

      // 2. Seed de 2 Tenants iniciales y sus TENANT_ADMIN
      const tenantsSeed = [
        {
          name: 'Radio Taxi Central (La Paz)',
          slug: 'radiotaxi-central-lp',
          adminName: 'Admin Radio Taxi Central',
          adminEmail: 'admin.central@taxiapp.bo',
          adminPhone: '71500001',
        },
        {
          name: 'Sindicato 1ro de Mayo (Cochabamba)',
          slug: 'sindicato-1ro-mayo-cb',
          adminName: 'Admin Sindicato 1ro de Mayo',
          adminEmail: 'admin.1romayo@taxiapp.bo',
          adminPhone: '71500002',
        },
      ];

      for (const t of tenantsSeed) {
        await client.query(
          `INSERT INTO tenants (name, slug, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (slug) DO NOTHING`,
          [t.name, t.slug],
        );

        const tenantRes = await client.query<{ id: string }>(
          'SELECT id FROM tenants WHERE slug = $1',
          [t.slug],
        );
        const tenantId = tenantRes.rows[0]?.id;

        if (tenantId) {
          await client.query(
            `INSERT INTO users (tenant_id, full_name, email, phone, password_hash, role, is_active)
             VALUES ($1, $2, $3, $4, $5, 'TENANT_ADMIN', true)
             ON CONFLICT (email) DO NOTHING`,
            [tenantId, t.adminName, t.adminEmail, t.adminPhone, passwordHash],
          );
        }
      }
      console.log('2 Tenants iniciales y sus TENANT_ADMIN verificados/insertados.');

      // 3. Seed de catálogo base de Marcas y Modelos de vehículos
      for (const item of VEHICLE_CATALOG_SEED) {
        await client.query(
          `INSERT INTO vehicle_brands (name)
           VALUES ($1)
           ON CONFLICT (name) DO NOTHING`,
          [item.brand],
        );

        const brandRes = await client.query<{ id: string }>(
          'SELECT id FROM vehicle_brands WHERE name = $1',
          [item.brand],
        );
        const brandId = brandRes.rows[0]?.id;

        if (brandId) {
          for (const modelName of item.models) {
            await client.query(
              `INSERT INTO vehicle_models (brand_id, name)
               VALUES ($1, $2)
               ON CONFLICT (brand_id, name) DO NOTHING`,
              [brandId, modelName],
            );
          }
        }
      }
      console.log(
        `Catálogo de marcas/modelos sembrado (${VEHICLE_CATALOG_SEED.length} marcas).`,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

runSeed().catch((error) => {
  console.error('Error ejecutando seed:', error);
  process.exit(1);
});
