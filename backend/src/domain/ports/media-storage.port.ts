export interface UploadFileInput {
  buffer: Uint8Array;
  mimeType: string;
  originalName: string;
}

export abstract class MediaStoragePort {
  abstract uploadAvatar(userId: string, file: UploadFileInput): Promise<string>;

  abstract uploadDriverDocument(
    branchId: string,
    driverUserId: string,
    side: 'ci-front' | 'ci-back',
    file: UploadFileInput,
  ): Promise<string>;

  abstract getSignedDriverDocumentUrl(
    storagePath: string | null,
    expiresInSeconds?: number,
  ): Promise<string | null>;
}
