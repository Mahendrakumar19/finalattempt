import { ExtractedQnA, QnaConfidenceScore } from '../core/ExtractedQnA';

export class ConfidenceEngine {
  /**
   * Calculates evidence-based multi-level confidence score and structural validation
   */
  static calculateConfidence(qna: Partial<ExtractedQnA>): QnaConfidenceScore {
    const qVersion = qna.question?.versions?.[0];
    const questionText = qVersion?.text?.trim() || '';
    const questionConf = questionText.length > 0 ? (qVersion?.confidence || 0.95) : 0.0;

    // Option confidence: evaluated based on option count, text presence & marker quality
    const options = qna.options || [];
    const optCount = options.length;
    const hasEmptyOption = options.some(opt => !opt.versions || !opt.versions[0] || !opt.versions[0].text.trim());

    let optionConf = 0.0;
    if (!hasEmptyOption && optCount >= 4) optionConf = 0.95;
    else if (!hasEmptyOption && optCount >= 2) optionConf = 0.8;
    else if (optCount === 1) optionConf = 0.4;
    else optionConf = 0.0; // empty options => 0.0

    // Matching Question Validation: Check if table row text leaked into options
    if (qna.questionType === 'MATCHING' && qna.question?.matching) {
      const leftTexts = qna.question.matching.leftList.flatMap(l => l.versions.map(v => v.text.toLowerCase()));
      const leakedInOptions = options.some(opt =>
        leftTexts.some(lt => lt.length > 3 && opt.versions.some(v => v.text.toLowerCase().includes(lt)))
      );

      if (leakedInOptions) {
        optionConf = 0.2; // Structural penalty
      }
    }

    // Answer confidence: evaluated based on answer values & conflicts
    let answerConf = 0.0;
    const hasAnswer = qna.answer?.values && qna.answer.values.length > 0 && Boolean(qna.answer.values[0]);
    if (hasAnswer) {
      answerConf = qna.answer!.hasConflict ? 0.4 : (qna.answer!.confidence || 0.95);
    } else {
      answerConf = 0.0;
    }

    // Explanation confidence
    const expVersion = qna.explanation?.versions?.[0];
    const explanationConf = expVersion && expVersion.text.trim() ? (expVersion.confidence || 0.9) : 0.0;

    // Bilingual alignment confidence: NULL for single-language documents!
    const versionsCount = qna.question?.versions?.length || 0;
    const bilingualAlignmentConf = versionsCount >= 2 ? 0.95 : (null as unknown as number);

    // Overall weighted calculation
    let overall = (questionConf * 0.40) + (optionConf * 0.40) + (answerConf * 0.20);
    if (versionsCount >= 2 && bilingualAlignmentConf) {
      overall = (overall * 0.9) + (bilingualAlignmentConf * 0.1);
    }

    // Apply penalty for answer conflicts or option leakage
    if (qna.answer?.hasConflict) overall -= 0.25;
    if (optCount < 2 || hasEmptyOption) overall -= 0.20;
    if (!hasAnswer) overall -= 0.15;

    overall = Math.max(0.0, Math.min(1.0, Number(overall.toFixed(2))));

    // Determine strict validationStatus
    let status: 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'ERROR' = 'PASS';
    const warnings: string[] = qna.validation?.warnings || [];

    if (!questionText) {
      status = 'ERROR';
    } else if (!hasAnswer || optCount < 2 || hasEmptyOption || qna.questionType === 'UNKNOWN' || qna.answer?.hasConflict) {
      status = 'REVIEW_REQUIRED';
      if (!hasAnswer && !warnings.includes('Missing answer key')) warnings.push('Missing answer key');
      if ((optCount < 2 || hasEmptyOption) && !warnings.includes('Missing or empty options')) warnings.push('Missing or empty options');
      if (qna.questionType === 'UNKNOWN' && !warnings.includes('Unknown question type')) warnings.push('Unknown question type');
    } else if (overall < 0.75) {
      status = 'WARNING';
    }

    if (qna.validation) {
      qna.validation.status = status;
      qna.validation.warnings = Array.from(new Set(warnings));
    }

    return {
      question: Number(questionConf.toFixed(2)),
      options: Number(optionConf.toFixed(2)),
      answer: Number(answerConf.toFixed(2)),
      explanation: Number(explanationConf.toFixed(2)),
      bilingualAlignment: bilingualAlignmentConf !== null ? Number(bilingualAlignmentConf.toFixed(2)) : (null as unknown as number),
      overall
    };
  }
}
