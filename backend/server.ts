import express from 'express';
import cors from 'cors';
import { db, seedCourses, seedFaculty, seedResults, seedCurrentAffairs } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// API healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// COURSES
app.get('/api/courses', (req, res) => {
  res.json(seedCourses);
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
    return res.status(400).json({ error: 'fullName and mobile are required parameters.' });
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

// STUDENT PROGRESS
app.get('/api/student/progress/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const progress = await db.getStudentProgress(studentId);
    res.json(progress);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/progress', async (req, res) => {
  const { studentId, courseId, lessonId, completed } = req.body;
  if (!studentId || !lessonId) {
    return res.status(400).json({ error: 'studentId and lessonId are required.' });
  }

  try {
    const ok = await db.saveStudentProgress(studentId, courseId, lessonId, completed);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// QUERIES
app.get('/api/queries', async (req, res) => {
  try {
    const queries = await db.getQueries();
    res.json(queries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/queries', async (req, res) => {
  const { studentName, subject, text } = req.body;
  if (!studentName || !text) {
    return res.status(400).json({ error: 'studentName and text are required.' });
  }

  try {
    const q = await db.createQuery(studentName, subject, text);
    res.json(q);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/queries/:id/reply', async (req, res) => {
  const { id } = req.params;
  const { replyText } = req.body;

  if (!replyText) {
    return res.status(400).json({ error: 'replyText is required.' });
  }

  try {
    const ok = await db.replyQuery(id, replyText);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MOODLE SYNC SERVICE
app.post('/api/sync', async (req, res) => {
  // Simulated Sync logic connecting to hidden Moodle instance
  console.log('Backend Sync Hook: Querying Moodle API WS endpoints...');
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      syncedCourses: seedCourses.length,
      syncedSections: 3 * seedCourses.length,
      syncedLessons: 5 * seedCourses.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Unified Backend Server listening on port ${PORT}`);
});
