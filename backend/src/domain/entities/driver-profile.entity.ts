import {
  AffiliateType,
  ExpedidoCode,
  VerificationStatus,
} from '../enums/user-role.enum';
import { ValidationDomainException } from '../exceptions/domain.exception';

export interface DriverProfileProps {
  userId: string;
  branchId: string;
  birthDate: Date;
  ciNumber: string;
  ciComplement: string | null;
  ciIssuedDept: ExpedidoCode;
  address: string;
  ciFrontPath: string | null;
  ciBackPath: string | null;
  affiliateType: AffiliateType;
  verificationStatus: VerificationStatus;
  verificationNotes: string | null;
  isAvailable: boolean;
  dailyQuotaPaidUntil: Date | null;
  ratingAvg: number;
  totalTrips: number;
  createdAt: Date;
  updatedAt: Date;
}

export class DriverProfile {
  readonly userId: string;
  readonly branchId: string;
  readonly birthDate: Date;
  readonly ciNumber: string;
  readonly ciComplement: string | null;
  readonly ciIssuedDept: ExpedidoCode;
  readonly address: string;
  readonly ciFrontPath: string | null;
  readonly ciBackPath: string | null;
  readonly affiliateType: AffiliateType;
  readonly verificationStatus: VerificationStatus;
  readonly verificationNotes: string | null;
  readonly isAvailable: boolean;
  readonly dailyQuotaPaidUntil: Date | null;
  readonly ratingAvg: number;
  readonly totalTrips: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DriverProfileProps) {
    this.userId = props.userId;
    this.branchId = props.branchId;
    this.birthDate = props.birthDate;
    this.ciNumber = props.ciNumber;
    this.ciComplement = props.ciComplement;
    this.ciIssuedDept = props.ciIssuedDept;
    this.address = props.address;
    this.ciFrontPath = props.ciFrontPath;
    this.ciBackPath = props.ciBackPath;
    this.affiliateType = props.affiliateType;
    this.verificationStatus = props.verificationStatus;
    this.verificationNotes = props.verificationNotes;
    this.isAvailable = props.isAvailable;
    this.dailyQuotaPaidUntil = props.dailyQuotaPaidUntil;
    this.ratingAvg = props.ratingAvg;
    this.totalTrips = props.totalTrips;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Valida que el conductor tenga al menos 18 años cumplidos.
   */
  static assertAdult(birthDate: Date): void {
    const now = new Date();
    let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())
    ) {
      age--;
    }
    if (age < 18) {
      throw new ValidationDomainException(
        'El conductor debe ser mayor de 18 años.',
      );
    }
  }
}
