import fs from 'fs';
import path from 'path';
import { AdapterFactory } from './services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';

async function runGoldenRegressionTest() {
  console.log("====================================================");
  console.log("GOLDEN REGRESSION TEST: POLITY ALL PYQ ENG.pdf");
  console.log("====================================================\n");

  let pdfPath = path.join(__dirname, 'POLITY ALL PYQ ENG.pdf');
  if (!fs.existsSync(pdfPath)) {
    pdfPath = path.join(__dirname, '..', 'POLITY ALL PYQ ENG.pdf');
  }
  if (!fs.existsSync(pdfPath)) {
    pdfPath = path.join(__dirname, 'uploads', 'POLITY ALL PYQ ENG.pdf');
  }
  if (!fs.existsSync(pdfPath)) {
    console.error("❌ GOLDEN TEST FAILED: POLITY ALL PYQ ENG.pdf not found in backend or root directory!");
    process.exit(1);
  }

  const buffer = fs.readFileSync(pdfPath);
  const doc = await AdapterFactory.process(buffer, { filename: 'POLITY ALL PYQ ENG.pdf', mimeType: 'application/pdf' });
  const qnas = await QnaExtractor.extractQna(doc);

  console.log(`[1] Total Pages Processed: ${doc.pages.length} / 63`);
  const totalBlocks = doc.pages.reduce((acc, p) => acc + p.blocks.length, 0);
  console.log(`[2] Total Blocks Extracted: ${totalBlocks}`);
  console.log(`[3] Total Logical Questions Extracted: ${qnas.length}`);

  // Assert 1: Entire PDF processed (63 pages)
  if (doc.pages.length < 63) {
    console.error(`❌ ASSERT FAILED: Expected 63 pages, got ${doc.pages.length}`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: Entire 63-page PDF processed cleanly!");
  }

  // Assert 2: Question Range (1 to 324)
  const qNums = qnas.map(q => q.questionNumber).filter(Boolean);
  const maxQ = Math.max(...qNums);
  console.log(`[4] Question Number Range: 1 to ${maxQ}`);

  if (maxQ < 320) {
    console.error(`❌ ASSERT FAILED: Question numbers stopped early at ${maxQ}!`);
    process.exit(1);
  } else {
    console.log(`✓ ASSERT PASS: Questions after Q190 are present (Max Q = ${maxQ})!`);
  }

  // Assert 3: No Question Text is Empty
  const emptyPrompts = qnas.filter(q => !q.question.versions[0]?.text?.trim());
  if (emptyPrompts.length > 0) {
    console.error(`❌ ASSERT FAILED: Found ${emptyPrompts.length} questions with empty questionText!`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: 0 questions with empty questionText!");
  }

  // Assert 4: No Question Has All Options Empty
  const emptyOptions = qnas.filter(q => q.options.length > 0 && q.options.every(o => !o.versions[0]?.text?.trim()));
  if (emptyOptions.length > 0) {
    console.error(`❌ ASSERT FAILED: Found ${emptyOptions.length} questions with all options empty!`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: 0 questions with all options empty!");
  }

  // Assert 5: Q14 is ONE Matching Question
  const q14List = qnas.filter(q => q.questionNumber === 14);
  if (q14List.length !== 1) {
    console.error(`❌ ASSERT FAILED: Q14 expected 1 question record, got ${q14List.length}`);
    process.exit(1);
  } else if (q14List[0].questionType !== 'MATCHING') {
    console.error(`❌ ASSERT FAILED: Q14 expected questionType MATCHING, got ${q14List[0].questionType}`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: Q14 is exactly ONE MATCHING question!");
  }

  // Assert 6: Q25 is ONE Question
  const q25List = qnas.filter(q => q.questionNumber === 25);
  if (q25List.length !== 1) {
    console.error(`❌ ASSERT FAILED: Q25 expected 1 question record, got ${q25List.length}`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: Q25 is exactly ONE logical question!");
  }

  // Assert 7: Q27 is ONE Question
  const q27List = qnas.filter(q => q.questionNumber === 27);
  if (q27List.length !== 1) {
    console.error(`❌ ASSERT FAILED: Q27 expected 1 question record, got ${q27List.length}`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: Q27 is exactly ONE logical question!");
  }

  // Assert 8: Q70 is ONE Question
  const q70List = qnas.filter(q => q.questionNumber === 70);
  if (q70List.length !== 1) {
    console.error(`❌ ASSERT FAILED: Q70 expected 1 question record, got ${q70List.length}`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: Q70 is exactly ONE logical question!");
  }

  // Assert 9: Q78 is ONE Question with statements
  const q78List = qnas.filter(q => q.questionNumber === 78);
  if (q78List.length !== 1) {
    console.error(`❌ ASSERT FAILED: Q78 expected 1 question record, got ${q78List.length}`);
    process.exit(1);
  } else {
    console.log(`✓ ASSERT PASS: Q78 is exactly ONE question (Statements=${q78List[0].question.statements?.length || 0})!`);
  }

  // Assert 10: Strict Validation Status (Questions with missing answers are REVIEW_REQUIRED, not PASS)
  const unansPass = qnas.filter(q => (!q.answer?.values || q.answer.values.length === 0) && q.validation.status === 'PASS');
  if (unansPass.length > 0) {
    console.error(`❌ ASSERT FAILED: Found ${unansPass.length} unanswered questions incorrectly marked as PASS!`);
    process.exit(1);
  } else {
    console.log("✓ ASSERT PASS: 0 unanswered questions marked as PASS (Strict Validation Enforced)!");
  }

  // Metric Reporting
  const passCount = qnas.filter(q => q.validation.status === 'PASS').length;
  const reviewCount = qnas.filter(q => q.validation.status === 'REVIEW_REQUIRED').length;
  const warningCount = qnas.filter(q => q.validation.status === 'WARNING').length;
  const errorCount = qnas.filter(q => q.validation.status === 'ERROR').length;
  const matchingCount = qnas.filter(q => q.questionType === 'MATCHING').length;
  const stmtCount = qnas.filter(q => q.questionType === 'STATEMENT_BASED').length;

  console.log("\n====================================================");
  console.log("FULL DOCUMENT EXTRACTION METRICS & STATISTICS");
  console.log("====================================================");
  console.log(`Total Pages Processed       : ${doc.pages.length}`);
  console.log(`Total Blocks Processed      : ${totalBlocks}`);
  console.log(`Total Logical Questions     : ${qnas.length}`);
  console.log(`Matching Questions          : ${matchingCount}`);
  console.log(`Statement-Based Questions   : ${stmtCount}`);
  console.log(`PASS Status Questions       : ${passCount}`);
  console.log(`REVIEW_REQUIRED Questions   : ${reviewCount}`);
  console.log(`WARNING Status Questions    : ${warningCount}`);
  console.log(`ERROR Status Questions      : ${errorCount}`);
  // Export updated audit JSON
  const auditRecords = qnas.map((q, idx) => ({
    index: idx + 1,
    id: q.id,
    questionNumber: q.questionNumber,
    sectionName: (q as any).sectionName || '',
    questionType: q.questionType,
    questionImageUrl: q.question.imageUrl || null,
    questionText_en: q.question.versions.find(v => v.language === 'en')?.text || q.question.versions[0]?.text || '',
    questionText_hi: q.question.versions.find(v => v.language === 'hi')?.text || '',
    matching: q.question.matching || null,
    tableData: q.question.tableData || null,
    optionsCount: q.options.length,
    options: q.options.map(o => ({
      label: o.label,
      text_en: o.versions.find(v => v.language === 'en')?.text || o.versions[0]?.text || '',
      text_hi: o.versions.find(v => v.language === 'hi')?.text || ''
    })),
    correctAnswer: q.answer?.values[0] || null,
    explanation_en: q.explanation?.versions.find(v => v.language === 'en')?.text || q.explanation?.versions[0]?.text || '',
    explanation_hi: q.explanation?.versions.find(v => v.language === 'hi')?.text || '',
    confidenceScore: q.confidence,
    validationStatus: q.validation.status
  }));
  const auditPath = path.join(__dirname, 'polity_all_pyq_eng_audit.json');
  fs.writeFileSync(auditPath, JSON.stringify(auditRecords, null, 2), 'utf-8');
  console.log(`✓ Updated audit JSON exported to: ${auditPath}`);

  console.log("====================================================");
  console.log("✅ GOLDEN REGRESSION SUITE PASSED 100%!");
  console.log("====================================================");
}

runGoldenRegressionTest();
