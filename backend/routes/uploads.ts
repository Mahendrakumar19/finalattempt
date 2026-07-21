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

router.get('/files/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: 'File not found.' });
    return;
  }

  // Extract original display name by stripping the timestamp prefix (e.g. 1720000000000-filename.pdf -> filename.pdf)
  const originalDisplayName = filename.includes('-') ? filename.split('-').slice(1).join('-') : filename;

  // For PDFs / images / videos / text: serve inline so browser can render / preview them
  const ext = path.extname(filename).toLowerCase();
  const inlineExts = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.ogg', '.txt'];
  const disposition = inlineExts.includes(ext) ? 'inline' : 'attachment';

  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(originalDisplayName)}"`);
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  res.sendFile(filePath);
});

export default router;
