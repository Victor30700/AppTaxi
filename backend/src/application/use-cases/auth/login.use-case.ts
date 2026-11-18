import { UnauthorizedDomainException } from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import { PassengerProfileRepositoryPort } from '../../../domain/ports/passenger-profile-repository.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { normalizePhoneNumber } from '../../../domain/value-objects/bolivian-ci.vo';
import {
  assembleCurrentUserView,
  AuthenticatedSessionView,
} from './auth-views';

export interface LoginCommand {
  identifier: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private readonly authGateway: AuthGatewayPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly branchRepo: BranchRepositoryPort,
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly passengerRepo: PassengerProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(command: LoginCommand): Promise<AuthenticatedSessionView> {
    const trimmedIdentifier = command.identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');

    let authResult: { userId: string; tokens: import('../../../domain/ports/auth-gateway.port').AuthTokens };
    if (isEmail) {
      authResult = await this.authGateway.signInWithEmail(
        trimmedIdentifier.toLowerCase(),
        command.password,
      );
    } else {
      const normalizedPhone = normalizePhoneNumber(trimmedIdentifier);
      try {
        authResult = await this.authGateway.signInWithPhone(
          normalizedPhone,
          command.password,
        );
      } catch (err) {
        if (
          err instanceof UnauthorizedDomainException &&
          err.message.startsWith('PHONE_PROVIDER_DISABLED')
        ) {
          const existingByPhone = await this.userRepo.findByPhone(normalizedPhone);
          if (existingByPhone?.email) {
            authResult = await this.authGateway.signInWithEmail(
              existingByPhone.email,
              command.password,
            );
          } else {
            throw new UnauthorizedDomainException(
              'El inicio de sesión por celular está deshabilitado en Supabase Auth (habilita Authentication -> Providers -> Phone en tu dashboard de Supabase).',
            );
          }
        } else {
          throw err;
        }
      }
    }

    const { userId, tokens } = authResult;

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedDomainException(
        'Usuario autenticado sin perfil registrado en la plataforma.',
      );
    }

    if (!user.isActive()) {
      throw new UnauthorizedDomainException(
        `Tu cuenta se encuentra en estado ${user.status}. Contacta al administrador.`,
      );
    }

    await this.userRepo.touchLastLogin(user.id);

    const view = await assembleCurrentUserView(user, {
      branchRepo: this.branchRepo,
      driverRepo: this.driverRepo,
      passengerRepo: this.passengerRepo,
      mediaStorage: this.mediaStorage,
    });

    return { tokens, ...view };
  }
}
