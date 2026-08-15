import { Router, Response } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { requireStudent } from '../middleware/role';
import { lmsDB } from '../db';
import { ContentLocalizer, getTargetLang } from '../services/contentLocalizer';

const router = Router();

// ─── DAILY QUIZ PUBLIC & ADMIN ENDPOINTS (MUST BE BEFORE Wildcard /:quizId) ──

// Get Today's Daily Quiz Metadata
router.get('/daily/today', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await lmsDB.getAllDailyQuizzes();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayQuiz = list.find((q: any) => q.publishDate === todayStr) || list[0] || FALLBACK_DAILY_QUIZZES[0];
    res.json({ success: true, data: todayQuiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Previous Daily Quizzes List
router.get('/daily/list', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await lmsDB.getAllDailyQuizzes();
    const data = (list && list.length > 0) ? list : FALLBACK_DAILY_QUIZZES;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Public/Daily Quiz (Get Questions without Answers for security)
router.get('/daily/:quizId/start', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    let quiz = await lmsDB.getDailyQuizById(quizId) || FALLBACK_DAILY_QUIZZES.find(q => q.id === quizId) || { ...FALLBACK_DAILY_QUIZZES[0], id: quizId };
    let questions = await lmsDB.getDailyQuizQuestions(quizId);
    if (!questions || questions.length === 0) {
      questions = FALLBACK_DAILY_QUESTIONS;
    }

    const cleanQuestions = questions.map((q: any) => {
      const { correctAnswer, explanation, ...publicFields } = q;
      return publicFields;
    });

    res.json({
      success: true,
      data: {
        quiz,
        questions: cleanQuestions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit Public/Daily Quiz (Supports Guest & Auth Users)
router.post('/daily/:quizId/submit', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { answers, timeTakenSecs } = req.body;
    const quizId = req.params.quizId as string;

    if (!answers) {
      res.status(400).json({ success: false, error: 'Answers payload is required.' });
      return;
    }

    let quiz = await lmsDB.getDailyQuizById(quizId) || FALLBACK_DAILY_QUIZZES.find(q => q.id === quizId) || FALLBACK_DAILY_QUIZZES[0];
    let questions = await lmsDB.getDailyQuizQuestions(quizId);
    if (!questions || questions.length === 0) questions = FALLBACK_DAILY_QUESTIONS;

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const details = [];

    for (const q of questions) {
      const studentAnswer = answers[q.id];
      const correct = studentAnswer === q.correctAnswer;
      const questionMarks = q.marks || 1.0;
      const negativeVal = q.negativeMarks || 0.33;

      maxScore += questionMarks;

      if (studentAnswer) {
        if (correct) {
          score += questionMarks;
          correctCount++;
        } else {
          score -= negativeVal;
          incorrectCount++;
        }
      } else {
        unansweredCount++;
      }

      details.push({
        questionId: q.id,
        questionText: q.questionText,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
        studentAnswer: studentAnswer || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: correct
      });
    }

    if (score < 0) score = 0;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= (quiz.passingScore || 40);

    let attemptId = `att-guest-${Date.now()}`;
    if (req.user && req.user.userId && lmsDB) {
      try {
        const attempt = await lmsDB.submitQuizAttempt(
          req.user.userId,
          quizId,
          answers,
          score,
          maxScore,
          passed,
          timeTakenSecs || 0
        );
        if (attempt?.id) attemptId = attempt.id;
      } catch (_) {}
    }

    res.json({
      success: true,
      data: {
        attemptId,
        score,
        maxScore,
        percentage,
        passed,
        correctCount,
        incorrectCount,
        unansweredCount,
        timeTakenSecs: timeTakenSecs || 0,
        details
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Save Daily Quiz Metadata
router.post('/admin/daily', async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await lmsDB.saveDailyQuiz(req.body);
    res.json({ success: true, data: quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Daily Quiz
router.delete('/admin/daily/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ok = await lmsDB.deleteDailyQuiz(req.params.id as string);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Save Daily Quiz Question
router.post('/admin/daily/:quizId/questions', async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const question = await lmsDB.saveDailyQuizQuestion(quizId, req.body);
    res.json({ success: true, data: question });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Daily Quiz Question
router.delete('/admin/daily/:quizId/questions/:qId', async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const qId = req.params.qId as string;
    const ok = await lmsDB.deleteDailyQuizQuestion(quizId, qId);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── COURSE / LMS QUIZZES ENDPOINTS ──────────────────────────────────────────

// Get Student's All Quiz Attempts
router.get('/attempts/me', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const attempts = await lmsDB.getAllStudentQuizAttempts(req.user!.userId);
    res.json({ success: true, data: attempts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Quiz Info (Metadata only)
router.get('/:quizId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const quiz = await lmsDB.getQuizById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }
    res.json({ success: true, data: quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Quiz (Fetch questions without answer keys for security)
router.get('/:quizId/start', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const quiz = await lmsDB.getQuizById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }

    // Entitlement Check: If test is linked to a course/test series, verify enrollment unless admin/faculty
    if (quiz.courseId && req.user!.role === 'student') {
      const isEnrolled = await lmsDB.isEnrolled(req.user!.userId, quiz.courseId);
      if (!isEnrolled) {
        // Allow access if passing score / demo check or check if any active enrollment exists
        const userEnrollments = await lmsDB.getUserEnrollments(req.user!.userId);
        const enrolledInSeries = userEnrollments.some((e: any) => e.courseId === quiz.courseId);
        if (!enrolledInSeries && !quiz.isFree) {
          // Check fallback: return 403 if not enrolled
          res.status(403).json({ success: false, error: 'Please enroll in this test series program to attempt this CBT test.', code: 'QUIZ_003' });
          return;
        }
      }
    }

    const targetLang = getTargetLang(req);
    const questions = await lmsDB.getQuestionsByQuizId(quizId);
    
    // Clean correct answers to prevent source code checking cheating
    const cleanQuestions = questions.map((q: any) => {
      const { correctAnswer, explanation, ...publicFields } = q;
      return publicFields;
    });

    const localizedQuestions = await ContentLocalizer.localizeQuizQuestions(cleanQuestions, targetLang);

    res.json({
      success: true,
      data: {
        quiz,
        questions: localizedQuestions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit Quiz Answers & Calculate Marks
router.post('/:quizId/submit', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  const { answers, timeTakenSecs } = req.body; // Map: { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId;
  if (!quizId || typeof quizId !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid Quiz ID parameter.' });
    return;
  }

  if (!answers) {
    res.status(400).json({ success: false, error: 'Answers payload is required.' });
    return;
  }

  try {
    const quiz = await lmsDB.getQuizById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }

    const questions = await lmsDB.getQuestionsByQuizId(quizId);
    let score = 0;
    let maxScore = 0;
    const details = [];

    for (const q of questions) {
      const studentAnswer = answers[q.id];
      const correct = studentAnswer === q.correctAnswer;
      const questionMarks = q.marks || 1.0;
      const negativeVal = q.negativeMarks || 0.33;

      maxScore += questionMarks;

      if (studentAnswer) {
        if (correct) {
          score += questionMarks;
        } else {
          score -= negativeVal;
        }
      }

      details.push({
        questionId: q.id,
        questionText: q.questionText,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
        studentAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: correct
      });
    }

    // Bound final score to 0
    if (score < 0) score = 0;

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passed = percentage >= (quiz.passingScore || 40);

    const attempt = await lmsDB.submitQuizAttempt(
      req.user!.userId,
      quizId,
      answers,
      score,
      maxScore,
      passed,
      timeTakenSecs || 0
    );

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score,
        maxScore,
        percentage,
        passed,
        details
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Quiz Leaderboard
router.get('/:quizId/leaderboard', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = Array.isArray(req.params.quizId) ? req.params.quizId[0] : req.params.quizId;
    if (!quizId || typeof quizId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid Quiz ID parameter.' });
      return;
    }
    const leaderboard = await lmsDB.getLeaderboard(quizId);
    res.json({ success: true, data: leaderboard || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
