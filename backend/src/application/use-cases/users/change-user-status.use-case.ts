import { User } from '../../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../../domain/enums/user-role.enum';
import {
  EntityNotFoundException,
  ForbiddenBranchScopeException,
  ValidationDomainException,
} from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { toUserSummaryView, UserSummaryView } from '../auth/auth-views';

export class ChangeUserStatusUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly authGateway: AuthGatewayPort,
  ) {}

  async execute(
    actor: User,
    targetUserId: string,
    newStatus: UserStatus,
  ): Promise<UserSummaryView> {
    if (actor.id === targetUserId) {
      throw new ValidationDomainException(
        'No puedes cambiar el estado de tu propia cuenta.',
      );
    }

    const target = await this.userRepo.findById(targetUserId);
    if (!target) {
      throw new EntityNotFoundException('Usuario', targetUserId);
    }

    if (actor.role === UserRole.BRANCH_ADMIN) {
      if (
        target.role !== UserRole.DRIVER ||
        target.branchId !== actor.branchId
      ) {
        throw new ForbiddenBranchScopeException(
          'Solo puedes gestionar el estado de conductores pertenecientes a tu sucursal.',
        );
      }
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenBranchScopeException();
    }

    const updated = await this.userRepo.updateStatus(targetUserId, newStatus);
    await this.authGateway.setAuthUserBanned(
      targetUserId,
      newStatus !== UserStatus.ACTIVE,
    );

    return toUserSummaryView(updated);
  }
}
