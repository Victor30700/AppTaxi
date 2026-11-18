import { Inject, Injectable } from '@nestjs/common';
import { DriverProfile } from '../../../domain/entities/driver-profile.entity';
import {
  AffiliateType,
  ExpedidoCode,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../../domain/enums/user-role.enum';
import {
  CreateDriverProfileInput,
  DriverFilter,
  DriverProfileRepositoryPort,
  DriverWithUser,
  UpdateDriverProfileInput,
} from '../../../domain/ports/driver-profile-repository.port';
import { DatabaseService } from '../database.service';
import { mapUserRow } from './pg-user.repository';

interface DriverProfileRow {
  user_id: string;
  branch_id: string;
  birth_date: Date | string;
  ci_number: string;
  ci_complement: string | null;
  ci_issued_dept: ExpedidoCode;
  address: string;
  ci_front_path: string | null;
  ci_back_path: string | null;
  affiliate_type: AffiliateType;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  is_available: boolean;
  daily_quota_paid_until: Date | null;
  rating_avg: string | number;
  total_trips: number;
  created_at: Date;
  updated_at: Date;
}

interface JoinedDriverRow extends DriverProfileRow {
  u_id: string;
  u_role: UserRole;
  u_branch_id: string | null;
  u_first_name: string;
  u_last_name: string;
  u_email: string | null;
  u_phone: string;
  u_avatar_url: string | null;
  u_status: UserStatus;
  u_last_login_at: Date | null;
  u_created_at: Date;
  u_updated_at: Date;
}

function mapDriverProfileRow(row: DriverProfileRow): DriverProfile {
  return new DriverProfile({
    userId: row.user_id,
    branchId: row.branch_id,
    birthDate: new Date(row.birth_date),
    ciNumber: row.ci_number,
    ciComplement: row.ci_complement,
    ciIssuedDept: row.ci_issued_dept,
    address: row.address,
    ciFrontPath: row.ci_front_path,
    ciBackPath: row.ci_back_path,
    affiliateType: row.affiliate_type,
    verificationStatus: row.verification_status,
    verificationNotes: row.verification_notes,
    isAvailable: row.is_available,
    dailyQuotaPaidUntil: row.daily_quota_paid_until
      ? new Date(row.daily_quota_paid_until)
      : null,
    ratingAvg: Number(row.rating_avg),
    totalTrips: Number(row.total_trips),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function mapJoinedDriverRow(row: JoinedDriverRow): DriverWithUser {
  return {
    user: mapUserRow({
      id: row.u_id,
      role: row.u_role,
      branch_id: row.u_branch_id,
      first_name: row.u_first_name,
      last_name: row.u_last_name,
      email: row.u_email,
      phone: row.u_phone,
      avatar_url: row.u_avatar_url,
      status: row.u_status,
      last_login_at: row.u_last_login_at,
      created_at: row.u_created_at,
      updated_at: row.u_updated_at,
    }),
    profile: mapDriverProfileRow(row),
  };
}

@Injectable()
export class PgDriverProfileRepository extends DriverProfileRepositoryPort {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {
    super();
  }

  private baseSelectSql(): string {
    return `
      SELECT
        dp.*,
        u.id AS u_id,
        u.role AS u_role,
        u.branch_id AS u_branch_id,
        u.first_name AS u_first_name,
        u.last_name AS u_last_name,
        u.email AS u_email,
        u.phone AS u_phone,
        u.avatar_url AS u_avatar_url,
        u.status AS u_status,
        u.last_login_at AS u_last_login_at,
        u.created_at AS u_created_at,
        u.updated_at AS u_updated_at
      FROM ${this.db.table('driver_profiles')} dp
      INNER JOIN ${this.db.table('users')} u ON u.id = dp.user_id
    `;
  }

  async findByUserId(userId: string): Promise<DriverWithUser | null> {
    const res = await this.db.query<JoinedDriverRow>(
      `${this.baseSelectSql()} WHERE dp.user_id = $1 LIMIT 1`,
      [userId],
    );
    return res.rows[0] ? mapJoinedDriverRow(res.rows[0]) : null;
  }

  async findByCi(
    ciNumber: string,
    ciComplement: string | null,
    ciIssuedDept: ExpedidoCode,
  ): Promise<DriverProfile | null> {
    const res = await this.db.query<DriverProfileRow>(
      `
      SELECT * FROM ${this.db.table('driver_profiles')}
      WHERE ci_number = $1
        AND COALESCE(ci_complement, '') = $2
        AND ci_issued_dept = $3
      LIMIT 1
      `,
      [ciNumber, ciComplement ?? '', ciIssuedDept],
    );
    return res.rows[0] ? mapDriverProfileRow(res.rows[0]) : null;
  }

  async findAll(filter?: DriverFilter): Promise<DriverWithUser[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter?.branchId) {
      params.push(filter.branchId);
      conditions.push(`dp.branch_id = $${params.length}`);
    }
    if (filter?.verificationStatus) {
      params.push(filter.verificationStatus);
      conditions.push(`dp.verification_status = $${params.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await this.db.query<JoinedDriverRow>(
      `${this.baseSelectSql()} ${whereClause} ORDER BY dp.created_at DESC`,
      params,
    );
    return res.rows.map(mapJoinedDriverRow);
  }

  async create(input: CreateDriverProfileInput): Promise<DriverProfile> {
    const res = await this.db.query<DriverProfileRow>(
      `
      INSERT INTO ${this.db.table('driver_profiles')} (
        user_id, branch_id, birth_date, ci_number, ci_complement, ci_issued_dept,
        address, ci_front_path, ci_back_path, affiliate_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        input.userId,
        input.branchId,
        input.birthDate.toISOString().slice(0, 10),
        input.ciNumber,
        input.ciComplement,
        input.ciIssuedDept,
        input.address,
        input.ciFrontPath ?? null,
        input.ciBackPath ?? null,
        input.affiliateType ?? AffiliateType.SOCIO_TITULAR,
      ],
    );
    return mapDriverProfileRow(res.rows[0]);
  }

  async update(
    userId: string,
    input: UpdateDriverProfileInput,
  ): Promise<DriverProfile> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.birthDate !== undefined) {
      params.push(input.birthDate.toISOString().slice(0, 10));
      sets.push(`birth_date = $${params.length}`);
    }
    if (input.ciNumber !== undefined) {
      params.push(input.ciNumber);
      sets.push(`ci_number = $${params.length}`);
    }
    if (input.ciComplement !== undefined) {
      params.push(input.ciComplement);
      sets.push(`ci_complement = $${params.length}`);
    }
    if (input.ciIssuedDept !== undefined) {
      params.push(input.ciIssuedDept);
      sets.push(`ci_issued_dept = $${params.length}`);
    }
    if (input.address !== undefined) {
      params.push(input.address);
      sets.push(`address = $${params.length}`);
    }
    if (input.affiliateType !== undefined) {
      params.push(input.affiliateType);
      sets.push(`affiliate_type = $${params.length}`);
    }

    if (sets.length === 0) {
      const found = await this.findByUserId(userId);
      if (!found) {
        throw new Error(`Perfil de conductor ${userId} no encontrado.`);
      }
      return found.profile;
    }

    params.push(userId);
    const res = await this.db.query<DriverProfileRow>(
      `
      UPDATE ${this.db.table('driver_profiles')}
      SET ${sets.join(', ')}
      WHERE user_id = $${params.length}
      RETURNING *
      `,
      params,
    );
    return mapDriverProfileRow(res.rows[0]);
  }

  async updateVerification(
    userId: string,
    status: VerificationStatus,
    notes: string | null,
  ): Promise<DriverProfile> {
    const res = await this.db.query<DriverProfileRow>(
      `
      UPDATE ${this.db.table('driver_profiles')}
      SET verification_status = $1, verification_notes = $2
      WHERE user_id = $3
      RETURNING *
      `,
      [status, notes, userId],
    );
    return mapDriverProfileRow(res.rows[0]);
  }

  async updateDocumentPaths(
    userId: string,
    paths: { ciFrontPath?: string; ciBackPath?: string },
  ): Promise<DriverProfile> {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (paths.ciFrontPath !== undefined) {
      params.push(paths.ciFrontPath);
      sets.push(`ci_front_path = $${params.length}`);
    }
    if (paths.ciBackPath !== undefined) {
      params.push(paths.ciBackPath);
      sets.push(`ci_back_path = $${params.length}`);
    }

    params.push(userId);
    const res = await this.db.query<DriverProfileRow>(
      `
      UPDATE ${this.db.table('driver_profiles')}
      SET ${sets.join(', ')}
      WHERE user_id = $${params.length}
      RETURNING *
      `,
      params,
    );
    return mapDriverProfileRow(res.rows[0]);
  }
}
