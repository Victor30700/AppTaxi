import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
import {
  EntityNotFoundException,
  ForbiddenBranchScopeException,
  ValidationDomainException,
} from '../../../domain/exceptions/domain.exception';
import { DriverProfileRepositoryPort } from '../../../domain/ports/driver-profile-repository.port';
import {
  MediaStoragePort,
  UploadFileInput,
} from '../../../domain/ports/media-storage.port';
import { UserRepositoryPort } from '../../../domain/ports/user-repository.port';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function validateImage(file: UploadFileInput): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimeType)) {
    throw new ValidationDomainException(
      'Formato de imagen no permitido. Usa JPEG, PNG o WEBP.',
    );
  }
  if (file.buffer.byteLength === 0 || file.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ValidationDomainException(
      'La imagen debe pesar entre 1 byte y 5 MB.',
    );
  }
}

export class UploadProfileAvatarUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(
    actor: User,
    targetUserId: string,
    file: UploadFileInput,
  ): Promise<{ avatarUrl: string }> {
    validateImage(file);

    const target = await this.userRepo.findById(targetUserId);
    if (!target) {
      throw new EntityNotFoundException('Usuario', targetUserId);
    }

    const isSelf = actor.id === targetUserId;
    const isGlobalAdmin = actor.role === UserRole.ADMIN;
    const isBranchAdminOfDriver =
      actor.role === UserRole.BRANCH_ADMIN &&
      target.role === UserRole.DRIVER &&
      target.branchId === actor.branchId;

    if (!isSelf && !isGlobalAdmin && !isBranchAdminOfDriver) {
      throw new ForbiddenBranchScopeException();
    }

    const avatarUrl = await this.mediaStorage.uploadAvatar(targetUserId, file);
    await this.userRepo.updateOwnProfile(targetUserId, { avatarUrl });

    return { avatarUrl };
  }
}

export class UploadDriverDocumentUseCase {
  constructor(
    private readonly driverRepo: DriverProfileRepositoryPort,
    private readonly mediaStorage: MediaStoragePort,
  ) {}

  async execute(
    actor: User,
    driverUserId: string,
    side: 'ci-front' | 'ci-back',
    file: UploadFileInput,
  ): Promise<{ path: string; signedUrl: string | null }> {
    validateImage(file);

    const driver = await this.driverRepo.findByUserId(driverUserId);
    if (!driver) {
      throw new EntityNotFoundException('Conductor', driverUserId);
    }

    const isSelf = actor.id === driverUserId;
    const isGlobalAdmin = actor.role === UserRole.ADMIN;
    const isBranchAdminOfDriver =
      actor.role === UserRole.BRANCH_ADMIN &&
      driver.profile.branchId === actor.branchId;

    if (!isSelf && !isGlobalAdmin && !isBranchAdminOfDriver) {
      throw new ForbiddenBranchScopeException();
    }

    const path = await this.mediaStorage.uploadDriverDocument(
      driver.profile.branchId,
      driverUserId,
      side,
      file,
    );

    await this.driverRepo.updateDocumentPaths(
      driverUserId,
      side === 'ci-front' ? { ciFrontPath: path } : { ciBackPath: path },
    );

    const signedUrl = await this.mediaStorage.getSignedDriverDocumentUrl(path);
    return { path, signedUrl };
  }
}
