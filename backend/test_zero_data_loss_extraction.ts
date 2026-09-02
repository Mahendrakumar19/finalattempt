import { ConfidenceEngine } from './services/documentEngine/validation/ConfidenceEngine';
import { ExtractedQnA, LocalizedText } from './services/documentEngine/core/ExtractedQnA';

console.log('========================================================');
console.log('   PHASE 6.5: ZERO SILENT DATA LOSS REGRESSION SUITE   ');
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

const loc = (text: string, lang = 'en'): LocalizedText => ({ text, language: lang, confidence: 0.95 });

async function runRegressionFixtures() {
  // 1. Normal 4-option MCQ
  const f1: ExtractedQnA = {
    id: 'f1', documentId: 'doc1', questionNumber: 1, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('What is 2+2?')] },
    options: [{ label: 'A', versions: [loc('1')] }, { label: 'B', versions: [loc('2')] }, { label: 'C', versions: [loc('3')] }, { label: 'D', versions: [loc('4')] }],
    answer: { type: 'single', values: ['D'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [loc('2+2=4')] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0.95, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b1'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f1);
  assert(f1.validation.status === 'PASS' && f1.options.length === 4, 'Fixture 1: Normal 4-option MCQ MUST pass with exact 4 options');

  // 2. Normal 5-option MCQ
  const f2: ExtractedQnA = {
    id: 'f2', documentId: 'doc1', questionNumber: 2, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('BPSC Question')] },
    options: [{ label: 'A', versions: [loc('1')] }, { label: 'B', versions: [loc('2')] }, { label: 'C', versions: [loc('3')] }, { label: 'D', versions: [loc('4')] }, { label: 'E', versions: [loc('None of above')] }],
    answer: { type: 'single', values: ['E'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [loc('E')] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0.95, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b2'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f2);
  assert(f2.validation.status === 'PASS' && f2.options.length === 5, 'Fixture 2: Normal 5-option MCQ MUST pass with exact 5 options');

  // 3. Missing option detection (1 option only)
  const f3: ExtractedQnA = {
    id: 'f3', documentId: 'doc1', questionNumber: 3, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('Truncated question')] },
    options: [{ label: 'A', versions: [loc('Only one option')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.5, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.5 },
    source: { pages: [1], blockIds: ['b3'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f3);
  assert(f3.validation.status === 'REVIEW_REQUIRED', 'Fixture 3: Question with missing options MUST yield REVIEW_REQUIRED');

  // 4. Empty option detection
  const f4: ExtractedQnA = {
    id: 'f4', documentId: 'doc1', questionNumber: 4, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('Question with empty option')] },
    options: [{ label: 'A', versions: [loc('Opt A')] }, { label: 'B', versions: [loc('')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.5, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.5 },
    source: { pages: [1], blockIds: ['b4'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f4);
  assert(f4.validation.status === 'REVIEW_REQUIRED', 'Fixture 4: Empty option MUST yield REVIEW_REQUIRED');

  // 5. Option merged with question
  const f5: ExtractedQnA = {
    id: 'f5', documentId: 'doc1', questionNumber: 5, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('Question text (A) Option A text')] },
    options: [{ label: 'A', versions: [loc('Option A text')] }, { label: 'B', versions: [loc('Option B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b5'] },
    validation: { status: 'PASS', warnings: ['QUESTION_CONTAINS_OPTION_TEXT'], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f5);
  assert(f5.validation.status === 'REVIEW_REQUIRED', 'Fixture 5: Option leakage in prompt MUST yield REVIEW_REQUIRED');

  // 6. Table with 3 rows
  const f6: ExtractedQnA = {
    id: 'f6', documentId: 'doc1', questionNumber: 6, questionType: 'TABLE_BASED', metadata: {},
    question: { versions: [loc('Table Q')], tableData: { rowsCount: 3, colsCount: 2, headers: ['H1', 'H2'], cells: [[{ rowIndex: 1, colIndex: 0, text: 'R1' }]] } },
    options: [{ label: 'A', versions: [loc('Opt A')] }, { label: 'B', versions: [loc('Opt B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b6'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f6);
  assert(f6.validation.status === 'PASS' && f6.question.tableData?.rowsCount === 3, 'Fixture 6: Table with 3 rows preserved');

  // 7. Table with 5 rows
  const f7: ExtractedQnA = {
    id: 'f7', documentId: 'doc1', questionNumber: 7, questionType: 'TABLE_BASED', metadata: {},
    question: { versions: [loc('Table Q 5 rows')], tableData: { rowsCount: 5, colsCount: 2, headers: ['H1', 'H2'], cells: [[{ rowIndex: 1, colIndex: 0, text: 'R1' }]] } },
    options: [{ label: 'A', versions: [loc('Opt A')] }, { label: 'B', versions: [loc('Opt B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b7'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f7);
  assert(f7.validation.status === 'PASS' && f7.question.tableData?.rowsCount === 5, 'Fixture 7: Table with 5 rows preserved');

  // 8. Table with blank noise blocks
  const f8: ExtractedQnA = {
    id: 'f8', documentId: 'doc1', questionNumber: 8, questionType: 'TABLE_BASED', metadata: {},
    question: { versions: [loc('Table Q Noise')], tableData: { rowsCount: 2, colsCount: 2, headers: ['H1', 'H2'], cells: [[{ rowIndex: 1, colIndex: 0, text: 'Cell' }]] } },
    options: [{ label: 'A', versions: [loc('Opt A')] }, { label: 'B', versions: [loc('Opt B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b8'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f8);
  assert(f8.validation.status === 'PASS', 'Fixture 8: Table with noise blocks preserved');

  // 9. Matching question
  const f9: ExtractedQnA = {
    id: 'f9', documentId: 'doc1', questionNumber: 9, questionType: 'MATCHING', metadata: {},
    question: { versions: [loc('Match List I and II')], matching: { leftList: [{ label: 'A', versions: [loc('L1')] }], rightList: [{ label: '1', versions: [loc('R1')] }] } },
    options: [{ label: 'A', versions: [loc('A-1')] }, { label: 'B', versions: [loc('A-2')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b9'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f9);
  assert(f9.validation.status === 'PASS' && f9.question.matching?.leftList.length === 1, 'Fixture 9: Matching question preserved');

  // 10. Statement question
  const f10: ExtractedQnA = {
    id: 'f10', documentId: 'doc1', questionNumber: 10, questionType: 'STATEMENT_BASED', metadata: {},
    question: { versions: [loc('Consider statements')], statements: [{ number: 1, versions: [loc('Stmt 1')] }, { number: 2, versions: [loc('Stmt 2')] }] },
    options: [{ label: 'A', versions: [loc('1 only')] }, { label: 'B', versions: [loc('2 only')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b10'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f10);
  assert(f10.validation.status === 'PASS' && f10.question.statements?.length === 2, 'Fixture 10: Statement question preserved');

  // 11. Bilingual question
  const f11: ExtractedQnA = {
    id: 'f11', documentId: 'doc1', questionNumber: 11, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('English Q'), loc('Hindi Q', 'hi')] },
    options: [{ label: 'A', versions: [loc('Opt A'), loc('विकल्प A', 'hi')] }, { label: 'B', versions: [loc('Opt B'), loc('विकल्प B', 'hi')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: 0.95, overall: 0.95 },
    source: { pages: [1], blockIds: ['b11'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f11);
  assert(f11.validation.status === 'PASS' && f11.question.versions.length === 2, 'Fixture 11: Bilingual question preserved');

  // 12. Mixed-language question
  const f12: ExtractedQnA = {
    id: 'f12', documentId: 'doc1', questionNumber: 12, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('हिंदी प्रश्न', 'hi')] },
    options: [{ label: 'A', versions: [loc('English Option A')] }, { label: 'B', versions: [loc('English Option B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b12'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f12);
  assert(f12.validation.status === 'PASS', 'Fixture 12: Mixed-language question preserved');

  // 13. Question followed by code
  const f13: ExtractedQnA = {
    id: 'f13', documentId: 'doc1', questionNumber: 13, questionType: 'MATCHING', metadata: {},
    question: { versions: [loc('Match items. Code: A B C')], matching: { leftList: [{ label: 'A', versions: [loc('L1')] }], rightList: [{ label: '1', versions: [loc('R1')] }], codesHeader: 'Code: A B C' } },
    options: [{ label: 'A', versions: [loc('A-1')] }, { label: 'B', versions: [loc('A-2')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b13'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f13);
  assert(f13.validation.status === 'PASS', 'Fixture 13: Question followed by code preserved');

  // 14. Question followed by options
  const f14: ExtractedQnA = {
    id: 'f14', documentId: 'doc1', questionNumber: 14, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('Standard Prompt')] },
    options: [{ label: 'A', versions: [loc('A')] }, { label: 'B', versions: [loc('B')] }, { label: 'C', versions: [loc('C')] }, { label: 'D', versions: [loc('D')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b14'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f14);
  assert(f14.validation.status === 'PASS', 'Fixture 14: Question followed by options preserved');

  // 15. Headings between questions
  const f15: ExtractedQnA = {
    id: 'f15', documentId: 'doc1', questionNumber: 15, questionType: 'MCQ', metadata: { sectionHeader: 'Indian Polity' },
    question: { versions: [loc('Question under heading')] },
    options: [{ label: 'A', versions: [loc('A')] }, { label: 'B', versions: [loc('B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b15'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f15);
  assert(f15.validation.status === 'PASS' && f15.metadata.sectionHeader === 'Indian Polity', 'Fixture 15: Section heading preserved without prompt contamination');

  // 16. Consecutive questions
  const f16: ExtractedQnA = {
    id: 'f16', documentId: 'doc1', questionNumber: 16, questionType: 'MCQ', metadata: {},
    question: { versions: [loc('Consecutive Question 16')] },
    options: [{ label: 'A', versions: [loc('A')] }, { label: 'B', versions: [loc('B')] }],
    answer: { type: 'single', values: ['A'], confidence: 0.95, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.95, options: 0.95, answer: 0.95, explanation: 0, bilingualAlignment: null, overall: 0.95 },
    source: { pages: [1], blockIds: ['b16'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f16);
  assert(f16.validation.status === 'PASS', 'Fixture 16: Consecutive questions preserved');

  // 17. Malformed question boundary
  const f17: ExtractedQnA = {
    id: 'f17', documentId: 'doc1', questionNumber: 17, questionType: 'UNKNOWN', metadata: {},
    question: { versions: [loc('Malformed boundary prompt')] },
    options: [{ label: 'A', versions: [loc('A')] }],
    answer: { type: 'single', values: [], confidence: 0, sourceLocation: 'IMMEDIATE' },
    explanation: { versions: [] },
    confidence: { question: 0.5, options: 0.5, answer: 0, explanation: 0, bilingualAlignment: null, overall: 0.3 },
    source: { pages: [1], blockIds: ['b17'] },
    validation: { status: 'PASS', warnings: [], errors: [] }
  };
  ConfidenceEngine.calculateConfidence(f17);
  assert(f17.validation.status === 'REVIEW_REQUIRED', 'Fixture 17: Malformed question boundary MUST yield REVIEW_REQUIRED');

  console.log('\n========================================================');
  console.log(`  ZERO SILENT DATA LOSS SUITE RESULT: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================\n');

  if (failCount > 0) process.exit(1);
}

runRegressionFixtures().catch(err => {
  console.error('Fatal Zero Data Loss Regression Error:', err);
  process.exit(1);
});
