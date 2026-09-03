import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BilingualPdfParser } from './services/bilingualPdfParser';
import { sanitizeAndRepairQuestion } from '../frontend/src/utils/questionFormatter';

async function testNumberedStatementE2E() {
  console.log('============================================================');
  console.log('  E2E AUDIT: NUMBERED STATEMENT & FINAL OPTION CONSERVATION ');
  console.log('============================================================\n');

  // Verify DB checksum before
  const repoDbPath = path.join(__dirname, 'database_store.json');
  let beforeDbHash = '';
  if (fs.existsSync(repoDbPath)) {
    beforeDbHash = crypto.createHash('sha256').update(fs.readFileSync(repoDbPath)).digest('hex');
  }

  // Exact Q27 source snippet
  const q27RawInput = `SECTION 1: QUESTIONS
27. भारतीय संविधान के विभित्र सूचियों के निम्नलिखित विषयों पर विचार कीजिए।
निम्नलिखित में से कौन विषय समवर्ती सूची में आते है? 71stBPSC

1) वन्यजीवों की सुरक्षा
2) कृषि पर आय
3) विद्युत उपभोग अथवा विक्री पर कर
4) मूल्य नियंत्रण

इनमें से :
(a) 2 तथा 3 सही है
(b) 1 तथा 4 सही है
(c) केवल 4 सही है
(d) केवल 2 सही है

SECTION 2: SOLUTIONS & EXPLANATIONS
Q27. B
विस्तृत व्याख्या: 1 और 4 समवर्ती सूची में आते हैं।`;

  const parseResult = BilingualPdfParser.parseText(q27RawInput);
  const q27Preview = parseResult.questionsPreview[0];

  console.log(`📌 Parsed Question Count: ${parseResult.questionsPreview.length}`);
  console.log(`📌 Q27 Question Text:`, JSON.stringify(q27Preview.questionText));
  console.log(`📌 Q27 Option A:`, JSON.stringify(q27Preview.optionA));
  console.log(`📌 Q27 Option B:`, JSON.stringify(q27Preview.optionB));
  console.log(`📌 Q27 Option C:`, JSON.stringify(q27Preview.optionC));
  console.log(`📌 Q27 Option D:`, JSON.stringify(q27Preview.optionD));
  console.log(`📌 Q27 Option E:`, JSON.stringify(q27Preview.optionE));
  console.log(`📌 Q27 Answer:`, JSON.stringify(q27Preview.correctAnswer));
  console.log(`📌 Q27 Explanation:`, JSON.stringify(q27Preview.explanation));

  const assertions = [
    { name: 'Question Count == 1', pass: parseResult.questionsPreview.length === 1 },
    { name: 'Question Text retains sentence 1', pass: q27Preview.questionText.includes('भारतीय संविधान के विभित्र सूचियों') },
    { name: 'Question Text retains sentence 2', pass: q27Preview.questionText.includes('समवर्ती सूची में आते है') },
    { name: 'Question Text retains statement 1)', pass: q27Preview.questionText.includes('1) वन्यजीवों की सुरक्षा') },
    { name: 'Question Text retains statement 2)', pass: q27Preview.questionText.includes('2) कृषि पर आय') },
    { name: 'Question Text retains statement 3)', pass: q27Preview.questionText.includes('3) विद्युत उपभोग अथवा विक्री पर कर') },
    { name: 'Question Text retains statement 4)', pass: q27Preview.questionText.includes('4) मूल्य नियंत्रण') },
    { name: 'Option A == "2 तथा 3 सही है"', pass: q27Preview.optionA === '2 तथा 3 सही है' },
    { name: 'Option B == "1 तथा 4 सही है"', pass: q27Preview.optionB === '1 तथा 4 सही है' },
    { name: 'Option C == "केवल 4 सही है"', pass: q27Preview.optionC === 'केवल 4 सही है' },
    { name: 'Option D == "केवल 2 सही है"', pass: q27Preview.optionD === 'केवल 2 सही है' },
    { name: 'Option E == ""', pass: q27Preview.optionE === '' },
    { name: 'Correct Answer == "B"', pass: q27Preview.correctAnswer === 'B' }
  ];

  console.log('\n--- Q27 STATEMENT ASSERTIONS ---');
  let allPass = true;
  assertions.forEach(a => {
    console.log(`  ${a.pass ? '✅ PASS' : '❌ FAIL'}: ${a.name}`);
    if (!a.pass) allPass = false;
  });

  // Verify DB checksum after
  let afterDbHash = '';
  if (fs.existsSync(repoDbPath)) {
    afterDbHash = crypto.createHash('sha256').update(fs.readFileSync(repoDbPath)).digest('hex');
  }

  console.log(`\n📌 Database Store SHA-256 BEFORE: ${beforeDbHash}`);
  console.log(`📌 Database Store SHA-256 AFTER:  ${afterDbHash}`);

  if (beforeDbHash === afterDbHash && allPass) {
    console.log('\n============================================================');
    console.log('  NUMBERED STATEMENT E2E AUDIT: PASS ✅');
    console.log('============================================================\n');
  } else {
    console.error('\n============================================================');
    console.error('  NUMBERED STATEMENT E2E AUDIT: FAIL ❌');
    console.error('============================================================\n');
    process.exit(1);
  }
}

testNumberedStatementE2E().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
