import { UserRole, UserStatus } from '../enums/user-role.enum';
import { ValidationDomainException } from '../exceptions/domain.exception';

export interface UserProps {
  id: string;
  role: UserRole;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly role: UserRole;
  readonly branchId: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string;
  readonly avatarUrl: string | null;
  readonly status: UserStatus;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    User.assertRoleBranchInvariant(props.role, props.branchId);
    this.id = props.id;
    this.role = props.role;
    this.branchId = props.branchId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.phone = props.phone;
    this.avatarUrl = props.avatarUrl;
    this.status = props.status;
    this.lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  static assertRoleBranchInvariant(
    role: UserRole,
    branchId: string | null,
  ): void {
    if (
      (role === UserRole.ADMIN || role === UserRole.PASSENGER) &&
      branchId !== null
    ) {
      throw new ValidationDomainException(
        `El rol ${role} no debe estar asignado a una sucursal fija.`,
      );
    }
    if (
      (role === UserRole.BRANCH_ADMIN || role === UserRole.DRIVER) &&
      !branchId
    ) {
      throw new ValidationDomainException(
        `El rol ${role} requiere obligatoriamente un branchId asignado.`,
      );
    }
  }
}
