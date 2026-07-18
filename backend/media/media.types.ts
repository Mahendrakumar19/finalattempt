import { FileType, StorageProvider, Visibility } from '@prisma/client';

export interface ImageVariantPaths {
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  original: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  dpi?: number;
  pageCount?: number;
  variants?: ImageVariantPaths;
  cameraInfo?: any;
  customAttributes?: Record<string, any>;
}

export interface MediaDTO {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  originalName: string;
  fileType: FileType;
  storageProvider: StorageProvider;
  mimeType: string;
  extension: string;
  size: number;
  storagePath: string;
  thumbnailPath?: string | null;
  metadata?: MediaMetadata | null;
  visibility: Visibility;
  checksum: string;
  width?: number | null;
  height?: number | null;
  folderId?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  lastAccessedAt?: Date | null;
}
