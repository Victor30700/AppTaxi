import {
  PaymentMethod,
  UserRole,
  UserStatus,
} from '../../../domain/enums/user-role.enum';
import {
  ConflictDomainException,
  UnauthorizedDomainException,
} from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { PassengerProfileRepositoryPort } from '../../../domain/ports/passenger-profile-repository.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { normalizePhoneNumber } from '../../../domain/value-objects/bolivian-ci.vo';
import {
  AuthenticatedSessionView,
  toPassengerProfileView,
  toUserSummaryView,
} from './auth-views';

export interface RegisterPassengerCommand {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  password: string;
  defaultPaymentMethod?: PaymentMethod;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export class RegisterPassengerUseCase {
  constructor(
    private readonly authGateway: AuthGatewayPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly passengerRepo: PassengerProfileRepositoryPort,
  ) {}

  async execute(
    command: RegisterPassengerCommand,
  ): Promise<AuthenticatedSessionView> {
    const normalizedPhone = normalizePhoneNumber(command.phone);
    const normalizedEmail = command.email?.trim().toLowerCase() || null;

    const existingByPhone = await this.userRepo.findByPhone(normalizedPhone);
    if (existingByPhone) {
      throw new ConflictDomainException(
        'Ya existe una cuenta registrada con ese número de celular.',
      );
    }

    if (normalizedEmail) {
      const existingByEmail = await this.userRepo.findByEmail(normalizedEmail);
      if (existingByEmail) {
        throw new ConflictDomainException(
          'Ya existe una cuenta registrada con ese correo electrónico.',
        );
      }
    }

    const { userId } = await this.authGateway.createAuthUser({
      email: normalizedEmail,
      phone: normalizedPhone,
      password: command.password,
      role: UserRole.PASSENGER,
      branchId: null,
    });

    try {
      const user = await this.userRepo.create({
        id: userId,
        role: UserRole.PASSENGER,
        branchId: null,
        firstName: command.firstName.trim(),
        lastName: command.lastName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        status: UserStatus.ACTIVE,
      });

      const passengerProfile = await this.passengerRepo.create({
        userId,
        defaultPaymentMethod:
          command.defaultPaymentMethod ?? PaymentMethod.CASH,
        emergencyContactName: command.emergencyContactName?.trim() || null,
        emergencyContactPhone: command.emergencyContactPhone
          ? normalizePhoneNumber(command.emergencyContactPhone)
          : null,
        isPhoneVerified: false,
      });

      let tokens;
      try {
        ({ tokens } = await this.authGateway.signInWithPhone(
          normalizedPhone,
          command.password,
        ));
      } catch (signInError) {
        if (
          signInError instanceof UnauthorizedDomainException &&
          signInError.message.startsWith('PHONE_PROVIDER_DISABLED')
        ) {
          if (normalizedEmail) {
            ({ tokens } = await this.authGateway.signInWithEmail(
              normalizedEmail,
              command.password,
            ));
          } else {
            throw new UnauthorizedDomainException(
              'Cuenta creada, pero el login solo con celular requiere habilitar Authentication -> Providers -> Phone en tu dashboard de Supabase.',
            );
          }
        } else {
          throw signInError;
        }
      }

      return {
        tokens,
        user: toUserSummaryView(user),
        branch: null,
        driverProfile: null,
        passengerProfile: toPassengerProfileView(passengerProfile),
      };
    } catch (error) {
      await this.authGateway.deleteAuthUser(userId).catch(() => undefined);
      throw error;
    }
  }
}
