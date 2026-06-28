import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireStudent, requireAdmin } from '../middleware/role';
import { lmsDB } from '../db';

const router = Router();

// ─────────────────────────── GET /api/lms/courses ────────────────────────────
// Public: list all published courses

router.get('/courses', async (req, res) => {
  try {
    const courses = await lmsDB.getCourses();
    res.json({ success: true, data: courses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ─────────────────────────── POST /api/lms/courses ───────────────────────────
// Admin: create/publish a course

router.post('/courses', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const course = await lmsDB.createCourse(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/courses/:id ────────────────────────
// Public: single course detail

router.get('/courses/:id', async (req, res) => {
  try {
    const course = await lmsDB.getCourseById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.', code: 'LMS_002' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/courses/:id/sections ───────────────
// Protected: get course curriculum (requires enrollment check)

router.get('/courses/:id/sections', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    // Check enrollment
    const enrolled = await lmsDB.isEnrolled(req.user!.userId, id);
    const course   = await lmsDB.getCourseById(id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.', code: 'LMS_002' });
      return;
    }

    const sections = await lmsDB.getSectionsByCourseId(id);

    // For each section, get lessons (hide locked lesson details if not enrolled)
    const sectionsWithLessons = await Promise.all(
      sections.map(async (section: any) => {
        const lessons = await lmsDB.getLessonsBySectionId(section.id);
        return {
          ...section,
          lessons: lessons.map((lesson: any) => ({
            ...lesson,
            // Hide video URL if not enrolled and not a free lesson
            videoUrl: (enrolled || lesson.isFree) ? lesson.videoUrl : null,
            isLocked: !enrolled && !lesson.isFree
          }))
        };
      })
    );

    res.json({ success: true, data: { course, sections: sectionsWithLessons, isEnrolled: enrolled } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/enrollments/check/:courseId ────────
// Check if current user is enrolled in a course

router.get('/enrollments/check/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const enrolled = await lmsDB.isEnrolled(req.user!.userId, req.params.courseId);
    res.json({ success: true, data: { enrolled } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/enrollments/me ─────────────────────
// Get my enrolled courses with progress data

router.get('/enrollments/me', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await lmsDB.getUserEnrollments(req.user!.userId);
    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── POST /api/lms/enrollments ───────────────────────
// Enroll a student (admin manual enrollment, or post-payment hook)

router.post('/enrollments', authenticate, async (req: AuthRequest, res: Response) => {
  const { courseId, paymentOrderId, amountPaid } = req.body;
  if (!courseId) {
    res.status(400).json({ success: false, error: 'courseId is required.' });
    return;
  }

  try {
    const alreadyEnrolled = await lmsDB.isEnrolled(req.user!.userId, courseId);
    if (alreadyEnrolled) {
      res.status(409).json({ success: false, error: 'Already enrolled in this course.', code: 'PAY_002' });
      return;
    }

    const enrollment = await lmsDB.createEnrollment(req.user!.userId, courseId, paymentOrderId, amountPaid);
    res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/progress/:courseId ─────────────────
// Get my progress for a course (completion %, per-lesson status)

router.get('/progress/:courseId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const progress = await lmsDB.getUserProgress(req.user!.userId, req.params.courseId);
    res.json({ success: true, data: progress });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── POST /api/lms/progress ──────────────────────────
// Save lesson progress (video position, completion)

const ProgressSchema = z.object({
  courseId:       z.string(),
  lessonId:       z.string(),
  completed:      z.boolean().optional(),
  watchedSeconds: z.number().int().nonnegative().optional(),
  totalSeconds:   z.number().int().nonnegative().optional(),
  lastPosition:   z.number().int().nonnegative().optional()
});

router.post('/progress', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  const parsed = ProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  try {
    const ok = await lmsDB.saveProgress(req.user!.userId, parsed.data);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/analytics/me ───────────────────────
// Get my aggregated performance stats (course completions, quiz performance)

router.get('/analytics/me', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await lmsDB.getStudentProgressMetrics(req.user!.userId);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
