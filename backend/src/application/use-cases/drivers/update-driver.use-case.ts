import { DriverProfile } from '../../../domain/entities/driver-profile.entity';
import { User } from '../../../domain/entities/user.entity';
import {
  AffiliateType,
  ExpedidoCode,
  UserRole,
} from '../../../domain/enums/user-role.enum';
import {
  ConflictDomainException,
  EntityNotFoundException,
  ForbiddenBranchScopeException,
} from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import {
  BolivianCi,
  normalizePhoneNumber,
} from '../../../domain/value-objects/bolivian-ci.vo';
import {
  DriverDetailView,
  toDriverProfileView,
  toUserSummaryView,
} from '../auth/auth-views';

export interface UpdateDriverCommand {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  ciNumber?: string;
  ciComplement?: string | null;
  ciIssuedDept?: ExpedidoCode;
  address?: string;
  affiliateType?: AffiliateType;
}

export class UpdateDriverUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
    private readonly authGateway: AuthGatewayPort,
  ) {}

  async execute(
    actor: User,
    driverUserId: string,
    command: UpdateDriverCommand,
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

    let normalizedPhone: string | undefined;
    let shouldSyncAuthPhone = false;
    if (command.phone !== undefined) {
      normalizedPhone = normalizePhoneNumber(command.phone);
      const userWithPhone = await this.userRepo.findByPhone(normalizedPhone);
      if (userWithPhone && userWithPhone.id !== driverUserId) {
        throw new ConflictDomainException(
          'Ese número de celular ya está registrado en otra cuenta.',
        );
      }
      shouldSyncAuthPhone = normalizedPhone !== existing.user.phone;
    }

    let parsedBirthDate: Date | undefined;
    if (command.birthDate !== undefined) {
      parsedBirthDate = new Date(command.birthDate);
      DriverProfile.assertAdult(parsedBirthDate);
    }

    const nextCiNumber = command.ciNumber ?? existing.profile.ciNumber;
    const nextCiDept = command.ciIssuedDept ?? existing.profile.ciIssuedDept;
    const nextCiComplement =
      command.ciComplement !== undefined
        ? command.ciComplement
        : existing.profile.ciComplement;

    const ci = BolivianCi.create(nextCiNumber, nextCiDept, nextCiComplement);
    const duplicateCi = await this.driverRepo.findByCi(
      ci.ciNumber,
      ci.ciComplement,
      ci.ciIssuedDept,
    );
    if (duplicateCi && duplicateCi.userId !== driverUserId) {
      throw new ConflictDomainException(
        `Ya existe otro conductor con el CI ${ci.format()}.`,
      );
    }

    if (shouldSyncAuthPhone && normalizedPhone) {
      await this.authGateway.updateAuthUserPhone(driverUserId, normalizedPhone);
    }

    let updatedUser: User;
    try {
      updatedUser = await this.userRepo.updateOwnProfile(driverUserId, {
        firstName: command.firstName?.trim(),
        lastName: command.lastName?.trim(),
        phone: normalizedPhone,
      });
    } catch (error) {
      if (shouldSyncAuthPhone) {
        await this.authGateway
          .updateAuthUserPhone(driverUserId, existing.user.phone)
          .catch(() => undefined);
      }
      throw error;
    }

    const updatedProfile = await this.driverRepo.update(driverUserId, {
      birthDate: parsedBirthDate,
      ciNumber: ci.ciNumber,
      ciComplement: ci.ciComplement,
      ciIssuedDept: ci.ciIssuedDept,
      address: command.address?.trim(),
      affiliateType: command.affiliateType,
    });

    const [ciFrontUrl, ciBackUrl] = await Promise.all([
      this.mediaStorage.getSignedDriverDocumentUrl(updatedProfile.ciFrontPath),
      this.mediaStorage.getSignedDriverDocumentUrl(updatedProfile.ciBackPath),
    ]);

    return {
      user: toUserSummaryView(updatedUser),
      profile: toDriverProfileView(updatedProfile, ciFrontUrl, ciBackUrl),
    };
  }
}
