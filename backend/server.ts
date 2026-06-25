import express from 'express';
import cors from 'cors';
import { db } from './db';

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

// QUERIES
app.get('/api/queries', async (req, res) => {
  try {
    const list = await db.getQueries();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/queries', async (req, res) => {
  const { studentName, subject, text } = req.body;
  try {
    const q = await db.createQuery(studentName, subject, text);
    res.json(q);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/queries/:id/reply', async (req, res) => {
  try {
    const ok = await db.replyQuery(req.params.id, req.body.replyText);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// MOODLE SYNC
app.post('/api/sync', async (req, res) => {
  try {
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      syncedCourses: 6,
      syncedSections: 18,
      syncedLessons: 30
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Unified Backend Server listening on port ${PORT}`);
});
