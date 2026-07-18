import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { ExamStage, Prisma } from '@prisma/client';

const router = Router();

// GET /api/pyqs
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const examId = req.query.examId as string;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const stage = req.query.stage as ExamStage;
    
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = (page - 1) * limit;

    const where: Prisma.PYQWhereInput = { isPublished: true };

    if (examId && examId !== 'ALL') {
      where.examId = examId;
    }
    if (year) {
      where.year = year;
    }
    if (stage) {
      where.stage = stage;
    }
    if (search) {
      where.OR = [
        { paperName: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const items = await prisma.pYQ.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [
        { year: 'desc' },
        { sortOrder: 'asc' }
      ],
      include: {
        exam: true,
        questionPaper: true,
        answerKey: true,
        solution: true
      }
    });

    const total = await prisma.pYQ.count({ where });

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin CMS endpoints
router.post('/', async (req: Request, res: Response) => {
  try {
    const { examId, year, stage, paperName, questionPaperMediaId, answerKeyMediaId, solutionMediaId, description, sortOrder, isPublished } = req.body;
    
    const item = await prisma.pYQ.create({
      data: {
        examId,
        year: parseInt(year, 10),
        stage: stage as ExamStage,
        paperName,
        questionPaperMediaId: questionPaperMediaId || null,
        answerKeyMediaId: answerKeyMediaId || null,
        solutionMediaId: solutionMediaId || null,
        description,
        sortOrder: parseInt(sortOrder || '0', 10),
        isPublished: isPublished !== false
      },
      include: {
        exam: true,
        questionPaper: true,
        answerKey: true,
        solution: true
      }
    });

    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { examId, year, stage, paperName, questionPaperMediaId, answerKeyMediaId, solutionMediaId, description, sortOrder, isPublished } = req.body;
    
    const item = await prisma.pYQ.update({
      where: { id },
      data: {
        examId,
        year: parseInt(year, 10),
        stage: stage as ExamStage,
        paperName,
        questionPaperMediaId: questionPaperMediaId || null,
        answerKeyMediaId: answerKeyMediaId || null,
        solutionMediaId: solutionMediaId || null,
        description,
        sortOrder: parseInt(sortOrder || '0', 10),
        isPublished: isPublished !== false
      },
      include: {
        exam: true,
        questionPaper: true,
        answerKey: true,
        solution: true
      }
    });

    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.pYQ.delete({ where: { id } });
    res.json({ success: true, message: 'PYQ deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
