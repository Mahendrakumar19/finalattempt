import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';

const router = Router();

// ── Upload directory setup ─────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Multer storage config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Preserve original filename while ensuring unique prefix to prevent overwrite collisions
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
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

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded.' });
    return;
  }

  const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const fileUrl = `${backendBase}/api/files/${req.file.filename}`;

  res.json({
    success: true,
    url: fileUrl,
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
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: 'File not found.' });
    return;
  }

  // Strip the timestamp prefix to recover the original display name
  // e.g. "1720000000000-My_Document.pdf" → "My_Document.pdf"
  const originalDisplayName = filename.replace(/^\d+-/, '');

  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  const disposition = INLINE_EXTS.has(ext) ? 'inline' : 'attachment';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(originalDisplayName)}"; filename*=UTF-8''${encodeURIComponent(originalDisplayName)}`);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.sendFile(filePath);
});

export default router;
