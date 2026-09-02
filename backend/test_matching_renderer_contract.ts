import { sanitizeAndRepairQuestion, formatMatchListsInText } from '../frontend/src/utils/questionFormatter';
import { BilingualPdfParser } from './services/bilingualPdfParser';

console.log('========================================================');
console.log('  MATCHING RENDER CONTRACT & LAYOUT INTEGRITY AUDIT      ');
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

const TEST_MATCHING_QUESTIONS = [
  {
    name: 'Q286 Hindi Rocks Matching',
    rawText: `286. सूची-I को सूची-II से सुमेलित कीजिए तथा नीचे दिए गए कूट से सही उत्तर चुनिए:
सूची-I (चट्टान प्रणाली)  सूची-II (विशेषता)
A. धारवाड़  1. सबसे पुरानी आर्कीयन चट्टानें
B. कुडप्पा  2. धात्विक खनिजों में समृद्ध
C. विंध्यन  3. जीवाश्म युक्त चूना पत्थर
D. गोंडवाना  4. भारत का 98% कोयला
कूट:
   A B C D
(a) 2 1 3 4
(b) 1 2 3 4
(c) 2 3 1 4
(d) 4 3 2 1`
  },
  {
    name: 'Q289 Multiline Industry Location Matching',
    rawText: `289. Industry Location Match:
List-I (Industry Name with Detailed Region Info)   List-II (Mineral Product)
A. Bengaluru Heavy Electrical Equipment Manufacturing   1. Copper Ore Extraction
B. Korba Thermal Power Generation Complex              2. Airplane Electronics
C. Jamshedpur Steel Industry Plant                    3. Aluminium Smelting
D. Malajkhand Mining Belt                             4. Steel Production
Code:
   A B C D
(a) 2 3 4 1
(b) 1 2 3 4
(c) 4 3 2 1
(d) 2 1 4 3`
  },
  {
    name: 'Q535 Markdown Table Matching',
    rawText: `535. Match list:
| List-I | List-II |
| A. National Park | 1. Bihar |
| B. Wildlife Sanctuary | 2. UP |
| C. Biosphere Reserve | 3. MP |
| D. Tiger Reserve | 4. Assam |
(a) 1 2 3 4 (b) 2 1 4 3 (c) 3 4 1 2 (d) 4 3 2 1`
  }
];

async function runMatchingRenderAudit() {
  for (const tCase of TEST_MATCHING_QUESTIONS) {
    console.log(`\n--- Testing ${tCase.name} ---`);
    const parseReport = await BilingualPdfParser.parseTextAsync(tCase.rawText);
    const rawQ = parseReport.questionsPreview[0];

    assert(!!rawQ, `${tCase.name}: Backend parser returned valid question preview`);

    const repairedQ = sanitizeAndRepairQuestion(rawQ);
    const qTextToRender = repairedQ.questionText || repairedQ.questionTextHi || '';
    const htmlOutput = formatMatchListsInText(qTextToRender);

    // 1. Verify 2-Column Table structure
    assert(htmlOutput.includes('<table'), `${tCase.name}: Contains <table> markup`);
    assert(htmlOutput.includes('<tbody'), `${tCase.name}: Contains <tbody> rows`);

    // 2. Count table rows
    const trMatches = htmlOutput.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    assert(trMatches.length >= 3, `${tCase.name}: Contains header row and data rows (Total <tr> count = ${trMatches.length})`);

    // 3. Verify List-I item A and List-II item 1 in same row alignment
    const firstDataTr = trMatches[1] || '';
    assert(firstDataTr.includes('A.') || firstDataTr.includes('A. National Park') || firstDataTr.includes('National Park') || firstDataTr.includes('धारवाड़') || firstDataTr.includes('Bengaluru'), `${tCase.name}: Row 0 contains List-I Item A`);

    // 4. Verify Final Options are present and not swallowed
    assert(!!repairedQ.optionA, `${tCase.name}: Option A present ("${repairedQ.optionA}")`);
    assert(!!repairedQ.optionB, `${tCase.name}: Option B present ("${repairedQ.optionB}")`);
    assert(!!repairedQ.optionC, `${tCase.name}: Option C present ("${repairedQ.optionC}")`);
    assert(!!repairedQ.optionD, `${tCase.name}: Option D present ("${repairedQ.optionD}")`);
  }

  console.log('\n========================================================');
  console.log(`  MATCHING RENDER AUDIT: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================\n');

  if (failCount > 0) process.exit(1);
}

runMatchingRenderAudit().catch(err => {
  console.error('Fatal matching render audit error:', err);
  process.exit(1);
});
