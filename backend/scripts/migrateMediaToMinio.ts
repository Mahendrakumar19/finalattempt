import fs from 'fs';
import path from 'path';
import { generateInventory, InventoryItem } from './minio_phase5_inventory';
import { minioStorage, MinioStorageError } from '../services/minioStorage';

export interface ManifestRecord {
  sourcePath: string;
  relativePath: string;
  bucket: 'media-public' | 'media-private';
  objectKey: string;
  size: number;
  sha256: string;
  mimeType: string;
  status: 'pending' | 'uploaded' | 'verified' | 'failed' | 'skipped' | 'review_required';
  errorDetails?: string;
  verifiedAt?: string;
}

export class MinioMigrationRunner {
  private uploadsDir: string;
  private manifestPath: string;
  private inventoryPath: string;
  private concurrency: number;

  constructor(concurrency: number = 4) {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.manifestPath = path.join(__dirname, '..', 'minio_phase5_manifest.json');
    this.inventoryPath = path.join(__dirname, '..', 'minio_phase5_inventory.json');
    this.concurrency = concurrency;
  }

  public loadInventory(): InventoryItem[] {
    const prodInventoryPath = path.join(__dirname, '..', 'minio_phase5_production_inventory.json');
    if (fs.existsSync(prodInventoryPath)) {
      try {
        const raw = fs.readFileSync(prodInventoryPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) {
          return parsed.items;
        }
      } catch (_) {}
    }
    if (fs.existsSync(this.inventoryPath)) {
      const raw = fs.readFileSync(this.inventoryPath, 'utf-8');
      return JSON.parse(raw);
    }
    const items = generateInventory(this.uploadsDir);
    fs.writeFileSync(this.inventoryPath, JSON.stringify(items, null, 2), 'utf-8');
    return items;
  }

  public loadManifest(): Record<string, ManifestRecord> {
    if (fs.existsSync(this.manifestPath)) {
      try {
        const raw = fs.readFileSync(this.manifestPath, 'utf-8');
        return JSON.parse(raw);
      } catch (_) {}
    }
    return {};
  }

  public saveManifest(manifest: Record<string, ManifestRecord>) {
    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  public async runDryRun(): Promise<{ total: number; totalSize: number; publicCount: number; privateCount: number; reviewCount: number }> {
    console.log('============================================================');
    console.log('MINIO MIGRATION — PHASE 5 DRY RUN PASS (NON-DESTRUCTIVE)');
    console.log('============================================================\n');

    const inventory = this.loadInventory();
    let totalSize = 0;
    let publicCount = 0;
    let privateCount = 0;
    let reviewCount = 0;

    for (const item of inventory) {
      totalSize += item.size;
      if (item.bucket === 'media-public') publicCount++;
      if (item.bucket === 'media-private') privateCount++;
      if (item.reviewRequired) reviewCount++;

      console.log(`[DRY RUN] ${item.relativePath} (${(item.size / 1024).toFixed(1)} KB) -> ${item.bucket}/${item.objectKey} [${item.mimeType}]`);
    }

    console.log('\n------------------------------------------------------------');
    console.log(`TOTAL FILES     : ${inventory.length}`);
    console.log(`TOTAL SIZE      : ${(totalSize / (1024 * 1024)).toFixed(2)} MB (${totalSize} bytes)`);
    console.log(`PUBLIC OBJECTS  : ${publicCount}`);
    console.log(`PRIVATE OBJECTS : ${privateCount}`);
    console.log(`REVIEW REQUIRED : ${reviewCount}`);
    console.log('------------------------------------------------------------\n');

    return { total: inventory.length, totalSize, publicCount, privateCount, reviewCount };
  }

  public async runMigration(isRetry: boolean = false): Promise<{ uploaded: number; skipped: number; failed: number }> {
    console.log('============================================================');
    console.log(`MINIO MIGRATION — PHASE 5 EXECUTION (CONCURRENCY: ${this.concurrency})`);
    console.log('============================================================\n');

    const inventory = this.loadInventory();
    const manifest = this.loadManifest();

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    // Helper to process a single inventory item safely
    const processItem = async (item: InventoryItem) => {
      const manifestKey = item.relativePath;
      const existing = manifest[manifestKey];

      if (!isRetry && existing && existing.status === 'verified') {
        skipped++;
        return;
      }

      const record: ManifestRecord = {
        sourcePath: item.absolutePath,
        relativePath: item.relativePath,
        bucket: item.bucket,
        objectKey: item.objectKey,
        size: item.size,
        sha256: item.sha256,
        mimeType: item.mimeType,
        status: 'pending'
      };

      try {
        const isPrivate = item.bucket === 'media-private';
        const fileBuffer = fs.readFileSync(item.absolutePath);

        // Check if object already exists in MinIO
        const exists = await minioStorage.objectExists(item.objectKey, isPrivate);
        if (exists) {
          const stat = await minioStorage.statObject(item.objectKey, isPrivate);
          if (stat.size === item.size) {
            record.status = 'verified';
            record.verifiedAt = new Date().toISOString();
            manifest[manifestKey] = record;
            skipped++;
            console.log(`✓ SKIP (Already on MinIO): ${item.objectKey}`);
            return;
          }
        }

        // Upload to MinIO
        await minioStorage.uploadBuffer(item.objectKey, fileBuffer, item.mimeType, isPrivate);
        record.status = 'uploaded';
        uploaded++;
        console.log(`✓ UPLOADED: ${item.relativePath} -> ${item.bucket}/${item.objectKey}`);
      } catch (err: any) {
        failed++;
        record.status = 'failed';
        record.errorDetails = err.message;
        console.log(`ℹ MIGRATION WARNING for ${item.relativePath}: ${err.message}`);
      }

      manifest[manifestKey] = record;
      this.saveManifest(manifest);
    };

    // Execute batch processing with controlled concurrency
    for (let i = 0; i < inventory.length; i += this.concurrency) {
      const batch = inventory.slice(i, i + this.concurrency);
      await Promise.all(batch.map(item => processItem(item)));
    }

    console.log('\n------------------------------------------------------------');
    console.log(`MIGRATION BATCH COMPLETE | UPLOADED: ${uploaded} | SKIPPED: ${skipped} | FAILED: ${failed}`);
    console.log('------------------------------------------------------------\n');

    return { uploaded, skipped, failed };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new MinioMigrationRunner();

  if (args.includes('--dry-run') || args.includes('--inventory')) {
    runner.runDryRun().catch(console.error);
  } else if (args.includes('--migrate') || args.includes('--retry-failed')) {
    runner.runMigration(args.includes('--retry-failed')).catch(console.error);
  } else {
    console.log('Usage: npx ts-node -T scripts/migrateMediaToMinio.ts [--dry-run | --migrate | --verify]');
    runner.runDryRun().catch(console.error);
  }
}
