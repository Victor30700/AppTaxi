import { PassengerProfile } from '../entities/passenger-profile.entity';
import { PaymentMethod } from '../enums/user-role.enum';

export interface CreatePassengerProfileInput {
  userId: string;
  defaultPaymentMethod?: PaymentMethod;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  isPhoneVerified?: boolean;
}

export abstract class PassengerProfileRepositoryPort {
  abstract findByUserId(userId: string): Promise<PassengerProfile | null>;
  abstract create(
    input: CreatePassengerProfileInput,
  ): Promise<PassengerProfile>;
}
