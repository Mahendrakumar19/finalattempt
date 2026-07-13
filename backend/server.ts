import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { db } from './db';

import { createServer } from 'http';
import { Server } from 'socket.io';
import chatsRouter from './routes/chats';
import { lmsDB } from './db';

// Import new LMS route modules
import authRouter from './routes/auth';
import lmsRouter from './routes/lms';
import paymentsRouter from './routes/payments';
import quizzesRouter from './routes/quizzes';
import facultiesRouter from './routes/faculties';
import uploadsRouter from './routes/uploads';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy header (Render, Heroku, Vercel, etc.)
app.set('trust proxy', 1);


// ─── Security middleware ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CDN resources
  contentSecurityPolicy: false // Disable inline CSP — Next.js handles this
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const cleanFrontend = (process.env.FRONTEND_URL || '').trim();
    const cleanAdmin = (process.env.ADMIN_URL || '').trim();

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://finalttempt-tau.vercel.app',
      'https://finalattempt-tau.vercel.app',
      'https://finalattempt-t7n6.vercel.app'
    ];
    if (cleanFrontend) allowedOrigins.push(cleanFrontend);
    if (cleanAdmin) allowedOrigins.push(cleanAdmin);

    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost:') || 
                      origin.includes('vercel.app') || 
                      origin.includes('finalattempt') || 
                      origin.includes('finalttempt');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General API rate limit (not on auth routes — those have their own limiter)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.', code: 'RATE_LIMIT' }
});
app.use('/api/', generalLimiter);

// Simple Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Backend API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});


// ─── Route mounts ──────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/lms', lmsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/faculty', facultiesRouter);
app.use('/api', uploadsRouter); // file upload + serve

// Swagger UI 
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// API healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// SETTINGS
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const ok = await db.updateSettings(req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LEADS
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await db.getLeads();
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', async (req, res) => {
  const { fullName, mobile, targetExam, email } = req.body;
  if (!fullName || !mobile) {
    return res.status(400).json({ error: 'fullName and mobile are required.' });
  }
  try {
    const lead = await db.createLead(fullName, mobile, targetExam, email);
    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const ok = await db.updateLeadStatus(id, status);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// FACULTY
app.get('/api/faculty', async (req, res) => {
  try {
    const list = await db.getFaculty();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faculty', async (req, res) => {
  try {
    const member = await db.createFaculty(req.body);
    res.json(member);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/faculty/:id', async (req, res) => {
  try {
    const ok = await db.updateFaculty(req.params.id, req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/faculty/:id', async (req, res) => {
  try {
    const ok = await db.deleteFaculty(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESULTS
app.get('/api/results', async (req, res) => {
  try {
    const list = await db.getResults();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const item = await db.createResult(req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/results/:id', async (req, res) => {
  try {
    const ok = await db.updateResult(req.params.id, req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/results/:id', async (req, res) => {
  try {
    const ok = await db.deleteResult(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CURRENT AFFAIRS
app.get('/api/current-affairs', async (req, res) => {
  try {
    const list = await db.getCurrentAffairs();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/current-affairs', async (req, res) => {
  try {
    const item = await db.createCurrentAffair(req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/current-affairs/:id', async (req, res) => {
  try {
    const ok = await db.updateCurrentAffair(req.params.id, req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/current-affairs/:id', async (req, res) => {
  try {
    const ok = await db.deleteCurrentAffair(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// BLOGS
app.get('/api/blogs', async (req, res) => {
  try {
    const list = await db.getBlogs();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/blogs', async (req, res) => {
  try {
    const item = await db.createBlog(req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/blogs/:id', async (req, res) => {
  try {
    const ok = await db.updateBlog(req.params.id, req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const ok = await db.deleteBlog(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// RESOURCES
app.get('/api/resources', async (req, res) => {
  try {
    const list = await db.getResources();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const item = await db.createResource(req.body);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/resources/:id', async (req, res) => {
  try {
    const ok = await db.updateResource(req.params.id, req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/resources/:id', async (req, res) => {
  try {
    const ok = await db.deleteResource(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// STUDENT PROGRESS
app.get('/api/student/progress/:studentId', async (req, res) => {
  try {
    const list = await db.getStudentProgress(req.params.studentId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/progress', async (req, res) => {
  const { studentId, courseId, lessonId, completed } = req.body;
  try {
    const ok = await db.saveStudentProgress(studentId, courseId, lessonId, completed);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});






// Create HTTP and Socket.io Servers
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const cleanFrontend = (process.env.FRONTEND_URL || '').trim();
      const isAllowed = origin.startsWith('http://localhost:') || 
                        origin.includes('vercel.app') || 
                        origin.includes('finalattempt') ||
                        origin.includes('finalttempt') ||
                        (cleanFrontend && origin === cleanFrontend);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Student connected: ${socket.id}`);

  // Join designated channel room (general discussion or doubts)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] Client ${socket.id} joined chat room: ${roomId}`);
  });

  // Real-time message exchange and database persistence
  socket.on('send_message', async (data: { roomId: string; senderId: string; messageText: string }) => {
    const { roomId, senderId, messageText } = data;
    try {
      // Save message to database and retrieve full payload (joins details)
      const savedMsg = await lmsDB.saveChatMessage(roomId, senderId, messageText);
      // Dispatch in real-time to everyone in the room
      io.to(roomId).emit('new_message', savedMsg);
    } catch (err) {
      console.error('[Socket] Chat delivery failed:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Student disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Unified Backend Server listening on port ${PORT}`);
  console.log(`Auth routes: POST /api/auth/register | /api/auth/login | /api/auth/refresh`);
  console.log(`LMS  routes: GET  /api/lms/courses   | /api/lms/enrollments/me`);
  console.log(`Real-Time Mentorship Socket.io Server active.`);
});
