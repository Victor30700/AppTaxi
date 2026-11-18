import path from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import {
  MediaStoragePort,
  UploadFileInput,
} from '../../domain/ports/media-storage.port';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SupabaseStorageAdapter extends MediaStoragePort {
  private readonly avatarsBucket: string;
  private readonly documentsBucket: string;

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {
    super();
    this.avatarsBucket = (
      process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars'
    ).trim();
    this.documentsBucket = (
      process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'driver-documents'
    ).trim();
  }

  private resolveExtension(file: UploadFileInput): string {
    const ext = path.extname(file.originalName).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
      return ext;
    }
    if (file.mimeType === 'image/png') return '.png';
    if (file.mimeType === 'image/webp') return '.webp';
    return '.jpg';
  }

  async uploadAvatar(userId: string, file: UploadFileInput): Promise<string> {
    const admin = this.db.getSupabaseAdmin();
    const ext = this.resolveExtension(file);
    const objectPath = `users/${userId}/avatar-${Date.now()}${ext}`;

    const { error } = await admin.storage
      .from(this.avatarsBucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Error subiendo foto de perfil: ${error.message}`);
    }

    const { data } = admin.storage
      .from(this.avatarsBucket)
      .getPublicUrl(objectPath);
    return data.publicUrl;
  }

  async uploadDriverDocument(
    branchId: string,
    driverUserId: string,
    side: 'ci-front' | 'ci-back',
    file: UploadFileInput,
  ): Promise<string> {
    const admin = this.db.getSupabaseAdmin();
    const ext = this.resolveExtension(file);
    const objectPath = `branches/${branchId}/drivers/${driverUserId}/${side}-${Date.now()}${ext}`;

    const { error } = await admin.storage
      .from(this.documentsBucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Error subiendo documento CI: ${error.message}`);
    }

    return objectPath;
  }

  async getSignedDriverDocumentUrl(
    storagePath: string | null,
    expiresInSeconds = 300,
  ): Promise<string | null> {
    if (!storagePath) return null;

    const admin = this.db.getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(this.documentsBucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  }
}
