/**
 * Jerarquía de excepciones puras del dominio (sin acoplamiento HTTP/NestJS).
 * La capa api/ las traduce mediante DomainExceptionFilter al código HTTP correspondiente.
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationDomainException extends DomainException {
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedDomainException extends DomainException {
  readonly code = 'UNAUTHORIZED';

  constructor(message = 'Credenciales inválidas o sesión expirada.') {
    super(message);
  }
}

export class ForbiddenBranchScopeException extends DomainException {
  readonly code = 'FORBIDDEN_SCOPE';

  constructor(
    message = 'No tienes permisos para realizar esta acción sobre este recurso o sucursal.',
  ) {
    super(message);
  }
}

export class EntityNotFoundException extends DomainException {
  readonly code = 'NOT_FOUND';

  constructor(entity: string, identifier?: string) {
    super(
      identifier
        ? `${entity} (${identifier}) no fue encontrado.`
        : `${entity} no fue encontrado.`,
    );
  }
}

export class ConflictDomainException extends DomainException {
  readonly code = 'CONFLICT';

  constructor(message: string) {
    super(message);
  }
}
