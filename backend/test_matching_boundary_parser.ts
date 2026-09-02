import { BilingualPdfParser } from './services/bilingualPdfParser';

console.log('========================================================');
console.log('   TEST MATCHING BOUNDARY PARSER & CONSERVATION AUDIT   ');
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

const REAL_MATCHING_CASES = [
  { qNum: 13, text: `13. Bihar Rock Systems:\nA. Dharwar Rock System\nB. Vindhyan Rock System\nC. Quaternary Rock System\nD. Tertiary Rock System\n1. South-East\n2. South-West\n3. North-West\n4. Plain Area\n(a) 3 4 1 2 (b) 1 2 3 4 (c) 3 1 2 4 (d) 4 3 2 1` },
  { qNum: 11, text: `11. Match List-I with List-II:\nA. Item A B. Item B C. Item C D. Item D\n1. Val 1 2. Val 2 3. Val 3 4. Val 4\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 2 1 4 3 (d) 3 4 1 2` },
  { qNum: 286, text: `286. सूची-1 को सूची-II से सुमेलित कीजिए: 70thBPSC\nA. वैशाली       1. रेशमी वस्त्र\nB. भागलपुर      2. सोना\nC. जमुई         3. रेल डिब्बा कारखाना\nD. मधेपुरा      4. पुष्प उत्पादन\n(a) 3 4 1 2 (b) 2 3 4 1 (c) 1 2 3 4 (d) 4 1 2 3` },
  { qNum: 287, text: `287. Match list:\nA. X B. Y C. Z D. W\n1. A 2. B 3. C 4. D\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 3 4 1 2 (d) 2 1 4 3` },
  { qNum: 289, text: `289. Industry Location Match:\nA. Bengaluru  1. Copper\nB. Korba      2. Airplane\nC. Jamshedpur 3. Aluminium\nD. Malajkhand 4. Steel\n(a) 3 4 1 2 (b) 1 2 3 4 (c) 4 3 2 1 (d) 2 1 4 3` },
  { qNum: 429, text: `429. City & River Matching:\nA. City A 1. River 1\nB. City B 2. River 2\nC. City C 3. River 3\nD. City D 4. River 4\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 2 1 4 3 (d) 3 4 1 2` },
  { qNum: 431, text: `431. Match pairs:\nA. P B. Q C. R D. S\n1. 1 2. 2 3. 3 4. 4\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 2 3 4 1 (d) 3 4 1 2` },
  { qNum: 501, text: `501. Energy sources matching:\nA. Mineral 1. Gold\nB. Metal   2. Copper\n(a) 1 2 (b) 2 1\n\n502. Independent question prompt?` },
  { qNum: 502, text: `502. Standalone MP border question:\n(a) Maharashtra (b) AP (c) UP (d) Rajasthan` },
  { qNum: 504, text: `504. Match list:\nA. Alpha B. Beta\n1. X 2. Y\n(a) 1 2 (b) 2 1` },
  { qNum: 507, text: `507. Port city match:\nA. Tokyo 1. Japan\nB. London 2. UK\n(a) 1 2 (b) 2 1` },
  { qNum: 508, text: `508. Heatwave statements:\n1. Plain 30C\n2. Hill 40C\n(a) Neither (b) Both (c) 1 only (d) 2 only` },
  { qNum: 509, text: `509. Match list:\nA. 1 B. 2 C. 3 D. 4\n1. A 2. B 3. C 4. D\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 2 1 4 3 (d) 3 4 1 2` },
  { qNum: 510, text: `510. Match pairs:\nA. X B. Y C. Z D. W\n1. A 2. B 3. C 4. D\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 3 4 1 2 (d) 2 1 4 3` },
  { qNum: 535, text: `535. Match list:\n| List-I | List-II |\n| A. Park | 1. Bihar |\n| B. Wildlife | 2. UP |\n(a) 1 2 (b) 2 1` },
  { qNum: 537, text: `537. Match list:\nA. Item 1 B. Item 2\n1. Val 1 2. Val 2\n(a) 1 2 (b) 2 1` }
];

async function runMatchingBoundaryAudit() {
  console.log(`--- PART 1: AUDITING ${REAL_MATCHING_CASES.length} REAL MATCHING FIXTURES ---`);

  for (const c of REAL_MATCHING_CASES) {
    const report = await BilingualPdfParser.parseTextAsync(c.text);
    assert(report.questionsPreview.length >= 1, `Fixture Q${c.qNum}: Parsed cleanly`);

    if (c.qNum === 501) {
      assert(report.questionsPreview.length === 2, `Fixture Q501: Cleanly parsed into 2 questions (Q501 & Q502) without boundary corruption`);
      const q501 = report.questionsPreview[0];
      const optA = (q501.optionA || q501.optionAHi || '').trim();
      assert(optA === '1 2', `Fixture Q501: Option A is coded choice ("1 2"), not matching item`);
      continue;
    }

    const q = report.questionsPreview[0];
    const optA = (q.optionA || q.optionAHi || '').trim();
    const optB = (q.optionB || q.optionBHi || '').trim();

    assert(!!optA && !!optB, `Fixture Q${c.qNum}: Coded options present in Option A and Option B`);
    assert(!optA.includes('वैशाली') && !optA.includes('Bengaluru') && !optA.includes('Item A'), `Fixture Q${c.qNum}: Matching table text NOT inside Option A`);
  }

  console.log('\n--- PART 2: AUDITING 20 UNSEEN SYNTHETIC MATCHING VARIATIONS ---');

  const UNSEEN_SYNTHETIC_MATCHING = Array.from({ length: 20 }, (_, idx) => {
    const n = 950 + idx + 1;
    return {
      qNum: n,
      text: `${n}. Synthetic Match Question ${idx + 1}:\nA. Alpha-${idx}       1. Val-A-${idx}\nB. Beta-${idx}        2. Val-B-${idx}\nC. Gamma-${idx}       3. Val-C-${idx}\nD. Delta-${idx}       4. Val-D-${idx}\n(a) 3 4 1 2 (b) 1 2 3 4 (c) 2 1 4 3 (d) 4 3 2 1`
    };
  });

  for (const c of UNSEEN_SYNTHETIC_MATCHING) {
    const report = await BilingualPdfParser.parseTextAsync(c.text);
    const q = report.questionsPreview[0];

    assert(!!q, `Synthetic Q${c.qNum}: Parsed cleanly into Preview DTO`);
    assert(report.questionsPreview.length === 1, `Synthetic Q${c.qNum}: Exactly 1 single question parsed (0 phantom splits)`);

    const optA = (q.optionA || q.optionAHi || '').trim();
    assert(optA === '3 4 1 2', `Synthetic Q${c.qNum}: Option A is coded choice ("3 4 1 2")`);
    assert(!optA.includes('Alpha'), `Synthetic Q${c.qNum}: Matching list text NOT inside Option A`);
  }

  console.log('\n========================================================');
  console.log(`  MATCHING BOUNDARY PARSER SUITE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================\n');

  if (failCount > 0) process.exit(1);
}

runMatchingBoundaryAudit().catch(err => {
  console.error('Fatal Matching Boundary Audit Error:', err);
  process.exit(1);
});
