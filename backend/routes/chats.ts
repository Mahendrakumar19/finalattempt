import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireStudent } from '../middleware/role';
import { lmsDB } from '../db';

const router = Router();

// Get Rooms list for Course
router.get('/rooms/:courseId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await lmsDB.getChatRoomsByCourseId(req.params.courseId);
    res.json({ success: true, data: rooms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Messages History of a Room
router.get('/messages/:roomId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await lmsDB.getChatMessagesByRoomId(req.params.roomId, 50);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
