import { Branch } from '../../../domain/entities/branch.entity';
import { DriverProfile } from '../../../domain/entities/driver-profile.entity';
import { PassengerProfile } from '../../../domain/entities/passenger-profile.entity';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { AuthTokens } from '../../../domain/ports/auth-gateway.port';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import { MediaStoragePort } from '../../../domain/ports/media-storage.port';
import { PassengerProfileRepositoryPort } from '../../../domain/ports/passenger-profile-repository.port';

export interface DriverProfileView {
  userId: string;
  branchId: string;
  birthDate: string;
  ciNumber: string;
  ciComplement: string | null;
  ciIssuedDept: string;
  ciFormatted: string;
  address: string;
  ciFrontUrl: string | null;
  ciBackUrl: string | null;
  affiliateType: string;
  verificationStatus: string;
  verificationNotes: string | null;
  isAvailable: boolean;
  dailyQuotaPaidUntil: string | null;
  ratingAvg: number;
  totalTrips: number;
}

export interface PassengerProfileView {
  userId: string;
  defaultPaymentMethod: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  isPhoneVerified: boolean;
  ratingAvg: number;
  totalTrips: number;
}

export interface UserSummaryView {
  id: string;
  role: string;
  branchId: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CurrentUserView {
  user: UserSummaryView;
  branch: Branch | null;
  driverProfile: DriverProfileView | null;
  passengerProfile: PassengerProfileView | null;
}

export interface AuthenticatedSessionView extends CurrentUserView {
  tokens: AuthTokens;
}

export interface DriverDetailView {
  user: UserSummaryView;
  profile: DriverProfileView;
}

export function toUserSummaryView(user: User): UserSummaryView {
  return {
    id: user.id,
    role: user.role,
    branchId: user.branchId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    status: user.status,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toDriverProfileView(
  profile: DriverProfile,
  ciFrontUrl: string | null,
  ciBackUrl: string | null,
): DriverProfileView {
  const ciFormattedBase = profile.ciComplement
    ? `${profile.ciNumber}-${profile.ciComplement}`
    : profile.ciNumber;

  return {
    userId: profile.userId,
    branchId: profile.branchId,
    birthDate: profile.birthDate.toISOString().slice(0, 10),
    ciNumber: profile.ciNumber,
    ciComplement: profile.ciComplement,
    ciIssuedDept: profile.ciIssuedDept,
    ciFormatted: `${ciFormattedBase} ${profile.ciIssuedDept}`,
    address: profile.address,
    ciFrontUrl,
    ciBackUrl,
    affiliateType: profile.affiliateType,
    verificationStatus: profile.verificationStatus,
    verificationNotes: profile.verificationNotes,
    isAvailable: profile.isAvailable,
    dailyQuotaPaidUntil: profile.dailyQuotaPaidUntil
      ? profile.dailyQuotaPaidUntil.toISOString()
      : null,
    ratingAvg: profile.ratingAvg,
    totalTrips: profile.totalTrips,
  };
}

export function toPassengerProfileView(
  profile: PassengerProfile,
): PassengerProfileView {
  return {
    userId: profile.userId,
    defaultPaymentMethod: profile.defaultPaymentMethod,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
    isPhoneVerified: profile.isPhoneVerified,
    ratingAvg: profile.ratingAvg,
    totalTrips: profile.totalTrips,
  };
}

export async function assembleCurrentUserView(
  user: User,
  deps: {
    branchRepo: BranchRepositoryPort;
    driverRepo: DriverProfileRepositoryPort;
    passengerRepo: PassengerProfileRepositoryPort;
    mediaStorage: MediaStoragePort;
  },
): Promise<CurrentUserView> {
  const branch = user.branchId
    ? await deps.branchRepo.findById(user.branchId)
    : null;

  let driverProfileView: DriverProfileView | null = null;
  if (user.role === UserRole.DRIVER) {
    const driverData = await deps.driverRepo.findByUserId(user.id);
    if (driverData) {
      const [ciFrontUrl, ciBackUrl] = await Promise.all([
        deps.mediaStorage.getSignedDriverDocumentUrl(
          driverData.profile.ciFrontPath,
        ),
        deps.mediaStorage.getSignedDriverDocumentUrl(
          driverData.profile.ciBackPath,
        ),
      ]);
      driverProfileView = toDriverProfileView(
        driverData.profile,
        ciFrontUrl,
        ciBackUrl,
      );
    }
  }

  let passengerProfileView: PassengerProfileView | null = null;
  if (user.role === UserRole.PASSENGER) {
    const passenger = await deps.passengerRepo.findByUserId(user.id);
    if (passenger) {
      passengerProfileView = toPassengerProfileView(passenger);
    }
  }

  return {
    user: toUserSummaryView(user),
    branch,
    driverProfile: driverProfileView,
    passengerProfile: passengerProfileView,
  };
}
