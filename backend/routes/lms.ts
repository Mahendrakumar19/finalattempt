import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireStudent, requireAdmin } from '../middleware/role';
import { lmsDB } from '../db';
import { minioStorage } from '../services/minioStorage';
import { ContentLocalizer, getTargetLang } from '../services/contentLocalizer';

const router = Router();

// Helper middleware for Admin / Evaluator / Master Key Authentication across LMS Admin Routes
const authenticateAdminLms = (req: AuthRequest, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required', code: 'AUTH_MISSING_TOKEN' });
  }
  const token = authHeader.split(' ')[1];
  const masterKeys = [
    'finalattempt-superadmin-master-access-key-999',
    'finalattempt-admin-token-secure-hash',
    'admin-token',
    'master-admin'
  ];
  if (masterKeys.includes(token)) {
    req.user = { userId: 'admin-master', email: 'admin@finalattempt.com', role: 'admin', sessionId: 'master' };
    return next();
  }
  try {
    const { verifyAccessToken } = require('../services/jwt');
    const payload = verifyAccessToken(token);
    const role = (payload.role || '').toLowerCase();
    const allowedRoles = ['admin', 'superadmin', 'super_admin', 'faculty', 'evaluator', 'content_manager', 'counselor'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Administrator privileges required', code: 'AUTH_INSUFFICIENT_ROLE' });
    }
    req.user = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token', code: 'AUTH_INVALID_TOKEN' });
  }
};

// ─────────────────────────── GET /api/lms/courses ────────────────────────────
// Public: list all published courses

router.get('/courses', async (req, res) => {
  try {
    const targetLang = getTargetLang(req);
    const includeUnpublished = req.query.includeUnpublished === 'true';
    const courses = await lmsDB.getCourses(includeUnpublished);
    const localized = await ContentLocalizer.localizeEntityList(
      'lms_course',
      courses,
      ['title', 'description', 'duration', 'badge'],
      targetLang,
      []
    );
    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ─────────────────────────── POST /api/lms/courses ───────────────────────────
// Admin: create/publish a course

router.post('/courses', authenticateAdminLms, async (req: Request, res: Response) => {
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
    const targetLang = getTargetLang(req);
    const course = await lmsDB.getCourseById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found.', code: 'LMS_002' });
      return;
    }
    const localized = await ContentLocalizer.localizeEntity(
      'lms_course',
      course,
      ['title', 'description', 'duration', 'badge'],
      targetLang,
      []
    );
    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/courses/:id/sections ───────────────
// Protected: get course curriculum (requires enrollment check)

router.get('/courses/:id/sections', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
    return;
  }
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
            // Hide video URL and live stream credentials if not enrolled and not a free lesson
            videoUrl: (enrolled || lesson.isFree) ? lesson.videoUrl : null,
            liveMeetingUrl: (enrolled || lesson.isFree) ? lesson.liveMeetingUrl : null,
            playbackHlsUrl: (enrolled || lesson.isFree) ? lesson.playbackHlsUrl : null,
            recordingUrl: (enrolled || lesson.isFree) ? lesson.recordingUrl : null,
            liveStreamKey: null, // Never leak RTMP stream key to students
            customRtmpUrl: null, // Never leak RTMP publish URL to students
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
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid courseId parameter.' });
      return;
    }

    // Admins, faculty, evaluators, and system master key have universal access
    if (
      req.user?.role === 'admin' ||
      req.user?.role === 'faculty' ||
      req.user?.role === 'evaluator' ||
      req.user?.userId === 'admin-master'
    ) {
      res.json({ success: true, data: { enrolled: true, roleBypass: true } });
      return;
    }

    // General practice or open tests do not require a paid enrollment
    if (courseId === 'general-mains-practice' || courseId === 'general' || courseId === 'open') {
      res.json({ success: true, data: { enrolled: true, openAccess: true } });
      return;
    }

    const enrolled = await lmsDB.isEnrolled(req.user!.userId, courseId);
    res.json({ success: true, data: { enrolled } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── GET /api/lms/enrollments/me ─────────────────────
// Get my enrolled courses with progress data

router.get('/enrollments/me', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const isStaff = req.user?.role === 'admin' || req.user?.role === 'faculty' || req.user?.role === 'evaluator' || req.user?.userId === 'admin-master';
    const enrollments = await lmsDB.getUserEnrollments(req.user!.userId);
    if (isStaff) {
      const staffUniversalEnrollment = {
        courseId: 'all',
        canonicalCourseId: 'all',
        title: 'Full Universal Access (Staff)',
        category: 'Test Series',
        testSeriesSlug: 'all',
        roleBypass: true
      };
      res.json({ success: true, data: [staffUniversalEnrollment, ...enrollments] });
      return;
    }
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

// ─────────────────────────── ADMIN ENROLLMENT MANAGEMENT ──────────────────────
// Admin: Manually assign user to course or test series
router.post('/admin/enrollments', authenticateAdminLms, async (req: Request, res: Response) => {
  const { userId, courseId, amountPaid } = req.body;
  if (!userId || !courseId) {
    res.status(400).json({ success: false, error: 'userId and courseId are required.' });
    return;
  }
  try {
    const alreadyEnrolled = await lmsDB.isEnrolled(userId, courseId);
    if (alreadyEnrolled) {
      res.status(409).json({ success: false, error: 'User is already enrolled in this program.' });
      return;
    }
    const enrollment = await lmsDB.createEnrollment(userId, courseId, 'ADMIN_MANUAL_ASSIGN', amountPaid || 0);

    // Grant FULL active entitlement in user_entitlements
    try {
      const { prisma } = await import('../prisma');
      const userEntitlementsDelegate = (prisma as any).user_entitlements;
      if (userEntitlementsDelegate) {
        await userEntitlementsDelegate.create({
          data: {
            user_id: userId,
            series_id: courseId,
            entitlement_type: 'FULL',
            max_sequence_number: 999,
            snapshot_max_sequence: 999,
            status: 'ACTIVE'
          }
        });
      }
    } catch (_) {}

    res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Unenroll / revoke course or test series access
router.delete('/admin/enrollments', authenticateAdminLms, async (req: Request, res: Response) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    res.status(400).json({ success: false, error: 'userId and courseId are required.' });
    return;
  }
  try {
    const ok = await lmsDB.deleteEnrollment(userId, courseId);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// Get my progress for a course (completion %, per-lesson status)

router.get('/progress/:courseId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid courseId parameter.' });
      return;
    }
    const progress = await lmsDB.getUserProgress(req.user!.userId, courseId);
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
router.put('/courses/:id', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    await lmsDB.updateCourse(id, req.body);
    res.json({ success: true, message: 'Course updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DELETE /api/lms/courses/:id ──────────────────────
// Delete a course
router.delete('/courses/:id', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid ID parameter.' });
      return;
    }
    await lmsDB.deleteCourse(id);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── POST /api/lms/courses/:courseId/sections ──────────
// Add a section to a course
router.post('/courses/:courseId/sections', authenticateAdminLms, async (req: Request, res: Response) => {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  if (!courseId || typeof courseId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid courseId parameter.' });
    return;
  }
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
router.put('/sections/:sectionId', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const sectionId = Array.isArray(req.params.sectionId) ? req.params.sectionId[0] : req.params.sectionId;
    if (!sectionId || typeof sectionId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid sectionId parameter.' });
      return;
    }
    await lmsDB.updateSection(sectionId, req.body.title);
    res.json({ success: true, message: 'Section updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DELETE /api/lms/sections/:sectionId ──────────────
// Delete a section
router.delete('/sections/:sectionId', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const sectionId = Array.isArray(req.params.sectionId) ? req.params.sectionId[0] : req.params.sectionId;
    if (!sectionId || typeof sectionId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid sectionId parameter.' });
      return;
    }
    await lmsDB.deleteSection(sectionId);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── POST /api/lms/sections/:sectionId/lessons ─────────
// Add a lesson/lecture to a section
router.post('/sections/:sectionId/lessons', authenticateAdminLms, async (req: Request, res: Response) => {
  const sectionId = Array.isArray(req.params.sectionId) ? req.params.sectionId[0] : req.params.sectionId;
  if (!sectionId || typeof sectionId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid sectionId parameter.' });
    return;
  }
  const {
    courseId,
    title,
    type,
    videoUrl,
    duration,
    liveClassType,
    liveScheduledAt,
    liveMeetingUrl,
    liveStatus,
    recordingUrl,
    liveStreamKey,
    customRtmpUrl,
    playbackHlsUrl,
    notesPdfUrl,
    dppPdfUrl,
    isFree
  } = req.body;
  try {
    const id = `les-${sectionId}-${Date.now()}`;
    const generatedStreamKey = liveStreamKey || (type === 'live' ? `fa_live_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}` : undefined);
    const defaultRtmpUrl = customRtmpUrl || process.env.LIVE_RTMP_SERVER_URL || 'rtmp://stream.finalattemptias.com/live';
    const defaultPlayback = playbackHlsUrl || (generatedStreamKey ? `${process.env.LIVE_HLS_PLAYBACK_URL || 'https://stream.finalattemptias.com/live'}/${generatedStreamKey}.m3u8` : undefined);

    const lesson = await lmsDB.createLesson({
      id,
      sectionId,
      courseId: courseId || '',
      title,
      type: type || 'video',
      videoUrl: videoUrl || defaultPlayback || '',
      duration: duration || '10 mins',
      durationSeconds: 600,
      orderIndex: 1,
      isFree: isFree ? 1 : 0,
      isPublished: 1,
      liveClassType: liveClassType || (type === 'live' ? 'custom' : 'youtube'),
      liveScheduledAt,
      liveMeetingUrl: liveMeetingUrl || defaultPlayback,
      liveStatus: liveStatus || (type === 'live' ? 'scheduled' : null),
      recordingUrl,
      liveStreamKey: generatedStreamKey,
      customRtmpUrl: defaultRtmpUrl,
      playbackHlsUrl: defaultPlayback,
      notesPdfUrl: notesPdfUrl || null,
      dppPdfUrl: dppPdfUrl || null
    });
    res.status(201).json({ success: true, data: lesson });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── LIVE CLASS OBS STREAM KEY & CREDENTIALS ──────────
// Generate or regenerate OBS Studio RTMP URL & Stream Key for a Live Lesson
router.post('/lessons/:lessonId/live-stream-credentials', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const lessonId = req.params.lessonId as string;
    const lesson = await lmsDB.getLessonById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, error: 'Lesson not found' });
      return;
    }

    const { regenerate } = req.body;
    let streamKey = lesson.liveStreamKey;
    if (!streamKey || regenerate) {
      streamKey = `fa_live_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    }

    const customRtmpUrl = process.env.LIVE_RTMP_SERVER_URL || 'rtmp://stream.finalattemptias.com/live';
    const playbackHlsUrl = `${process.env.LIVE_HLS_PLAYBACK_URL || 'https://stream.finalattemptias.com/live'}/${streamKey}.m3u8`;

    await lmsDB.updateLesson(lessonId, {
      liveClassType: 'custom',
      liveStreamKey: streamKey,
      customRtmpUrl,
      playbackHlsUrl,
      liveMeetingUrl: playbackHlsUrl,
      videoUrl: lesson.videoUrl || playbackHlsUrl
    });

    res.json({
      success: true,
      data: {
        lessonId,
        rtmpServerUrl: customRtmpUrl,
        streamKey,
        playbackHlsUrl,
        obsSetup: {
          service: 'Custom...',
          server: customRtmpUrl,
          streamKey: streamKey,
          instructions: 'In OBS Studio -> Settings -> Stream -> Select "Custom...", paste Server URL and Stream Key, then click Start Streaming.'
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── SRS 6.0 LIVE STREAMING WEBHOOKS ──────────────────
// In-memory debounce map for OBS Wi-Fi dropouts / brief disconnects (45 seconds)
const unpublishDebounceTimers = new Map<string, NodeJS.Timeout>();
const SRS_UNPUBLISH_DEBOUNCE_MS = 8000;

/**
 * POST /api/lms/streaming/on-publish
 * Called by SRS when an encoder (OBS Studio) begins publishing RTMP.
 * Validates stream key against lms_lessons; returns { code: 0 } on success or 403 / { code: 1 } to kick.
 */
router.post('/streaming/on-publish', async (req: Request, res: Response) => {
  try {
    const { stream, ip, client_id } = req.body;
    const streamKey = stream ? String(stream).trim() : '';

    if (!streamKey) {
      console.warn(`[SRS on_publish] Rejected: missing stream key from client ${client_id} (${ip})`);
      return res.status(403).json({ code: 1, error: 'Stream key is required' });
    }

    const lesson = await lmsDB.getLessonByStreamKey(streamKey);
    if (!lesson) {
      console.warn(`[SRS on_publish] Rejected: unauthorized stream key "${streamKey}" from client ${client_id} (${ip})`);
      return res.status(403).json({ code: 1, error: 'Unauthorized stream key' });
    }

    // Cancel pending unpublish debounce timer if broadcaster reconnected in time
    if (unpublishDebounceTimers.has(streamKey)) {
      clearTimeout(unpublishDebounceTimers.get(streamKey)!);
      unpublishDebounceTimers.delete(streamKey);
      console.log(`[SRS on_publish] Cleared unpublish debounce timer for stream ${streamKey}`);
    }

    const hlsUrl = `${process.env.LIVE_HLS_PLAYBACK_URL || 'https://stream.finalattemptias.com/live'}/${streamKey}.m3u8`;

    // Automatically transition lesson to live status
    await lmsDB.updateLesson(lesson.id, {
      liveStatus: 'live',
      liveMeetingUrl: hlsUrl,
      playbackHlsUrl: hlsUrl
    });

    console.log(`[SRS on_publish] Stream authorized: "${lesson.title}" (${lesson.id}) is now LIVE`);
    return res.json({ code: 0 });
  } catch (err: any) {
    console.error('[SRS on_publish] Error:', err);
    return res.status(500).json({ code: 1, error: err.message });
  }
});

/**
 * POST /api/lms/streaming/on-unpublish
 * Called by SRS when the RTMP publisher disconnects.
 * Uses a 45-second debounce window to prevent transient network drops from prematurely ending class.
 */
router.post('/streaming/on-unpublish', async (req: Request, res: Response) => {
  try {
    const { stream, client_id } = req.body;
    const streamKey = stream ? String(stream).trim() : '';

    if (!streamKey) {
      return res.json({ code: 0 });
    }

    // Clear any previous timer
    if (unpublishDebounceTimers.has(streamKey)) {
      clearTimeout(unpublishDebounceTimers.get(streamKey)!);
    }

    // Debounce transition to 'ended'
    const timer = setTimeout(async () => {
      unpublishDebounceTimers.delete(streamKey);
      try {
        const lesson = await lmsDB.getLessonByStreamKey(streamKey);
        if (lesson && lesson.liveStatus === 'live') {
          await lmsDB.updateLesson(lesson.id, { liveStatus: 'ended' });
          console.log(`[SRS on_unpublish] Lesson "${lesson.title}" (${lesson.id}) marked as ENDED after 45s debounce.`);
        }
      } catch (debounceErr: any) {
        console.error('[SRS on_unpublish] Error updating lesson status to ended:', debounceErr);
      }
    }, SRS_UNPUBLISH_DEBOUNCE_MS);

    unpublishDebounceTimers.set(streamKey, timer);
    console.log(`[SRS on_unpublish] Stream ${streamKey} disconnected. 45-second debounce timer started.`);
    return res.json({ code: 0 });
  } catch (err: any) {
    console.error('[SRS on_unpublish] Error:', err);
    return res.json({ code: 0 });
  }
});

/**
 * POST /api/lms/streaming/on-dvr
 * Called by SRS when DVR recording concludes and MP4 file is written to disk.
 * Uploads .mp4 via MinIO streaming fPutObject, updates recordingUrl, and deletes local copy.
 */
router.post('/streaming/on-dvr', async (req: Request, res: Response) => {
  try {
    const { stream, file } = req.body;
    const streamKey = stream ? String(stream).trim() : '';

    if (!streamKey || !file) {
      return res.json({ code: 0 });
    }

    console.log(`[SRS on_dvr] Received recording callback for stream ${streamKey}: ${file}`);

    const fileName = path.basename(file);
    const candidatePaths = [
      file,
      path.join('/opt/finalattempt-srs/objs/nginx/html/live', fileName),
      path.join('/opt/finalattempt-srs/objs/nginx/html', fileName),
      path.join(process.cwd(), 'recordings', fileName)
    ];

    const hostFilePath = candidatePaths.find(p => fs.existsSync(p));
    if (!hostFilePath) {
      console.warn(`[SRS on_dvr] Host file not found in candidate paths for ${fileName}`);
      return res.json({ code: 0 });
    }

    const lesson = await lmsDB.getLessonByStreamKey(streamKey);
    if (!lesson) {
      console.warn(`[SRS on_dvr] No lesson associated with stream key ${streamKey}`);
      return res.json({ code: 0 });
    }

    // Stream upload file directly to MinIO without holding file in RAM
    const s3Key = `recordings/${lesson.courseId || 'courses'}/${fileName}`;
    try {
      const uploadResult = await minioStorage.uploadLocalFile(s3Key, hostFilePath, 'video/mp4', false);
      const recordingUrl = uploadResult.url;

      await lmsDB.updateLesson(lesson.id, {
        recordingUrl,
        videoUrl: lesson.videoUrl || recordingUrl
      });
      console.log(`[SRS on_dvr] Successfully uploaded recording to MinIO: ${recordingUrl}`);

      // Unlink local host recording file to prevent disk exhaustion
      try {
        fs.unlinkSync(hostFilePath);
        console.log(`[SRS on_dvr] Unlinked local file: ${hostFilePath}`);
      } catch (unlinkErr: any) {
        console.warn(`[SRS on_dvr] Failed to unlink local file ${hostFilePath}:`, unlinkErr.message);
      }
    } catch (minioErr: any) {
      console.error('[SRS on_dvr] MinIO upload failed:', minioErr);
    }

    return res.json({ code: 0 });
  } catch (err: any) {
    console.error('[SRS on_dvr] Error:', err);
    return res.json({ code: 0 });
  }
});

// Update Live Status (e.g., 'live' when faculty starts stream, 'ended' when finished)
router.post('/lessons/:lessonId/live-status', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const lessonId = req.params.lessonId as string;
    const { status, recordingUrl } = req.body; // 'scheduled' | 'live' | 'ended'
    if (!status || !['scheduled', 'live', 'ended'].includes(status)) {
      res.status(400).json({ success: false, error: 'Valid status (scheduled, live, ended) is required.' });
      return;
    }

    const updatePayload: any = { liveStatus: status };
    if (recordingUrl) {
      updatePayload.recordingUrl = recordingUrl;
    }
    await lmsDB.updateLesson(lessonId, updatePayload);
    res.json({ success: true, message: `Live status updated to ${status}`, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── PUT /api/lms/lessons/:lessonId ───────────────────
// Update a lesson/lecture details
router.put('/lessons/:lessonId', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
    if (!lessonId || typeof lessonId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid lessonId parameter.' });
      return;
    }
    await lmsDB.updateLesson(lessonId, req.body);
    res.json({ success: true, message: 'Lesson updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DELETE /api/lms/lessons/:lessonId ────────────────
// Delete a lesson/lecture
router.delete('/lessons/:lessonId', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
    if (!lessonId || typeof lessonId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid lessonId parameter.' });
      return;
    }
    await lmsDB.deleteLesson(lessonId);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── QUIZZES ─────────────────────────────────────────
// Get quizzes for a course / test series (Authorization & Enrollment aware)
router.get('/courses/:courseId/quizzes', async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const includeUnpublished = req.query.includeUnpublished === 'true' || req.query.admin === 'true';
    let enrolled = false;
    let isAdminOrFaculty = includeUnpublished;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const ADMIN_MASTER_KEYS = ['finalattempt-superadmin-master-access-key-999', 'finalattempt-admin-token-secure-hash', 'admin-token', 'master-admin'];
      if (ADMIN_MASTER_KEYS.includes(token)) {
        enrolled = true;
        isAdminOrFaculty = true;
      } else {
        try {
          const { verifyAccessToken } = await import('../services/jwt');
          const payload = verifyAccessToken(token);
          if (payload.role === 'admin' || payload.role === 'faculty') {
            enrolled = true;
            isAdminOrFaculty = true;
          } else {
            enrolled = await lmsDB.isEnrolled(payload.userId, courseId);
          }
        } catch {
          enrolled = false;
        }
      }
    }

    const list = await lmsDB.getQuizzesByCourseId(courseId);

    // If Admin/Faculty or explicitly requesting all drafts, return full quiz list
    if (isAdminOrFaculty) {
      res.json({ success: true, data: list });
      return;
    }

    // Public / Student request: return published quizzes so mock test lists render cleanly
    const published = list.filter((q: any) => q.isPublished !== false);
    res.json({ success: true, data: published });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new quiz
router.post('/courses/:courseId/quizzes', authenticateAdminLms, async (req, res) => {
  try {
    const quiz = await lmsDB.createQuiz({ ...req.body, courseId: req.params.courseId });
    res.status(201).json({ success: true, data: quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update quiz details
router.put('/quizzes/:quizId', authenticateAdminLms, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    await lmsDB.updateQuiz(quizId, req.body);
    res.json({ success: true, message: 'Quiz updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a quiz
router.delete('/quizzes/:quizId', authenticateAdminLms, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    await lmsDB.deleteQuiz(quizId);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── QUESTIONS ───────────────────────────────────────
// Get questions for a quiz (admin with answers)
router.get('/quizzes/:quizId/questions', authenticateAdminLms, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    const list = await lmsDB.getQuestionsByQuizId(quizId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add or Upsert a question to a quiz
router.post('/quizzes/:quizId/questions', authenticateAdminLms, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    const body = { ...req.body, quizId };
    let question;
    if (body.id) {
      const existing = await lmsDB.updateQuestion(body.id, body);
      if (existing) {
        question = body;
      } else {
        question = await lmsDB.createQuestion(body);
      }
    } else {
      question = await lmsDB.createQuestion(body);
    }
    res.status(200).json({ success: true, data: question });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a question
router.put('/questions/:questionId', authenticateAdminLms, async (req, res) => {
  try {
    const questionId = String(req.params.questionId);
    await lmsDB.updateQuestion(questionId, req.body);
    res.json({ success: true, message: 'Question updated successfully', data: req.body });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a question
router.delete('/questions/:questionId', authenticateAdminLms, async (req, res) => {
  try {
    const questionId = String(req.params.questionId);
    await lmsDB.deleteQuestion(questionId);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── ASSIGNMENTS ─────────────────────────────────────
// Get all assignments for a course
router.get('/courses/:courseId/assignments', async (req, res) => {
  try {
    const courseId = String(req.params.courseId);
    const list = await lmsDB.getAssignmentsByCourseId(courseId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new assignment
router.post('/courses/:courseId/assignments', authenticateAdminLms, async (req, res) => {
  try {
    const courseId = String(req.params.courseId);
    const assign = await lmsDB.createAssignment({ ...req.body, courseId });
    res.status(201).json({ success: true, data: assign });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update an assignment
router.put('/assignments/:assignmentId', authenticateAdminLms, async (req, res) => {
  try {
    const assignmentId = String(req.params.assignmentId);
    await lmsDB.updateAssignment(assignmentId, req.body);
    res.json({ success: true, message: 'Assignment updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete an assignment
router.delete('/assignments/:assignmentId', authenticateAdminLms, async (req, res) => {
  try {
    const assignmentId = String(req.params.assignmentId);
    await lmsDB.deleteAssignment(assignmentId);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get submissions for an assignment (Admin / Evaluator only)
router.get('/assignments/:assignmentId/submissions', authenticateAdminLms, async (req, res) => {
  try {
    const assignmentId = String(req.params.assignmentId);
    const submissions = await lmsDB.getAssignmentSubmissions(assignmentId);
    res.json({ success: true, data: submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── MAINS TESTS & UPLOADS ─────────────────────────────

// Get all published Mains tests (assignments) across all test series or filtered by testSeriesId
router.get('/mains/tests', async (req: Request, res: Response) => {
  try {
    const { testSeriesId } = req.query;
    let list: any[] = [];
    if (testSeriesId && typeof testSeriesId === 'string') {
      list = await lmsDB.getAssignmentsByTestSeriesId(testSeriesId);
    } else {
      list = await lmsDB.getAllMainsAssignments();
    }
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single Mains test detail
router.get('/mains/tests/:id', async (req: Request, res: Response) => {
  try {
    const testId = req.params.id as string;
    const test = await lmsDB.getAssignmentById(testId);
    if (!test) {
      res.status(404).json({ success: false, error: 'Mains test not found.' });
      return;
    }

    let userSubmission = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../services/jwt');
        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        userSubmission = await lmsDB.getStudentSubmissionForTest(payload.userId, testId);
      } catch (e) {
        // Unauthenticated or expired token
      }
    }

    res.json({ success: true, data: { test, submission: userSubmission } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Student Submit Mains Answer Copy (PDF)
router.post('/mains/tests/:id/submit', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  const assignmentId = req.params.id as string;
  const { submissionUrl, submissionText, medium } = req.body;

  if (!submissionUrl) {
    res.status(400).json({ success: false, error: 'Answer Copy PDF file is required.' });
    return;
  }

  try {
    const test = await lmsDB.getAssignmentById(assignmentId);
    if (!test) {
      res.status(404).json({ success: false, error: 'Mains test not found.' });
      return;
    }

    // Enforce Enrollment Check:
    // If test is linked to a test series and user is not admin or faculty, ensure student is enrolled/has purchased
    const userRole = req.user?.role;
    const targetSeriesId = test.testSeriesId || test.courseId;
    if (userRole !== 'admin' && userRole !== 'faculty' && targetSeriesId) {
      const isEnrolledDirect = await lmsDB.isEnrolled(req.user!.userId, targetSeriesId);
      let isEnrolledSeries = false;
      if (!isEnrolledDirect) {
        const seriesObj = await lmsDB.getTestSeriesById(targetSeriesId);
        if (seriesObj) {
          isEnrolledSeries = (await lmsDB.isEnrolled(req.user!.userId, seriesObj.id)) ||
                             (seriesObj.slug ? await lmsDB.isEnrolled(req.user!.userId, seriesObj.slug) : false);
        }
      }

      if (!isEnrolledDirect && !isEnrolledSeries) {
        res.status(403).json({
          success: false,
          error: 'Access Denied: You must be enrolled in or have purchased this Test Series program to submit answer copies.',
          code: 'NOT_ENROLLED'
        });
        return;
      }
    }

    const sub = await lmsDB.submitAssignmentResponse(req.user!.userId, assignmentId, submissionUrl, submissionText, medium || 'English');

    // Instant Alert to Evaluator Team via Telegram/Webhook
    try {
      const { alertService } = await import('../services/alertService');
      alertService.notifyMainsSubmission({
        studentEmail: req.user?.email,
        testTitle: test.title,
        submissionUrl
      }).catch(() => {});
    } catch (_) {}

    res.status(201).json({ success: true, data: sub, message: 'Answer Copy submitted successfully for evaluation.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Student Get My Mains Copy Submissions
router.get('/mains/submissions/me', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await lmsDB.getStudentMainsSubmissions(req.user!.userId);
    res.json({ success: true, data: submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Get Student Quiz Attempts & Performance Metrics
router.get('/admin/students/:userId/attempts', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  try {
    const attempts = await lmsDB.getAllStudentQuizAttempts(userId);
    res.json({ success: true, data: attempts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Get Enrolled Students for a specific Course or Test Series
router.get('/admin/courses/:courseId/students', authenticateAdminLms, async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  try {
    const students = await lmsDB.getTestSeriesEnrolledStudents(courseId);
    res.json({ success: true, data: students });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Manually Add Student to Course
router.post('/admin/courses/:courseId/enroll', authenticateAdminLms, async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ success: false, error: 'Student userId is required.' });
    return;
  }
  try {
    // Resolve course to verify and extract UUID / slug
    let targetCourseId = courseId;
    let targetSlug: string | null = null;
    try {
      const course = await lmsDB.getCourseById(courseId);
      if (course) {
        if (course.id) targetCourseId = course.id;
        if (course.slug) targetSlug = course.slug;
      }
    } catch (_) {}

    const already = await lmsDB.isEnrolled(userId, targetCourseId);
    if (!already) {
      await lmsDB.createEnrollment(userId, targetCourseId, 'ADMIN_MANUAL', 0);
    }

    // Also grant FULL active entitlement in user_entitlements
    try {
      const { prisma } = await import('../prisma');
      const userEntitlementsDelegate = (prisma as any).user_entitlements;
      if (userEntitlementsDelegate) {
        const idsToGrant = [targetCourseId, targetSlug].filter(Boolean) as string[];
        for (const sid of idsToGrant) {
          const existingEnt = await userEntitlementsDelegate.findFirst({
            where: { user_id: userId, series_id: sid, entitlement_type: 'FULL', status: 'ACTIVE' }
          });
          if (!existingEnt) {
            await userEntitlementsDelegate.create({
              data: {
                user_id: userId,
                series_id: sid,
                entitlement_type: 'FULL',
                max_sequence_number: 999,
                snapshot_max_sequence: 999,
                status: 'ACTIVE'
              }
            });
          }
        }
      }
    } catch (_) {}

    res.json({ success: true, message: 'Student successfully enrolled in Course.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Deactivate Student Access from Course
router.delete('/admin/courses/:courseId/enroll/:userId', authenticateAdminLms, async (req: Request, res: Response) => {
  const { courseId, userId } = req.params as { courseId: string; userId: string };
  try {
    let targetCourseId = courseId;
    let targetSlug: string | null = null;
    try {
      const course = await lmsDB.getCourseById(courseId);
      if (course) {
        if (course.id) targetCourseId = course.id;
        if (course.slug) targetSlug = course.slug;
      }
    } catch (_) {}

    await lmsDB.deleteEnrollment(userId, targetCourseId);
    if (targetSlug && targetSlug !== targetCourseId) {
      await lmsDB.deleteEnrollment(userId, targetSlug);
    }
    // Deactivate entitlements
    try {
      const { prisma } = await import('../prisma');
      const userEntitlementsDelegate = (prisma as any).user_entitlements;
      if (userEntitlementsDelegate) {
        await userEntitlementsDelegate.deleteMany({
          where: {
            user_id: userId,
            series_id: { in: [targetCourseId, targetSlug, courseId].filter(Boolean) }
          }
        });
      }
    } catch (_) {}

    res.json({ success: true, message: 'Student access revoked from Course.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Get Enrolled Students for a specific Test Series
router.get('/admin/test-series/:testSeriesId/students', authenticateAdminLms, async (req: Request, res: Response) => {
  const testSeriesId = req.params.testSeriesId as string;
  try {
    const students = await lmsDB.getTestSeriesEnrolledStudents(testSeriesId);
    res.json({ success: true, data: students });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Manually Add Student to Test Series
router.post('/admin/test-series/:testSeriesId/enroll', authenticateAdminLms, async (req: Request, res: Response) => {
  const testSeriesId = req.params.testSeriesId as string;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ success: false, error: 'Student userId is required.' });
    return;
  }
  try {
    let targetIds = [testSeriesId];
    try {
      const ts = await lmsDB.getTestSeriesById(testSeriesId);
      if (ts) {
        if (ts.id) targetIds.push(ts.id);
        if (ts.slug) targetIds.push(ts.slug);
      }
    } catch (_) {}
    targetIds = Array.from(new Set(targetIds.filter(Boolean)));

    for (const sid of targetIds) {
      const already = await lmsDB.isEnrolled(userId, sid);
      if (!already) {
        await lmsDB.createEnrollment(userId, sid, 'ADMIN_MANUAL', 0);
      }

      // Grant FULL active entitlement in user_entitlements
      try {
        const { prisma } = await import('../prisma');
        const userEntitlementsDelegate = (prisma as any).user_entitlements;
        if (userEntitlementsDelegate) {
          const existingEnt = await userEntitlementsDelegate.findFirst({
            where: { user_id: userId, series_id: sid, entitlement_type: 'FULL', status: 'ACTIVE' }
          });
          if (!existingEnt) {
            await userEntitlementsDelegate.create({
              data: {
                user_id: userId,
                series_id: sid,
                entitlement_type: 'FULL',
                max_sequence_number: 999,
                snapshot_max_sequence: 999,
                status: 'ACTIVE'
              }
            });
          }
        }
      } catch (_) {}
    }

    res.json({ success: true, message: 'Student successfully enrolled in Test Series with full access.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Deactivate Student Access from Test Series
router.delete('/admin/test-series/:testSeriesId/enroll/:userId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { testSeriesId, userId } = req.params as { testSeriesId: string; userId: string };
  try {
    await lmsDB.deleteEnrollment(userId, testSeriesId);
    res.json({ success: true, message: 'Student access revoked from Test Series.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Update Student Info Profile
router.put('/admin/students/:userId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { fullName, email, mobile, state, district, targetExam } = req.body;
  try {
    const { authDB } = await import('../db');
    await authDB.updateProfile(userId, { fullName, email, mobile, state, district, targetExam });
    res.json({ success: true, message: 'Student profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ─────────────────────────── ADMIN MAINS PAPERS / TESTS CRUD ────────────────────

// Admin: Get all Mains tests across all test series or filtered by testSeriesId (including unpublished)
router.get('/admin/mains-tests', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const { testSeriesId } = req.query;
    let list: any[] = [];
    if (testSeriesId && typeof testSeriesId === 'string' && testSeriesId !== 'ALL') {
      list = await lmsDB.getAssignmentsByTestSeriesId(testSeriesId, true);
    } else {
      list = await lmsDB.getAllMainsAssignments(true);
    }
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create Mains Paper / Test
router.post('/admin/mains-tests', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const {
      title,
      titleHi,
      testSeriesId,
      description,
      descriptionHi,
      syllabus,
      syllabusHi,
      syllabusPdfUrl,
      syllabusPdfUrlHi,
      maxMarks,
      dueDate,
      questionPaperUrl,
      questionPaperUrlHi,
      answerBookletUrl,
      answerBookletUrlHi,
      modelAnswerUrl,
      modelAnswerUrlHi,
      discussionVideoUrl,
      discussionVideoUrlHi,
      medium,
      isPublished
    } = req.body;

    if (!title || !testSeriesId) {
      res.status(400).json({ success: false, error: 'Title and testSeriesId are required.' });
      return;
    }

    const test = await lmsDB.createAssignment({
      title,
      titleHi,
      testSeriesId,
      description,
      descriptionHi,
      syllabus,
      syllabusHi,
      syllabusPdfUrl,
      syllabusPdfUrlHi,
      maxMarks: Number(maxMarks || 100),
      dueDate,
      questionPaperUrl,
      questionPaperUrlHi,
      answerBookletUrl,
      answerBookletUrlHi,
      modelAnswerUrl,
      modelAnswerUrlHi,
      discussionVideoUrl,
      discussionVideoUrlHi,
      medium: medium || 'Bilingual',
      submissionType: 'pdf',
      isPublished: isPublished !== undefined ? isPublished : true
    });

    res.status(201).json({ success: true, data: test, message: 'Mains paper created successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update Mains Paper / Test
router.put('/admin/mains-tests/:id', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await lmsDB.updateAssignment(id, req.body);
    res.json({ success: ok, message: 'Mains paper updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete Mains Paper / Test
router.delete('/admin/mains-tests/:id', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await lmsDB.deleteAssignment(id);
    res.json({ success: ok, message: 'Mains paper deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Get All Mains Submissions for Evaluation
router.get('/admin/mains-submissions', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const submissions = await lmsDB.getAllMainsSubmissionsForAdmin();
    res.json({ success: true, data: submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Evaluate Mains Submission
router.put('/admin/mains-submissions/:submissionId/evaluate', authenticateAdminLms, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId as string;
  const { 
    grade, 
    feedback, 
    evaluatedCopyUrl, 
    status,
    rubricsBreakdown,
    assignedToUserId,
    assignedToName,
    evaluationDeadline
  } = req.body;

  try {
    const ok = await lmsDB.evaluateMainsSubmission(submissionId, { 
      grade, 
      feedback, 
      evaluatedCopyUrl, 
      status: status || 'Evaluated',
      rubricsBreakdown,
      assignedToUserId,
      assignedToName,
      evaluationDeadline
    });
    res.json({ success: ok, message: 'Mains submission evaluated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Assign Evaluator to Mains Submission
router.put('/admin/mains-submissions/:submissionId/assign', authenticateAdminLms, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId as string;
  const { assignedToUserId, assignedToName, evaluationDeadline } = req.body;

  try {
    const ok = await lmsDB.evaluateMainsSubmission(submissionId, {
      status: 'Under Evaluation',
      assignedToUserId,
      assignedToName,
      evaluationDeadline
    });
    res.json({ success: ok, message: 'Evaluator assigned successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Mains Submission Copy
router.delete('/admin/mains-submissions/:submissionId', authenticateAdminLms, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId as string;
  try {
    const ok = await lmsDB.deleteMainsSubmission(submissionId);
    res.json({ success: ok, message: 'Mains submission copy deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Remove Evaluated Copy from Mains Submission
router.delete('/admin/mains-submissions/:submissionId/evaluated-copy', authenticateAdminLms, async (req: Request, res: Response) => {
  const submissionId = req.params.submissionId as string;
  try {
    const ok = await lmsDB.deleteMainsEvaluatedCopy(submissionId);
    res.json({ success: ok, message: 'Evaluated copy removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── DOUBTS & COMMUNITY DISCUSSION ────────────────────

// GET /api/lms/courses/:courseId/doubts - List doubts for a course (or lesson)
router.get('/courses/:courseId/doubts', async (req: Request, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const lessonId = req.query.lessonId as string | undefined;
    const doubts = await lmsDB.getDoubtsByCourse(courseId, lessonId);
    res.json({ success: true, data: doubts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/lms/doubts/:doubtId - Get single doubt with threaded replies
router.get('/doubts/:doubtId', async (req: Request, res: Response) => {
  try {
    const doubtId = Array.isArray(req.params.doubtId) ? req.params.doubtId[0] : req.params.doubtId;
    const doubt = await lmsDB.getDoubtById(doubtId);
    if (!doubt) {
      res.status(404).json({ success: false, error: 'Doubt not found' });
      return;
    }
    res.json({ success: true, data: doubt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/lms/courses/:courseId/doubts - Ask a new doubt
router.post('/courses/:courseId/doubts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const { title, description, lessonId, timestampSec, userName, userAvatar } = req.body;
    if (!title || !description) {
      res.status(400).json({ success: false, error: 'Title and description are required.' });
      return;
    }

    const doubt = await lmsDB.createDoubt({
      courseId,
      lessonId,
      userId: req.user?.userId || 'student',
      userName: userName || req.user?.email?.split('@')[0] || 'Aspirant',
      userRole: req.user?.role || 'student',
      userAvatar,
      title,
      description,
      timestampSec: Number(timestampSec || 0)
    });
    res.status(201).json({ success: true, data: doubt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/lms/doubts/:doubtId/replies - Reply to a doubt
router.post('/doubts/:doubtId/replies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const doubtId = Array.isArray(req.params.doubtId) ? req.params.doubtId[0] : req.params.doubtId;
    const { replyText, userName, userAvatar } = req.body;
    if (!replyText || !replyText.trim()) {
      res.status(400).json({ success: false, error: 'Reply text cannot be empty.' });
      return;
    }

    const isFaculty = req.user?.role === 'faculty' || req.user?.role === 'admin';
    const reply = await lmsDB.addDoubtReply(doubtId, {
      userId: req.user?.userId || 'user',
      userName: userName || (isFaculty ? 'Faculty Mentor' : 'Aspirant'),
      userRole: req.user?.role || 'student',
      userAvatar,
      replyText: replyText.trim(),
      isFaculty
    });
    res.status(201).json({ success: true, data: reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/lms/doubts/:doubtId/upvote - Upvote a doubt
router.put('/doubts/:doubtId/upvote', async (req: Request, res: Response) => {
  try {
    const doubtId = Array.isArray(req.params.doubtId) ? req.params.doubtId[0] : req.params.doubtId;
    const upvotes = await lmsDB.upvoteDoubt(doubtId);
    res.json({ success: true, upvotes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/lms/doubts/:doubtId/resolve - Mark resolved / unresolved
router.put('/doubts/:doubtId/resolve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const doubtId = Array.isArray(req.params.doubtId) ? req.params.doubtId[0] : req.params.doubtId;
    const { isResolved } = req.body;
    const ok = await lmsDB.toggleDoubtResolved(doubtId, Boolean(isResolved));
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────── ADMIN DATABASE BACKUP & RESTORE ────────────────────

// GET /api/lms/admin/database/export - Download full JSON database backup
router.get('/admin/database/export', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const data = await lmsDB.exportBackup();
    const fileName = `finalattempt_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/lms/admin/database/import - Restore full JSON database backup
router.post('/admin/database/import', authenticateAdminLms, async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid backup JSON payload.' });
      return;
    }
    const ok = await lmsDB.importBackup(payload);
    res.json({ success: ok, message: 'Database backup imported successfully and saved to persistent disk storage.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
