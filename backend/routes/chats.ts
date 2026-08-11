import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireStudent, requireAdmin } from '../middleware/role';
import { lmsDB } from '../db';

const ADMIN_MASTER_KEYS = [
  'finalattempt-superadmin-master-access-key-999',
  'finalattempt-admin-token-secure-hash'
];

// Middleware: accepts valid JWT OR hardcoded admin master keys
function authenticateAdminOrMasterKey(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided', code: 'AUTH_MISSING_TOKEN' });
    return;
  }
  const token = authHeader.split(' ')[1];
  // Accept hardcoded admin master keys directly
  if (ADMIN_MASTER_KEYS.includes(token)) {
    req.user = { userId: 'admin-master', email: 'admin@finalattempt.com', role: 'admin', sessionId: 'master' };
    next();
    return;
  }
  // Otherwise validate JWT
  authenticate(req, res, next);
}

const router = Router();

// Get or Create Personal Support Room (Student <-> Admin/Mentor)
router.get('/support-room', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const room = await lmsDB.getOrCreateSupportRoom(studentId, req.user?.email);
    res.json({ success: true, data: room });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get All Chat Rooms with last message preview (accepts master key OR valid admin JWT)
router.get('/admin/all-rooms', authenticateAdminOrMasterKey, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await lmsDB.getAllChatRoomsForAdmin();
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Rooms list for Course
router.get('/rooms/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const rooms = await lmsDB.getChatRoomsByCourseId(courseId);
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Messages History of a Room (Student, Admin, or master key)
router.get('/messages/:roomId', authenticateAdminOrMasterKey, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const messages = await lmsDB.getChatMessagesByRoomId(roomId, 100);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
