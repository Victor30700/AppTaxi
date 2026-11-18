import {
  ConflictDomainException,
  EntityNotFoundException,
} from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { normalizePhoneNumber } from '../../../domain/value-objects/bolivian-ci.vo';
import { toUserSummaryView, UserSummaryView } from '../auth/auth-views';

export interface UpdateOwnProfileCommand {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export class UpdateOwnProfileUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly authGateway: AuthGatewayPort,
  ) {}

  async execute(
    userId: string,
    command: UpdateOwnProfileCommand,
  ): Promise<UserSummaryView> {
    const currentUser = await this.userRepo.findById(userId);
    if (!currentUser) {
      throw new EntityNotFoundException('Usuario', userId);
    }

    let normalizedPhone: string | undefined;
    let shouldSyncAuthPhone = false;

    if (command.phone !== undefined) {
      normalizedPhone = normalizePhoneNumber(command.phone);
      const existing = await this.userRepo.findByPhone(normalizedPhone);
      if (existing && existing.id !== userId) {
        throw new ConflictDomainException(
          'Ese número de celular ya está asociado a otra cuenta.',
        );
      }
      shouldSyncAuthPhone = normalizedPhone !== currentUser.phone;
    }

    if (shouldSyncAuthPhone && normalizedPhone) {
      await this.authGateway.updateAuthUserPhone(userId, normalizedPhone);
    }

    try {
      const updated = await this.userRepo.updateOwnProfile(userId, {
        firstName: command.firstName?.trim(),
        lastName: command.lastName?.trim(),
        phone: normalizedPhone,
      });

      return toUserSummaryView(updated);
    } catch (error) {
      if (shouldSyncAuthPhone) {
        await this.authGateway
          .updateAuthUserPhone(userId, currentUser.phone)
          .catch(() => undefined);
      }
      throw error;
    }
  }
}
