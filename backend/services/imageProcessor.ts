import sharp from 'sharp';
import path from 'path';

export interface ProcessedImageVariant {
  name: string;
  width: number;
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export interface ProcessedImageResult {
  optimizedBuffer: Buffer;
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  variants: ProcessedImageVariant[];
}

export class ImageProcessor {
  public static async processImage(
    buffer: Buffer,
    fileName: string,
    extension: string
  ): Promise<ProcessedImageResult> {
    const ext = extension.toLowerCase();
    
    // SVGs bypass rasterization
    if (ext === 'svg') {
      return {
        optimizedBuffer: buffer,
        mimeType: 'image/svg+xml',
        extension: 'svg',
        variants: []
      };
    }

    let pipeline = sharp(buffer).rotate(); // auto-rotate based on EXIF orientation

    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Resize to max width 2560px (preserving aspect ratio) if larger
    if (width > 2560) {
      pipeline = pipeline.resize(2560, null, { withoutEnlargement: true });
    }

    // Convert main image to WebP with compression quality 85
    const optimizedBuffer = await pipeline.webp({ quality: 85 }).toBuffer();

    const baseName = path.basename(fileName, path.extname(fileName));
    const variantList: ProcessedImageVariant[] = [];

    const widths: Record<string, number> = {
      thumbnail: 200,
      small: 640,
      medium: 1280,
      large: 1920
    };

    for (const [vName, targetWidth] of Object.entries(widths)) {
      if (width > targetWidth) {
        const variantBuffer = await sharp(buffer)
          .rotate()
          .resize(targetWidth, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const variantFileName = `${baseName}_${vName}.webp`;
        const variantKey = `images/${variantFileName}`;

        variantList.push({
          name: vName,
          width: targetWidth,
          key: variantKey,
          buffer: variantBuffer,
          mimeType: 'image/webp'
        });
      }
    }

    return {
      optimizedBuffer,
      mimeType: 'image/webp',
      extension: 'webp',
      width,
      height,
      variants: variantList
    };
  }

  public static async generatePdfThumbnail(
    originalName: string,
    pdfBaseName: string
  ): Promise<{ key: string; buffer: Buffer; mimeType: string }> {
    const thumbFileName = `${pdfBaseName}_thumb.png`;
    const thumbKey = `thumbnails/${thumbFileName}`;

    const canvas = sharp({
      create: {
        width: 300,
        height: 400,
        channels: 4,
        background: { r: 245, g: 158, b: 11, alpha: 1 } // Orange color theme
      }
    });

    const safeTitle = (originalName || 'PDF Document').replace(/[<>&'"]/g, '').substring(0, 30);
    const svgText = Buffer.from(
      `<svg width="300" height="400">
        <rect width="300" height="400" fill="#D97706"/>
        <text x="50%" y="45%" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">PDF DOCUMENT</text>
        <text x="50%" y="55%" font-family="sans-serif" font-size="12" fill="#ffffff" opacity="0.8" text-anchor="middle">${safeTitle}</text>
      </svg>`
    );

    const thumbnailBuffer = await canvas.composite([{ input: svgText }]).png().toBuffer();

    return {
      key: thumbKey,
      buffer: thumbnailBuffer,
      mimeType: 'image/png'
    };
  }
}
