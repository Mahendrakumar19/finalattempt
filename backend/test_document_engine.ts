import { AdapterFactory } from './services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';

async function runTests() {
  console.log('====================================================');
  console.log('UNIVERSAL DOCUMENT ENGINE - REGRESSION TEST SUITE');
  console.log('====================================================\n');

  const sampleBilingualDoc = `
CHAPTER 1: INDIAN POLITY & CONSTITUTION

Q1. With reference to the Preamble of the Indian Constitution, consider the following statements:
1. It is based on the Objective Resolution moved by Jawaharlal Nehru.
2. It is non-justiciable in nature.
3. It cannot be amended under Article 368.

Which of the statements given above is/are correct?
(a) 1 and 2 only
(b) 2 and 3 only
(c) 1 and 3 only
(d) 1, 2 and 3
Ans: A
Explanation: The Preamble was amended by the 42nd Constitutional Amendment Act 1976.

प्रश्न 1. भारतीय संविधान की प्रस्तावना के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:
1. यह जवाहरलाल नेहरू द्वारा पेश किए गए उद्देश्य प्रस्ताव पर आधारित है।
2. यह गैर-न्यायिक प्रकृति का है।
3. इसे अनुच्छेद 368 के तहत संशोधित नहीं किया जा सकता है।

उपर्युक्त में से कौन सा/से कथन सही है/हैं?
(क) केवल 1 और 2
(ख) केवल 2 और 3
(ग) केवल 1 और 3
(घ) 1, 2 और 3
उत्तर: A

Q2. Match List-I with List-II:
List-I (Articles)              List-II (Provisions)
A. Article 14                  1. Right to Equality
B. Article 17                  2. Abolition of Untouchability
C. Article 21                  3. Protection of Life & Liberty

Options:
(a) A-1, B-2, C-3
(b) A-2, B-1, C-3
(c) A-3, B-2, C-1
(d) A-1, B-3, C-2
Ans: D
`;

  try {
    const textBuffer = Buffer.from(sampleBilingualDoc, 'utf-8');
    const doc = await AdapterFactory.process(textBuffer, {
      filename: 'POLITY_BILINGUAL_PYQ.txt',
      mimeType: 'text/plain'
    });

    console.log(`✓ AdapterFactory successfully ingested document: ${doc.filename}`);
    console.log(`  - Source Type: ${doc.sourceType}`);
    console.log(`  - Total Pages: ${doc.pages.length}`);
    console.log(`  - Total Blocks: ${doc.pages[0].blocks.length}`);
    console.log(`  - Detected Languages: ${doc.languages.join(', ')}\n`);

    const qnas = await QnaExtractor.extractQna(doc);

    console.log(`✓ QnaExtractor successfully resolved ${qnas.length} unified ExtractedQnA candidates:\n`);

    qnas.forEach((q, idx) => {
      console.log(`----------------------------------------------------`);
      console.log(`LOGICAL QUESTION #${idx + 1} (Canonical Q# ${q.questionNumber})`);
      console.log(`----------------------------------------------------`);
      console.log(`Question Type: ${q.questionType}`);
      console.log(`Languages Present: ${q.question.versions.map(v => v.language.toUpperCase()).join(' + ')}`);

      q.question.versions.forEach(v => {
        console.log(`\n[Question Text - ${v.language.toUpperCase()}]`);
        console.log(`"${v.text}"`);
      });

      if (q.question.statements && q.question.statements.length > 0) {
        console.log(`\nStatements (${q.question.statements.length}):`);
        q.question.statements.forEach(s => {
          const stmtText = s.versions.map(v => `[${v.language.toUpperCase()}] ${v.text}`).join(' | ');
          console.log(`  ${s.number}. ${stmtText}`);
        });
      }

      if (q.question.matching) {
        console.log(`\nMatching Left List (${q.question.matching.leftList.length}):`);
        q.question.matching.leftList.forEach(item => {
          const itemText = item.versions.map(v => `[${v.language.toUpperCase()}] ${v.text}`).join(' | ');
          console.log(`  ${item.label}. ${itemText}`);
        });

        console.log(`\nMatching Right List (${q.question.matching.rightList.length}):`);
        q.question.matching.rightList.forEach(item => {
          const itemText = item.versions.map(v => `[${v.language.toUpperCase()}] ${v.text}`).join(' | ');
          console.log(`  ${item.label}. ${itemText}`);
        });
      }

      console.log(`\nOptions (${q.options.length}):`);
      q.options.forEach(o => {
        const optText = o.versions.map(v => `[${v.language.toUpperCase()}] ${v.text}`).join(' | ');
        console.log(`  ${o.label}. ${optText}`);
      });

      console.log(`\nAnswer: ${q.answer.values.join(', ') || 'None'} (Conflict: ${q.answer.hasConflict ? 'YES - ' + q.answer.conflictDetails : 'NO'})`);
      
      if (q.explanation.versions.length > 0) {
        console.log(`\nExplanations:`);
        q.explanation.versions.forEach(e => {
          console.log(`  [${e.language.toUpperCase()}] "${e.text}"`);
        });
      }

      console.log(`\nConfidence Scores:`);
      console.log(`  - Overall: ${Math.round(q.confidence.overall * 100)}%`);
      console.log(`  - Question: ${Math.round(q.confidence.question * 100)}%`);
      console.log(`  - Options: ${Math.round(q.confidence.options * 100)}%`);
      console.log(`  - Answer: ${Math.round(q.confidence.answer * 100)}%`);
      console.log(`  - Bilingual Alignment: ${q.confidence.bilingualAlignment !== null ? Math.round(q.confidence.bilingualAlignment * 100) + '%' : 'NOT_APPLICABLE'}`);

      console.log(`\nValidation Status: ${q.validation.status}`);
      if (q.validation.warnings.length > 0) {
        console.log(`Warnings: ${q.validation.warnings.join('; ')}`);
      }
      console.log('');
    });

    // Mandatory Negative Assertions
    console.log('====================================================');
    console.log('RUNNING MANDATORY REGRESSION ASSERTIONS');
    console.log('====================================================');

    const q1 = qnas.find(q => q.questionNumber === 1);
    if (!q1) throw new Error('Assertion Failed: Question 1 missing');
    if (q1.questionType !== 'STATEMENT_BASED') throw new Error(`Assertion Failed: Q1 type is ${q1.questionType}, expected STATEMENT_BASED`);
    if (!q1.question.statements || q1.question.statements.length !== 3) throw new Error(`Assertion Failed: Q1 statements count is ${q1.question.statements?.length}, expected 3`);
    if (q1.options.length !== 4) throw new Error(`Assertion Failed: Q1 options count is ${q1.options.length}, expected 4`);
    console.log('✓ PASS: Question 1 (Statement-based) separated 3 statements from 4 explicit options.');

    const q2 = qnas.find(q => q.questionNumber === 2);
    if (!q2) throw new Error('Assertion Failed: Question 2 missing');
    if (q2.questionType !== 'MATCHING') throw new Error(`Assertion Failed: Q2 type is ${q2.questionType}, expected MATCHING`);
    if (!q2.question.matching) throw new Error('Assertion Failed: Q2 matching structure is missing');
    if (q2.question.matching.leftList.length !== 3) throw new Error(`Assertion Failed: Q2 leftList count is ${q2.question.matching.leftList.length}, expected 3`);
    if (q2.question.matching.rightList.length !== 3) throw new Error(`Assertion Failed: Q2 rightList count is ${q2.question.matching.rightList.length}, expected 3`);
    if (q2.options.length !== 4) throw new Error(`Assertion Failed: Q2 options count is ${q2.options.length}, expected 4`);

    // Ensure matching table row text ("Article 14") does NOT appear in options[]
    const optHasTableRowText = q2.options.some(o => o.versions.some(v => v.text.includes('Article 14') || v.text.includes('Right to Equality')));
    if (optHasTableRowText) throw new Error('Assertion Failed: Matching table row text leaked into options[]');
    console.log('✓ PASS: Question 2 (Matching) separated Left List (3) & Right List (3) from 4 coded options.');
    console.log('✓ PASS: No matching table rows were incorrectly leaked into options[].');

    console.log('\n====================================================');
    console.log('ALL MANDATORY REGRESSION ASSERTIONS PASSED 100%');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runTests();
