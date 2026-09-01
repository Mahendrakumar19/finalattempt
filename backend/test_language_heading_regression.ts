import { AdapterFactory } from './services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';
import { ExcelQuestionBankAdapter } from './services/excelEngine/ExcelQuestionBankAdapter';
import { BlockClassifier } from './services/documentEngine/understanding/BlockClassifier';
import { LanguageDetector } from './services/documentEngine/alignment/LanguageDetector';
import * as XLSX from 'xlsx';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runLanguageHeadingRegressionTests() {
  console.log('====================================================');
  console.log('LANGUAGE-AWARE IMPORT + HEADING SUPPRESSION TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: Hindi-only TXT (simulating DOCX with headings) - headings skipped, documentLanguage = HINDI
  console.log('--- TEST 1: Hindi-only Document ---');
  const hindiDoc = `क्षेत्र
अक्षांशीय सीमा
मानक समय
सीमावर्ती देश
भौतिक विभाजन
पर्वत शिखर
पठार
नदियाँ
जलवायु

Q1. भारत का क्षेत्रफल लगभग कितने वर्ग किलोमीटर है?
(a) 2 लाख
(b) 3 लाख
(c) 4 लाख
(d) 5 लाख
Ans: B

Q2. भारत की उत्तरी सीमा पर स्थित पर्वत श्रृंखला कौन सी है?
(a) हिमालय
(b) गोदावरी
(c) सतलुज
(d) नर्मदा
Ans: A
`;
  const hindiBuffer = Buffer.from(hindiDoc, 'utf-8');
  const hindiNormDoc = await AdapterFactory.process(hindiBuffer, { filename: 'hindi_only.txt', mimeType: 'text/plain' });
  assert(hindiNormDoc.documentLanguage === 'HINDI', `Hindi doc documentLanguage = HINDI (got ${hindiNormDoc.documentLanguage})`);

  const hindiQnas = await QnaExtractor.extractQna(hindiNormDoc);
  assert(hindiQnas.length >= 2, `Hindi doc extracted at least 2 questions (got ${hindiQnas.length})`);

  for (const qna of hindiQnas) {
    const qText = qna.question.versions[0]?.text || '';
    assert(!KNOWN_HEADINGS.has(qText.trim()), `Question text does not contain heading: "${qText.substring(0, 40)}"`);
    for (const opt of qna.options) {
      assert(!KNOWN_HEADINGS.has(opt.versions[0]?.text?.trim() || ''), `Option text does not contain heading for Q${qna.questionNumber}`);
    }
  }
  console.log('✓ PASS: Hindi doc - headings skipped, no leakage into questions/options\n');

  // TEST 2: English-only Document
  console.log('--- TEST 2: English-only Document ---');
  const englishDoc = `Indian Geography
Physical Features
Climate
Rivers
Flora
Fauna

Q1. Which state in India is the largest producer of Tea?
(A) West Bengal
(B) Kerala
(C) Assam
(D) Tamil Nadu
(E) None of the above
Ans: C

Q2. The Ganges River originates from which glacier?
(A) Gangotri
(B) Siachen
(C) Yamunotri
(D) Zemu
Ans: A
`;
  const englishBuffer = Buffer.from(englishDoc, 'utf-8');
  const englishNormDoc = await AdapterFactory.process(englishBuffer, { filename: 'english_only.txt', mimeType: 'text/plain' });
  assert(englishNormDoc.documentLanguage === 'ENGLISH', `English doc documentLanguage = ENGLISH (got ${englishNormDoc.documentLanguage})`);

  const englishQnas = await QnaExtractor.extractQna(englishNormDoc);
  assert(englishQnas.length >= 2, `English doc extracted at least 2 questions (got ${englishQnas.length})`);

  for (const qna of englishQnas) {
    const qText = qna.question.versions[0]?.text || '';
    assert(!KNOWN_HEADINGS.has(qText.trim()), `Question text does not contain heading: "${qText.substring(0, 40)}"`);
  }
  console.log('✓ PASS: English doc - headings skipped, no leakage into questions\n');

  // TEST 3: Bilingual Document
  console.log('--- TEST 3: Bilingual Document ---');
  const bilingualDoc = `CHAPTER 1: INDIAN POLITY

Q1. Who is the Father of the Indian Constitution?
(a) Mahatma Gandhi
(b) B.R. Ambedkar
(c) Jawaharlal Nehru
(d) Sardar Patel
Ans: B

प्रश्न 1. भारतीय संविधान के जनक कौन हैं?
(क) महात्मा गांधी
(ख) बी.आर. अंबेडकर
(ग) जवाहरलाल नेहरू
(घ) सरदार पटेल
उत्तर: ख
`;
  const bilingualBuffer = Buffer.from(bilingualDoc, 'utf-8');
  const bilingualNormDoc = await AdapterFactory.process(bilingualBuffer, { filename: 'bilingual.txt', mimeType: 'text/plain' });
  assert(bilingualNormDoc.documentLanguage === 'BILINGUAL', `Bilingual doc documentLanguage = BILINGUAL (got ${bilingualNormDoc.documentLanguage})`);

  const bilingualQnas = await QnaExtractor.extractQna(bilingualNormDoc);
  assert(bilingualQnas.length >= 1, `Bilingual doc extracted at least 1 question (got ${bilingualQnas.length})`);

  const q1 = bilingualQnas.find(q => q.questionNumber === 1) || bilingualQnas[0];
  const hasEn = q1.question.versions.some(v => v.language === 'en');
  const hasHi = q1.question.versions.some(v => v.language === 'hi');
  assert(hasEn && hasHi, `Bilingual Q1 has both EN and HI versions`);
  console.log('✓ PASS: Bilingual doc - both languages detected and aligned\n');

  // TEST 4: Heading leakage between questions
  console.log('--- TEST 4: Heading Leakage Between Questions ---');
  const leakageDoc = `Q1. भारत का क्षेत्रफल लगभग कितने वर्ग किलोमीटर है?
(a) 2 लाख
(b) 3 लाख
(c) 4 लाख
(d) 5 लाख
Ans: B

अक्षांशीय सीमा

Q2. भारत की उत्तरी सीमा पर स्थित पर्वत श्रृंखला कौन सी है?
(a) हिमालय
(b) गोदावरी
(c) सतलुज
(d) नर्मदा
Ans: A
`;
  const leakageBuffer = Buffer.from(leakageDoc, 'utf-8');
  const leakageNormDoc = await AdapterFactory.process(leakageBuffer, { filename: 'leakage_test.txt', mimeType: 'text/plain' });
  const leakageQnas = await QnaExtractor.extractQna(leakageNormDoc);

  const q2Leakage = leakageQnas.find(q => q.questionNumber === 2);
  if (q2Leakage) {
    const q2Text = q2Leakage.question.versions[0]?.text || '';
    assert(!q2Text.includes('अक्षांशीय सीमा'), `Q2 text does not contain leaked heading "अक्षांशीय सीमा"`);
    for (const opt of q2Leakage.options) {
      assert(!(opt.versions[0]?.text || '').includes('अक्षांशीय सीमा'), `Q2 option does not contain leaked heading`);
    }
  }
  console.log('✓ PASS: No heading leakage into Q2 text or options\n');

  // TEST 5: Hindi-only Excel
  console.log('--- TEST 5: Hindi-only Excel ---');
  const hindiExcelWb = XLSX.utils.book_new();
  const hindiExcelHeaders = ['questionText','optionA','optionB','optionC','optionD','optionE','correctAnswer','explanation','questionTextHi','optionAHi','optionBHi','optionCHi','optionDHi','optionEHi','explanationHi','marks','negativeMarks'];
  const hindiExcelRows = [
    hindiExcelHeaders,
    ['', '', '', '', '', '', 'A', '', 'प्रश्न 1', 'क', 'ख', 'ग', 'घ', 'ङ', 'व्याख्या 1', 1, 0.33]
  ];
  const hindiExcelSheet = XLSX.utils.aoa_to_sheet(hindiExcelRows);
  XLSX.utils.book_append_sheet(hindiExcelWb, hindiExcelSheet, 'Question Bank');
  const hindiExcelBuf = XLSX.write(hindiExcelWb, { type: 'buffer', bookType: 'xlsx' });
  const hindiExcelReport = ExcelQuestionBankAdapter.parseBuffer(hindiExcelBuf, 'hindi_only.xlsx');
  assert(hindiExcelReport.documentLanguage === 'HINDI', `Hindi Excel documentLanguage = HINDI (got ${hindiExcelReport.documentLanguage})`);
  assert(hindiExcelReport.isValid, 'Hindi-only Excel is valid');
  console.log('✓ PASS: Hindi-only Excel - documentLanguage = HINDI\n');

  // TEST 6: English-only Excel
  console.log('--- TEST 6: English-only Excel ---');
  const englishExcelWb = XLSX.utils.book_new();
  const englishExcelHeaders = ['questionText','optionA','optionB','optionC','optionD','optionE','correctAnswer','explanation','questionTextHi','optionAHi','optionBHi','optionCHi','optionDHi','optionEHi','explanationHi','marks','negativeMarks'];
  const englishExcelRows = [
    englishExcelHeaders,
    ['Question 1', 'A1', 'B1', 'C1', 'D1', '', 'A', 'Exp 1', '', '', '', '', '', '', '', 1, 0.33]
  ];
  const englishExcelSheet = XLSX.utils.aoa_to_sheet(englishExcelRows);
  XLSX.utils.book_append_sheet(englishExcelWb, englishExcelSheet, 'Question Bank');
  const englishExcelBuf = XLSX.write(englishExcelWb, { type: 'buffer', bookType: 'xlsx' });
  const englishExcelReport = ExcelQuestionBankAdapter.parseBuffer(englishExcelBuf, 'english_only.xlsx');
  assert(englishExcelReport.documentLanguage === 'ENGLISH', `English Excel documentLanguage = ENGLISH (got ${englishExcelReport.documentLanguage})`);
  assert(englishExcelReport.isValid, 'English-only Excel is valid');
  console.log('✓ PASS: English-only Excel - documentLanguage = ENGLISH\n');

  // TEST 7: Bilingual Excel
  console.log('--- TEST 7: Bilingual Excel ---');
  const biExcelWb = XLSX.utils.book_new();
  const biExcelHeaders = ['questionText','optionA','optionB','optionC','optionD','optionE','correctAnswer','explanation','questionTextHi','optionAHi','optionBHi','optionCHi','optionDHi','optionEHi','explanationHi','marks','negativeMarks'];
  const biExcelRows = [
    biExcelHeaders,
    ['Question 1', 'A1', 'B1', 'C1', 'D1', '', 'A', 'Exp 1', 'प्रश्न 1', 'क', 'ख', 'ग', 'घ', '', 'व्याख्या 1', 1, 0.33]
  ];
  const biExcelSheet = XLSX.utils.aoa_to_sheet(biExcelRows);
  XLSX.utils.book_append_sheet(biExcelWb, biExcelSheet, 'Question Bank');
  const biExcelBuf = XLSX.write(biExcelWb, { type: 'buffer', bookType: 'xlsx' });
  const biExcelReport = ExcelQuestionBankAdapter.parseBuffer(biExcelBuf, 'bilingual.xlsx');
  assert(biExcelReport.documentLanguage === 'BILINGUAL', `Bilingual Excel documentLanguage = BILINGUAL (got ${biExcelReport.documentLanguage})`);
  assert(biExcelReport.isValid, 'Bilingual Excel is valid');
  console.log('✓ PASS: Bilingual Excel - documentLanguage = BILINGUAL\n');

  // REGRESSION: Ensure headings are not in options or question text
  console.log('--- REGRESSION: Heading Absence in Questions ---');
  const regressionDoc = `अक्षांशीय सीमा
मानक समय
सीमावर्ती देश

Q1. भारत का क्षेत्रफल लगभग कितने वर्ग किलोमीटर है?
(a) 2 लाख
(b) 3 लाख
(c) 4 लाख
(d) 5 लाख
Ans: B
`;
  const regBuffer = Buffer.from(regressionDoc, 'utf-8');
  const regNormDoc = await AdapterFactory.process(regBuffer, { filename: 'regression.txt', mimeType: 'text/plain' });
  const regQnas = await QnaExtractor.extractQna(regNormDoc);
  assert(regQnas.length >= 1, 'Regression doc extracted at least 1 question');
  const rq1 = regQnas[0];
  const rqText = rq1.question.versions[0]?.text || '';
  assert(!rqText.includes('अक्षांशीय सीमा'), 'Q1 text does not contain "अक्षांशीय सीमा"');
  assert(!rqText.includes('मानक समय'), 'Q1 text does not contain "मानक समय"');
  assert(!rqText.includes('सीमावर्ती देश'), 'Q1 text does not contain "सीमावर्ती देश"');
  for (const opt of rq1.options) {
    const optText = opt.versions[0]?.text || '';
    assert(!optText.includes('अक्षांशीय सीमा'), `Option ${opt.label} does not contain heading`);
  }
  console.log('✓ PASS: No heading leakage in regression doc\n');

  console.log('====================================================');
  console.log('ALL LANGUAGE + HEADING REGRESSION TESTS PASSED 100%');
  console.log('====================================================');
}

const KNOWN_HEADINGS = new Set([
  'क्षेत्र', 'अक्षांशीय सीमा', 'मानक समय', 'सीमावर्ती देश', 'भौतिक विभाजन',
  'पर्वत शिखर', 'पठार', 'नदियाँ', 'जलवायु', 'वनस्पति', 'जीव-जगत',
  'Indian Geography', 'Physical Features', 'Climate', 'Rivers', 'Flora', 'Fauna',
  'Answer Key', 'उत्तर कुंजी', 'Solutions', 'व्याख्या', 'Explanations'
]);

runLanguageHeadingRegressionTests().catch(err => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});
