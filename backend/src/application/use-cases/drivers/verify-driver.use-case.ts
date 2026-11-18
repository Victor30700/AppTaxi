import { User } from '../../../domain/entities/user.entity';
import {
  UserRole,
  VerificationStatus,
} from '../../../domain/enums/user-role.enum';
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

export class VerifyDriverUseCase {
  constructor(
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(
    actor: User,
    driverUserId: string,
    status: VerificationStatus,
    notes?: string | null,
  ): Promise<DriverDetailView> {
    const existing = await this.driverRepo.findByUserId(driverUserId);
    if (!existing) {
      throw new EntityNotFoundException('Conductor', driverUserId);
    }

    const isAdmin = actor.role === UserRole.ADMIN;
    const isSameBranchAdmin =
      actor.role === UserRole.BRANCH_ADMIN &&
      existing.profile.branchId === actor.branchId;

    if (!isAdmin && !isSameBranchAdmin) {
      throw new ForbiddenBranchScopeException();
    }

    const updatedProfile = await this.driverRepo.updateVerification(
      driverUserId,
      status,
      notes?.trim() || null,
    );

    const [ciFrontUrl, ciBackUrl] = await Promise.all([
      this.mediaStorage.getSignedDriverDocumentUrl(updatedProfile.ciFrontPath),
      this.mediaStorage.getSignedDriverDocumentUrl(updatedProfile.ciBackPath),
    ]);

    return {
      user: toUserSummaryView(existing.user),
      profile: toDriverProfileView(updatedProfile, ciFrontUrl, ciBackUrl),
    };
  }
}
