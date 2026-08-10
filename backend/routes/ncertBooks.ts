import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/ncert-books
router.get('/', async (req: Request, res: Response) => {
  try {
    const subject = req.query.subject as string;
    const classLevel = req.query.classLevel ? parseInt(req.query.classLevel as string, 10) : undefined;
    const search = req.query.search as string;

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '500', 10);
    const offset = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (subject && subject !== 'ALL') {
      where.subject = subject;
    }
    if (classLevel) {
      where.classLevel = classLevel;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { bookName: { contains: search } },
        { subject: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const items = await prisma.nCERTBook.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [
        { classLevel: 'asc' },
        { sortOrder: 'asc' }
      ],
      include: {
        fileMedia: true
      }
    });

    const total = await prisma.nCERTBook.count({ where });

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

// Admin CMS Endpoints
router.post('/', async (req: Request, res: Response) => {
  try {
    const { subject, classLevel, bookName, title, fileMediaId, description, sortOrder, isPublished } = req.body;

    const item = await prisma.nCERTBook.create({
      data: {
        subject,
        classLevel: parseInt(classLevel, 10),
        bookName,
        title: title || bookName,
        fileMediaId: fileMediaId || null,
        description: description || null,
        sortOrder: parseInt(sortOrder || '0', 10),
        isPublished: isPublished !== false
      },
      include: {
        fileMedia: true
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
    const { subject, classLevel, bookName, title, fileMediaId, description, sortOrder, isPublished } = req.body;

    const item = await prisma.nCERTBook.update({
      where: { id },
      data: {
        subject,
        classLevel: parseInt(classLevel, 10),
        bookName,
        title: title || bookName,
        fileMediaId: fileMediaId || null,
        description: description || null,
        sortOrder: parseInt(sortOrder || '0', 10),
        isPublished: isPublished !== false
      },
      include: {
        fileMedia: true
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
    await prisma.nCERTBook.delete({ where: { id } });
    res.json({ success: true, message: 'NCERT book deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
