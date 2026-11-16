-- =============================================================================
-- Migración Inicial Multi-tenant TaxiApp (Supabase PostgreSQL + PostGIS)
-- Tareas cubiertas: TAXI-06, TAXI-07, TAXI-08, TAXI-09
-- =============================================================================

-- 1. Extensiones requeridas (TAXI-06)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Tipo de rol Multi-tenant (TAXI-07)
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'TENANT_ADMIN', 'DRIVER', 'PASSENGER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Tenants y Usuarios (TAXI-07)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT, -- NULL solo para SUPERADMIN
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_superadmin_tenant CHECK (
    (role = 'SUPERADMIN' AND tenant_id IS NULL) OR
    (role IN ('TENANT_ADMIN', 'DRIVER') AND tenant_id IS NOT NULL) OR
    (role = 'PASSENGER')
  )
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);

-- 4. Conductores, Marcas, Modelos y Vehículos (TAXI-08)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nombre VARCHAR(180) NOT NULL,
  foto_perfil_url TEXT,
  fecha_nacimiento DATE NOT NULL,
  dni VARCHAR(30) NOT NULL,
  foto_identificacion_url TEXT,
  expedido VARCHAR(2) NOT NULL CHECK (expedido IN ('LP','CB','SC','OR','PT','TJ','CH','BE','PD')),
  telefono VARCHAR(30) NOT NULL,
  direccion TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, dni)
);

CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON drivers(tenant_id);

CREATE TABLE IF NOT EXISTS vehicle_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand ON vehicle_models(brand_id);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  placa VARCHAR(20) NOT NULL,
  foto_vehiculo_url TEXT,
  brand_id UUID NOT NULL REFERENCES vehicle_brands(id),
  model_id UUID NOT NULL REFERENCES vehicle_models(id),
  anio INT NOT NULL,
  color VARCHAR(60) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, placa)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);

-- 5. Socios/Inquilinos, Grupos, Tipos de Móvil, Móviles y Kardex (TAXI-09)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  celular VARCHAR(30) NOT NULL,
  tipo_afiliado VARCHAR(30) NOT NULL CHECK (tipo_afiliado IN ('SOCIO_TITULAR','INQUILINO','ASALARIADO')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_tenant ON partners(tenant_id);

CREATE TABLE IF NOT EXISTS mobile_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS mobile_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS mobiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nro_movil VARCHAR(20) NOT NULL,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  group_id UUID NOT NULL REFERENCES mobile_groups(id),
  conductor_es_propietario BOOLEAN NOT NULL DEFAULT false,
  partner_id UUID REFERENCES partners(id),
  tipo_afiliado VARCHAR(30) NOT NULL CHECK (tipo_afiliado IN ('SOCIO_TITULAR','INQUILINO','ASALARIADO')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_mobile_owner CHECK (conductor_es_propietario = true OR partner_id IS NOT NULL),
  UNIQUE (tenant_id, nro_movil)
);

CREATE INDEX IF NOT EXISTS idx_mobiles_tenant ON mobiles(tenant_id);

CREATE TABLE IF NOT EXISTS mobile_unit_types (
  mobile_id UUID NOT NULL REFERENCES mobiles(id) ON DELETE CASCADE,
  mobile_type_id UUID NOT NULL REFERENCES mobile_types(id) ON DELETE CASCADE,
  PRIMARY KEY (mobile_id, mobile_type_id)
);

CREATE TABLE IF NOT EXISTS kardex_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('DRIVER','VEHICLE','LINEA_TITULAR')),
  entity_id UUID NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kardex_tenant_entity ON kardex_items(tenant_id, entity_type, entity_id);
