export interface QuestionPublishabilityResult {
  questionId: string;
  questionNumber: number;
  isPublishable: boolean;
  reasonCodes: string[];
}

export interface QuizPublishabilityResult {
  quizId: string;
  isPublishable: boolean;
  totalQuestions: number;
  readyQuestions: number;
  blockedQuestions: number;
  details: QuestionPublishabilityResult[];
}

export class LmsPublishabilityValidator {
  /**
   * Validates whether a single question is ready for CBT test publication.
   */
  public static validateQuestion(q: any, index: number): QuestionPublishabilityResult {
    const reasonCodes: string[] = [];
    const qId = q.id || `q-${index + 1}`;

    const questionTextEn = q.questionText || '';
    const questionTextHi = q.questionTextHi || '';
    if (!questionTextEn.trim() && !questionTextHi.trim()) {
      reasonCodes.push('EMPTY_QUESTION_PROMPT');
    }

    const optA = q.optionA || q.optionAHi || '';
    const optB = q.optionB || q.optionBHi || '';
    const optC = q.optionC || q.optionCHi || '';
    const optD = q.optionD || q.optionDHi || '';
    const optE = q.optionE || q.optionEHi || '';

    if (!optA.trim() || !optB.trim()) {
      reasonCodes.push('MISSING_REQUIRED_OPTIONS');
    }

    // Correct Answer Verification
    const effectiveAns = (q.verifiedAnswer || q.correctAnswer || '').toUpperCase();
    if (!effectiveAns) {
      reasonCodes.push('MISSING_CORRECT_ANSWER');
    } else if (!['A', 'B', 'C', 'D', 'E'].includes(effectiveAns)) {
      reasonCodes.push('INVALID_ANSWER_KEY');
    } else {
      // Answer Option Existence Check
      const availableLabels: string[] = [];
      if (optA.trim()) availableLabels.push('A');
      if (optB.trim()) availableLabels.push('B');
      if (optC.trim()) availableLabels.push('C');
      if (optD.trim()) availableLabels.push('D');
      if (optE.trim()) availableLabels.push('E');

      if (!availableLabels.includes(effectiveAns)) {
        reasonCodes.push('ANSWER_KEY_NOT_IN_OPTIONS');
      }
    }

    // Lifecycle Status Checks
    if (q.questionStatus && q.questionStatus !== 'VALID') {
      reasonCodes.push(`QUESTION_STATUS_${q.questionStatus}`);
    }

    if (q.publishStatus && q.publishStatus === 'BLOCKED') {
      reasonCodes.push('PUBLISH_STATUS_BLOCKED');
    }

    const isPublishable = reasonCodes.length === 0;

    return {
      questionId: qId,
      questionNumber: q.orderIndex || index + 1,
      isPublishable,
      reasonCodes
    };
  }

  /**
   * Validates whether an entire Quiz can be set to isPublished = true for student CBT tests.
   */
  public static validateQuiz(quizId: string, questions: any[]): QuizPublishabilityResult {
    const details: QuestionPublishabilityResult[] = [];
    let readyCount = 0;
    let blockedCount = 0;

    questions.forEach((q, idx) => {
      const res = this.validateQuestion(q, idx);
      details.push(res);
      if (res.isPublishable) {
        readyCount++;
      } else {
        blockedCount++;
      }
    });

    const isPublishable = questions.length > 0 && blockedCount === 0;

    return {
      quizId,
      isPublishable,
      totalQuestions: questions.length,
      readyQuestions: readyCount,
      blockedQuestions: blockedCount,
      details
    };
  }
}
