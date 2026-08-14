import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { ExamStage, CompanyValueType } from '@prisma/client';
import { ContentLocalizer, getTargetLang } from '../services/contentLocalizer';

const router = Router();

// ─── Exam Endpoints ──────────────────────────────────────────────────────────
router.get('/exams', async (req: Request, res: Response) => {
  try {
    const targetLang = getTargetLang(req);
    const exams = await prisma.exam.findMany({
      include: { logo: true }
    });
    exams.sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' })
    );
    const localized = await ContentLocalizer.localizeEntityList(
      'exam',
      exams,
      ['name', 'description'],
      targetLang,
      ['description']
    );
    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/exams', async (req: Request, res: Response) => {
  try {
    const { name, code, slug, description, displayOrder, isActive, logoMediaId, logoUrl } = req.body;
    const exam = await prisma.exam.create({
      data: {
        name,
        code,
        slug,
        description,
        displayOrder: parseInt(displayOrder || '0', 10),
        isActive: isActive !== false,
        logoMediaId: logoMediaId || null,
        logoUrl: logoUrl || null
      },
      include: { logo: true }
    });
    res.status(201).json({ success: true, data: exam });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/exams/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    const { name, code, slug, description, displayOrder, isActive, logoMediaId, logoUrl } = req.body;
    const exam = await prisma.exam.update({
      where: { id },
      data: {
        name,
        code,
        slug,
        description,
        displayOrder: parseInt(displayOrder || '0', 10),
        isActive: isActive !== false,
        logoMediaId: logoMediaId || null,
        logoUrl: logoUrl !== undefined ? (logoUrl || null) : undefined
      },
      include: { logo: true }
    });
    res.json({ success: true, data: exam });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/exams/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    await prisma.exam.delete({ where: { id } });
    res.json({ success: true, message: 'Exam deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/exam/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    await prisma.exam.delete({ where: { id } });
    res.json({ success: true, message: 'Exam deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Syllabus Endpoints ──────────────────────────────────────────────────────
router.get('/syllabus', async (req: Request, res: Response) => {
  try {
    const targetLang = getTargetLang(req);
    const list = await prisma.syllabus.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        exam: true,
        fileMedia: true
      }
    });
    const localized = await ContentLocalizer.localizeEntityList(
      'syllabus',
      list,
      ['description'],
      targetLang,
      ['description']
    );
    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/syllabus', async (req: Request, res: Response) => {
  try {
    const { examId, stage, version, mediaId, lastUpdated, description, isPublished, sortOrder } = req.body;
    const item = await prisma.syllabus.create({
      data: {
        examId,
        stage: stage as ExamStage,
        version: version || '1.0',
        mediaId,
        lastUpdated: lastUpdated || new Date().toLocaleDateString('en-IN'),
        description,
        isPublished: isPublished !== false,
        sortOrder: parseInt(sortOrder || '0', 10)
      },
      include: {
        exam: true,
        fileMedia: true
      }
    });
    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/syllabus/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    const { examId, stage, version, mediaId, lastUpdated, description, isPublished, sortOrder } = req.body;
    const item = await prisma.syllabus.update({
      where: { id },
      data: {
        examId,
        stage: stage as ExamStage,
        version: version || '1.0',
        mediaId,
        lastUpdated: lastUpdated || new Date().toLocaleDateString('en-IN'),
        description,
        isPublished: isPublished !== false,
        sortOrder: parseInt(sortOrder || '0', 10)
      },
      include: {
        exam: true,
        fileMedia: true
      }
    });
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/syllabus/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    await prisma.syllabus.delete({ where: { id } });
    res.json({ success: true, message: 'Syllabus deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Strategy Blocks Endpoints ───────────────────────────────────────────────
router.get('/strategy', async (req: Request, res: Response) => {
  try {
    const targetLang = getTargetLang(req);
    const list = await prisma.strategyBlock.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        featuredImage: true,
        attachment: true
      }
    });
    const localized = await ContentLocalizer.localizeEntityList(
      'strategy_block',
      list,
      ['title', 'content', 'ctaText'],
      targetLang,
      ['content']
    );
    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/strategy', async (req: Request, res: Response) => {
  try {
    const { title, slug, content, category, featuredImageMediaId, attachmentMediaId, videoUrl, ctaText, ctaUrl, sortOrder, isPublished } = req.body;
    const block = await prisma.strategyBlock.create({
      data: {
        title,
        slug,
        content,
        category,
        featuredImageMediaId: featuredImageMediaId || null,
        attachmentMediaId: attachmentMediaId || null,
        videoUrl: videoUrl || null,
        ctaText: ctaText || null,
        ctaUrl: ctaUrl || null,
        sortOrder: parseInt(sortOrder || '0', 10),
        isPublished: isPublished !== false
      },
      include: {
        featuredImage: true,
        attachment: true
      }
    });
    res.status(201).json({ success: true, data: block });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/strategy/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    const { title, slug, content, category, featuredImageMediaId, attachmentMediaId, videoUrl, ctaText, ctaUrl, sortOrder, isPublished } = req.body;
    const block = await prisma.strategyBlock.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        category,
        featuredImageMediaId: featuredImageMediaId || null,
        attachmentMediaId: attachmentMediaId || null,
        videoUrl: videoUrl || null,
        ctaText: ctaText || null,
        ctaUrl: ctaUrl || null,
        sortOrder: parseInt(sortOrder || '0', 10),
        isPublished: isPublished !== false
      },
      include: {
        featuredImage: true,
        attachment: true
      }
    });
    res.json({ success: true, data: block });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/strategy/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    await prisma.strategyBlock.delete({ where: { id } });
    res.json({ success: true, message: 'Strategy block deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Company Values Endpoints ────────────────────────────────────────────────
router.get('/company-values', async (req: Request, res: Response) => {
  try {
    const targetLang = getTargetLang(req);
    let values = await prisma.companyValue.findMany();

    const localized = await ContentLocalizer.localizeEntityList(
      'company_value',
      values,
      ['title', 'content'],
      targetLang,
      ['content']
    );

    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/company-values', async (req: Request, res: Response) => {
  try {
    const { type, title, content } = req.body;
    const updated = await prisma.companyValue.upsert({
      where: { type: type as CompanyValueType },
      update: { title, content },
      create: { type: type as CompanyValueType, title, content }
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
