import { DriverProfile } from '../entities/driver-profile.entity';
import { User } from '../entities/user.entity';
import {
  AffiliateType,
  ExpedidoCode,
  VerificationStatus,
} from '../enums/user-role.enum';

export interface DriverWithUser {
  user: User;
  profile: DriverProfile;
}

export interface CreateDriverProfileInput {
  userId: string;
  branchId: string;
  birthDate: Date;
  ciNumber: string;
  ciComplement: string | null;
  ciIssuedDept: ExpedidoCode;
  address: string;
  ciFrontPath?: string | null;
  ciBackPath?: string | null;
  affiliateType?: AffiliateType;
}

export interface UpdateDriverProfileInput {
  birthDate?: Date;
  ciNumber?: string;
  ciComplement?: string | null;
  ciIssuedDept?: ExpedidoCode;
  address?: string;
  ciFrontPath?: string | null;
  ciBackPath?: string | null;
  affiliateType?: AffiliateType;
}

export interface DriverFilter {
  branchId?: string | null;
  verificationStatus?: VerificationStatus;
}

export abstract class DriverProfileRepositoryPort {
  abstract findByUserId(userId: string): Promise<DriverWithUser | null>;
  abstract findByCi(
    ciNumber: string,
    ciComplement: string | null,
    ciIssuedDept: ExpedidoCode,
  ): Promise<DriverProfile | null>;
  abstract findAll(filter?: DriverFilter): Promise<DriverWithUser[]>;
  abstract create(input: CreateDriverProfileInput): Promise<DriverProfile>;
  abstract update(
    userId: string,
    input: UpdateDriverProfileInput,
  ): Promise<DriverProfile>;
  abstract updateVerification(
    userId: string,
    status: VerificationStatus,
    notes: string | null,
  ): Promise<DriverProfile>;
  abstract updateDocumentPaths(
    userId: string,
    paths: { ciFrontPath?: string; ciBackPath?: string },
  ): Promise<DriverProfile>;
}
