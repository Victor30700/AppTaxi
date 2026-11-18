import { Inject, Injectable } from '@nestjs/common';
import { PassengerProfile } from '../../../domain/entities/passenger-profile.entity';
import { PaymentMethod } from '../../../domain/enums/user-role.enum';
import {
  CreatePassengerProfileInput,
  PassengerProfileRepositoryPort,
} from '../../../domain/ports/passenger-profile-repository.port';
import { DatabaseService } from '../database.service';

interface PassengerProfileRow {
  user_id: string;
  default_payment_method: PaymentMethod;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_phone_verified: boolean;
  rating_avg: string | number;
  total_trips: number;
  created_at: Date;
  updated_at: Date;
}

function mapPassengerRow(row: PassengerProfileRow): PassengerProfile {
  return new PassengerProfile({
    userId: row.user_id,
    defaultPaymentMethod: row.default_payment_method,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    isPhoneVerified: row.is_phone_verified,
    ratingAvg: Number(row.rating_avg),
    totalTrips: Number(row.total_trips),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

@Injectable()
export class PgPassengerProfileRepository extends PassengerProfileRepositoryPort {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {
    super();
  }

  async findByUserId(userId: string): Promise<PassengerProfile | null> {
    const res = await this.db.query<PassengerProfileRow>(
      `SELECT * FROM ${this.db.table('passenger_profiles')} WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    return res.rows[0] ? mapPassengerRow(res.rows[0]) : null;
  }

  async create(
    input: CreatePassengerProfileInput,
  ): Promise<PassengerProfile> {
    const res = await this.db.query<PassengerProfileRow>(
      `
      INSERT INTO ${this.db.table('passenger_profiles')} (
        user_id, default_payment_method, emergency_contact_name,
        emergency_contact_phone, is_phone_verified
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        input.userId,
        input.defaultPaymentMethod ?? PaymentMethod.CASH,
        input.emergencyContactName ?? null,
        input.emergencyContactPhone ?? null,
        input.isPhoneVerified ?? false,
      ],
    );
    return mapPassengerRow(res.rows[0]);
  }
}
