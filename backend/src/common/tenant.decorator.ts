import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el identificador del tenant activo desde el header `x-tenant-id`.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const tenantHeader = request.headers['x-tenant-id'];

    if (Array.isArray(tenantHeader)) {
      return tenantHeader[0];
    }

    return tenantHeader;
  },
);
