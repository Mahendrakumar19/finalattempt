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

// Middleware: optional authentication for read endpoints so guests/students never get 401
function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = authHeader.split(' ')[1];
  if (ADMIN_MASTER_KEYS.includes(token)) {
    req.user = { userId: 'admin-master', email: 'admin@finalattempt.com', role: 'admin', sessionId: 'master' };
    next();
    return;
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key');
    req.user = decoded;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
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

// Get Messages History of a Room (Student, Admin, or guest)
router.get('/messages/:roomId', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const messages = await lmsDB.getChatMessagesByRoomId(roomId, 100);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edit Message (Student or Admin)
router.put('/messages/:messageId', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const { messageText } = req.body;
    const userId = req.user?.userId || req.body.senderId;
    const isAdmin = req.user?.role === 'admin' || req.user?.userId === 'admin-master';

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ success: false, error: 'messageText is required' });
    }

    const updated = await lmsDB.editChatMessage(messageId, messageText.trim(), userId, isAdmin);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(403).json({ success: false, error: err.message });
  }
});

// Delete Message (Student or Admin)
router.delete('/messages/:messageId', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const userId = req.user?.userId || req.body?.senderId || req.query?.senderId;
    const isAdmin = req.user?.role === 'admin' || req.user?.userId === 'admin-master';

    const deleted = await lmsDB.deleteChatMessage(messageId, userId as string, isAdmin);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(403).json({ success: false, error: err.message });
  }
});

// Admin: Delete Chat Room
router.delete('/rooms/:roomId', authenticateAdminOrMasterKey, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const ok = await lmsDB.deleteChatRoom(roomId);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Block / Unblock User
router.post('/block-user', authenticateAdminOrMasterKey, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, isBlocked } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    const ok = await lmsDB.blockUser(userId, isBlocked !== false);
    res.json({ success: ok, userId, isBlocked: isBlocked !== false });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Blocked Users List
router.get('/blocked-users', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const blockedList = await lmsDB.getBlockedUsers();
    res.json({ success: true, data: blockedList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check if Specific User is Blocked
router.get('/blocked-users/check/:userId', optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const blocked = await lmsDB.isUserBlocked(userId);
    res.json({ success: true, isBlocked: blocked });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
