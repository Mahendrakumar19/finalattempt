import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { ExamStage, CompanyValueType } from '@prisma/client';

const router = Router();

// ─── Exam Endpoints ──────────────────────────────────────────────────────────
router.get('/exams', async (req: Request, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { logo: true }
    });
    res.json({ success: true, data: exams });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/exams', async (req: Request, res: Response) => {
  try {
    const { name, code, slug, description, displayOrder, isActive, logoMediaId } = req.body;
    const exam = await prisma.exam.create({
      data: {
        name,
        code,
        slug,
        description,
        displayOrder: parseInt(displayOrder || '0', 10),
        isActive: isActive !== false,
        logoMediaId: logoMediaId || null
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
    const { id } = req.params;
    const { name, code, slug, description, displayOrder, isActive, logoMediaId } = req.body;
    const exam = await prisma.exam.update({
      where: { id },
      data: {
        name,
        code,
        slug,
        description,
        displayOrder: parseInt(displayOrder || '0', 10),
        isActive: isActive !== false,
        logoMediaId: logoMediaId || null
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
    const { id } = req.params;
    await prisma.exam.delete({ where: { id } });
    res.json({ success: true, message: 'Exam deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Syllabus Endpoints ──────────────────────────────────────────────────────
router.get('/syllabus', async (req: Request, res: Response) => {
  try {
    const list = await prisma.syllabus.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        exam: true,
        fileMedia: true
      }
    });
    res.json({ success: true, data: list });
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
    const { id } = req.params;
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
    const { id } = req.params;
    await prisma.syllabus.delete({ where: { id } });
    res.json({ success: true, message: 'Syllabus deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Strategy Blocks Endpoints ───────────────────────────────────────────────
router.get('/strategy', async (req: Request, res: Response) => {
  try {
    const list = await prisma.strategyBlock.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        featuredImage: true,
        attachment: true
      }
    });
    res.json({ success: true, data: list });
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
    const { id } = req.params;
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
    const { id } = req.params;
    await prisma.strategyBlock.delete({ where: { id } });
    res.json({ success: true, message: 'Strategy block deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Company Values Endpoints ────────────────────────────────────────────────
router.get('/company-values', async (req: Request, res: Response) => {
  try {
    const values = await prisma.companyValue.findMany();
    
    // Seed default if empty
    if (values.length === 0) {
      const defaults = [
        {
          type: CompanyValueType.MISSION,
          title: 'Our Mission',
          content: 'To simplify the preparation of Civil Services Examinations (BPSC/UPSC) by offering structured learning, premium customized guidance, and personalized mentorship.'
        },
        {
          type: CompanyValueType.VISION,
          title: 'Our Vision',
          content: 'To create a support system where every student receives standard guidance to crack civil service exams in their final attempt, raising the selection rates in Bihar.'
        },
        {
          type: CompanyValueType.CORE_VALUES,
          title: 'Our Core Values',
          content: 'Discipline, Integrity, Transformed Output, Personal Mentorship Focus, and Transparency.'
        }
      ];

      await Promise.all(
        defaults.map(d => prisma.companyValue.create({ data: d }))
      );

      const freshValues = await prisma.companyValue.findMany();
      res.json({ success: true, data: freshValues });
      return;
    }

    res.json({ success: true, data: values });
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
