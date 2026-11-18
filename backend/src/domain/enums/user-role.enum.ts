export enum UserRole {
  ADMIN = 'ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  QR = 'QR',
}

export enum TariffStrategy {
  ZONE = 'ZONE',
  TAXIMETER = 'TAXIMETER',
}

export const BOLIVIA_DEPARTMENT_CODES = [
  'LP',
  'CB',
  'SC',
  'OR',
  'PT',
  'TJ',
  'CH',
  'BE',
  'PD',
] as const;

export type ExpedidoCode = (typeof BOLIVIA_DEPARTMENT_CODES)[number];

export enum AffiliateType {
  SOCIO_TITULAR = 'SOCIO_TITULAR',
  INQUILINO = 'INQUILINO',
  ASALARIADO = 'ASALARIADO',
}
