import './bootstrap';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
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
import youtubeRouter, { syncYouTubeChannel } from './routes/youtube';
import mediaRouter from './media/media.routes';
import syllabusStrategyRouter from './routes/syllabusStrategy';
import pyqsRouter from './routes/pyqs';
import bpscScraperRouter from './routes/bpscScraper';
import ncertRouter from './routes/ncert';
import ncertBooksRouter from './routes/ncertBooks';
import { verifyEmailConnection } from './services/email';
import { ContentLocalizer, getTargetLang } from './services/contentLocalizer';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy header (Render, Heroku, Vercel, etc.)
app.set('trust proxy', 1);


// ─── Security middleware ───────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow CDN resources
  contentSecurityPolicy: false // Disable inline CSP — Next.js handles this
}));

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://38.242.244.225:3000',
  'https://finalattemptias.com',
  'https://www.finalattemptias.com',
  'http://finalattemptias.com',
  'http://www.finalattemptias.com',
  'https://finalattempt-tau.vercel.app',
  'https://finalattempt-vawt.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = ALLOWED_ORIGINS.includes(cleanOrigin) ||
                      cleanOrigin.includes('finalattemptias.com') ||
                      cleanOrigin.includes('vercel.app') ||
                      cleanOrigin.includes('onrender.com') ||
                      cleanOrigin.startsWith('http://localhost:') ||
                      cleanOrigin.startsWith('http://127.0.0.1:') ||
                      cleanOrigin.startsWith('http://38.242.244.225:');
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      callback(null, true); // Fallback allow to avoid admin lockout
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
app.use('/api/lms/quizzes', quizzesRouter);
app.use('/api/lms', lmsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/faculty', facultiesRouter);
app.use('/api', uploadsRouter); // file upload + serve
app.use('/api/youtube', youtubeRouter);
app.use('/api/media', mediaRouter);
app.use('/api/syllabus-strategy', syllabusStrategyRouter);
app.use('/api/pyqs', pyqsRouter);
app.use('/api/bpsc', bpscScraperRouter);
app.use('/api/ncert', ncertRouter);
app.use('/api/ncert-books', ncertBooksRouter);
app.use('/uploads', (req, res, next) => {
  // Allow cross-origin file serving for the frontend domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(process.cwd(), 'uploads'), {
  // Force correct MIME type for PDFs and documents
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf':  'application/pdf',
      '.doc':  'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls':  'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt':  'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip':  'application/zip',
    };
    if (mimeMap[ext]) {
      res.setHeader('Content-Type', mimeMap[ext]);
    }
    // Serve PDFs inline (viewable in browser), force attachment for Office files
    const inlineExts = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.txt', '.svg']);
    // Cleanly strip leading timestamp (e.g., 1784719739539_ or 1784719739539-)
    const cleanFileName = path.basename(filePath).replace(/^\d+[_-]/, '');
    const disposition = inlineExts.has(ext) ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(cleanFileName)}"; filename*=UTF-8''${encodeURIComponent(cleanFileName)}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

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

// CUSTOM PAGES CMS
app.get('/api/custom-pages', async (req, res) => {
  try {
    const publishedOnly = req.query.publishedOnly === 'true';
    const pages = await db.getCustomPages(publishedOnly);
    res.json({ success: true, data: pages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/custom-pages/:slug', async (req, res) => {
  try {
    const page = await db.getCustomPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/custom-pages', async (req, res) => {
  try {
    const saved = await db.saveCustomPage(req.body);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/custom-pages/:id', async (req, res) => {
  try {
    const ok = await db.deleteCustomPage(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TEST SERIES & EXAM HIERARCHY API ROUTES
app.get('/api/test-series/hierarchy', async (req, res) => {
  try {
    const includeUnpublished = req.query.includeUnpublished === 'true';
    const list = await db.getExamsHierarchy(includeUnpublished);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/test-series', async (req, res) => {
  try {
    const includeUnpublished = req.query.includeUnpublished === 'true';
    const exams = await db.getExamsHierarchy(includeUnpublished);
    const allSeries: any[] = [];
    exams.forEach((ex: any) => {
      if (ex.testSeries && Array.isArray(ex.testSeries)) {
        allSeries.push(...ex.testSeries);
      }
    });
    res.json({ success: true, data: allSeries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/test-series/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const item = await db.getTestSeriesBySlugOrId(slug);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Test Series not found' });
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/test-series', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.title || !body.examId) {
      return res.status(400).json({ success: false, error: 'title and examId are required' });
    }
    const saved = await db.saveTestSeriesRecord(body);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/test-series/:id', async (req, res) => {
  try {
    const ok = await db.deleteTestSeriesRecord(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/exams', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.id) {
      return res.status(400).json({ success: false, error: 'id is required' });
    }
    const saved = await db.saveExamRecord(body);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post('/api/visitors/increment', async (req, res) => {
  try {
    const count = await db.getAndIncrementVisitorCount();
    res.json({ success: true, visitorsCount: count });
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
    const targetLang = getTargetLang(req);
    const list = await db.getFaculty();
    const localized = await ContentLocalizer.localizeEntityList(
      'faculty',
      list,
      ['name', 'role', 'experience', 'bio'],
      targetLang,
      ['bio']
    );
    res.json(localized);
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
    const targetLang = getTargetLang(req);
    const list = await db.getCurrentAffairs();
    const localized = await ContentLocalizer.localizeEntityList(
      'current_affair',
      list,
      ['title', 'summary', 'relevance', 'context', 'analysis', 'wayForward', 'practiceQuestion'],
      targetLang,
      ['content', 'summary', 'relevance', 'context', 'analysis', 'wayForward', 'practiceQuestion']
    );
    res.json(localized);
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

// DYNAMIC CURRENT AFFAIRS SYSTEM API ROUTES
app.get('/api/dynamic-current-affairs/editions', async (req, res) => {
  try {
    res.setHeader('Vary', 'Accept-Language, x-locale, Cookie');
    res.setHeader('Cache-Control', 'no-cache, private');
    const targetLang = getTargetLang(req);
    const includeDrafts = req.query.includeDrafts === 'true';
    const list = await db.getDynamicCurrentAffairsEditions(includeDrafts);

    if (targetLang === 'hi' && Array.isArray(list) && list.length > 0) {
      for (const ed of list) {
        if (Array.isArray(ed.articles) && ed.articles.length > 0) {
          ed.articles = await ContentLocalizer.localizeEntityList(
            'current_affair_article',
            ed.articles,
            ['title', 'summary'],
            targetLang,
            ['summary']
          );
        }
      }
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dynamic-current-affairs/daily/:date', async (req, res) => {
  try {
    res.setHeader('Vary', 'x-locale');
    res.setHeader('Cache-Control', 'no-cache, private');
    const targetLang = getTargetLang(req);
    const includeDrafts = req.query.includeDrafts === 'true';
    const edition = await db.getDynamicCurrentAffairsEditionByDate(req.params.date, includeDrafts);
    if (edition && Array.isArray(edition.articles)) {
      // Localize metadata fields for the sidebar article index list (fast load)
      edition.articles = await ContentLocalizer.localizeEntityList(
        'current_affair_article',
        edition.articles,
        ['title', 'summary'],
        targetLang,
        ['summary']
      );
    }
    res.json(edition);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dynamic-current-affairs/article/:slug', async (req, res) => {
  try {
    res.setHeader('Vary', 'x-locale');
    res.setHeader('Cache-Control', 'no-cache, private');
    const targetLang = getTargetLang(req);
    const includeDrafts = req.query.includeDrafts === 'true';
    const article = await db.getDynamicCurrentAffairArticle(req.params.slug, includeDrafts);
    if (article) {
      const localized = await ContentLocalizer.localizeEntity(
        'current_affair_article',
        article,
        ['title', 'summary', 'content', 'whyInNews', 'context', 'background', 'keyHighlights', 'importantFacts', 'examRelevance', 'previousContext', 'wayForward', 'keyTakeaways'],
        targetLang,
        ['content', 'summary', 'whyInNews', 'context', 'background', 'keyHighlights', 'importantFacts', 'examRelevance', 'previousContext', 'wayForward', 'keyTakeaways']
      );
      res.json(localized);
    } else {
      res.json(null);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dynamic-current-affairs/search', async (req, res) => {
  try {
    const targetLang = getTargetLang(req);
    const results = await db.getDynamicCurrentAffairsSearch(req.query);
    if (Array.isArray(results)) {
      const localized = await ContentLocalizer.localizeEntityList(
        'current_affair_article',
        results,
        ['title', 'summary'],
        targetLang,
        ['summary']
      );
      res.json(localized);
      return;
    }
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/edition', async (req, res) => {
  try {
    const ok = await db.createOrUpdateDynamicCurrentAffairEdition(req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/dynamic-current-affairs/edition/:id', async (req, res) => {
  try {
    const ok = await db.deleteDynamicCurrentAffairEdition(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/dynamic-current-affairs/article/:id', async (req, res) => {
  try {
    const ok = await db.deleteDynamicCurrentAffairArticle(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AGGREGATION & COMPILATIONS ENDPOINTS
app.get('/api/dynamic-current-affairs/compilations', async (req, res) => {
  try {
    const targetLang = getTargetLang(req);
    const type = req.query.type as string | undefined;
    const list = await db.getCompilations(type);
    const localized = await ContentLocalizer.localizeEntityList(
      'current_affairs_compilation',
      list,
      ['title', 'summary'],
      targetLang,
      ['summary']
    );
    res.json({ success: true, data: localized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/dynamic-current-affairs/compilations/:key', async (req, res) => {
  try {
    const targetLang = getTargetLang(req);
    const compilation: any = await db.getCompilationByKey(req.params.key);
    if (!compilation) {
      res.status(404).json({ success: false, error: 'Compilation not found.' });
      return;
    }
    if (compilation && Array.isArray(compilation.articles)) {
      compilation.articles = await ContentLocalizer.localizeEntityList(
        'current_affair_article',
        compilation.articles,
        ['title', 'summary', 'content', 'whyInNews', 'context', 'background', 'keyHighlights', 'importantFacts', 'examRelevance', 'previousContext', 'wayForward', 'keyTakeaways'],
        targetLang,
        ['content', 'summary', 'whyInNews', 'context', 'background', 'keyHighlights', 'importantFacts', 'examRelevance', 'previousContext', 'wayForward', 'keyTakeaways']
      );
    }
    res.json({ success: true, data: compilation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/combine/weekly/preview', async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const preview = await db.previewCombineWeekly(fromDate, toDate);
    res.json({ success: true, data: preview });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/combine/weekly', async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const result = await db.combineWeekly(fromDate, toDate);
    res.json({ success: true, message: 'Weekly Current Affairs combined successfully.', data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/combine/monthly/preview', async (req, res) => {
  try {
    const { year, month } = req.body;
    const preview = await db.previewCombineMonthly(year, month);
    res.json({ success: true, data: preview });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/combine/monthly', async (req, res) => {
  try {
    const { year, month } = req.body;
    const result = await db.combineMonthly(year, month);
    res.json({ success: true, message: 'Monthly Current Affairs combined successfully.', data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/combine/yearly/preview', async (req, res) => {
  try {
    const { year } = req.body;
    const preview = await db.previewCombineYearly(year);
    res.json({ success: true, data: preview });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/dynamic-current-affairs/combine/yearly', async (req, res) => {
  try {
    const { year, combineAvailableOnly } = req.body;
    const result = await db.combineYearly(year, Boolean(combineAvailableOnly));
    res.json({ success: true, message: 'Yearly Current Affairs combined successfully.', data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// BLOGS
app.get('/api/blogs', async (req, res) => {
  try {
    const list = await db.getBlogs();
    const targetLang = getTargetLang(req);
    res.setHeader('Vary', 'Accept-Language, x-locale, Cookie');
    res.setHeader('Cache-Control', 'no-cache, private');

    if (targetLang === 'hi' && Array.isArray(list) && list.length > 0) {
      const localized = await ContentLocalizer.localizeEntityList(
        'blog',
        list,
        ['title', 'blurb', 'excerpt', 'category', 'content'],
        targetLang,
        ['content']
      );
      return res.json(localized);
    }
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blogs/:id', async (req, res) => {
  try {
    const list = await db.getBlogs();
    const idOrSlug = req.params.id;
    const item = list.find((b: any) => String(b.id) === idOrSlug || b.slug === idOrSlug);
    if (!item) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    const targetLang = getTargetLang(req);
    res.setHeader('Vary', 'Accept-Language, x-locale, Cookie');
    res.setHeader('Cache-Control', 'no-cache, private');

    if (targetLang === 'hi') {
      const localized = await ContentLocalizer.localizeEntity(
        'blog',
        item,
        ['title', 'blurb', 'excerpt', 'category', 'content'],
        targetLang,
        ['content']
      );
      return res.json(localized);
    }
    res.json(item);
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

// CUSTOM PAGES CMS ROUTES
app.get('/api/custom-pages', async (req, res) => {
  try {
    const publishedOnly = req.query.publishedOnly === 'true';
    const pages = await db.getCustomPages(publishedOnly);
    res.json({ success: true, data: pages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/custom-pages/*', async (req, res) => {
  try {
    const rawSlug = (req.params as any)[0] || '';
    const page = await db.getCustomPageBySlug(rawSlug);
    res.json({ success: true, data: page });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/custom-pages', async (req, res) => {
  try {
    const ok = await db.saveCustomPage(req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/custom-pages/:id', async (req, res) => {
  try {
    const ok = await db.deleteCustomPage(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});






// Create HTTP and Socket.io Servers
const httpServer = createServer(app);
const io = new Server(httpServer, {
  transports: ['websocket', 'polling'],
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const cleanFrontend = (process.env.FRONTEND_URL || '').trim();
      const cleanOrigin = origin.replace(/\/$/, '');
      const isAllowed = ALLOWED_ORIGINS.includes(cleanOrigin) ||
                        cleanOrigin.includes('finalattempt') ||
                        cleanOrigin.includes('vercel.app') ||
                        cleanOrigin.includes('onrender.com') ||
                        cleanOrigin.startsWith('http://localhost:') ||
                        cleanOrigin.startsWith('http://127.0.0.1:') ||
                        cleanOrigin.startsWith('http://38.242.244.225:') ||
                        (cleanFrontend && cleanOrigin === cleanFrontend.replace(/\/$/, ''));
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[Socket CORS Fallback] Origin: ${origin}`);
        callback(null, true); // Fallback allow to avoid disconnects in production deployments
      }
    },
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join designated channel room (general discussion or doubts)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] Client ${socket.id} joined chat room: ${roomId}`);
  });

  // Admin socket watcher join
  socket.on('admin_join_all', () => {
    socket.join('admin_watchers');
    console.log(`[Socket] Admin watcher joined: ${socket.id}`);
  });

  // Real-time message exchange and database persistence
  socket.on('send_message', async (data: { roomId: string; senderId: string; messageText: string; senderName?: string; senderRole?: string }) => {
    const { roomId, senderId, messageText, senderName, senderRole } = data;
    try {
      // Check if student sender is blocked
      const isBlocked = await lmsDB.isUserBlocked(senderId);
      if (isBlocked && senderRole !== 'admin') {
        socket.emit('user_blocked_error', { message: 'You have been blocked from sending messages by Admin.' });
        return;
      }

      // Save message to database and retrieve full payload (joins details)
      const savedMsg = await lmsDB.saveChatMessage(roomId, senderId, messageText, senderName, senderRole);
      if (!savedMsg) return;
      // Dispatch in real-time to everyone in the room
      io.to(roomId).emit('new_message', savedMsg);
      // Also dispatch to admin watchers watching for real-time incoming student chats
      io.to('admin_watchers').emit('new_message', savedMsg);
      console.log(`[Socket] Message delivered: room=${roomId} sender=${senderName || senderId}`);
    } catch (err) {
      console.error('[Socket] Chat delivery failed:', err);
    }
  });

  // Real-time message edit
// Server touch: Trigger nodemon reload with Vary x-locale and cookie fallback fix
  socket.on('edit_message', async (data: { messageId: string; roomId: string; newMessageText: string; senderId?: string; isAdmin?: boolean }) => {
    const { messageId, roomId, newMessageText, senderId, isAdmin } = data;
    try {
      const updated = await lmsDB.editChatMessage(messageId, newMessageText, senderId, isAdmin);
      io.to(roomId).emit('message_edited', { messageId, roomId, newMessageText, isEdited: true });
      io.to('admin_watchers').emit('message_edited', { messageId, roomId, newMessageText, isEdited: true });
    } catch (err) {
      console.error('[Socket] Edit message failed:', err);
    }
  });

  // Real-time message deletion
  socket.on('delete_message', async (data: { messageId: string; roomId: string; senderId?: string; isAdmin?: boolean }) => {
    const { messageId, roomId, senderId, isAdmin } = data;
    try {
      await lmsDB.deleteChatMessage(messageId, senderId, isAdmin);
      io.to(roomId).emit('message_deleted', { messageId, roomId });
      io.to('admin_watchers').emit('message_deleted', { messageId, roomId });
    } catch (err) {
      console.error('[Socket] Delete message failed:', err);
    }
  });

  // Real-time user block action
  socket.on('block_user', async (data: { userId: string; isBlocked: boolean }) => {
    const { userId, isBlocked } = data;
    try {
      await lmsDB.blockUser(userId, isBlocked);
      io.emit('user_blocked_status', { userId, isBlocked });
    } catch (err) {
      console.error('[Socket] Block user failed:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Unified Backend Server listening on port ${PORT}`);
  console.log(`Auth routes: POST /api/auth/register | /api/auth/login | /api/auth/refresh`);
  console.log(`LMS  routes: GET  /api/lms/courses   | /api/lms/enrollments/me`);
  console.log(`Real-Time Mentorship Socket.io Server active.`);

  // Verify Zoho SMTP email connection at startup
  verifyEmailConnection();

  const THIRTY_MINUTES_MS = 30 * 60 * 1000;
  setInterval(async () => {
    console.log('[YouTube Scheduler] Running automatic background channel sync...');
    try {
      await syncYouTubeChannel();
    } catch (e: any) {
      console.error('[YouTube Scheduler] Background sync error:', e.message);
    }
  }, THIRTY_MINUTES_MS);

  // Run initial sync 5 seconds after startup to ensure fresh data
  setTimeout(async () => {
    console.log('[YouTube Scheduler] Initial background channel sync trigger...');
    try {
      await syncYouTubeChannel();
    } catch (e: any) {
      console.error('[YouTube Scheduler] Initial sync error:', e.message);
    }
  }, 5000);
});
