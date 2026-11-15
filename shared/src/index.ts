/**
 * Los 9 departamentos de Bolivia para el campo "Expedido" del documento de identidad (DNI/CI).
 */
export const BOLIVIA_DEPARTMENTS = [
  { code: 'LP', name: 'La Paz' },
  { code: 'CB', name: 'Cochabamba' },
  { code: 'SC', name: 'Santa Cruz' },
  { code: 'OR', name: 'Oruro' },
  { code: 'PT', name: 'Potosí' },
  { code: 'TJ', name: 'Tarija' },
  { code: 'CH', name: 'Chuquisaca' },
  { code: 'BE', name: 'Beni' },
  { code: 'PD', name: 'Pando' },
] as const;

export type ExpedidoCode = (typeof BOLIVIA_DEPARTMENTS)[number]['code'];

export enum AffiliateType {
  SOCIO_TITULAR = 'SOCIO_TITULAR',
  INQUILINO = 'INQUILINO',
  ASALARIADO = 'ASALARIADO',
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface DriverDto {
  id: string;
  tenantId: string;
  nombre: string;
  fechaNacimiento: string;
  dni: string;
  expedido: ExpedidoCode;
  telefono: string;
  direccion: string;
  fotoPerfilUrl?: string;
  fotoIdentificacionUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface VehicleBrandDto {
  id: string;
  name: string;
}

export interface VehicleModelDto {
  id: string;
  brandId: string;
  name: string;
}

export interface VehicleDto {
  id: string;
  tenantId: string;
  placa: string;
  fotoVehiculoUrl?: string;
  brandId: string;
  brandName?: string;
  modelId: string;
  modelName?: string;
  anio: number;
  color: string;
  createdAt: string;
}

export interface PartnerDto {
  id: string;
  tenantId: string;
  nombres: string;
  apellidos: string;
  fechaIngreso: string; // Formato dd/mm/aaaa en UI, ISO en almacenamiento
  celular: string;
  tipoAfiliado: AffiliateType;
  isActive: boolean;
}

export interface MobileGroupDto {
  id: string;
  tenantId: string;
  name: string;
  isActive: boolean;
}

export interface MobileTypeDto {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
}

export interface MobileUnitDto {
  id: string;
  tenantId: string;
  nroMovil: string;
  driverId: string; // Usuario de Móvil
  vehicleId: string;
  groupId: string;
  mobileTypeIds: string[]; // Selección múltiple
  conductorEsPropietario: boolean;
  partnerId?: string; // Requerido cuando conductorEsPropietario === false
  tipoAfiliado: AffiliateType;
  isActive: boolean;
  createdAt: string;
}

export type KardexEntityType = 'DRIVER' | 'VEHICLE' | 'LINEA_TITULAR';

export interface KardexItemDto {
  id: string;
  tenantId: string;
  entityType: KardexEntityType;
  entityId: string;
  title: string;
  description: string;
  eventDate: string;
  recordedBy: string;
}
