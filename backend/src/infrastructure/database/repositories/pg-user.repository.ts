import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../../domain/enums/user-role.enum';
import {
  CreateUserRecordInput,
  UpdateOwnUserInput,
  UserRepositoryPort,
} from '../../../domain/ports/user-repository.port';
import { DatabaseService } from '../database.service';

export interface UserRow {
  id: string;
  role: UserRole;
  branch_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  avatar_url: string | null;
  status: UserStatus;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function mapUserRow(row: UserRow): User {
  return new User({
    id: row.id,
    role: row.role,
    branchId: row.branch_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    status: row.status,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

@Injectable()
export class PgUserRepository extends UserRepositoryPort {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const res = await this.db.query<UserRow>(
      `SELECT * FROM ${this.db.table('users')} WHERE id = $1 LIMIT 1`,
      [id],
    );
    return res.rows[0] ? mapUserRow(res.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const res = await this.db.query<UserRow>(
      `SELECT * FROM ${this.db.table('users')} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    return res.rows[0] ? mapUserRow(res.rows[0]) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const res = await this.db.query<UserRow>(
      `SELECT * FROM ${this.db.table('users')} WHERE phone = $1 LIMIT 1`,
      [phone],
    );
    return res.rows[0] ? mapUserRow(res.rows[0]) : null;
  }

  async create(input: CreateUserRecordInput): Promise<User> {
    const res = await this.db.query<UserRow>(
      `
      INSERT INTO ${this.db.table('users')} (
        id, role, branch_id, first_name, last_name, email, phone, avatar_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        input.id,
        input.role,
        input.branchId,
        input.firstName,
        input.lastName,
        input.email,
        input.phone,
        input.avatarUrl ?? null,
        input.status ?? UserStatus.ACTIVE,
      ],
    );
    return mapUserRow(res.rows[0]);
  }

  async updateOwnProfile(
    userId: string,
    input: UpdateOwnUserInput,
  ): Promise<User> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.firstName !== undefined) {
      params.push(input.firstName);
      sets.push(`first_name = $${params.length}`);
    }
    if (input.lastName !== undefined) {
      params.push(input.lastName);
      sets.push(`last_name = $${params.length}`);
    }
    if (input.phone !== undefined) {
      params.push(input.phone);
      sets.push(`phone = $${params.length}`);
    }
    if (input.avatarUrl !== undefined) {
      params.push(input.avatarUrl);
      sets.push(`avatar_url = $${params.length}`);
    }

    if (sets.length === 0) {
      const current = await this.findById(userId);
      if (!current) {
        throw new Error(`Usuario ${userId} no encontrado.`);
      }
      return current;
    }

    params.push(userId);
    const res = await this.db.query<UserRow>(
      `
      UPDATE ${this.db.table('users')}
      SET ${sets.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
      `,
      params,
    );
    return mapUserRow(res.rows[0]);
  }

  async updateStatus(userId: string, status: UserStatus): Promise<User> {
    const res = await this.db.query<UserRow>(
      `
      UPDATE ${this.db.table('users')}
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, userId],
    );
    return mapUserRow(res.rows[0]);
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.db.query(
      `UPDATE ${this.db.table('users')} SET last_login_at = NOW() WHERE id = $1`,
      [userId],
    );
  }
}
