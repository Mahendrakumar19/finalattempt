import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireFaculty } from '../middleware/role';
import { lmsDB, mysqlPool } from '../db';

const router = Router();

// Get list of courses managed/accessible
router.get('/courses', authenticate, requireFaculty, async (req: AuthRequest, res: Response) => {
  try {
    const courses = await lmsDB.getCourses();
    res.json({ success: true, data: courses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update syllabus/curriculum for a course
router.put('/courses/:id/syllabus', authenticate, requireFaculty, async (req: AuthRequest, res: Response) => {
  const { syllabus } = req.body;
  if (!syllabus) {
    res.status(400).json({ success: false, error: 'Syllabus JSON structure is required.' });
    return;
  }

  try {
    if (mysqlPool) {
      await mysqlPool.query(
        'UPDATE lms_courses SET syllabus = ? WHERE id = ?',
        [JSON.stringify(syllabus), req.params.id]
      );
    }
    res.json({ success: true, message: 'Syllabus updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload/Post new lesson lecture to a course chapter
router.post('/lessons', authenticate, requireFaculty, async (req: AuthRequest, res: Response) => {
  const { id, sectionId, courseId, title, type, videoUrl, pdfUrl, textContent, duration, durationSeconds, orderIndex, isFree } = req.body;

  if (!id || !sectionId || !courseId || !title) {
    res.status(400).json({ success: false, error: 'Missing required lesson metadata.' });
    return;
  }

  try {
    if (mysqlPool) {
      await mysqlPool.query(
        `INSERT INTO lms_lessons (id, sectionId, courseId, title, type, videoUrl, pdfUrl, textContent, duration, durationSeconds, orderIndex, isFree)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, sectionId, courseId, title, type || 'video', videoUrl || null, pdfUrl || null, textContent || null, duration || '45 mins', durationSeconds || 2700, orderIndex || 1, isFree ? 1 : 0]
      );
    }
    res.json({ success: true, message: 'Lesson added successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add new curriculum chapter section
router.post('/sections', authenticate, requireFaculty, async (req: AuthRequest, res: Response) => {
  const { id, courseId, title, description, orderIndex } = req.body;

  if (!id || !courseId || !title || orderIndex === undefined) {
    res.status(400).json({ success: false, error: 'Missing required section parameters.' });
    return;
  }

  try {
    if (mysqlPool) {
      await mysqlPool.query(
        'INSERT INTO lms_sections (id, courseId, title, description, orderIndex) VALUES (?, ?, ?, ?, ?)',
        [id, courseId, title, description || null, orderIndex]
      );
    }
    res.json({ success: true, message: 'Curriculum section created successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
