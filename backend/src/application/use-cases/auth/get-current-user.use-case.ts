import { EntityNotFoundException } from '../../../domain/exceptions/domain.exception';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import { PassengerProfileRepositoryPort } from '../../../domain/ports/passenger-profile-repository.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { assembleCurrentUserView, CurrentUserView } from './auth-views';

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly branchRepo: BranchRepositoryPort,
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly passengerRepo: PassengerProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(userId: string): Promise<CurrentUserView> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('Usuario', userId);
    }

    return assembleCurrentUserView(user, {
      branchRepo: this.branchRepo,
      driverRepo: this.driverRepo,
      passengerRepo: this.passengerRepo,
      mediaStorage: this.mediaStorage,
    });
  }
}
