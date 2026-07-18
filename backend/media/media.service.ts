import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { FileType, StorageProvider, Visibility } from '@prisma/client';
import { mediaRepository } from './media.repository';

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
    let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF orientation

    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Resize to max width 2560px (preserving aspect ratio) if larger
    if (width > 2560) {
      pipeline = pipeline.resize(2560, null, { withoutEnlargement: true });
    }

    // Convert to WebP with compression quality 85 and preserve transparency
    const optimizedBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
    
    // Generate variants: thumbnail (200px), small (640px), medium (1280px), large (1920px)
    const baseName = path.basename(fileName, path.extname(fileName));
    const variants: Record<string, string> = {};

    const widths = {
      thumbnail: 200,
      small: 640,
      medium: 1280,
      large: 1920
    };

    for (const [key, w] of Object.entries(widths)) {
      if (width > w) {
        const variantBuffer = await sharp(buffer)
          .rotate()
          .resize(w, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        
        const variantFileName = `${baseName}_${key}.webp`;
        const variantPath = path.join(UPLOADS_ROOT, 'images', variantFileName);
        fs.writeFileSync(variantPath, variantBuffer);
        variants[key] = `uploads/images/${variantFileName}`;
      }
    }

    return {
      optimizedBuffer,
      width,
      height,
      variants
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

    const uuid = crypto.randomUUID();
    let finalFileName = `${uuid}.${fileType === FileType.IMAGE ? 'webp' : extension}`;
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
      // Mock generate PDF first page thumbnail placeholder representing the PDF structure
      const pdfBaseName = path.basename(finalFileName, '.pdf');
      const thumbFileName = `${pdfBaseName}_thumb.png`;
      const thumbDiskPath = path.join(UPLOADS_ROOT, 'thumbnails', thumbFileName);
      
      // Write clean visual card icon preview for PDFs
      const canvas = sharp({
        create: {
          width: 300,
          height: 400,
          channels: 4,
          background: { r: 245, g: 158, b: 11, alpha: 1 } // Orange color theme
        }
      });
      const svgText = Buffer.from(
        `<svg width="300" height="400">
          <rect width="300" height="400" fill="#D97706"/>
          <text x="50%" y="45%" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">PDF DOCUMENT</text>
          <text x="50%" y="55%" font-family="sans-serif" font-size="12" fill="#ffffff" opacity="0.8" text-anchor="middle">${originalName.substring(0, 30)}</text>
        </svg>`
      );
      const thumbnailBuffer = await canvas.composite([{ input: svgText }]).png().toBuffer();
      fs.writeFileSync(thumbDiskPath, thumbnailBuffer);
      thumbnailPath = `uploads/thumbnails/${thumbFileName}`;
    }

    const relativeStoragePath = `uploads/${subFolder}/${finalFileName}`;
    const absoluteDiskPath = path.join(UPLOADS_ROOT, subFolder, finalFileName);

    fs.writeFileSync(absoluteDiskPath, finalBuffer);

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
      // Deletes file contents physically
      const diskPath = path.join(process.cwd(), item.storagePath);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
      
      // Delete thumbnail variants if they exist
      if (item.thumbnailPath) {
        const thumbPath = path.join(process.cwd(), item.thumbnailPath);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }

      if (item.metadata) {
        const meta = item.metadata as any;
        if (meta.variants) {
          for (const variantUrl of Object.values(meta.variants)) {
            const variantPath = path.join(process.cwd(), variantUrl as string);
            if (fs.existsSync(variantPath)) {
              fs.unlinkSync(variantPath);
            }
          }
        }
      }

      return mediaRepository.delete(id, true);
    } else {
      // Soft Delete: Move storagePath metadata reference inside database into trash folder virtual indicator
      return mediaRepository.delete(id, false);
    }
  }

  public async replaceFile(id: string, fileBuffer: Buffer, originalName: string, mimetype: string): Promise<any> {
    const item = await mediaRepository.findById(id);
    if (!item) throw new Error('Asset not found');

    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    
    // overwrite original disk location
    const diskPath = path.join(process.cwd(), item.storagePath);
    
    let processedBuffer = fileBuffer;
    if (item.fileType === FileType.IMAGE && ext !== 'svg') {
      const processResults = await this.processImage(fileBuffer, item.fileName, ext);
      processedBuffer = processResults.optimizedBuffer;
    }

    fs.writeFileSync(diskPath, processedBuffer);
    
    const checksum = this.calculateChecksum(processedBuffer);

    return mediaRepository.update(id, {
      size: processedBuffer.length,
      checksum,
      updatedAt: new Date()
    });
  }
}

export const mediaService = new MediaService();
