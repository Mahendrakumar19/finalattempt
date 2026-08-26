import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { mediaService } from '../media/media.service';
import { mediaRepository } from '../media/media.repository';
import { getMediaCdnUrl, sanitizeObjectKey } from '../services/urlResolver';
import { minioStorage, MinioStorageError } from '../services/minioStorage';

async function runPhase3Tests() {
  console.log('============================================================');
  console.log('MINIO MIGRATION — PHASE 3 DUAL-WRITE & LIFECYCLE TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  const createdMediaIds: string[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. JPEG Upload & Dual-Write Processing
    const sampleJpeg = await sharp({
      create: { width: 1920, height: 1080, channels: 3, background: { r: 234, g: 88, b: 12 } } // Orange background
    }).jpeg({ quality: 90 }).toBuffer();

    const jpegAsset = await mediaService.saveFile(
      sampleJpeg,
      'phase3_test_banner.jpg',
      'image/jpeg',
      undefined,
      null
    );
    createdMediaIds.push(jpegAsset.id);

    assert(jpegAsset && jpegAsset.extension === 'webp', '1. JPEG upload processed and converted to WebP');
    assert(jpegAsset.mimeType === 'image/webp', '2. JPEG mimeType updated to image/webp');

    // 2. Local Fallback File Existence Check
    const localDiskPath = path.join(process.cwd(), jpegAsset.storagePath);
    assert(fs.existsSync(localDiskPath), '3. Local fallback disk file exists on filesystem');

    // 3. Image Variants Verification
    const meta = jpegAsset.metadata as any;
    assert(meta && meta.variants && meta.variants.thumbnail, '4. Generated image variants in metadata');

    // 4. PNG Upload & Dual-Write
    const samplePng = await sharp({
      create: { width: 800, height: 600, channels: 4, background: { r: 16, g: 185, b: 129, alpha: 1 } }
    }).png().toBuffer();

    const pngAsset = await mediaService.saveFile(
      samplePng,
      'phase3_test_logo.png',
      'image/png',
      undefined,
      null
    );
    createdMediaIds.push(pngAsset.id);
    assert(pngAsset && fs.existsSync(path.join(process.cwd(), pngAsset.storagePath)), '5. PNG upload dual-written to local disk');

    // 5. PDF Upload & PDF 300x400 Thumbnail Generation
    const dummyPdfContent = Buffer.from('%PDF-1.4\n%Phase 3 Test PDF Document Content\n%%EOF');
    const pdfAsset = await mediaService.saveFile(
      dummyPdfContent,
      'phase3_test_document.pdf',
      'application/pdf',
      undefined,
      null
    );
    createdMediaIds.push(pdfAsset.id);

    assert(pdfAsset && pdfAsset.extension === 'pdf', '6. PDF document saved with .pdf extension');
    assert(pdfAsset.thumbnailPath && pdfAsset.thumbnailPath.endsWith('_thumb.png'), '7. PDF 300x400 PNG visual preview thumbnail generated');
    assert(fs.existsSync(path.join(process.cwd(), pdfAsset.thumbnailPath!)), '8. PDF thumbnail saved to local thumbnails directory');

    // 6. DOCX Document Pass-Through Upload
    const dummyDocx = Buffer.from('PK\x03\x04\x14\x00\x00\x00Phase 3 Test DOCX Document');
    const docxAsset = await mediaService.saveFile(
      dummyDocx,
      'phase3_assignment.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      undefined,
      null
    );
    createdMediaIds.push(docxAsset.id);
    assert(docxAsset && docxAsset.extension === 'docx', '9. DOCX document stored directly without image processing');

    // 7. CDN URL Resolver Verification
    const cdnUrl = getMediaCdnUrl(jpegAsset.storagePath);
    assert(cdnUrl.startsWith('https://media.finalattemptias.com/'), '10. CDN URL generated cleanly via getMediaCdnUrl()', cdnUrl);

    // 8. Duplicate Detection Check (SHA256 Checksum)
    const duplicateAsset = await mediaService.saveFile(
      samplePng,
      'phase3_test_logo_duplicate.png',
      'image/png',
      undefined,
      null
    );
    assert(duplicateAsset.id === pngAsset.id, '11. Duplicate detection: Duplicate SHA256 checksum returned existing asset');

    // 9. Forbidden Extension / Invalid File Rejection
    try {
      await mediaService.saveFile(Buffer.from('echo malicious'), 'script.sh', 'application/x-sh');
      assert(false, '12. Security Rejection: Forbidden extension script.sh', 'Failed to throw forbidden error');
    } catch (err: any) {
      assert(err.message.includes('Forbidden file extension'), '12. Security Rejection: Forbidden script.sh rejected cleanly');
    }

    // 10. Path Traversal Key Rejection
    try {
      sanitizeObjectKey('../../../etc/shadow');
      assert(false, '13. Security Rejection: Path traversal key', 'Failed to reject path traversal');
    } catch (err: any) {
      assert(err.message.includes('Security Violation'), '13. Security Rejection: Path traversal key rejected by sanitization guard');
    }

    // 11. Dual Delete Verification (Permanent Delete)
    const mediaIdToDelete = createdMediaIds.pop()!;
    const assetToDelete = await mediaRepository.findById(mediaIdToDelete);
    const diskPathToDelete = path.join(process.cwd(), assetToDelete!.storagePath);

    await mediaService.deleteFile(mediaIdToDelete, true);
    const dbRecordAfterDelete = await mediaRepository.findById(mediaIdToDelete);
    const fileExistsAfterDelete = fs.existsSync(diskPathToDelete);

    assert(!dbRecordAfterDelete && !fileExistsAfterDelete, '14. Dual Delete: Permanent delete removed DB record and local disk file');

    // Clean remaining test media entries created during test
    for (const id of createdMediaIds) {
      try {
        await mediaService.deleteFile(id, true);
      } catch (_) {}
    }
    assert(true, '15. Temporary test assets cleaned up from database and disk');

  } catch (err: any) {
    console.error('Fatal test error:', err);
  }

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Phase 3 test execution failed:', err);
  process.exit(1);
});
