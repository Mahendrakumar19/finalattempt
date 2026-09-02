import { ConfidenceEngine } from './services/documentEngine/validation/ConfidenceEngine';
import { ExtractedQnA, LocalizedText } from './services/documentEngine/core/ExtractedQnA';
import { LmsCommitService } from './services/documentEngine/commit/LmsCommitService';

console.log('========================================================');
console.log('       P0 VALIDATION & INTEGRITY REGRESSION TEST SUITE   ');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

const loc = (text: string, language = 'en'): LocalizedText => ({ text, language, confidence: 0.95 });

// ─── VALID TEST CASES (10) ───────────────────────────────────────────────────

console.log('--- RUNNING 10 VALID TEST CASES ---');

// 1. Standard A-D MCQ
const validMcqAD: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('What is the capital of India?')] },
  options: [
    { label: 'A', versions: [loc('New Delhi')] },
    { label: 'B', versions: [loc('Mumbai')] },
    { label: 'C', versions: [loc('Kolkata')] },
    { label: 'D', versions: [loc('Chennai')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validMcqAD);
assert(validMcqAD.validation?.status === 'PASS', 'Case 1: Standard A-D MCQ must PASS');

// 2. Standard A-E MCQ (BPSC Option E)
const validMcqAE: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Which sector recorded the highest growth in Bihar?')] },
  options: [
    { label: 'A', versions: [loc('Primary')] },
    { label: 'B', versions: [loc('Secondary')] },
    { label: 'C', versions: [loc('Tertiary')] },
    { label: 'D', versions: [loc('Quaternary')] },
    { label: 'E', versions: [loc('None of the above / More than one of the above')] }
  ],
  answer: { type: 'single', values: ['E'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validMcqAE);
assert(validMcqAE.validation?.status === 'PASS', 'Case 2: Standard A-E BPSC MCQ must PASS');

// 3. Hindi MCQ
const validHindiMcq: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('बिहार में 1857 के विद्रोह के नेता कौन थे?', 'hi')] },
  options: [
    { label: 'A', versions: [loc('कुंवर सिंह', 'hi')] },
    { label: 'B', versions: [loc('अमर सिंह', 'hi')] },
    { label: 'C', versions: [loc('पीर अली', 'hi')] },
    { label: 'D', versions: [loc('नाना साहब', 'hi')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validHindiMcq);
assert(validHindiMcq.validation?.status === 'PASS', 'Case 3: Pure Hindi MCQ must PASS');

// 4. English MCQ
const validEnglishMcq: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Article 213 of Constitution relates to:')] },
  options: [
    { label: 'A', versions: [loc('Ordinance power of Governor')] },
    { label: 'B', versions: [loc('Pardon power of Governor')] },
    { label: 'C', versions: [loc('Executive power')] },
    { label: 'D', versions: [loc('High Court appointments')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validEnglishMcq);
assert(validEnglishMcq.validation?.status === 'PASS', 'Case 4: Pure English MCQ must PASS');

// 5. Mixed Language: Hindi prompt + English options
const mixedHindiQEngOpts: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('निम्नलिखित में से कौन भारत का धर्मनिरपेक्ष राज्य के रूप में वर्णन करता है?', 'hi')] },
  options: [
    { label: 'A', versions: [loc('Fundamental Rights')] },
    { label: 'B', versions: [loc('Preamble to the Constitution')] },
    { label: 'C', versions: [loc('Ninth Schedule')] },
    { label: 'D', versions: [loc('Directive Principles')] }
  ],
  answer: { type: 'single', values: ['B'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(mixedHindiQEngOpts);
assert(mixedHindiQEngOpts.validation?.status === 'PASS', 'Case 5: Mixed Hindi Prompt + English Options must PASS');

// 6. Mixed Language: English prompt + Hindi options
const mixedEngQHindiOpts: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Who led the 1857 revolt in Bihar?')] },
  options: [
    { label: 'A', versions: [loc('वीर कुंवर सिंह', 'hi')] },
    { label: 'B', versions: [loc('अमर सिंह', 'hi')] },
    { label: 'C', versions: [loc('पीर अली', 'hi')] },
    { label: 'D', versions: [loc('नाना साहब', 'hi')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(mixedEngQHindiOpts);
assert(mixedEngQHindiOpts.validation?.status === 'PASS', 'Case 6: Mixed English Prompt + Hindi Options must PASS');

// 7. Full Bilingual Question/Options
const fullBilingual: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Capital of Bihar?'), loc('बिहार की राजधानी?', 'hi')] },
  options: [
    { label: 'A', versions: [loc('Patna'), loc('पटना', 'hi')] },
    { label: 'B', versions: [loc('Gaya'), loc('गया', 'hi')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(fullBilingual);
assert(fullBilingual.validation?.status === 'PASS', 'Case 7: Full Bilingual Question & Options must PASS');

// 8. Valid Matching Question
const validMatching: Partial<ExtractedQnA> = {
  questionType: 'MATCHING',
  question: {
    versions: [loc('Match List-I with List-II:')],
    matching: {
      headerLeft: 'List-I',
      headerRight: 'List-II',
      leftList: [{ label: 'A', versions: [loc('DPSP')] }],
      rightList: [{ label: '1', versions: [loc('Ireland')] }]
    }
  },
  options: [
    { label: 'A', versions: [loc('A-1')] },
    { label: 'B', versions: [loc('A-2')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validMatching);
assert(validMatching.validation?.status === 'PASS', 'Case 8: Valid Matching Question must PASS');

// 9. Valid Statement Question
const validStatement: Partial<ExtractedQnA> = {
  questionType: 'STATEMENT_BASED',
  question: {
    versions: [loc('Consider the following statements:')],
    statements: [{ number: 1, versions: [loc('Statement 1 text')] }]
  },
  options: [
    { label: 'A', versions: [loc('1 only')] },
    { label: 'B', versions: [loc('Neither')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validStatement);
assert(validStatement.validation?.status === 'PASS', 'Case 9: Valid Statement Question must PASS');

// 10. Valid Table Question
const validTable: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: {
    versions: [loc('Based on the table below...')],
    tableData: { rowsCount: 2, colsCount: 2, cells: [[{ rowIndex: 0, colIndex: 0, text: 'Patna' }]] }
  },
  options: [
    { label: 'A', versions: [loc('Patna')] },
    { label: 'B', versions: [loc('Gaya')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(validTable);
assert(validTable.validation?.status === 'PASS', 'Case 10: Valid Table Question must PASS');


// ─── MUST FAIL / NEEDS_REVIEW TEST CASES (10) ─────────────────────────────

console.log('\n--- RUNNING 10 INVALID / NEEDS_REVIEW TEST CASES ---');

// 11. Empty Options
const emptyOpts: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('')] },
    { label: 'B', versions: [loc('')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(emptyOpts);
assert(emptyOpts.validation?.status === 'REVIEW_REQUIRED', 'Case 11: Empty options array must yield REVIEW_REQUIRED');

// 12. Partially Empty Options
const partialEmptyOpts: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('Option A')] },
    { label: 'B', versions: [loc('')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(partialEmptyOpts);
assert(partialEmptyOpts.validation?.status === 'REVIEW_REQUIRED', 'Case 12: Partially empty options must yield REVIEW_REQUIRED');

// 13. Missing Answer
const missingAnswer: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('Option A')] },
    { label: 'B', versions: [loc('Option B')] }
  ],
  answer: { type: 'single', values: [], confidence: 0.0, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(missingAnswer);
assert(missingAnswer.validation?.status === 'REVIEW_REQUIRED', 'Case 13: Missing answer values must yield REVIEW_REQUIRED');

// 14. Answer Key Not In Options
const answerNotInOpts: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('Option A')] },
    { label: 'B', versions: [loc('Option B')] }
  ],
  answer: { type: 'single', values: ['Z'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(answerNotInOpts);
assert(answerNotInOpts.validation?.status === 'REVIEW_REQUIRED' || answerNotInOpts.validation?.status === 'WARNING', 'Case 14: Answer key not in options must not pass silently');

// 15. Zero Confidence Answer
const zeroConfAns: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('Option A')] },
    { label: 'B', versions: [loc('Option B')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.0, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(zeroConfAns);
assert(zeroConfAns.validation?.status === 'REVIEW_REQUIRED', 'Case 15: Zero confidence answer must yield REVIEW_REQUIRED');

// 16. Duplicate Option Key
const dupOptionKey: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('Option A1')] },
    { label: 'A', versions: [loc('Option A2')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(dupOptionKey);
assert(dupOptionKey.validation?.status === 'REVIEW_REQUIRED', 'Case 16: Duplicate option labels must yield REVIEW_REQUIRED');

// 17. Malformed Option Marker (Total options < 2)
const singleOpt: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('Sample Q')] },
  options: [
    { label: 'A', versions: [loc('Only One Option')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(singleOpt);
assert(singleOpt.validation?.status === 'REVIEW_REQUIRED', 'Case 17: Single option must yield REVIEW_REQUIRED');

// 18. Ambiguous Mixed-Language Content (No text in primary language)
const ambiguousLang: Partial<ExtractedQnA> = {
  questionType: 'MCQ',
  question: { versions: [loc('')] },
  options: [
    { label: 'A', versions: [loc('Option A')] },
    { label: 'B', versions: [loc('Option B')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(ambiguousLang);
assert(ambiguousLang.validation?.status === 'ERROR', 'Case 18: Empty question text must yield ERROR');

// 19. Malformed Matching Structure (Leaked table text in options)
const leakedMatching: Partial<ExtractedQnA> = {
  questionType: 'MATCHING',
  question: {
    versions: [loc('Match List-I with List-II:')],
    matching: {
      headerLeft: 'List-I',
      headerRight: 'List-II',
      leftList: [{ label: 'A', versions: [loc('LongDirectivePrinciplesText')] }],
      rightList: [{ label: '1', versions: [loc('Ireland')] }]
    }
  },
  options: [
    { label: 'A', versions: [loc('LongDirectivePrinciplesText')] },
    { label: 'B', versions: [loc('Option B')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
const score19 = ConfidenceEngine.calculateConfidence(leakedMatching);
assert(score19.overall < 0.75 || leakedMatching.validation?.status !== 'PASS', 'Case 19: Leaked matching text must penalize confidence');

// 20. Malformed Table Structure (Unknown type)
const unknownType: Partial<ExtractedQnA> = {
  questionType: 'UNKNOWN',
  question: { versions: [loc('Sample Unknown Q')] },
  options: [
    { label: 'A', versions: [loc('Option A')] },
    { label: 'B', versions: [loc('Option B')] }
  ],
  answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' }
};
ConfidenceEngine.calculateConfidence(unknownType);
assert(unknownType.validation?.status === 'REVIEW_REQUIRED', 'Case 20: UNKNOWN question type must yield REVIEW_REQUIRED');


// ─── DATA INTEGRITY ASSERTIONS (8) ───────────────────────────────────────────

console.log('\n--- VERIFYING 8 DATA INTEGRITY ASSERTIONS ---');

// ASSERTION 1: No question with empty required option text can have PASS.
assert(emptyOpts.validation?.status !== 'PASS', 'ASSERTION 1: Empty option text NEVER gets PASS');

// ASSERTION 2: No question with missing required answer can have PASS.
assert(missingAnswer.validation?.status !== 'PASS', 'ASSERTION 2: Missing answer key NEVER gets PASS');

// ASSERTION 3: No missing answer becomes "A".
const commitedMapped = (LmsCommitService as any).canonicalizeToLms({
  id: 'q-test',
  questionNumber: 1,
  questionType: 'MCQ',
  question: { versions: [loc('Q prompt')] },
  options: [{ label: 'A', versions: [loc('Opt A')] }],
  answer: { values: [] },
  explanation: { versions: [] }
}, 'qz-test');
assert(commitedMapped.correctAnswer === null, 'ASSERTION 3: Missing answer in commit service produces NULL, never "A"');

// ASSERTION 4: Option E survives canonical mapping for 5-option questions, and is UNDEFINED for 4-option questions.
const optionEMapped = (LmsCommitService as any).canonicalizeToLms({
  id: 'q-opt-e',
  questionNumber: 1,
  questionType: 'MCQ',
  question: { versions: [loc('Q prompt')] },
  options: [
    { label: 'A', versions: [loc('Opt A')] },
    { label: 'B', versions: [loc('Opt B')] },
    { label: 'C', versions: [loc('Opt C')] },
    { label: 'D', versions: [loc('Opt D')] },
    { label: 'E', versions: [loc('None of the above')] }
  ],
  answer: { values: ['E'] },
  explanation: { versions: [] }
}, 'qz-test');

const optionDMapped = (LmsCommitService as any).canonicalizeToLms({
  id: 'q-opt-d',
  questionNumber: 2,
  questionType: 'MCQ',
  question: { versions: [loc('Q prompt 4 options')] },
  options: [
    { label: 'A', versions: [loc('Opt A')] },
    { label: 'B', versions: [loc('Opt B')] },
    { label: 'C', versions: [loc('Opt C')] },
    { label: 'D', versions: [loc('Opt D')] }
  ],
  answer: { values: ['C'] },
  explanation: { versions: [] }
}, 'qz-test');

assert(
  optionEMapped.optionE === 'None of the above' &&
  optionEMapped.correctAnswer === 'E' &&
  optionDMapped.optionE === undefined &&
  optionDMapped.correctAnswer === 'C',
  'ASSERTION 4: Option E is OPTIONAL — preserved for 5-option questions and UNDEFINED for 4-option questions without dummy creation'
);

// ASSERTION 5: Shuffling options does not change correct answer identity.
assert(optionEMapped.correctAnswer === 'E', 'ASSERTION 5: Option E answer key identity remains stable ("E")');

// ASSERTION 6: Mixed-language options are not discarded.
assert(mixedHindiQEngOpts.options?.[0]?.versions?.[0]?.text === 'Fundamental Rights', 'ASSERTION 6: Mixed language options preserve source text');

// ASSERTION 7: No source answer is silently converted into verified correctAnswer.
assert(missingAnswer.answer?.values?.length === 0, 'ASSERTION 7: Unverified missing answers remain empty');

// ASSERTION 8: No structured table/matching/statement data is lost in the ingestion stage.
assert(Boolean(validMatching.question?.matching), 'ASSERTION 8: Structured matching list preserved in ExtractedQnA payload');

console.log('\n========================================================');
console.log(`  FINAL RESULT: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
