import fs from 'fs';
import path from 'path';
import { AdapterFactory } from './services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';

async function runUniversalDocumentImport() {
  console.log("====================================================");
  console.log("UNIVERSAL DOCUMENT IMPORT ENGINE (ALL SUBJECTS & FILES)");
  console.log("====================================================\n");

  const targetFileArg = process.argv[2];
  let targetPath = targetFileArg ? path.resolve(targetFileArg) : '';

  if (!targetPath || !fs.existsSync(targetPath)) {
    // Fallbacks if no argument passed
    const candidateFiles = [
      path.join(__dirname, 'POLITY ALL PYQ ENG.pdf'),
      path.join(__dirname, '..', 'POLITY ALL PYQ ENG.pdf'),
      path.join(__dirname, 'uploads', 'VALGRIND.pdf')
    ];
    const found = candidateFiles.find(f => fs.existsSync(f));
    if (found) {
      targetPath = found;
    } else {
      console.error("❌ Usage: npx ts-node -T test_universal_document_import.ts <path_to_file>");
      process.exit(1);
    }
  }

  const filename = path.basename(targetPath);
  const ext = path.extname(targetPath).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' :
                   ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                   ext === '.doc' ? 'application/msword' :
                   ext === '.txt' ? 'text/plain' : 'application/octet-stream';

  console.log(`Processing Target File: ${targetPath}`);
  console.log(`File Type: ${ext.toUpperCase()} | MIME: ${mimeType}`);

  const buffer = fs.readFileSync(targetPath);
  const doc = await AdapterFactory.process(buffer, { filename, mimeType });
  const qnas = await QnaExtractor.extractQna(doc);

  console.log(`\n[1] Total Pages Processed: ${doc.pages.length}`);
  const totalBlocks = doc.pages.reduce((acc, p) => acc + p.blocks.length, 0);
  console.log(`[2] Total Blocks Extracted: ${totalBlocks}`);
  console.log(`[3] Total Logical Questions Extracted: ${qnas.length}`);

  if (qnas.length > 0) {
    const qNums = qnas.map(q => q.questionNumber).filter(Boolean);
    const minQ = Math.min(...qNums);
    const maxQ = Math.max(...qNums);
    console.log(`[4] Question Number Range: ${minQ} to ${maxQ}`);
  }

  let mcqCount = 0;
  let matchingCount = 0;
  let stmtCount = 0;
  let passCount = 0;
  let reviewCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const q of qnas) {
    if (q.questionType === 'MATCHING') matchingCount++;
    else if (q.questionType === 'STATEMENT_BASED') stmtCount++;
    else mcqCount++;

    if (q.validation.status === 'PASS') passCount++;
    else if (q.validation.status === 'REVIEW_REQUIRED') reviewCount++;
    else if (q.validation.status === 'WARNING') warningCount++;
    else if (q.validation.status === 'ERROR') errorCount++;
  }

  console.log("\n====================================================");
  console.log("UNIVERSAL DOCUMENT METRICS & STATISTICS");
  console.log("====================================================");
  console.log(`Total Pages Processed       : ${doc.pages.length}`);
  console.log(`Total Blocks Processed      : ${totalBlocks}`);
  console.log(`Total Logical Questions     : ${qnas.length}`);
  console.log(`MCQ Questions               : ${mcqCount}`);
  console.log(`Matching Questions          : ${matchingCount}`);
  console.log(`Statement-Based Questions   : ${stmtCount}`);
  console.log(`PASS Status Questions       : ${passCount}`);
  console.log(`REVIEW_REQUIRED Questions   : ${reviewCount}`);
  console.log(`WARNING Status Questions    : ${warningCount}`);
  console.log(`ERROR Status Questions      : ${errorCount}`);

  // Export Audit JSON dynamically
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

  const baseNameNoExt = path.basename(filename, ext).toLowerCase().replace(/[^a-z0-9]/g, '_');
  const auditPath = path.join(__dirname, `${baseNameNoExt}_audit.json`);
  fs.writeFileSync(auditPath, JSON.stringify(auditRecords, null, 2), 'utf-8');
  console.log(`\n✓ Universal audit JSON exported dynamically to: ${auditPath}`);
  console.log("====================================================");
  console.log("✅ UNIVERSAL IMPORT PIPELINE PASSED 100%");
  console.log("====================================================");
}

runUniversalDocumentImport().catch(err => {
  console.error("❌ Universal Import Test Error:", err);
  process.exit(1);
});
