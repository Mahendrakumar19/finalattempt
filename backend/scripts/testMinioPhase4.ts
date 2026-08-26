import { getMediaCdnUrl, resolveMediaItem, sanitizeObjectKey } from '../services/urlResolver';
import { minioStorage } from '../services/minioStorage';

async function runPhase4Tests() {
  console.log('============================================================');
  console.log('MINIO MIGRATION — PHASE 4 READ-PATH & RESOLVER TEST SUITE');
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

  // 1. Existing Local Image URL Resolution
  const localImageRes = resolveMediaItem({
    storagePath: 'uploads/images/1784665967482_AIUdaan1.webp',
    storageProvider: 'LOCAL'
  });
  assert(localImageRes.url === '/uploads/images/1784665967482_AIUdaan1.webp', '1. Local image URL resolved to local path format');

  // 2. Existing Local PDF URL Resolution
  const localPdfRes = resolveMediaItem({
    storagePath: 'uploads/pdfs/1784804656597_WEBSITE.pdf',
    storageProvider: 'LOCAL'
  });
  assert(localPdfRes.url === '/uploads/pdfs/1784804656597_WEBSITE.pdf', '2. Local PDF URL resolved to local path format');

  // 3. Existing Local Thumbnail Resolution
  const localThumbRes = resolveMediaItem({
    thumbnailPath: 'uploads/thumbnails/1784804656597_WEBSITE_thumb.png',
    storageProvider: 'LOCAL'
  });
  assert(localThumbRes.url === '/uploads/thumbnails/1784804656597_WEBSITE_thumb.png', '3. Local thumbnail URL resolved to local path format');

  // 4. New MinIO Public Image Resolution
  const minioImageRes = resolveMediaItem({
    storagePath: 'images/course_banner.webp',
    storageProvider: 'MINIO',
    visibility: 'PUBLIC'
  });
  assert(minioImageRes.cdnUrl === 'https://media.finalattemptias.com/images/course_banner.webp', '4. MinIO public image URL resolved to CDN URL');
  assert(minioImageRes.isMinio === true, '5. MinIO storage provider flag verified');

  // 5. New MinIO Public Thumbnail Resolution
  const minioThumbRes = resolveMediaItem({
    thumbnailPath: 'thumbnails/course_banner_thumb.png',
    storageProvider: 'S3',
    visibility: 'PUBLIC'
  });
  assert(minioThumbRes.cdnUrl === 'https://media.finalattemptias.com/thumbnails/course_banner_thumb.png', '6. MinIO thumbnail URL resolved to CDN URL');

  // 6. Absolute URL Passthrough
  const absUrlRes = getMediaCdnUrl('https://media.finalattemptias.com/images/logo.png');
  assert(absUrlRes === 'https://media.finalattemptias.com/images/logo.png', '7. Absolute CDN URL passed through untouched');

  // 7. Legacy Prefix Stripping (/api/files/ and /uploads/)
  const strippedUrl1 = getMediaCdnUrl('/api/files/bpsc_syllabus.pdf');
  const strippedUrl2 = getMediaCdnUrl('/uploads/pdfs/bpsc_syllabus.pdf');
  assert(strippedUrl1 === 'https://media.finalattemptias.com/bpsc_syllabus.pdf', '8. Legacy /api/files/ prefix stripped cleanly');
  assert(strippedUrl2 === 'https://media.finalattemptias.com/pdfs/bpsc_syllabus.pdf', '9. Legacy /uploads/ prefix stripped cleanly');

  // 8. Malformed / Null Record Fallback Handling
  const nullRes = getMediaCdnUrl(null);
  const emptyRes = getMediaCdnUrl('');
  const undefinedRes = getMediaCdnUrl(undefined);
  assert(nullRes === '' && emptyRes === '' && undefinedRes === '', '10. Null, empty, and undefined records handled gracefully without errors');

  // 9. Presigned Private URL Method Check
  try {
    const minioInstance = minioStorage;
    assert(typeof minioInstance.getPrivateUrl === 'function', '11. minioStorage.getPrivateUrl signature verified for private objects');
  } catch (err: any) {
    assert(false, '11. Private URL method check', err.message);
  }

  // 10. Path Traversal Security Rejection Guard
  try {
    sanitizeObjectKey('../../../etc/passwd');
    assert(false, '12. Path traversal security guard', 'Failed to throw error');
  } catch (err: any) {
    assert(err.message.includes('Security Violation'), '12. Security Rejection: Path traversal key rejected by sanitization guard');
  }

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Phase 4 test execution failed:', err);
  process.exit(1);
});
