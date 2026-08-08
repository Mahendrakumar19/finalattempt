import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireStudent } from '../middleware/role';
import { lmsDB } from '../db';

const router = Router();

// Get Rooms list for Course
router.get('/rooms/:courseId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
    const rooms = await lmsDB.getChatRoomsByCourseId(courseId);
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Messages History of a Room
router.get('/messages/:roomId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const messages = await lmsDB.getChatMessagesByRoomId(roomId, 50);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
