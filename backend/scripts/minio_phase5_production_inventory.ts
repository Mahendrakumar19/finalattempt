import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ProductionInventoryItem {
  relativePath: string;
  absolutePath: string;
  filename: string;
  extension: string;
  mimeType: string;
  size: number;
  sizeFormatted: string;
  modifiedTime: string;
  sha256: string;
  bucket: 'media-public' | 'media-private';
  objectKey: string;
  dbReferenced: boolean;
  dbRecordId?: string;
  classificationStatus: 'PUBLIC' | 'PRIVATE' | 'REVIEW_REQUIRED';
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
  '.txt': 'text/plain',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

// Stream SHA-256 calculation to keep RAM usage constant regardless of file size
export async function calculateStreamSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

export function findProductionUploadRoots(): string[] {
  const candidates = [
    path.join(process.cwd(), 'uploads'),
    'd:\\FinalAttempt\\backend\\uploads',
    '/var/www/finalattempt/backend/uploads',
    '/var/lib/finalattempt_data/uploads',
    '/root/finalattempt/backend/uploads',
    'C:\\finalattempt_production_data\\uploads'
  ];

  return candidates.filter(dir => fs.existsSync(dir));
}

export async function runProductionInventory() {
  console.log('============================================================');
  console.log('MINIO MIGRATION — PHASE 5A PRODUCTION FORENSIC INVENTORY');
  console.log('============================================================\n');

  const uploadRoots = findProductionUploadRoots();
  console.log(`[Production Inventory] Detected upload roots:`, uploadRoots);

  const inventoryItems: ProductionInventoryItem[] = [];
  const dbReferencedPaths = new Set<string>();

  // Read local database snapshot to correlate DB records
  const dbStorePath = path.join(__dirname, '..', 'database_store.json');
  let dbStore: any = null;
  if (fs.existsSync(dbStorePath)) {
    try {
      dbStore = JSON.parse(fs.readFileSync(dbStorePath, 'utf-8'));
    } catch (_) {}
  }

  if (dbStore && Array.isArray(dbStore.Media)) {
    for (const record of dbStore.Media) {
      if (record.storagePath) {
        dbReferencedPaths.add(record.storagePath.replace(/\\/g, '/').replace(/^(\/|\\)+/, ''));
      }
    }
  }

  for (const root of uploadRoots) {
    async function scanDir(currentDir: string) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
          const ext = path.extname(entry.name).toLowerCase();
          const stats = fs.statSync(fullPath);
          const mimeType = MIME_MAP[ext] || 'application/octet-stream';
          const sha256 = await calculateStreamSha256(fullPath);

          // Determine MinIO S3 object key
          const cleanRel = relativePath.replace(/^(\/|\\)+/, '');
          const parts = cleanRel.split('/');
          let objectKey = cleanRel;

          if (parts.length === 1) {
            if (ext === '.pdf') objectKey = `pdfs/${entry.name}`;
            else if (['.webp', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) objectKey = `images/${entry.name}`;
            else objectKey = `documents/${entry.name}`;
          }

          // Classification: Private vs Public
          let classification: 'PUBLIC' | 'PRIVATE' | 'REVIEW_REQUIRED' = 'PUBLIC';
          let bucket: 'media-public' | 'media-private' = 'media-public';

          if (entry.name.toLowerCase().includes('private') || entry.name.toLowerCase().includes('secret')) {
            classification = 'PRIVATE';
            bucket = 'media-private';
          }

          const isDbRef = dbReferencedPaths.has(cleanRel) || dbReferencedPaths.has(`uploads/${cleanRel}`);

          inventoryItems.push({
            relativePath: cleanRel,
            absolutePath: fullPath,
            filename: entry.name,
            extension: ext,
            mimeType,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            modifiedTime: stats.mtime.toISOString(),
            sha256,
            bucket,
            objectKey,
            dbReferenced: isDbRef,
            classificationStatus: classification
          });
        }
      }
    }

    await scanDir(root);
  }

  // Deduplicate items by absolutePath
  const uniqueItemsMap = new Map<string, ProductionInventoryItem>();
  for (const item of inventoryItems) {
    uniqueItemsMap.set(item.absolutePath, item);
  }
  const finalInventory = Array.from(uniqueItemsMap.values());

  // Sort by file size descending for Top 20 largest files
  const sortedByLargest = [...finalInventory].sort((a, b) => b.size - a.size);
  const top20Largest = sortedByLargest.slice(0, 20);

  const totalSize = finalInventory.reduce((sum, item) => sum + item.size, 0);

  // Save JSON
  const jsonPath = path.join(__dirname, '..', 'minio_phase5_production_inventory.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalFiles: finalInventory.length,
    totalSizeBytes: totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    items: finalInventory,
    top20Largest
  }, null, 2), 'utf-8');

  console.log(`✓ Inventory completed: ${finalInventory.length} files (${formatBytes(totalSize)})`);
  console.log(`✓ JSON report written to ${jsonPath}`);

  return { finalInventory, totalSize, top20Largest };
}

if (require.main === module) {
  runProductionInventory().catch(console.error);
}
