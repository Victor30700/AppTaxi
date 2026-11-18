import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
import {
  EntityNotFoundException,
  ForbiddenBranchScopeException,
} from '../../../domain/exceptions/domain.exception';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import {
  DriverDetailView,
  toDriverProfileView,
  toUserSummaryView,
} from '../auth/auth-views';

export class GetDriverDetailUseCase {
  constructor(
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(
    actor: User,
    driverUserId: string,
  ): Promise<DriverDetailView> {
    const found = await this.driverRepo.findByUserId(driverUserId);
    if (!found) {
      throw new EntityNotFoundException('Conductor', driverUserId);
    }

    const isSelf = actor.id === driverUserId;
    const isAdmin = actor.role === UserRole.ADMIN;
    const isSameBranchAdmin =
      actor.role === UserRole.BRANCH_ADMIN &&
      found.profile.branchId === actor.branchId;

    if (!isSelf && !isAdmin && !isSameBranchAdmin) {
      throw new ForbiddenBranchScopeException();
    }

    const [ciFrontUrl, ciBackUrl] = await Promise.all([
      this.mediaStorage.getSignedDriverDocumentUrl(found.profile.ciFrontPath),
      this.mediaStorage.getSignedDriverDocumentUrl(found.profile.ciBackPath),
    ]);

    return {
      user: toUserSummaryView(found.user),
      profile: toDriverProfileView(found.profile, ciFrontUrl, ciBackUrl),
    };
  }
}
