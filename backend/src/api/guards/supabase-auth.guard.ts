import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../domain/entities/user.entity';
import { AuthGatewayPort } from '../../domain/ports/auth-gateway.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  currentUser?: User;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthGatewayPort) private readonly authGateway: AuthGatewayPort,
    @Inject(UserRepositoryPort) private readonly userRepo: UserRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const rawAuthHeader = request.headers.authorization;
    const authHeader = Array.isArray(rawAuthHeader)
      ? rawAuthHeader[0]
      : (rawAuthHeader ?? null);

    try {
      const claims = await this.authGateway.verifyAccessToken(authHeader);
      const user = await this.userRepo.findById(claims.userId);
      if (!user) {
        throw new UnauthorizedException(
          'Usuario autenticado sin registro activo en la plataforma.',
        );
      }
      if (!user.isActive()) {
        throw new UnauthorizedException(
          `Tu cuenta se encuentra en estado ${user.status}.`,
        );
      }

      request.currentUser = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'No autorizado.',
      );
    }
  }
}
