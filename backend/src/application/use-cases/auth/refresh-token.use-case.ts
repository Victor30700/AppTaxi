import { UnauthorizedDomainException } from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import { PassengerProfileRepositoryPort } from '../../../domain/ports/passenger-profile-repository.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import {
  assembleCurrentUserView,
  AuthenticatedSessionView,
} from './auth-views';

export class RefreshTokenUseCase {
  constructor(
    private readonly authGateway: AuthGatewayPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly branchRepo: BranchRepositoryPort,
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly passengerRepo: PassengerProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(refreshToken: string): Promise<AuthenticatedSessionView> {
    const { userId, tokens } =
      await this.authGateway.refreshSession(refreshToken);

    const user = await this.userRepo.findById(userId);
    if (!user || !user.isActive()) {
      throw new UnauthorizedDomainException(
        'La cuenta no existe o está inactiva.',
      );
    }

    const view = await assembleCurrentUserView(user, {
      branchRepo: this.branchRepo,
      driverRepo: this.driverRepo,
      passengerRepo: this.passengerRepo,
      mediaStorage: this.mediaStorage,
    });

    return { tokens, ...view };
  }
}
