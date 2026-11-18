import {
  BOLIVIA_DEPARTMENT_CODES,
  ExpedidoCode,
} from '../enums/user-role.enum';
import { ValidationDomainException } from '../exceptions/domain.exception';

/**
 * Value Object para Cédula de Identidad Boliviana (CI / DNI).
 * Soporta número base, complemento alfanumérico opcional (ej. "1A") y departamento expedido.
 */
export class BolivianCi {
  readonly ciNumber: string;
  readonly ciComplement: string | null;
  readonly ciIssuedDept: ExpedidoCode;

  private constructor(
    ciNumber: string,
    ciComplement: string | null,
    ciIssuedDept: ExpedidoCode,
  ) {
    this.ciNumber = ciNumber;
    this.ciComplement = ciComplement;
    this.ciIssuedDept = ciIssuedDept;
  }

  static create(
    ciNumber: string,
    ciIssuedDept: ExpedidoCode,
    ciComplement?: string | null,
  ): BolivianCi {
    const normalizedNumber = ciNumber.trim();
    if (!/^[0-9]{4,15}$/.test(normalizedNumber)) {
      throw new ValidationDomainException(
        'El número de CI debe contener entre 4 y 15 dígitos numéricos.',
      );
    }

    const normalizedDept = ciIssuedDept.trim().toUpperCase() as ExpedidoCode;
    if (!BOLIVIA_DEPARTMENT_CODES.includes(normalizedDept)) {
      throw new ValidationDomainException(
        `Departamento de emisión inválido: "${ciIssuedDept}".`,
      );
    }

    const rawComplement = ciComplement?.trim().toUpperCase() || null;
    if (rawComplement && !/^[A-Z0-9]{1,6}$/.test(rawComplement)) {
      throw new ValidationDomainException(
        'El complemento del CI solo puede contener hasta 6 caracteres alfanuméricos.',
      );
    }

    return new BolivianCi(normalizedNumber, rawComplement, normalizedDept);
  }

  format(): string {
    const base = this.ciComplement
      ? `${this.ciNumber}-${this.ciComplement}`
      : this.ciNumber;
    return `${base} ${this.ciIssuedDept}`;
  }
}

/**
 * Normaliza números telefónicos a formato E.164 (por defecto +591 para Bolivia si tiene 8 dígitos).
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[\s\-()]/g, '').trim();
  if (/^[67][0-9]{7}$/.test(cleaned)) {
    return `+591${cleaned}`;
  }
  if (/^\+[1-9][0-9]{7,14}$/.test(cleaned)) {
    return cleaned;
  }
  throw new ValidationDomainException(
    `Número telefónico inválido: "${rawPhone}". Usa 8 dígitos de Bolivia (ej. 70012345) o formato E.164 (+59170012345).`,
  );
}
