import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PERSISTENT_DIR } from '../db';

const router = Router();

// ── Persistent Upload directory setup ─────────────────────────────────────────
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PERSISTENT_UPLOADS_DIR = path.join(PERSISTENT_DIR, 'uploads');

if (!fs.existsSync(PERSISTENT_UPLOADS_DIR)) {
  fs.mkdirSync(PERSISTENT_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  try { fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true }); } catch (_) {}
}

// ── Multer storage config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PERSISTENT_UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Preserve clean original filename with spaces converted to underscores
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
    let targetName = `${baseName}${ext}`;
    if (fs.existsSync(path.join(PERSISTENT_UPLOADS_DIR, targetName)) || fs.existsSync(path.join(LOCAL_UPLOADS_DIR, targetName))) {
      targetName = `${baseName}_${Date.now()}${ext}`;
    }
    cb(null, targetName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max
  },
  fileFilter: (_req, file, cb) => {
    // Allow common document / media MIME types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'audio/mpeg',
      'audio/wav',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// ── POST /api/upload ────────────────────────────────────────────────────────
// Upload a file and get back a publicly accessible URL.
// Protected: admin / faculty only (optional — remove authenticate middleware to open it)

import { minioStorage } from '../services/minioStorage';
import { ImageProcessor } from '../services/imageProcessor';
import { getMediaCdnUrl } from '../services/urlResolver';

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded.' });
    return;
  }

  const filename = req.file.filename;
  const filePath = req.file.path;
  const mimetype = req.file.mimetype;
  const ext = path.extname(filename).replace('.', '').toLowerCase();

  // Dual-write to MinIO S3 asynchronously
  try {
    const fileBuffer = fs.readFileSync(filePath);
    let subfolder = 'documents';

    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
      subfolder = 'images';
    } else if (ext === 'pdf') {
      subfolder = 'pdfs';
    } else if (['zip', 'rar', 'tar'].includes(ext)) {
      subfolder = 'downloads';
    }

    const s3ObjectKey = `${subfolder}/${filename}`;

    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      const processed = await ImageProcessor.processImage(fileBuffer, filename, ext);
      await minioStorage.uploadBuffer(s3ObjectKey, processed.optimizedBuffer, processed.mimeType, false);

      for (const v of processed.variants) {
        await minioStorage.uploadBuffer(v.key, v.buffer, v.mimeType, false);
      }
    } else {
      await minioStorage.uploadBuffer(s3ObjectKey, fileBuffer, mimetype, false);
    }
  } catch (err: any) {
    console.warn(`[MinIO Dual-Write Warning] S3 upload for /api/upload (${filename}) failed:`, err.message);
  }

  const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const fileUrl = `${backendBase}/api/files/${filename}`;
  const cdnUrl = getMediaCdnUrl(filename);

  res.json({
    success: true,
    url: fileUrl,
    cdnUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// ── GET /api/files/:filename ───────────────────────────────────────────────
// Serve a previously uploaded file by its stored filename.

// MIME type map to ensure correct Content-Type headers
const MIME_TYPES: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip':  'application/zip',
  '.txt':  'text/plain',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
};

// Extensions that should be rendered inline in browser (not force-downloaded)
const INLINE_EXTS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.ogg', '.txt']);

router.get('/files/:filename', (req: Request, res: Response) => {
  const rawFilename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  if (!rawFilename || typeof rawFilename !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid filename parameter.' });
    return;
  }
  const filename = path.basename(rawFilename); // prevent path traversal
  const persistentPath = path.join(PERSISTENT_UPLOADS_DIR, filename);
  const localPath = path.join(LOCAL_UPLOADS_DIR, filename);
  const filePath = fs.existsSync(persistentPath) ? persistentPath : (fs.existsSync(localPath) ? localPath : null);

  if (!filePath) {
    res.status(404).json({ success: false, error: 'File not found.' });
    return;
  }

  const cleanDisplayName = filename.replace(/^\d+[_-]/, '');
  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  const disposition = INLINE_EXTS.has(ext) ? 'inline' : 'attachment';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(cleanDisplayName)}"; filename*=UTF-8''${encodeURIComponent(cleanDisplayName)}`);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.sendFile(filePath);
});

export default router;
