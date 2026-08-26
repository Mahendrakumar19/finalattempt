import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface InventoryItem {
  relativePath: string;
  absolutePath: string;
  filename: string;
  extension: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  sha256: string;
  bucket: 'media-public' | 'media-private';
  objectKey: string;
  reviewRequired: boolean;
  notes?: string;
}

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.txt': 'text/plain'
};

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

export function calculateFileSha256(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function determineObjectKeyAndBucket(relativePath: string): { key: string; bucket: 'media-public' | 'media-private'; reviewRequired: boolean; notes?: string } {
  const cleanPath = relativePath.replace(/\\/g, '/').replace(/^(\/|\\)+/, '');
  const parts = cleanPath.split('/');
  const filename = parts[parts.length - 1];

  let bucket: 'media-public' | 'media-private' = 'media-public';
  let key = cleanPath;
  let reviewRequired = false;
  let notes = '';

  if (parts.length === 1) {
    // Root level files e.g. VALGRIND.pdf -> pdfs/VALGRIND.pdf
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      key = `pdfs/${filename}`;
    } else if (['.webp', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
      key = `images/${filename}`;
    } else {
      key = `documents/${filename}`;
    }
  } else {
    // Subfolder files e.g. images/foo.webp, pdfs/bar.pdf, thumbnails/baz.png
    key = cleanPath;
  }

  // Classification: check for private keywords if applicable
  if (filename.toLowerCase().includes('private') || filename.toLowerCase().includes('secret')) {
    bucket = 'media-private';
    notes = 'Classified as private based on filename flag';
  }

  return { key, bucket, reviewRequired, notes };
}

export function generateInventory(uploadsDir: string): InventoryItem[] {
  const inventory: InventoryItem[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const relativePath = path.relative(uploadsDir, fullPath).replace(/\\/g, '/');
        const stats = fs.statSync(fullPath);
        const mimeType = getMimeType(fullPath);
        const sha256 = calculateFileSha256(fullPath);
        const { key, bucket, reviewRequired, notes } = determineObjectKeyAndBucket(relativePath);

        inventory.push({
          relativePath,
          absolutePath: fullPath,
          filename: entry.name,
          extension: path.extname(entry.name).toLowerCase(),
          mimeType,
          size: stats.size,
          modifiedTime: stats.mtime.toISOString(),
          sha256,
          bucket,
          objectKey: key,
          reviewRequired,
          notes
        });
      }
    }
  }

  scan(uploadsDir);
  return inventory;
}

if (require.main === module) {
  const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
  console.log(`[Phase 5 Inventory Pass] Scanning local directory: ${UPLOADS_DIR}...`);

  const inventory = generateInventory(UPLOADS_DIR);
  const jsonPath = path.join(__dirname, '..', 'minio_phase5_inventory.json');
  fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2), 'utf-8');

  console.log(`[Phase 5 Inventory Pass] Cataloged ${inventory.length} files.`);
  console.log(`[Phase 5 Inventory Pass] Saved JSON inventory to ${jsonPath}.`);
}
