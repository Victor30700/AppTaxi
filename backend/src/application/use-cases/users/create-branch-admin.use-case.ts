import { User } from '../../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../../domain/enums/user-role.enum';
import {
  ConflictDomainException,
  EntityNotFoundException,
  ForbiddenBranchScopeException,
} from '../../../domain/exceptions/domain.exception';
import { AuthGatewayPort } from '../../../domain/ports/auth-gateway.port';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';
import { normalizePhoneNumber } from '../../../domain/value-objects/bolivian-ci.vo';
import { toUserSummaryView, UserSummaryView } from '../auth/auth-views';

export interface CreateBranchAdminCommand {
  branchId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export class CreateBranchAdminUseCase {
  constructor(
    private readonly authGateway: AuthGatewayPort,
    private readonly userRepo: UserRepositoryPort,
    private readonly branchRepo: BranchRepositoryPort,
  ) {}

  async execute(
    actor: User,
    command: CreateBranchAdminCommand,
  ): Promise<UserSummaryView> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenBranchScopeException(
        'Solo el administrador general puede crear administradores regionales.',
      );
    }

    const branch = await this.branchRepo.findById(command.branchId);
    if (!branch) {
      throw new EntityNotFoundException('Sucursal', command.branchId);
    }

    const normalizedEmail = command.email.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(command.phone);

    if (await this.userRepo.findByEmail(normalizedEmail)) {
      throw new ConflictDomainException(
        'Ya existe un usuario registrado con ese correo electrónico.',
      );
    }
    if (await this.userRepo.findByPhone(normalizedPhone)) {
      throw new ConflictDomainException(
        'Ya existe un usuario registrado con ese número de celular.',
      );
    }

    const { userId } = await this.authGateway.createAuthUser({
      email: normalizedEmail,
      phone: normalizedPhone,
      password: command.password,
      role: UserRole.BRANCH_ADMIN,
      branchId: branch.id,
    });

    try {
      const created = await this.userRepo.create({
        id: userId,
        role: UserRole.BRANCH_ADMIN,
        branchId: branch.id,
        firstName: command.firstName.trim(),
        lastName: command.lastName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        status: UserStatus.ACTIVE,
      });

      return toUserSummaryView(created);
    } catch (error) {
      await this.authGateway.deleteAuthUser(userId).catch(() => undefined);
      throw error;
    }
  }
}
