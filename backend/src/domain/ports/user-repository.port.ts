import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../enums/user-role.enum';

export interface CreateUserRecordInput {
  id: string;
  role: UserRole;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  avatarUrl?: string | null;
  status?: UserStatus;
}

export interface UpdateOwnUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export abstract class UserRepositoryPort {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByPhone(phone: string): Promise<User | null>;
  abstract create(input: CreateUserRecordInput): Promise<User>;
  abstract updateOwnProfile(
    userId: string,
    input: UpdateOwnUserInput,
  ): Promise<User>;
  abstract updateStatus(userId: string, status: UserStatus): Promise<User>;
  abstract touchLastLogin(userId: string): Promise<void>;
}
