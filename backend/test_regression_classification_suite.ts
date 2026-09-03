import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BilingualPdfParser } from './services/bilingualPdfParser';
import { renderFormattedQuestionText } from '../frontend/src/utils/questionFormatter';

async function runClassificationRegressionSuite() {
  console.log('============================================================');
  console.log('  STRUCTURAL CLASSIFICATION & FORMATTING REGRESSION SUITE   ');
  console.log('============================================================\n');

  // Verify DB checksum before
  const repoDbPath = path.join(__dirname, 'database_store.json');
  let beforeDbHash = '';
  if (fs.existsSync(repoDbPath)) {
    beforeDbHash = crypto.createHash('sha256').update(fs.readFileSync(repoDbPath)).digest('hex');
  }

  const testCases = [
    {
      id: 'A',
      name: 'समवर्ती सूची + 1)-4) statements + (a)-(d)',
      input: `SECTION 1: QUESTIONS
1. भारतीय संविधान के विभिन्न सूचियों के निम्नलिखित विषयों पर विचार कीजिए।
निम्नलिखित में से कौन विषय समवर्ती सूची में आते है?
1) वन्यजीवों की सुरक्षा
2) कृषि पर आय
3) विद्युत उपभोग
4) मूल्य नियंत्रण
(a) 2 तथा 3 सही है
(b) 1 तथा 4 सही है
(c) केवल 4 सही है
(d) केवल 2 सही है

SECTION 2: SOLUTIONS & EXPLANATIONS
Q1. B
विस्तृत व्याख्या: 1 और 4 समवर्ती सूची में आते हैं।`,
      expectMatchingTable: false,
      expectOptions: ['2 तथा 3 सही है', '1 तथा 4 सही है', 'केवल 4 सही है', 'केवल 2 सही है']
    },
    {
      id: 'B',
      name: 'संघ सूची + 1)-4) statements + (a)-(d)',
      input: `SECTION 1: QUESTIONS
2. संघ सूची के निम्नलिखित विषयों पर विचार करें:
1) रक्षा
2) विदेश मामले
3) बैंकिंग
4) कृषि
(a) 1, 2 तथा 3
(b) केवल 4
(c) 2 तथा 4
(d) उपयुक्त सभी

SECTION 2: SOLUTIONS & EXPLANATIONS
Q2. A
विस्तृत व्याख्या: संघ सूची के विषय।`,
      expectMatchingTable: false,
      expectOptions: ['1, 2 तथा 3', 'केवल 4', '2 तथा 4', 'उपयुक्त सभी']
    },
    {
      id: 'C',
      name: 'राज्य सूची + 1)-4) statements + (a)-(d)',
      input: `SECTION 1: QUESTIONS
3. राज्य सूची में कौन से विषय आते हैं?
1) पुलिस
2) लोक स्वास्थ्य
3) स्वच्छता
4) रेलवे
(a) 1, 2 तथा 3
(b) 2, 3 तथा 4
(c) केवल 1
(d) सभी

SECTION 2: SOLUTIONS & EXPLANATIONS
Q3. A
विस्तृत व्याख्या: राज्य सूची विषय।`,
      expectMatchingTable: false,
      expectOptions: ['1, 2 तथा 3', '2, 3 तथा 4', 'केवल 1', 'सभी']
    },
    {
      id: 'D',
      name: 'विभिन्न सूचियों + 1)-4) statements + (a)-(d)',
      input: `SECTION 1: QUESTIONS
4. विभिन्न सूचियों के विषयों पर विचार कीजिए:
1) विषय A
2) विषय B
3) विषय C
4) विषय D
(a) 1 तथा 2
(b) 3 तथा 4
(c) 1 तथा 3
(d) 2 तथा 4

SECTION 2: SOLUTIONS & EXPLANATIONS
Q4. A
विस्तृत व्याख्या: व्याख्या।`,
      expectMatchingTable: false,
      expectOptions: ['1 तथा 2', '3 तथा 4', '1 तथा 3', '2 तथा 4']
    },
    {
      id: 'E',
      name: 'Actual Matching A-D + 1-4 + final options',
      input: `SECTION 1: QUESTIONS
5. सूची-I को सूची-II से सुमेलित कीजिए:
सूची-I
A. निदेशक सिद्धांत
B. मौलिक अधिकार
C. समवर्ती सूची
D. राज्यों का संघ

सूची-II
1. आयरलैंड
2. यूएसए
3. ऑस्ट्रेलिया
4. कनाडा

ूट:
(a) 1 2 3 4
(b) 2 1 4 3
(c) 3 4 1 2
(d) 4 3 2 1

SECTION 2: SOLUTIONS & EXPLANATIONS
Q5. A
विस्तृत व्याख्या: सुमेलित व्याख्या।`,
      expectMatchingTable: true,
      expectOptions: ['1 2 3 4', '2 1 4 3', '3 4 1 2', '4 3 2 1']
    },
    {
      id: 'F',
      name: 'Actual Matching I-III + A-C + final options',
      input: `SECTION 1: QUESTIONS
6. सूची-I को सूची-II से सुमेलित कीजिए:
I. संघीय सूची A. 97 प्रविष्टियां
II. राज्य सूची B. 47 प्रविष्टियां
III. समवर्ती सूची C. 66 प्रविष्टियां
(a) I-A, II-B, III-C
(b) I-B, II-A, III-C
(c) I-C, II-B, III-A
(d) I-A, II-C, III-B

SECTION 2: SOLUTIONS & EXPLANATIONS
Q6. A
विस्तृत व्याख्या: व्याख्या।`,
      expectMatchingTable: true,
      expectOptions: ['I-A, II-B, III-C', 'I-B, II-A, III-C', 'I-C, II-B, III-A', 'I-A, II-C, III-B']
    },
    {
      id: 'G',
      name: 'Inline Matching A+1, B+2, C+3',
      input: `SECTION 1: QUESTIONS
7. सुमेलित कीजिए:
A. विषय 1 1. उत्तर 1
B. विषय 2 2. उत्तर 2
C. विषय 3 3. उत्तर 3
(a) A-1, B-2, C-3
(b) A-2, B-1, C-3
(c) A-3, B-2, C-1
(d) A-1, B-3, C-2

SECTION 2: SOLUTIONS & EXPLANATIONS
Q7. A
विस्तृत व्याख्या: व्याख्या।`,
      expectMatchingTable: true,
      expectOptions: ['A-1, B-2, C-3', 'A-2, B-1, C-3', 'A-3, B-2, C-1', 'A-1, B-3, C-2']
    },
    {
      id: 'H',
      name: 'Normal MCQ containing word "सूची"',
      input: `SECTION 1: QUESTIONS
8. भारतीय संविधान की 7वीं सूची का संबंध किससे है?
(a) भाषाओं से
(b) केंद्र-राज्य शक्तियों के विभाजन से
(c) शपथ ग्रहण से
(d) दल-बदल विरोधी कानून से

SECTION 2: SOLUTIONS & EXPLANATIONS
Q8. B
विस्तृत व्याख्या: 7वीं अनुसूची में केंद्र व राज्यों के बीच शक्तियों का बंटवारा है।`,
      expectMatchingTable: false,
      expectOptions: ['भाषाओं से', 'केंद्र-राज्य शक्तियों के विभाजन से', 'शपथ ग्रहण से', 'दल-बदल विरोधी कानून से']
    },
    {
      id: 'I',
      name: 'Ordering question containing word "सूची"',
      input: `SECTION 1: QUESTIONS
9. सूची के निम्नलिखित घटनाओं को कालानुक्रम में व्यवस्थित करें:
1) घटना A
2) घटना B
3) घटना C
4) घटना D
(a) 1, 2, 3, 4
(b) 2, 1, 4, 3
(c) 4, 3, 2, 1
(d) 3, 4, 1, 2

SECTION 2: SOLUTIONS & EXPLANATIONS
Q9. A
विस्तृत व्याख्या: कालानुक्रम व्याख्या।`,
      expectMatchingTable: false,
      expectOptions: ['1, 2, 3, 4', '2, 1, 4, 3', '4, 3, 2, 1', '3, 4, 1, 2']
    }
  ];

  let overallPass = true;

  testCases.forEach(tc => {
    const parseRes = BilingualPdfParser.parseText(tc.input);
    const q = parseRes.questionsPreview[0];
    const formatted = renderFormattedQuestionText(q.questionText);
    const hasTable = formatted.formatted.includes('<table') || formatted.formatted.includes('match-list-container');

    const tableMatchPass = hasTable === tc.expectMatchingTable;
    const optAPass = q.optionA === tc.expectOptions[0];
    const optBPass = q.optionB === tc.expectOptions[1];
    const optCPass = q.optionC === tc.expectOptions[2];
    const optDPass = q.optionD === tc.expectOptions[3];

    const tcPass = tableMatchPass && optAPass && optBPass && optCPass && optDPass;

    console.log(`[TEST ${tc.id}] ${tc.name}`);
    console.log(`  Matching Table Expected: ${tc.expectMatchingTable} | Got: ${hasTable} -> ${tableMatchPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Option A Expected: "${tc.expectOptions[0]}" | Got: "${q.optionA}" -> ${optAPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Option B Expected: "${tc.expectOptions[1]}" | Got: "${q.optionB}" -> ${optBPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Option C Expected: "${tc.expectOptions[2]}" | Got: "${q.optionC}" -> ${optCPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Option D Expected: "${tc.expectOptions[3]}" | Got: "${q.optionD}" -> ${optDPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  STATUS: ${tcPass ? '✅ PASS' : '❌ FAIL'}\n`);

    if (!tcPass) overallPass = false;
  });

  // Verify DB checksum after
  let afterDbHash = '';
  if (fs.existsSync(repoDbPath)) {
    afterDbHash = crypto.createHash('sha256').update(fs.readFileSync(repoDbPath)).digest('hex');
  }

  console.log(`📌 Database Store SHA-256 BEFORE: ${beforeDbHash}`);
  console.log(`📌 Database Store SHA-256 AFTER:  ${afterDbHash}`);

  if (beforeDbHash === afterDbHash && overallPass) {
    console.log('\n============================================================');
    console.log('  CLASSIFICATION REGRESSION SUITE: PASS ✅ (9/9 CASES)');
    console.log('============================================================\n');
  } else {
    console.error('\n============================================================');
    console.error('  CLASSIFICATION REGRESSION SUITE: FAIL ❌');
    console.error('============================================================\n');
    process.exit(1);
  }
}

runClassificationRegressionSuite().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
