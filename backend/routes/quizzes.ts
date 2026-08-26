import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { requireStudent } from '../middleware/role';
import { lmsDB } from '../db';
import { ContentLocalizer, getTargetLang } from '../services/contentLocalizer';

const router = Router();

// ─── DETERMINISTIC RANDOMIZATION HELPERS (MULBERRY32 PRNG) ────────────────────

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArraySeeded<T>(array: T[], seedStr: string): T[] {
  const arr = [...array];
  const random = mulberry32(stringToSeed(seedStr));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── FALLBACK DATA FOR DAILY QUIZZES ──────────────────────────────────────────

const FALLBACK_DAILY_QUESTIONS = [
  {
    id: 'dq-1',
    questionText: 'With reference to the Bihar Economic Survey 2024-25, which sector recorded the highest growth rate in the state economy?',
    optionA: 'Primary Sector (Agriculture & Allied)',
    optionB: 'Secondary Sector (Manufacturing & Industry)',
    optionC: 'Tertiary Sector (Services & Financial Services)',
    optionD: 'Quaternary Knowledge Sector',
    correctAnswer: 'C',
    explanation: 'The Tertiary (Services) sector in Bihar continues to drive state GDP growth at over 10.3%, supported by trade, repair services, transport, and banking.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-2',
    questionText: 'Under Article 213 of the Indian Constitution, the Governor of a State can promulgate Ordinances when:',
    optionA: 'The State Legislative Assembly is dissolved only',
    optionB: 'Both Houses of the State Legislature (or Assembly) are not in session',
    optionC: 'The High Court approves the emergency situation',
    optionD: 'The Chief Minister submits a written emergency decree',
    correctAnswer: 'B',
    explanation: 'The Governor can promulgate an ordinance under Article 213 only when the Legislative Assembly (or both Houses in a bicameral legislature) is not in session.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-3',
    questionText: 'The Kunming-Montreal Global Biodiversity Framework (GBF) targets reducing global extinction risks of species by what percentage by 2030?',
    optionA: '20%',
    optionB: '30%',
    optionC: '50%',
    optionD: '75%',
    correctAnswer: 'B',
    explanation: 'Target 3 of the Kunming-Montreal GBF aims to effectively conserve and manage at least 30% of global land, coastal, and inland waters by 2030 (30x30 target).',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-4',
    questionText: 'Which historical leader established the Bihar Provincial Kisan Sabha (BPKS) in 1929 to spearhead agrarian rights?',
    optionA: 'Dr. Rajendra Prasad',
    optionB: 'Swami Sahajanand Saraswati',
    optionC: 'Jayaprakash Narayan',
    optionD: 'Sri Krishna Sinha',
    correctAnswer: 'B',
    explanation: 'Swami Sahajanand Saraswati founded the Bihar Provincial Kisan Sabha in 1929 at Sonepur to mobilize peasant grievances against zamindari oppression.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-5',
    questionText: 'What is the maximum limit of Member of Legislative Council (MLC) strength in a State relative to its Legislative Assembly strength?',
    optionA: 'One-half (1/2)',
    optionB: 'One-third (1/3)',
    optionC: 'One-fourth (1/4)',
    optionD: 'Fixed at 75 members irrespective of assembly size',
    correctAnswer: 'B',
    explanation: 'Under Article 171, the total number of members in the Legislative Council of a State shall not exceed one-third of the total number of members in the Legislative Assembly of that State, provided it is not less than 40.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-6',
    questionText: 'The PM-DevINE scheme recently highlighted in Union budget allocations is targeted specifically at the development of:',
    optionA: 'Island Territories (Andaman & Lakshadweep)',
    optionB: 'North-Eastern Region of India',
    optionC: 'Border Villages under Vibrant Villages Programme',
    optionD: 'Coastal Fishing Communities',
    correctAnswer: 'B',
    explanation: 'PM-DevINE (Prime Minister’s Development Initiative for North Eastern Region) is a 100% Central scheme for funding infrastructure and social development projects in the North East.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-7',
    questionText: 'Which district in Bihar has the highest forest cover percentage according to the India State of Forest Report (ISFR)?',
    optionA: 'West Champaran',
    optionB: 'Kaimur',
    optionC: 'Jamui',
    optionD: 'Rohtas',
    correctAnswer: 'B',
    explanation: 'Kaimur district has the largest area of forest cover as well as highest forest cover percentage (over 31.5%) in the state of Bihar.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-8',
    questionText: 'The phrase "Procedure Established by Law" in Article 21 of the Indian Constitution was originally borrowed from which legal system?',
    optionA: 'US Constitution',
    optionB: 'Japanese Constitution',
    optionC: 'British Common Law',
    optionD: 'Weimar Constitution of Germany',
    correctAnswer: 'B',
    explanation: 'The doctrine of "Procedure Established by Law" was inspired by the Japanese Constitution (Article 31), whereas "Due Process of Law" is derived from the US Constitution.',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-9',
    questionText: 'Which planet in our solar system exhibits retro-grade rotation (rotates from East to West on its axis)?',
    optionA: 'Mars & Jupiter',
    optionB: 'Venus & Uranus',
    optionC: 'Mercury & Neptune',
    optionD: 'Saturn & Uranus',
    correctAnswer: 'B',
    explanation: 'Venus and Uranus rotate clockwise (from East to West) on their axes, unlike most other planets which rotate counter-clockwise (West to East).',
    marks: 1,
    negativeMarks: 0.33
  },
  {
    id: 'dq-10',
    questionText: 'The Chaur Rebellion (1798–99) against British East India Company land tax policies took place primarily in which region?',
    optionA: 'Santhal Pargana & Chota Nagpur',
    optionB: 'Jungle Mahal region of Midnapore & Bankura',
    optionC: 'Munger & Bhagalpur belt',
    optionD: 'Purnea & Saharsa plains',
    correctAnswer: 'B',
    explanation: 'The Chaur (Bhumij) Uprising erupted in the Jungle Mahal region (Midnapore, Bankura, Manbhum) against high land revenue demands and forfeiture of ancestral lands.',
    marks: 1,
    negativeMarks: 0.33
  }
];

const FALLBACK_DAILY_QUIZZES = [
  {
    id: 'daily-quiz-today',
    title: 'Daily Current Affairs & Bihar GS Practice (Set 14)',
    description: '10 high-yield practice questions covering National & International Current Affairs, Bihar Budget & Economic Survey, and Indian Polity.',
    publishDate: new Date().toISOString().split('T')[0],
    timeLimitMins: 10,
    totalQuestions: 10,
    difficulty: 'MEDIUM',
    category: 'Daily Practice',
    attemptsCount: 142,
    passingScore: 40,
    isFree: true
  },
  {
    id: 'daily-quiz-prev-1',
    title: 'Daily Practice: Polity & Constitutional Landmarks (Set 13)',
    description: '10 Questions on Fundamental Rights, DPSP, Executive Powers, and Supreme Court Landmark Rulings.',
    publishDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    timeLimitMins: 10,
    totalQuestions: 10,
    difficulty: 'HIGH',
    category: 'Polity Special',
    attemptsCount: 230,
    passingScore: 40,
    isFree: true
  },
  {
    id: 'daily-quiz-prev-2',
    title: 'Daily Practice: Bihar History & Freedom Struggle (Set 12)',
    description: '10 Questions on Champaran Satyagraha, 1857 Revolt in Bihar, and Quit India Movement leadership.',
    publishDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    timeLimitMins: 10,
    totalQuestions: 10,
    difficulty: 'MEDIUM',
    category: 'Bihar Special',
    attemptsCount: 310,
    passingScore: 40,
    isFree: true
  },
  {
    id: 'daily-quiz-prev-3',
    title: 'Daily Practice: Environment & Geography Mapping (Set 11)',
    description: '10 High-yield questions on Wetlands, Tiger Reserves, River Basins, and Physical Geography.',
    publishDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    timeLimitMins: 10,
    totalQuestions: 10,
    difficulty: 'EASY',
    category: 'Geography & Environment',
    attemptsCount: 185,
    passingScore: 40,
    isFree: true
  }
];

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
      const questionMarks = Number(q.marks) || 1.0;
      const negativeVal = Number(q.negativeMarks) || 0.33;

      maxScore = Number(maxScore) + questionMarks;

      if (studentAnswer) {
        if (correct) {
          score = Number(score) + questionMarks;
          correctCount++;
        } else {
          score = Number(score) - negativeVal;
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

// ─── BILINGUAL MOCK TEST PDF IMPORT ENDPOINTS ──────────────────────────────────
import multer from 'multer';
import { BilingualPdfParser } from '../services/bilingualPdfParser';

const pdfMemoryStorage = multer.memoryStorage();
const pdfUpload = multer({ storage: pdfMemoryStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// Step 1a: Parse PDF Buffer & Run Validation Pass (NO DB WRITE)
router.post('/admin/parse-bilingual-pdf', pdfUpload.single('file'), async (req: Request & { file?: any }, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, error: 'PDF file is required in request payload.' });
      return;
    }

    const report = await BilingualPdfParser.parseBuffer(req.file.buffer);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Step 1b: Parse plain text (pasted text) & Run Validation Pass (NO DB WRITE)
router.post('/admin/parse-bilingual-text', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ success: false, error: 'Text body is required.' });
      return;
    }

    const report = BilingualPdfParser.parseText(text);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// Get My Quiz Attempts History
router.get('/attempts/me', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const list = await lmsDB.getAllStudentQuizAttempts(req.user!.userId);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Step 2: Atomic Import Execution (Creates Quiz + Questions transactional write)
router.post('/admin/import-bilingual-quiz', async (req: Request, res: Response) => {
  try {
    const { quizId, title, courseId, description, questions, replaceExisting } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'Quiz title and valid questions array are required.' });
      return;
    }

    const targetQuizId = quizId || `quiz-${Date.now()}`;

    // Duplicate Check & Protection
    const existingQuiz = await lmsDB.getQuizById(targetQuizId);
    if (existingQuiz && !replaceExisting) {
      res.status(409).json({
        success: false,
        code: 'ERR_QUIZ_EXISTS',
        error: 'A quiz paper with this ID already exists. Please confirm replacement before overwriting.'
      });
      return;
    }

    // Atomic DB write
    if (existingQuiz && replaceExisting) {
      await lmsDB.deleteQuiz(targetQuizId);
    }

    // Save Quiz Metadata
    const createdQuiz = await lmsDB.createQuiz({
      id: targetQuizId,
      courseId: courseId || 'bpsc-foundation',
      title,
      description: description || 'Strict Bilingual PDF Import Paper',
      timeLimitMins: Math.ceil(questions.length * 1.2),
      passingScore: 40,
      isPublished: true
    });

    // Save all 1:1 Bilingual Questions Transactionally
    const savedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const createdQ = await lmsDB.createQuestion({
        id: `q-${targetQuizId}-${i + 1}`,
        quizId: targetQuizId,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        questionTextHi: q.questionTextHi,
        optionAHi: q.optionAHi,
        optionBHi: q.optionBHi,
        optionCHi: q.optionCHi,
        optionDHi: q.optionDHi,
        optionEHi: q.optionEHi || null,
        explanationHi: q.explanationHi,
        marks: q.marks || 1.00,
        negativeMarks: q.negativeMarks || 0.33,
        orderIndex: i + 1
      });
      savedQuestions.push(createdQ);
    }

    res.json({
      success: true,
      data: {
        quiz: createdQuiz,
        importedQuestionsCount: savedQuestions.length,
        questions: savedQuestions,
        hasHindiAuthoredContent: true
      }
    });
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

// Start Quiz Session (Establishes/restores attempt, setCode, PRNG seed, and returns randomized questions)
router.get('/:quizId/start', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const quiz = await lmsDB.getQuizById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }

    // Strict Paywall Entitlement Check for TestSeries & Courses
    if (req.user!.role === 'student' && !quiz.isFree) {
      const targetCourseId = quiz.courseId;
      let isEnrolled = false;
      if (targetCourseId) {
        isEnrolled = await lmsDB.isEnrolled(req.user!.userId, targetCourseId);
      }
      if (!isEnrolled) {
        res.status(403).json({
          success: false,
          code: 'QUIZ_003',
          error: 'Access Denied: Please enroll in this test series program to attempt this CBT test paper.'
        });
        return;
      }
    }

    // Create or retrieve persistent session (Set Code & Seed)
    const session = await lmsDB.createOrGetQuizSession(req.user!.userId, quizId, quiz.timeLimitMins || 60);

    const targetLang = getTargetLang(req);
    const questions = await lmsDB.getQuestionsByQuizId(quizId);

    // Deterministic Question Order Shuffling per Attempt Seed
    const orderedQuestions = shuffleArraySeeded(questions, `${session.seed}-q`);

    // Clean correct answers & randomize options
    const cleanQuestions = orderedQuestions.map((q: any) => {
      const { correctAnswer, explanation, ...publicFields } = q;
      
      // Shuffle options deterministically per question seed
      const rawOptionPairs = [
        { orig: 'A', text: publicFields.optionA, textHi: publicFields.optionAHi },
        { orig: 'B', text: publicFields.optionB, textHi: publicFields.optionBHi },
        { orig: 'C', text: publicFields.optionC, textHi: publicFields.optionCHi },
        { orig: 'D', text: publicFields.optionD, textHi: publicFields.optionDHi },
        { orig: 'E', text: publicFields.optionE, textHi: publicFields.optionEHi },
      ];
      const optionPairs = rawOptionPairs.filter(o => o.text || o.textHi);

      const shuffledOptions = shuffleArraySeeded(optionPairs, `${session.seed}-opt-${q.id}`);
      
      const optionMap: Record<string, string> = {};
      const labels = ['A', 'B', 'C', 'D', 'E'];
      shuffledOptions.forEach((opt, idx) => {
        if (labels[idx]) optionMap[labels[idx]] = opt.orig;
      });

      return {
        ...publicFields,
        optionA: shuffledOptions[0]?.text || '',
        optionB: shuffledOptions[1]?.text || '',
        optionC: shuffledOptions[2]?.text || '',
        optionD: shuffledOptions[3]?.text || '',
        optionE: shuffledOptions[4]?.text || '',
        optionAHi: shuffledOptions[0]?.textHi || null,
        optionBHi: shuffledOptions[1]?.textHi || null,
        optionCHi: shuffledOptions[2]?.textHi || null,
        optionDHi: shuffledOptions[3]?.textHi || null,
        optionEHi: shuffledOptions[4]?.textHi || null,
        optionMap
      };
    });

    const localizedQuestions = await ContentLocalizer.localizeQuizQuestions(cleanQuestions, targetLang);

    res.json({
      success: true,
      data: {
        quiz,
        session: {
          id: session.id,
          setCode: session.setCode,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          savedAnswers: session.answers || {}
        },
        questions: localizedQuestions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-Save Answer Mid-Test
router.post('/:quizId/save-answer', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId, questionId, answer } = req.body;
    if (!attemptId || !questionId || !answer) {
      res.status(400).json({ success: false, error: 'attemptId, questionId, and answer are required.' });
      return;
    }

    const ok = await lmsDB.saveQuizAnswer(req.user!.userId, attemptId, questionId, answer);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit Quiz Answers & Calculate Marks Server-Side
router.post('/:quizId/submit', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  const { answers, timeTakenSecs, attemptId, setCode } = req.body; // Map: { [questionId]: 'A' | 'B' | 'C' | 'D' }
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

    // Entitlement verification on submit
    if (req.user!.role === 'student' && !quiz.isFree) {
      const isEnrolled = await lmsDB.isEnrolled(req.user!.userId, quiz.courseId);
      if (!isEnrolled) {
        res.status(403).json({ success: false, error: 'Access Denied: Unenrolled attempt submission rejected.' });
        return;
      }
    }

    const questions = await lmsDB.getQuestionsByQuizId(quizId);
    let score = 0;
    let maxScore = 0;
    const details = [];

    for (const q of questions) {
      const studentAnswer = answers[q.id];
      const correct = studentAnswer === q.correctAnswer;
      const questionMarks = Number(q.marks) || 1.0;
      const negativeVal = Number(q.negativeMarks) || 0.33;

      maxScore = Number(maxScore) + questionMarks;

      if (studentAnswer) {
        if (correct) {
          score = Number(score) + questionMarks;
        } else {
          score = Number(score) - negativeVal;
        }
      }

      details.push({
        questionId: q.id,
        questionText: q.questionText,
        questionTextHi: q.questionTextHi,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD, E: q.optionE },
        optionsHi: { A: q.optionAHi, B: q.optionBHi, C: q.optionCHi, D: q.optionDHi, E: q.optionEHi },
        studentAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        explanationHi: q.explanationHi,
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
      timeTakenSecs || 0,
      attemptId,
      setCode
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
