import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ConflictDomainException,
  DomainException,
  EntityNotFoundException,
  ForbiddenBranchScopeException,
  UnauthorizedDomainException,
  ValidationDomainException,
} from '../../domain/exceptions/domain.exception';

interface HttpRequestLike {
  method?: string;
  url?: string;
}

interface HttpResponseLike {
  status(code: number): {
    json(body: unknown): void;
  };
}

/**
 * Filtro global único de excepciones HTTP:
 * traduce errores de dominio y HttpExceptions a respuestas limpias
 * y oculta los detalles internos ante fallos inesperados (500).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<HttpRequestLike>();
    const response = ctx.getResponse<HttpResponseLike>();
    const path = request?.url ?? '';
    const timestamp = new Date().toISOString();

    if (exception instanceof DomainException) {
      const statusCode = this.resolveDomainStatus(exception);
      response.status(statusCode).json({
        statusCode,
        code: exception.code,
        message: exception.message,
        timestamp,
        path,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const rawBody = exception.getResponse();

      if (typeof rawBody === 'string') {
        response.status(statusCode).json({
          statusCode,
          code: 'HTTP_ERROR',
          message: rawBody,
          timestamp,
          path,
        });
        return;
      }

      const payload = rawBody as Record<string, unknown>;
      response.status(statusCode).json({
        statusCode,
        code:
          typeof payload.error === 'string'
            ? payload.error.toUpperCase().replace(/\s+/g, '_')
            : 'HTTP_ERROR',
        message: payload.message ?? exception.message,
        timestamp,
        path,
      });
      return;
    }

    const method = request?.method ?? 'HTTP';
    this.logger.error(
      `[${method} ${path}] Error interno no controlado`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error interno en el servidor.',
      timestamp,
      path,
    });
  }

  private resolveDomainStatus(exception: DomainException): number {
    if (exception instanceof ValidationDomainException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof UnauthorizedDomainException) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (exception instanceof ForbiddenBranchScopeException) {
      return HttpStatus.FORBIDDEN;
    }
    if (exception instanceof EntityNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ConflictDomainException) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
