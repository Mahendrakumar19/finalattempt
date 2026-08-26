import fs from 'fs';
import path from 'path';
import { generateInventory } from './minio_phase5_inventory';
import { MinioMigrationRunner } from './migrateMediaToMinio';
import { getMediaCdnUrl } from '../services/urlResolver';

async function runPhase5Tests() {
  console.log('============================================================');
  console.log('MINIO MIGRATION — PHASE 5 MIGRATION & SAFETY TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');

  // 1. Inventory Count & Integrity
  const inventory = generateInventory(uploadsDir);
  assert(inventory.length === 36, '1. Inventory cataloged exact 36 local media files', `Got: ${inventory.length}`);

  // 2. Total Size Verification
  const totalSize = inventory.reduce((sum, f) => sum + f.size, 0);
  assert(totalSize > 0, '2. Total inventory byte size calculated', `Total: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);

  // 3. Object Key Structure Mapping
  const pdfItem = inventory.find(i => i.extension === '.pdf');
  const webpItem = inventory.find(i => i.extension === '.webp');
  const docxItem = inventory.find(i => i.extension === '.docx');

  assert(pdfItem && pdfItem.objectKey.startsWith('pdfs/'), '3. PDF object key mapped under pdfs/ prefix');
  assert(webpItem && webpItem.objectKey.startsWith('images/'), '4. WebP image object key mapped under images/ prefix');
  assert(docxItem && docxItem.objectKey.startsWith('documents/'), '5. DOCX document object key mapped under documents/ prefix');

  // 4. Content-Type Header Assignment
  assert(pdfItem?.mimeType === 'application/pdf', '6. PDF MIME type assigned application/pdf');
  assert(webpItem?.mimeType === 'image/webp', '7. WebP MIME type assigned image/webp');

  // 5. CDN URL Generation
  if (webpItem) {
    const cdnUrl = getMediaCdnUrl(webpItem.objectKey);
    assert(cdnUrl === `https://media.finalattemptias.com/${webpItem.objectKey}`, '8. Public CDN URL resolved correctly');
  } else {
    assert(false, '8. Public CDN URL resolution test');
  }

  // 6. Non-Destructive Local File Integrity Check
  let allExist = true;
  for (const item of inventory) {
    if (!fs.existsSync(item.absolutePath)) {
      allExist = false;
      break;
    }
  }
  assert(allExist, '9. Local disk storage intact (100% of 36 local files preserved, 0 deleted)');

  // 7. Idempotency & Resumable Migration Runner Check
  const runner = new MinioMigrationRunner(4);
  const dryRunRes = await runner.runDryRun();
  assert(dryRunRes.total === 36, '10. Resumable Migration Runner dry-run executed without errors');

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Phase 5 test execution failed:', err);
  process.exit(1);
});
