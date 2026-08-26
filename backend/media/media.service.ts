import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { FileType, StorageProvider, Visibility } from '@prisma/client';
import { mediaRepository } from './media.repository';
import { ImageProcessor } from '../services/imageProcessor';
import { minioStorage } from '../services/minioStorage';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'svg',
  'pdf',
  'doc', 'docx',
  'xls', 'xlsx',
  'ppt', 'pptx',
  'zip',
  'mp3',
  'mp4'
];

const DISALLOWED_EXTENSIONS = ['exe', 'bat', 'cmd', 'apk', 'dll', 'sh'];

export class MediaService {
  constructor() {
    this.ensureDirectoryStructure();
  }

  private ensureDirectoryStructure() {
    const folders = [
      'images', 'blogs', 'courses', 'faculty', 'users', 'logos', 'banners',
      'documents', 'pdfs', 'notes', 'magazines', 'downloads',
      'videos', 'thumbnails', 'audio', 'temp', 'trash'
    ];

    if (!fs.existsSync(UPLOADS_ROOT)) {
      fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    }

    for (const f of folders) {
      const folderPath = path.join(UPLOADS_ROOT, f);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }
  }

  public getStoragePathForMime(mimetype: string, extension: string): string {
    const ext = extension.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
      return 'images';
    }
    if (ext === 'pdf') {
      return 'pdfs';
    }
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      return 'documents';
    }
    if (ext === 'zip') {
      return 'downloads';
    }
    if (ext === 'mp3') {
      return 'audio';
    }
    if (ext === 'mp4') {
      return 'videos';
    }
    return 'documents';
  }

  public getFileTypeFromExtension(extension: string): FileType {
    const ext = extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) return FileType.IMAGE;
    if (ext === 'pdf') return FileType.PDF;
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return FileType.DOCUMENT;
    if (ext === 'mp4') return FileType.VIDEO;
    if (ext === 'mp3') return FileType.AUDIO;
    if (ext === 'zip') return FileType.ZIP;
    return FileType.OTHER;
  }

  public calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  public async processImage(
    buffer: Buffer,
    fileName: string,
    extension: string
  ): Promise<{
    optimizedBuffer: Buffer;
    width?: number;
    height?: number;
    variants: Record<string, string>;
  }> {
    const result = await ImageProcessor.processImage(buffer, fileName, extension);
    const variantsRecord: Record<string, string> = {};

    for (const v of result.variants) {
      const variantFileName = path.basename(v.key);
      const variantPath = path.join(UPLOADS_ROOT, 'images', variantFileName);
      fs.writeFileSync(variantPath, v.buffer);
      variantsRecord[v.name] = `uploads/images/${variantFileName}`;

      // Upload to MinIO asynchronously
      minioStorage.uploadBuffer(v.key, v.buffer, v.mimeType, false).catch((err) => {
        console.warn(`[MinIO Dual-Write Warning] S3 upload for variant ${v.key} failed:`, err.message);
      });
    }

    return {
      optimizedBuffer: result.optimizedBuffer,
      width: result.width,
      height: result.height,
      variants: variantsRecord
    };
  }

  public async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    userId?: string,
    folderId?: string | null
  ): Promise<any> {
    const rawExt = path.extname(originalName).replace('.', '');
    const extension = rawExt.toLowerCase();

    // Validations
    if (DISALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`Forbidden file extension: .${extension}`);
    }

    const checksum = this.calculateChecksum(fileBuffer);
    
    // Duplicate Detection Check
    const existing = await mediaRepository.findByChecksum(checksum);
    if (existing) {
      return existing; // Returns existing media instance
    }

    const fileType = this.getFileTypeFromExtension(extension);
    const subFolder = this.getStoragePathForMime(mimetype, extension);

    const uuid = crypto.randomUUID().substring(0, 8);
    const baseName = path.basename(originalName, path.extname(originalName)).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = fileType === FileType.IMAGE && extension !== 'svg' ? 'webp' : extension;
    
    // Use clean original filename without timestamp prefix (handle collisions by checking existence if needed)
    let finalFileName = `${baseName}.${ext}`;
    if (fs.existsSync(path.join(UPLOADS_ROOT, subFolder, finalFileName))) {
      finalFileName = `${baseName}_${uuid}.${ext}`;
    }
    let finalBuffer = fileBuffer;
    let width: number | undefined;
    let height: number | undefined;
    let variants: any = {};
    let thumbnailPath: string | null = null;

    if (fileType === FileType.IMAGE && extension !== 'svg') {
      const processResults = await this.processImage(fileBuffer, finalFileName, extension);
      finalBuffer = processResults.optimizedBuffer;
      width = processResults.width;
      height = processResults.height;
      variants = processResults.variants;
      thumbnailPath = processResults.variants.thumbnail || `uploads/${subFolder}/${finalFileName}`;
    } else if (fileType === FileType.PDF) {
      const pdfBaseName = path.basename(finalFileName, '.pdf');
      const pdfThumbResult = await ImageProcessor.generatePdfThumbnail(originalName, pdfBaseName);
      const thumbDiskPath = path.join(UPLOADS_ROOT, 'thumbnails', path.basename(pdfThumbResult.key));
      
      fs.writeFileSync(thumbDiskPath, pdfThumbResult.buffer);
      thumbnailPath = `uploads/thumbnails/${path.basename(pdfThumbResult.key)}`;

      // Dual-write PDF thumbnail to MinIO
      minioStorage.uploadBuffer(pdfThumbResult.key, pdfThumbResult.buffer, pdfThumbResult.mimeType, false).catch((err) => {
        console.warn(`[MinIO Dual-Write Warning] S3 upload for PDF thumbnail ${pdfThumbResult.key} failed:`, err.message);
      });
    }

    const relativeStoragePath = `uploads/${subFolder}/${finalFileName}`;
    const absoluteDiskPath = path.join(UPLOADS_ROOT, subFolder, finalFileName);

    fs.writeFileSync(absoluteDiskPath, finalBuffer);

    // Dual-write main file buffer to MinIO
    const s3ObjectKey = `${subFolder}/${finalFileName}`;
    const s3MimeType = fileType === FileType.IMAGE && extension !== 'svg' ? 'image/webp' : mimetype;
    minioStorage.uploadBuffer(s3ObjectKey, finalBuffer, s3MimeType, false).catch((err) => {
      console.warn(`[MinIO Dual-Write Warning] S3 upload for main file ${s3ObjectKey} failed:`, err.message);
    });

    // Save to Prisma
    return mediaRepository.create({
      title: originalName.split('.')[0],
      fileName: finalFileName,
      originalName,
      fileType,
      storageProvider: StorageProvider.LOCAL,
      mimeType: fileType === FileType.IMAGE && extension !== 'svg' ? 'image/webp' : mimetype,
      extension: fileType === FileType.IMAGE && extension !== 'svg' ? 'webp' : extension,
      size: finalBuffer.length,
      storagePath: relativeStoragePath,
      thumbnailPath,
      checksum,
      width,
      height,
      folder: folderId ? { connect: { id: folderId } } : undefined,
      creator: userId ? { connect: { id: userId } } : undefined,
      metadata: {
        variants,
        pageCount: fileType === FileType.PDF ? 1 : undefined
      } as any
    });
  }

  public async deleteFile(id: string, permanent: boolean = false): Promise<any> {
    const item = await mediaRepository.findById(id);
    if (!item) throw new Error('Asset not found');

    if (permanent) {
      // Deletes local file contents physically
      const diskPath = path.join(process.cwd(), item.storagePath);
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath); } catch (_) {}
      }
      
      // Delete local thumbnail if exists
      if (item.thumbnailPath) {
        const thumbPath = path.join(process.cwd(), item.thumbnailPath);
        if (fs.existsSync(thumbPath)) {
          try { fs.unlinkSync(thumbPath); } catch (_) {}
        }
      }

      if (item.metadata) {
        const meta = item.metadata as any;
        if (meta.variants) {
          for (const variantUrl of Object.values(meta.variants)) {
            const variantPath = path.join(process.cwd(), variantUrl as string);
            if (fs.existsSync(variantPath)) {
              try { fs.unlinkSync(variantPath); } catch (_) {}
            }
          }
        }
      }

      // MinIO S3 Object Deletion Dual-Delete
      minioStorage.deleteObject(item.storagePath, item.visibility === Visibility.PRIVATE).catch((err) => {
        console.warn(`[MinIO Dual-Delete Warning] Failed to delete main S3 object ${item.storagePath}:`, err.message);
      });

      if (item.thumbnailPath) {
        minioStorage.deleteObject(item.thumbnailPath, item.visibility === Visibility.PRIVATE).catch((err) => {
          console.warn(`[MinIO Dual-Delete Warning] Failed to delete thumbnail S3 object ${item.thumbnailPath}:`, err.message);
        });
      }

      if (item.metadata && (item.metadata as any).variants) {
        for (const variantUrl of Object.values((item.metadata as any).variants)) {
          minioStorage.deleteObject(variantUrl as string, item.visibility === Visibility.PRIVATE).catch((err) => {
            console.warn(`[MinIO Dual-Delete Warning] Failed to delete variant S3 object ${variantUrl}:`, err.message);
          });
        }
      }

      return mediaRepository.delete(id, true);
    } else {
      // Soft Delete
      return mediaRepository.delete(id, false);
    }
  }

  public async replaceFile(id: string, fileBuffer: Buffer, originalName: string, mimetype: string): Promise<any> {
    const item = await mediaRepository.findById(id);
    if (!item) throw new Error('Asset not found');

    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    const diskPath = path.join(process.cwd(), item.storagePath);
    
    let processedBuffer = fileBuffer;
    if (item.fileType === FileType.IMAGE && ext !== 'svg') {
      const processResults = await this.processImage(fileBuffer, item.fileName, ext);
      processedBuffer = processResults.optimizedBuffer;
    }

    fs.writeFileSync(diskPath, processedBuffer);
    
    // MinIO S3 Dual-Write Replace
    const s3MimeType = item.fileType === FileType.IMAGE && ext !== 'svg' ? 'image/webp' : mimetype;
    minioStorage.uploadBuffer(item.storagePath, processedBuffer, s3MimeType, item.visibility === Visibility.PRIVATE).catch((err) => {
      console.warn(`[MinIO Dual-Write Warning] S3 upload replace for ${item.storagePath} failed:`, err.message);
    });

    const checksum = this.calculateChecksum(processedBuffer);

    return mediaRepository.update(id, {
      size: processedBuffer.length,
      checksum,
      updatedAt: new Date()
    });
  }
}

export const mediaService = new MediaService();
