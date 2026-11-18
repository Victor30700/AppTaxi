-- Migración 001: Schema dedicado para AppTaxi (sin tocar el schema public)
-- El marcador {{SCHEMA}} es reemplazado por el valor validado de DB_SCHEMA (.env).

CREATE TYPE {{SCHEMA}}.user_role AS ENUM (
  'ADMIN',
  'BRANCH_ADMIN',
  'DRIVER',
  'PASSENGER'
);

CREATE TYPE {{SCHEMA}}.user_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION'
);

CREATE TYPE {{SCHEMA}}.verification_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE {{SCHEMA}}.payment_method AS ENUM (
  'CASH',
  'QR'
);

CREATE TYPE {{SCHEMA}}.tariff_strategy AS ENUM (
  'ZONE',
  'TAXIMETER'
);

CREATE TYPE {{SCHEMA}}.affiliate_type AS ENUM (
  'SOCIO_TITULAR',
  'INQUILINO',
  'ASALARIADO'
);

CREATE OR REPLACE FUNCTION {{SCHEMA}}.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS {{SCHEMA}}.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(2) NOT NULL UNIQUE CHECK (
    department_code IN ('LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PD')
  ),
  name VARCHAR(100) NOT NULL,
  tariff_strategy {{SCHEMA}}.tariff_strategy NOT NULL DEFAULT 'TAXIMETER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON {{SCHEMA}}.branches
  FOR EACH ROW
  EXECUTE FUNCTION {{SCHEMA}}.set_updated_at();

CREATE TABLE IF NOT EXISTS {{SCHEMA}}.users (
  id UUID PRIMARY KEY,
  role {{SCHEMA}}.user_role NOT NULL,
  branch_id UUID NULL REFERENCES {{SCHEMA}}.branches(id) ON DELETE RESTRICT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL UNIQUE,
  phone VARCHAR(25) NOT NULL UNIQUE,
  avatar_url TEXT NULL,
  status {{SCHEMA}}.user_status NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_users_role_branch CHECK (
    (role IN ('ADMIN', 'PASSENGER') AND branch_id IS NULL)
    OR (role IN ('BRANCH_ADMIN', 'DRIVER') AND branch_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_users_role_branch
  ON {{SCHEMA}}.users (role, branch_id, status);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON {{SCHEMA}}.users
  FOR EACH ROW
  EXECUTE FUNCTION {{SCHEMA}}.set_updated_at();

CREATE TABLE IF NOT EXISTS {{SCHEMA}}.driver_profiles (
  user_id UUID PRIMARY KEY REFERENCES {{SCHEMA}}.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES {{SCHEMA}}.branches(id) ON DELETE RESTRICT,
  birth_date DATE NOT NULL,
  ci_number VARCHAR(20) NOT NULL,
  ci_complement VARCHAR(10) NULL,
  ci_issued_dept VARCHAR(2) NOT NULL CHECK (
    ci_issued_dept IN ('LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PD')
  ),
  address TEXT NOT NULL,
  ci_front_path TEXT NULL,
  ci_back_path TEXT NULL,
  affiliate_type {{SCHEMA}}.affiliate_type NOT NULL DEFAULT 'SOCIO_TITULAR',
  verification_status {{SCHEMA}}.verification_status NOT NULL DEFAULT 'PENDING',
  verification_notes TEXT NULL,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  daily_quota_paid_until TIMESTAMPTZ NULL,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_trips INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_profiles_ci
  ON {{SCHEMA}}.driver_profiles (ci_number, COALESCE(ci_complement, ''), ci_issued_dept);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_branch_verification
  ON {{SCHEMA}}.driver_profiles (branch_id, verification_status, is_available);

CREATE TRIGGER trg_driver_profiles_updated_at
  BEFORE UPDATE ON {{SCHEMA}}.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION {{SCHEMA}}.set_updated_at();

CREATE TABLE IF NOT EXISTS {{SCHEMA}}.passenger_profiles (
  user_id UUID PRIMARY KEY REFERENCES {{SCHEMA}}.users(id) ON DELETE CASCADE,
  default_payment_method {{SCHEMA}}.payment_method NOT NULL DEFAULT 'CASH',
  emergency_contact_name VARCHAR(100) NULL,
  emergency_contact_phone VARCHAR(25) NULL,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_trips INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_passenger_profiles_updated_at
  BEFORE UPDATE ON {{SCHEMA}}.passenger_profiles
  FOR EACH ROW
  EXECUTE FUNCTION {{SCHEMA}}.set_updated_at();
