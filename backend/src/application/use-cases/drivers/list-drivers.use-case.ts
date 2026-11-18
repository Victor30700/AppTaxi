import { User } from '../../../domain/entities/user.entity';
import { UserRole, VerificationStatus } from '../../../domain/enums/user-role.enum';
import { ForbiddenBranchScopeException } from '../../../domain/exceptions/domain.exception';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import {
  DriverDetailView,
  toDriverProfileView,
  toUserSummaryView,
} from '../auth/auth-views';

export interface ListDriversQuery {
  branchId?: string;
  verificationStatus?: VerificationStatus;
}

export class ListDriversUseCase {
  constructor(
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(
    actor: User,
    query: ListDriversQuery,
  ): Promise<DriverDetailView[]> {
    let scopedBranchId: string | undefined;

    if (actor.role === UserRole.ADMIN) {
      scopedBranchId = query.branchId;
    } else if (actor.role === UserRole.BRANCH_ADMIN && actor.branchId) {
      scopedBranchId = actor.branchId;
    } else {
      throw new ForbiddenBranchScopeException();
    }

    const rows = await this.driverRepo.findAll({
      branchId: scopedBranchId,
      verificationStatus: query.verificationStatus,
    });

    return Promise.all(
      rows.map(async ({ user, profile }) => {
        const [ciFrontUrl, ciBackUrl] = await Promise.all([
          this.mediaStorage.getSignedDriverDocumentUrl(profile.ciFrontPath),
          this.mediaStorage.getSignedDriverDocumentUrl(profile.ciBackPath),
        ]);
        return {
          user: toUserSummaryView(user),
          profile: toDriverProfileView(profile, ciFrontUrl, ciBackUrl),
        };
      }),
    );
  }
}
