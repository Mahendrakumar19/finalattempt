import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireStudent } from '../middleware/role';
import { lmsDB } from '../db';

const router = Router();

// Get Quiz Info (Metadata only)
router.get('/:quizId', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await lmsDB.getQuizById(req.params.quizId);
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
    const quiz = await lmsDB.getQuizById(req.params.quizId);
    if (!quiz) {
      res.status(404).json({ success: false, error: 'Quiz not found.' });
      return;
    }

    const questions = await lmsDB.getQuestionsByQuizId(req.params.quizId);
    
    // Clean correct answers to prevent source code checking cheating
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

// Submit Quiz Answers & Calculate Marks
router.post('/:quizId/submit', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  const { answers, timeTakenSecs } = req.body; // Map: { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const { quizId } = req.params;

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
router.get('/:quizId/leaderboard', authenticate, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const leaderboard = await lmsDB.getLeaderboard(req.params.quizId);
    res.json({ success: true, data: leaderboard });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
