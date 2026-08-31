import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AdapterFactory } from '../services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from '../services/documentEngine/extraction/QnaExtractor';
import { StagingService } from '../services/documentEngine/staging/StagingService';
import { LmsCommitService } from '../services/documentEngine/commit/LmsCommitService';

const router = Router();
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

/**
 * POST /api/document-imports
 * Upload document or paste raw text for ingestion and staging
 */
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (process.env.QUESTION_BANK_IMPORT_V2_ENABLED === 'false') {
      res.status(503).json({ success: false, error: 'Question Bank Import Engine V2 is currently disabled by site settings.' });
      return;
    }

    const userRole = (req as any).user?.role;
    if ((req as any).user && userRole !== 'admin' && userRole !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden: Administrator authorization required to import question banks.' });
      return;
    }

    const file = req.file;
    const pastedText = req.body.pastedText;
    const rawFilename = req.body.filename || file?.originalname || 'pasted_question_bank.txt';
    const filename = path.basename(rawFilename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const mimeType = file?.mimetype || (pastedText ? 'text/plain' : 'application/octet-stream');

    const ext = path.extname(filename).toLowerCase();
    const allowedExts = ['.pdf', '.docx', '.doc', '.txt', '.html', '.htm', '.md', '.rtf', '.jpg', '.jpeg', '.png', '.webp'];

    if (file && !allowedExts.includes(ext)) {
      res.status(400).json({
        success: false,
        error: `Unsupported file extension '${ext}'. Allowed formats: ${allowedExts.join(', ')}`
      });
      return;
    }

    let buffer: Buffer;
    if (file) {
      buffer = file.buffer;
    } else if (pastedText) {
      buffer = Buffer.from(pastedText, 'utf-8');
    } else {
      res.status(400).json({ success: false, error: 'Please upload a document file or provide pasted text.' });
      return;
    }

    // 1. Create Import Record in Staging
    const impRecord = await StagingService.createImport({
      adminId: (req as any).user?.id || 'admin',
      filename,
      sourceType: path.extname(filename).toUpperCase().replace('.', '') || 'TXT',
      mimeType,
      fileSize: buffer.length
    });

    await StagingService.updateImportStatus(impRecord.id, 'ANALYZING', { progress: 15 });

    // 2. Ingest Document via AdapterFactory
    const doc = await AdapterFactory.process(buffer, {
      filename,
      mimeType
    });

    await StagingService.updateImportStatus(impRecord.id, 'EXTRACTING', { progress: 45, totalPages: doc.pages.length });

    // 3. Extract & Resolve QnAs via QnaExtractor
    const qnas = await QnaExtractor.extractQna(doc);

    await StagingService.updateImportStatus(impRecord.id, 'VALIDATING', { progress: 85 });

    // 4. Save Extracted QnAs into Staging Database
    const stagedRecords = await StagingService.saveStagedQnas(impRecord.id, qnas);

    res.json({
      success: true,
      import: await StagingService.getImport(impRecord.id),
      stagedCount: stagedRecords.length
    });
  } catch (err: any) {
    console.error('[DocumentImports Route] Ingestion error:', err);
    res.status(500).json({ success: false, error: `Document processing failed: ${err.message}` });
  }
});

/**
 * GET /api/document-imports/:id
 * Get Import status & dashboard metrics
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const importId = String(req.params.id);
    const imp = await StagingService.getImport(importId);
    if (!imp) {
      res.status(404).json({ success: false, error: 'Import record not found' });
      return;
    }
    res.json({ success: true, import: imp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/document-imports/:id/qnas
 * Get all staged QnAs for an Import ID
 */
router.get('/:id/qnas', async (req: Request, res: Response): Promise<void> => {
  try {
    const importId = String(req.params.id);
    const qnas = await StagingService.getStagedQnas(importId);
    res.json({ success: true, count: qnas.length, qnas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/document-imports/:id/qnas/:qnaId/approve
 * Admin Approve QnA
 */
router.post('/:id/qnas/:qnaId/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const qnaId = String(req.params.qnaId);
    const updated = await StagingService.updateStagedQna(qnaId, 'APPROVE', undefined, (req as any).user?.id || 'admin');
    res.json({ success: true, qna: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/document-imports/:id/qnas/:qnaId/reject
 * Admin Reject QnA
 */
router.post('/:id/qnas/:qnaId/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const qnaId = String(req.params.qnaId);
    const updated = await StagingService.updateStagedQna(qnaId, 'REJECT', undefined, (req as any).user?.id || 'admin');
    res.json({ success: true, qna: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/document-imports/:id/qnas/:qnaId
 * Admin Edit & Update Staged QnA
 */
router.patch('/:id/qnas/:qnaId', async (req: Request, res: Response): Promise<void> => {
  try {
    const qnaId = String(req.params.qnaId);
    const reviewedData = req.body.reviewedData;
    if (!reviewedData) {
      res.status(400).json({ success: false, error: 'reviewedData payload is required' });
      return;
    }

    const updated = await StagingService.updateStagedQna(qnaId, 'EDIT', reviewedData, (req as any).user?.id || 'admin');
    res.json({ success: true, qna: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/document-imports/:id/commit
 * Commit approved staged QnAs into LMS DB (lms_quizzes & lms_questions)
 */
router.post('/:id/commit', async (req: Request, res: Response): Promise<void> => {
  try {
    const importId = String(req.params.id);
    const { quizTitle, courseId, lessonId, autoApprovePass, isFree, isFirstTestFree } = req.body;
    const result = await LmsCommitService.commitImport(importId, {
      quizTitle,
      courseId,
      lessonId,
      autoApprovePass: !!autoApprovePass,
      isFree: !!(isFree || isFirstTestFree),
      isFirstTestFree: !!isFirstTestFree,
      adminId: (req as any).user?.id || 'admin'
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
