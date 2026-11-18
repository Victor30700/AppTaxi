import { PaymentMethod } from '../enums/user-role.enum';

export interface PassengerProfileProps {
  userId: string;
  defaultPaymentMethod: PaymentMethod;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isPhoneVerified: boolean;
  ratingAvg: number;
  totalTrips: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PassengerProfile {
  readonly userId: string;
  readonly defaultPaymentMethod: PaymentMethod;
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly isPhoneVerified: boolean;
  readonly ratingAvg: number;
  readonly totalTrips: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: PassengerProfileProps) {
    this.userId = props.userId;
    this.defaultPaymentMethod = props.defaultPaymentMethod;
    this.emergencyContactName = props.emergencyContactName;
    this.emergencyContactPhone = props.emergencyContactPhone;
    this.isPhoneVerified = props.isPhoneVerified;
    this.ratingAvg = props.ratingAvg;
    this.totalTrips = props.totalTrips;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
