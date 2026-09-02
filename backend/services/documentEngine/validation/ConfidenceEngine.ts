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
    
    // An option is considered empty if NONE of its versions have non-empty text
    const hasEmptyOption = options.some(opt => {
      if (!opt.versions || opt.versions.length === 0) return true;
      return !opt.versions.some(v => v.text && v.text.trim().length > 0);
    });

    // Check duplicate option labels
    const optionLabels = options.map(o => (o.label || '').toUpperCase().trim()).filter(Boolean);
    const hasDuplicateLabels = optionLabels.length > 0 && new Set(optionLabels).size !== optionLabels.length;

    let optionConf = 0.0;
    if (!hasEmptyOption && !hasDuplicateLabels && optCount >= 4) optionConf = 0.95;
    else if (!hasEmptyOption && !hasDuplicateLabels && optCount >= 2) optionConf = 0.8;
    else if (optCount === 1) optionConf = 0.4;
    else optionConf = 0.0; // empty or duplicate options => 0.0

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
    const rawAns = qna.answer?.values?.[0];
    const answerInOptions = !rawAns || options.length === 0 || options.some(o => (o.label || '').toUpperCase().trim() === String(rawAns).toUpperCase().trim());
    const hasAnswer = Boolean(rawAns && String(rawAns).trim() !== '' && (qna.answer?.confidence === undefined || qna.answer.confidence > 0) && answerInOptions);
    
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
    if (optCount < 2 || hasEmptyOption || hasDuplicateLabels) overall -= 0.20;
    if (!hasAnswer) overall -= 0.15;

    overall = Math.max(0.0, Math.min(1.0, Number(overall.toFixed(2))));

    // Determine strict validationStatus
    let status: 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'ERROR' = 'PASS';
    const warnings: string[] = qna.validation?.warnings || [];
    const errors: string[] = qna.validation?.errors || [];
    // Specific Question Type Structural Validations
    let structuralIssue = false;
    const qType = qna.questionType || 'MCQ';

    if (['MCQ', 'SINGLE_CHOICE_MCQ', 'MULTI_SELECT', 'MULTIPLE_CHOICE'].includes(qType)) {
      if (optCount < 2) {
        structuralIssue = true;
        if (!warnings.includes('Less than 2 options extracted')) warnings.push('Less than 2 options extracted');
      }
    } else if (qType === 'MATCHING') {
      const match = qna.question?.matching;
      if (!match || !match.leftList || match.leftList.length === 0 || !match.rightList || match.rightList.length === 0) {
        structuralIssue = true;
        if (!warnings.includes('Missing or incomplete matching list pairs')) warnings.push('Missing or incomplete matching list pairs');
      }
    } else if (qType === 'STATEMENT_BASED') {
      const stmts = qna.question?.statements;
      if (!stmts || stmts.length === 0 || stmts.some(s => !s.versions || s.versions.length === 0 || !s.versions.some(v => v.text && v.text.trim()))) {
        structuralIssue = true;
        if (!warnings.includes('Missing or empty statements in statement-based question')) warnings.push('Missing or empty statements in statement-based question');
      }
    } else if (qType === 'ASSERTION_REASON') {
      const ar = qna.question?.assertionReason;
      const metaAr = qna.metadata?.assertionText && qna.metadata?.reasonText;
      if (!ar && !metaAr) {
        structuralIssue = true;
        if (!warnings.includes('Missing assertion or reason text structure')) warnings.push('Missing assertion or reason text structure');
      }
    } else if (qType === 'FILL_IN_THE_BLANK') {
      const blanks = qna.question?.blanks;
      if ((!blanks || blanks.length === 0) && !hasAnswer) {
        structuralIssue = true;
        if (!warnings.includes('Missing blank definition or target answer')) warnings.push('Missing blank definition or target answer');
      }
    }

    if (!questionText) {
      status = 'ERROR';
      errors.push('Empty question prompt text');
    } else if (!hasAnswer || hasEmptyOption || hasDuplicateLabels || qType === 'UNKNOWN' || qna.answer?.hasConflict || structuralIssue || warnings.includes('QUESTION_CONTAINS_OPTION_TEXT')) {
      status = 'REVIEW_REQUIRED';
      if (!hasAnswer && !warnings.includes('Missing or invalid answer key')) warnings.push('Missing or invalid answer key');
      if (!answerInOptions && ['MCQ', 'SINGLE_CHOICE_MCQ', 'MULTI_SELECT', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(qType) && !warnings.includes('Answer key not present in option choices')) {
        warnings.push('Answer key not present in option choices');
      }
      if (hasEmptyOption && !warnings.includes('Missing or empty options')) warnings.push('Missing or empty options');
      if (hasDuplicateLabels && !warnings.includes('Duplicate option labels detected')) warnings.push('Duplicate option labels detected');
      if (qType === 'UNKNOWN' && !warnings.includes('Unknown question type')) warnings.push('Unknown question type');
    } else if (overall < 0.75) {
      status = 'WARNING';
    }

    if (!qna.validation) {
      qna.validation = { status, warnings: Array.from(new Set(warnings)), errors: Array.from(new Set(errors)) };
    } else {
      qna.validation.status = status;
      qna.validation.warnings = Array.from(new Set(warnings));
      qna.validation.errors = Array.from(new Set(errors));
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
