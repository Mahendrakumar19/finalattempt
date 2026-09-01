import * as XLSX from 'xlsx';
import { ExcelQuestionBankAdapter, CANONICAL_EXCEL_COLUMNS } from './services/excelEngine/ExcelQuestionBankAdapter';
import { StagingService } from './services/documentEngine/staging/StagingService';
import { LmsCommitService } from './services/documentEngine/commit/LmsCommitService';
import { getLocalStore } from './db';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runExcelImportTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING EXCEL QUESTION BANK IMPORT TEST SUITE');
  console.log('====================================================\n');

  // Test 1 & 2 & 3: Template Creation & Worksheet Loading
  console.log('Test 1-4: Template Generation, Sheet Selection & Schema Validation');
  const templateBuf = ExcelQuestionBankAdapter.createTemplateBuffer();
  assert(templateBuf && templateBuf.length > 0, 'Workbook loads from buffer');

  const report1 = ExcelQuestionBankAdapter.parseBuffer(templateBuf, 'Question_Bank_Import_Template.xlsx');
  assert(report1.isValid, 'Golden template workbook parses as valid');
  assert(report1.sheetName === 'Question Bank', 'Prefers "Question Bank" worksheet');
  assert(report1.totalRows === 1, 'Instructions sheet was ignored, exactly 1 sample row parsed');
  assert(report1.qnas.length === 1, 'One row produces one question record');

  const q1 = report1.qnas[0];
  assert(q1.question.versions.find(v => v.language === 'en')?.text.includes('Government of India Act, 1935') === true, 'English question text mapped correctly');
  assert(q1.question.versions.find(v => v.language === 'hi')?.text.includes('1935') === true, 'Unicode Devanagari Hindi text preserved');
  assert(q1.options.length >= 4, 'Options A-D mapped correctly');
  assert(q1.answer.values[0] === 'A', 'correctAnswer A mapped correctly');
  assert((q1 as any).marks === 1, 'marks 1.0 mapped correctly');
  assert((q1 as any).negativeMarks === 0.33, 'negativeMarks 0.33 mapped correctly');
  assert((q1 as any).sourceType === 'EXCEL', 'sourceType set to EXCEL');
  assert((q1 as any).ocrConfidence === 'NOT_APPLICABLE', 'ocrConfidence set to NOT_APPLICABLE (No OCR invoked)');
  assert(report1.documentLanguage === 'BILINGUAL', 'Bilingual template detected documentLanguage = BILINGUAL');

  // Test 5: Strict Header Validation - Missing Column
  console.log('\nTest 5: Header Validation - Missing Column');
  const badwb1 = XLSX.utils.book_new();
  const badHeaders1 = CANONICAL_EXCEL_COLUMNS.filter(c => c !== 'questionText');
  const badSheet1 = XLSX.utils.aoa_to_sheet([badHeaders1]);
  XLSX.utils.book_append_sheet(badwb1, badSheet1, 'Question Bank');
  const badBuf1 = XLSX.write(badwb1, { type: 'buffer', bookType: 'xlsx' });
  const badReport1 = ExcelQuestionBankAdapter.parseBuffer(badBuf1, 'missing_header.xlsx');
  assert(!badReport1.isValid, 'Rejects workbook with missing required header');
  assert(badReport1.errors.some(e => e.includes('Missing column: questionText')), 'Reports exact missing column name error');

  // Test 6: Strict Header Validation - Unsupported Column
  console.log('\nTest 6: Header Validation - Unsupported Column');
  const badwb2 = XLSX.utils.book_new();
  const badHeaders2 = [...CANONICAL_EXCEL_COLUMNS, 'unsupportedColumnXyz'];
  const badSheet2 = XLSX.utils.aoa_to_sheet([badHeaders2]);
  XLSX.utils.book_append_sheet(badwb2, badSheet2, 'Question Bank');
  const badBuf2 = XLSX.write(badwb2, { type: 'buffer', bookType: 'xlsx' });
  const badReport2 = ExcelQuestionBankAdapter.parseBuffer(badBuf2, 'unsupported_header.xlsx');
  assert(!badReport2.isValid, 'Rejects workbook with unsupported column');
  assert(badReport2.errors.some(e => e.includes('Unsupported column: unsupportedColumnXyz')), 'Reports exact unsupported column name error');

  // Test 7: Multi-row Row Order Preservation & Empty Row Handling
  console.log('\nTest 7: 1 Row = 1 Question, Row Order & Empty Rows');
  const multiWb = XLSX.utils.book_new();
  const multiRows = [
    Array.from(CANONICAL_EXCEL_COLUMNS),
    ['Question Row 2', 'A1', 'B1', 'C1', 'D1', '', 'A', 'Exp 1', '', '', '', '', '', '', '', 1, 0.33],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''], // Completely empty row (Rule #19)
    ['Question Row 4', 'A2', 'B2', 'C2', 'D2', 'E2', 'E', 'Exp 2', 'प्रश्न 4', 'क', 'ख', 'ग', 'घ', 'ङ', 'व्याख्या 4', 2, 0.5]
  ];
  const multiSheet = XLSX.utils.aoa_to_sheet(multiRows);
  XLSX.utils.book_append_sheet(multiWb, multiSheet, 'Question Bank');
  const multiBuf = XLSX.write(multiWb, { type: 'buffer', bookType: 'xlsx' });
  const multiReport = ExcelQuestionBankAdapter.parseBuffer(multiBuf, 'multi_test.xlsx');
  
  assert(multiReport.isValid, 'Multi-row workbook is valid');
  assert(multiReport.totalRows === 2, 'Completely empty row (Row 3) was ignored, exactly 2 questions parsed');
  assert(multiReport.qnas[0].questionNumber === 1, 'First question has orderIndex/questionNumber 1');
  assert(multiReport.qnas[1].questionNumber === 2, 'Second question has orderIndex/questionNumber 2');
  assert((multiReport.qnas[0] as any).sourceRow === 2, 'First question records sourceRow = 2');
  assert((multiReport.qnas[1] as any).sourceRow === 4, 'Second question records sourceRow = 4 (preserving Excel row number)');
  assert(multiReport.qnas[1].answer.values[0] === 'E', 'Option E answer mapped correctly when Option E is present');

  // Test 8: Invalid Answer Rejection & Answer E without Option E
  console.log('\nTest 8: Invalid Answer & Option E Cross Validation');
  const badAnsWb = XLSX.utils.book_new();
  const badAnsRows = [
    Array.from(CANONICAL_EXCEL_COLUMNS),
    ['Q Bad Answer', 'A', 'B', 'C', 'D', '', 'F', '', '', '', '', '', '', '', '', 1, 0.33], // Invalid answer 'F'
    ['Q Answer E Missing Option E', 'A', 'B', 'C', 'D', '', 'E', '', '', '', '', '', '', '', '', 1, 0.33] // Answer E but no Option E
  ];
  const badAnsSheet = XLSX.utils.aoa_to_sheet(badAnsRows);
  XLSX.utils.book_append_sheet(badAnsWb, badAnsSheet, 'Question Bank');
  const badAnsBuf = XLSX.write(badAnsWb, { type: 'buffer', bookType: 'xlsx' });
  const badAnsReport = ExcelQuestionBankAdapter.parseBuffer(badAnsBuf, 'bad_answers.xlsx');

  assert(badAnsReport.errorRows === 2, 'Both invalid answer rows were flagged as ERROR');
  assert(badAnsReport.rowResults[0].issues.some(i => i.includes('correctAnswer must be A, B, C, D, or E')), 'Rejects invalid answer F');
  assert(badAnsReport.rowResults[1].issues.some(i => i.includes('Option E is missing but correctAnswer is set to E')), 'Rejects correctAnswer = E when option E is missing');

  // Test 9: Database & Staging & LMS Commit Integration Test
  console.log('\nTest 9: Full Pipeline Integration (Excel -> StagingService -> LmsCommitService)');
  const importRecord = await StagingService.createImport({
    adminId: 'test-admin',
    filename: 'multi_test.xlsx',
    sourceType: 'EXCEL',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: multiBuf.length
  });

  assert(importRecord && importRecord.id.startsWith('imp-'), 'Created Staging Import record');

  const stagedQnas = await StagingService.saveStagedQnas(importRecord.id, multiReport.qnas);
  assert(stagedQnas.length === 2, 'Staged 2 QnAs successfully in StagingService');

  const commitResult = await LmsCommitService.commitImport(importRecord.id, {
    quizTitle: 'Excel Integration Test Quiz Paper',
    autoApprovePass: true,
    isFree: true
  });

  assert(commitResult.success, 'LmsCommitService committed Excel questions cleanly');
  assert(commitResult.totalCommitted === 2, 'Committed exactly 2 questions into LMS Quiz');

  const store = getLocalStore();
  const committedQuiz = store.lmsQuizzes?.find(q => q.id === commitResult.quizId);
  assert(committedQuiz !== undefined, 'LMS Quiz master record created');
  
  const committedQuestions = store.lmsQuestions?.filter(q => q.quizId === commitResult.quizId) || [];
  assert(committedQuestions.length === 2, 'LMS Questions created with exact canonical fields');
  assert(committedQuestions[0].questionText === 'Question Row 2', 'English question text preserved in LMS');
  assert(committedQuestions[1].questionTextHi === 'प्रश्न 4', 'Hindi Devanagari text preserved in LMS');

  console.log('\n====================================================');
  console.log('🎉 ALL EXCEL QUESTION IMPORT TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runExcelImportTestSuite().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
