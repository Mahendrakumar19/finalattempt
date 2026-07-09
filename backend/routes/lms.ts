import { Router, Request, Response } from 'express';
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

router.post('/courses', async (req: Request, res: Response) => {
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

router.get('/courses/:id/sections', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Verify auth token and check enrollment
    let enrolled = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../services/jwt');
        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        // Admin and faculty always have access
        if (payload.role === 'admin' || payload.role === 'faculty') {
          enrolled = true;
        } else {
          // Check real enrollment in DB
          enrolled = await lmsDB.isEnrolled(payload.userId, id);
        }
      } catch {
        // Invalid/expired token — treat as unauthenticated
        enrolled = false;
      }
    }

    const course = await lmsDB.getCourseById(id);
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

// ─────────────────────────── PUT /api/lms/courses/:id ─────────────────────────
// Update course details
router.put('/courses/:id', async (req: Request, res: Response) => {
  try {
    await lmsDB.updateCourse(req.params.id, req.body);
    res.json({ success: true, message: 'Course updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DELETE /api/lms/courses/:id ──────────────────────
// Delete a course
router.delete('/courses/:id', async (req: Request, res: Response) => {
  try {
    await lmsDB.deleteCourse(req.params.id);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── POST /api/lms/courses/:courseId/sections ──────────
// Add a section to a course
router.post('/courses/:courseId/sections', async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title } = req.body;
  try {
    const id = `sect-${courseId}-${Date.now()}`;
    const result = await lmsDB.createSection({
      id,
      courseId,
      title,
      orderIndex: 1
    });
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── PUT /api/lms/sections/:sectionId ─────────────────
// Update section title
router.put('/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    await lmsDB.updateSection(req.params.sectionId, req.body.title);
    res.json({ success: true, message: 'Section updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DELETE /api/lms/sections/:sectionId ──────────────
// Delete a section
router.delete('/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    await lmsDB.deleteSection(req.params.sectionId);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── POST /api/lms/sections/:sectionId/lessons ─────────
// Add a lesson/lecture to a section
router.post('/sections/:sectionId/lessons', async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { courseId, title, type, videoUrl, duration } = req.body;
  try {
    const id = `les-${sectionId}-${Date.now()}`;
    const lesson = await lmsDB.createLesson({
      id,
      sectionId,
      courseId: courseId || '',
      title,
      type: type || 'video',
      videoUrl: videoUrl || '',
      duration: duration || '10 mins',
      durationSeconds: 600,
      orderIndex: 1,
      isFree: 0,
      isPublished: 1
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── PUT /api/lms/lessons/:lessonId ───────────────────
// Update a lesson/lecture details
router.put('/lessons/:lessonId', async (req: Request, res: Response) => {
  try {
    await lmsDB.updateLesson(req.params.lessonId, req.body);
    res.json({ success: true, message: 'Lesson updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DELETE /api/lms/lessons/:lessonId ────────────────
// Delete a lesson/lecture
router.delete('/lessons/:lessonId', async (req: Request, res: Response) => {
  try {
    await lmsDB.deleteLesson(req.params.lessonId);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── QUIZZES ─────────────────────────────────────────
// Get all quizzes for a course
router.get('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const list = await lmsDB.getQuizzesByCourseId(req.params.courseId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new quiz
router.post('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const quiz = await lmsDB.createQuiz({ ...req.body, courseId: req.params.courseId });
    res.status(201).json({ success: true, data: quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update quiz details
router.put('/quizzes/:quizId', async (req, res) => {
  try {
    await lmsDB.updateQuiz(req.params.quizId, req.body);
    res.json({ success: true, message: 'Quiz updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a quiz
router.delete('/quizzes/:quizId', async (req, res) => {
  try {
    await lmsDB.deleteQuiz(req.params.quizId);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── QUESTIONS ───────────────────────────────────────
// Get questions for a quiz (admin with answers)
router.get('/quizzes/:quizId/questions', async (req, res) => {
  try {
    const list = await lmsDB.getQuestionsByQuizId(req.params.quizId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a question to a quiz
router.post('/quizzes/:quizId/questions', async (req, res) => {
  try {
    const question = await lmsDB.createQuestion({ ...req.body, quizId: req.params.quizId });
    res.status(201).json({ success: true, data: question });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a question
router.put('/questions/:questionId', async (req, res) => {
  try {
    await lmsDB.updateQuestion(req.params.questionId, req.body);
    res.json({ success: true, message: 'Question updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    await lmsDB.deleteQuestion(req.params.questionId);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── ASSIGNMENTS ─────────────────────────────────────
// Get all assignments for a course
router.get('/courses/:courseId/assignments', async (req, res) => {
  try {
    const list = await lmsDB.getAssignmentsByCourseId(req.params.courseId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new assignment
router.post('/courses/:courseId/assignments', async (req, res) => {
  try {
    const assign = await lmsDB.createAssignment({ ...req.body, courseId: req.params.courseId });
    res.status(201).json({ success: true, data: assign });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update an assignment
router.put('/assignments/:assignmentId', async (req, res) => {
  try {
    await lmsDB.updateAssignment(req.params.assignmentId, req.body);
    res.json({ success: true, message: 'Assignment updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete an assignment
router.delete('/assignments/:assignmentId', async (req, res) => {
  try {
    await lmsDB.deleteAssignment(req.params.assignmentId);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get submissions for an assignment
router.get('/assignments/:assignmentId/submissions', async (req, res) => {
  try {
    const submissions = await lmsDB.getAssignmentSubmissions(req.params.assignmentId);
    res.json({ success: true, data: submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
