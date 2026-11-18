import { DriverProfile } from '../../../domain/entities/driver-profile.entity';
import { User } from '../../../domain/entities/user.entity';
import {
  AffiliateType,
  ExpedidoCode,
  UserRole,
  UserStatus,
} from '../../../domain/enums/user-role.enum';
import {
  ConflictDomainException,
  EntityNotFoundException,
  ForbiddenBranchScopeException,
} from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';
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

export interface RegisterDriverCommand {
  branchId?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  password: string;
  birthDate: string;
  ciNumber: string;
  ciComplement?: string | null;
  ciIssuedDept: ExpedidoCode;
  address: string;
  affiliateType?: AffiliateType;
  avatarUrl?: string | null;
  ciFrontPath?: string | null;
  ciBackPath?: string | null;
}

export class RegisterDriverUseCase {
  constructor(
    private readonly authGateway: AuthGatewayPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly branchRepo: BranchRepositoryPort,
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(
    actor: User,
    command: RegisterDriverCommand,
  ): Promise<DriverDetailView> {
    let targetBranchId: string;
    if (actor.role === UserRole.ADMIN) {
      if (!command.branchId) {
        throw new ForbiddenBranchScopeException(
          'El administrador general debe especificar el branchId del conductor.',
        );
      }
      targetBranchId = command.branchId;
    } else if (actor.role === UserRole.BRANCH_ADMIN && actor.branchId) {
      if (command.branchId && command.branchId !== actor.branchId) {
        throw new ForbiddenBranchScopeException(
          'No puedes registrar conductores en otra sucursal.',
        );
      }
      targetBranchId = actor.branchId;
    } else {
      throw new ForbiddenBranchScopeException();
    }

    const branch = await this.branchRepo.findById(targetBranchId);
    if (!branch) {
      throw new EntityNotFoundException('Sucursal', targetBranchId);
    }

    const birthDate = new Date(command.birthDate);
    DriverProfile.assertAdult(birthDate);

    const ci = BolivianCi.create(
      command.ciNumber,
      command.ciIssuedDept,
      command.ciComplement,
    );
    const normalizedPhone = normalizePhoneNumber(command.phone);
    const normalizedEmail = command.email?.trim().toLowerCase() || null;

    if (await this.userRepo.findByPhone(normalizedPhone)) {
      throw new ConflictDomainException(
        'Ya existe una cuenta registrada con ese número de celular.',
      );
    }
    if (normalizedEmail && (await this.userRepo.findByEmail(normalizedEmail))) {
      throw new ConflictDomainException(
        'Ya existe una cuenta registrada con ese correo electrónico.',
      );
    }
    if (
      await this.driverRepo.findByCi(
        ci.ciNumber,
        ci.ciComplement,
        ci.ciIssuedDept,
      )
    ) {
      throw new ConflictDomainException(
        `Ya existe un conductor registrado con el CI ${ci.format()}.`,
      );
    }

    const { userId } = await this.authGateway.createAuthUser({
      email: normalizedEmail,
      phone: normalizedPhone,
      password: command.password,
      role: UserRole.DRIVER,
      branchId: targetBranchId,
    });

    try {
      const user = await this.userRepo.create({
        id: userId,
        role: UserRole.DRIVER,
        branchId: targetBranchId,
        firstName: command.firstName.trim(),
        lastName: command.lastName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        avatarUrl: command.avatarUrl ?? null,
        status: UserStatus.ACTIVE,
      });

      const profile = await this.driverRepo.create({
        userId,
        branchId: targetBranchId,
        birthDate,
        ciNumber: ci.ciNumber,
        ciComplement: ci.ciComplement,
        ciIssuedDept: ci.ciIssuedDept,
        address: command.address.trim(),
        ciFrontPath: command.ciFrontPath ?? null,
        ciBackPath: command.ciBackPath ?? null,
        affiliateType: command.affiliateType ?? AffiliateType.SOCIO_TITULAR,
      });

      const [ciFrontUrl, ciBackUrl] = await Promise.all([
        this.mediaStorage.getSignedDriverDocumentUrl(profile.ciFrontPath),
        this.mediaStorage.getSignedDriverDocumentUrl(profile.ciBackPath),
      ]);

      return {
        user: toUserSummaryView(user),
        profile: toDriverProfileView(profile, ciFrontUrl, ciBackUrl),
      };
    } catch (error) {
      await this.authGateway.deleteAuthUser(userId).catch(() => undefined);
      throw error;
    }
  }
}
