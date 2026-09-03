import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { formatMatchListsInText } from '../frontend/src/utils/questionFormatter';

function runMatchingHeaderSplitSuite() {
  console.log('============================================================');
  console.log('  GENERIC MATCHING TABLE HEADER SPLIT REGRESSION SUITE   ');
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
      name: '"सूची-I ... सूची-II ..." same line',
      input: `सूची-I (संविधान की मदें) सूची-II (देशों से लिया गया)\nA. निदेशक सिद्धांत 1. आयरलैंड\nB. मौलिक अधिकार 2. यूएसए`,
      expectLeft: 'सूची-I (संविधान की मदें)',
      expectRight: 'सूची-II (देशों से लिया गया)'
    },
    {
      id: 'B',
      name: '"List-I ... List-II ..." same line',
      input: `List-I (Constitutional Items) List-II (Source Countries)\nA. Directive Principles 1. Ireland\nB. Fundamental Rights 2. USA`,
      expectLeft: 'List-I (Constitutional Items)',
      expectRight: 'List-II (Source Countries)'
    },
    {
      id: 'C',
      name: 'headers on separate lines',
      input: `सूची-I (संविधान की मदें)\nसूची-II (देशों से लिया गया)\nA. निदेशक सिद्धांत 1. आयरलैंड\nB. मौलिक अधिकार 2. यूएसए`,
      expectLeft: 'सूची-I (संविधान की मदें)',
      expectRight: 'सूची-II (देशों से लिया गया)'
    },
    {
      id: 'D',
      name: 'headers with tabs',
      input: `List-I (Subject)\tList-II (Details)\nA. Item 1 1. Val 1\nB. Item 2 2. Val 2`,
      expectLeft: 'List-I (Subject)',
      expectRight: 'List-II (Details)'
    },
    {
      id: 'E',
      name: 'headers with multiple spaces',
      input: `Column-A (Category)     Column-B (Values)\nA. Cat 1 1. Val 1\nB. Cat 2 2. Val 2`,
      expectLeft: 'Column-A (Category)',
      expectRight: 'Column-B (Values)'
    },
    {
      id: 'F',
      name: 'Column-I / Column-II',
      input: `Column-I (Items) Column-II (Outputs)\nA. X 1. Y\nB. Z 2. W`,
      expectLeft: 'Column-I (Items)',
      expectRight: 'Column-II (Outputs)'
    },
    {
      id: 'G',
      name: 'Hindi headers with parenthetical descriptions',
      input: `सूची-I (भारतीय संविधान के लक्षण) सूची-II (प्राप्त देश)\nA. समवर्ती सूची 1. ऑस्ट्रेलिया\nB. संघवाद 2. कनाडा`,
      expectLeft: 'सूची-I (भारतीय संविधान के लक्षण)',
      expectRight: 'सूची-II (प्राप्त देश)'
    },
    {
      id: 'H',
      name: 'HTML table headers split across cells',
      input: `| सूची-I (संविधान की मदें) | सूची-II (देशों से लिया गया) |\nA. निदेशक सिद्धांत | 1. आयरलैंड\nB. मौलिक अधिकार | 2. यूएसए`,
      expectLeft: 'सूची-I (संविधान की मदें)',
      expectRight: 'सूची-II (देशों से लिया गया)'
    }
  ];

  let overallPass = true;

  testCases.forEach(tc => {
    const formatted = formatMatchListsInText(tc.input);
    const thMatch = formatted.match(/<th[^>]*>\s*([\s\S]*?)\s*<\/th>[\s\S]*?<th[^>]*>\s*([\s\S]*?)\s*<\/th>/i);

    let gotLeft = '';
    let gotRight = '';
    if (thMatch) {
      gotLeft = thMatch[1].replace(/<[^>]+>/g, '').trim();
      gotRight = thMatch[2].replace(/<[^>]+>/g, '').trim();
    }

    const leftPass = gotLeft === tc.expectLeft;
    const rightPass = gotRight === tc.expectRight;
    const noConcatPass = !gotLeft.includes(tc.expectRight) && !gotRight.includes(tc.expectLeft);

    const tcPass = leftPass && rightPass && noConcatPass;

    console.log(`[TEST ${tc.id}] ${tc.name}`);
    console.log(`  Header Left Expected:  "${tc.expectLeft}" | Got: "${gotLeft}" -> ${leftPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Header Right Expected: "${tc.expectRight}" | Got: "${gotRight}" -> ${rightPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  No Concatenation: ${noConcatPass ? '✅ PASS' : '❌ FAIL'}`);
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
    console.log('  MATCHING HEADER SPLIT REGRESSION SUITE: PASS ✅ (8/8 CASES)');
    console.log('============================================================\n');
  } else {
    console.error('\n============================================================');
    console.error('  MATCHING HEADER SPLIT REGRESSION SUITE: FAIL ❌');
    console.error('============================================================\n');
    process.exit(1);
  }
}

runMatchingHeaderSplitSuite();
