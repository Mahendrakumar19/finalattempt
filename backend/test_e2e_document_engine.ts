import { AdapterFactory } from './services/documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';
import { StagingService } from './services/documentEngine/staging/StagingService';
import { LmsCommitService } from './services/documentEngine/commit/LmsCommitService';
import { getLocalStore } from './db';

async function runE2eTest() {
  console.log('====================================================');
  console.log('END-TO-END MANDATORY PIPELINE INTEGRATION TEST');
  console.log('====================================================\n');

  // Reset local store for clean test isolation
  const store = getLocalStore();
  store.documentImports = [];
  store.documentQnas = [];
  store.lmsQuizzes = [];
  store.lmsQuestions = [];
  const sampleE2eDoc = `
CHAPTER 1: INDIAN POLITY & GOVERNANCE

Q1. Which of the following is a Fundamental Right guaranteed by the Constitution of India?
(a) Right to Property
(b) Right to Equality
(c) Right to Work
(d) Right to Free Trade
Ans: B
Explanation: Right to Equality is guaranteed under Articles 14-18.

Q2. With reference to the Preamble of the Indian Constitution, consider the following statements:
1. It is based on the Objective Resolution moved by Jawaharlal Nehru.
2. It is non-justiciable in nature.
3. It cannot be amended under Article 368.

Which of the statements given above is/are correct?
(a) 1 and 2 only
(b) 2 and 3 only
(c) 1 and 3 only
(d) 1, 2 and 3
Ans: A

Q3. Match List-I with List-II:
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

प्रश्न 1. भारतीय संविधान द्वारा गारंटीकृत निम्नलिखित में से कौन सा एक मौलिक अधिकार है?
(क) संपत्ति का अधिकार
(ख) समानता का अधिकार
(ग) काम करने का अधिकार
(घ) मुक्त व्यापार का अधिकार
उत्तर: B
`;

  try {
    // 1. Upload & Create Staging Import Record
    console.log('Step 1: Creating Staging Import Record...');
    const textBuffer = Buffer.from(sampleE2eDoc, 'utf-8');
    const impRecord = await StagingService.createImport({
      adminId: 'test-admin',
      filename: 'POLITY_E2E_TEST.txt',
      sourceType: 'TXT',
      mimeType: 'text/plain',
      fileSize: textBuffer.length
    });

    console.log(`✓ Created Import Record: ID ${impRecord.id}, Status: ${impRecord.status}`);

    // 2. Ingestion & Document Processing
    console.log('\nStep 2: Ingesting & Extracting QnA Candidates...');
    const doc = await AdapterFactory.process(textBuffer, {
      filename: impRecord.filename,
      mimeType: impRecord.mimeType
    });

    const qnas = await QnaExtractor.extractQna(doc);
    console.log(`✓ Extracted & Aligned ${qnas.length} logical QnA candidates.`);

    // Assert document-level language detection
    if (doc.documentLanguage !== 'BILINGUAL' && doc.documentLanguage !== 'ENGLISH') {
      throw new Error(`Document language detected as ${doc.documentLanguage}`);
    }
    console.log(`  - Document Language: ${doc.documentLanguage}`);

    // 3. Persist Staging Records
    console.log('\nStep 3: Staging QnAs into Persistent Storage...');
    const stagedRecords = await StagingService.saveStagedQnas(impRecord.id, qnas);
    console.log(`✓ Staged ${stagedRecords.length} QnA records into staging storage.`);

    // Verify Staging Persistence
    const fetchedStaged = await StagingService.getStagedQnas(impRecord.id);
    if (fetchedStaged.length !== qnas.length) {
      throw new Error(`Staging verification failed: Staged count ${fetchedStaged.length} != ${qnas.length}`);
    }
    console.log(`✓ Verified Staging Persistence: ${fetchedStaged.length} QnAs retrieved cleanly.`);

    // 4. Admin Review & Approval Simulation
    console.log('\nStep 4: Admin Review & Approval Simulation...');
    for (const stg of fetchedStaged) {
      await StagingService.updateStagedQna(stg.id, 'APPROVE', undefined, 'test-admin');
    }

    const approvedStaged = await StagingService.getStagedQnas(impRecord.id);
    const approvedCount = approvedStaged.filter(q => q.reviewStatus === 'APPROVED').length;
    console.log(`✓ Approved ${approvedCount} of ${approvedStaged.length} staged QnAs.`);

    // 5. Controlled LMS Database Commit
    console.log('\nStep 5: Executing Transactional LMS Database Commit...');
    const commitResult = await LmsCommitService.commitImport(impRecord.id, {
      quizTitle: 'POLITY E2E Test Quiz',
      courseId: 'course-polity-e2e',
      lessonId: 'lesson-e2e-1',
      adminId: 'test-admin'
    });

    if (!commitResult.success) {
      throw new Error(`Commit failed: ${commitResult.error}`);
    }

    console.log(`✓ LMS Commit Succeeded! Created Quiz ID: ${commitResult.quizId}, Committed Questions: ${commitResult.totalCommitted}`);

    // Verify LMS Question Schema Mapping
    const store = getLocalStore();
    const quiz = store.lmsQuizzes?.find(q => q.id === commitResult.quizId);
    const questions = store.lmsQuestions?.filter(q => q.quizId === commitResult.quizId);

    if (!quiz) throw new Error('LMS Quiz Record not found in store');
    if (!questions || questions.length !== commitResult.totalCommitted) {
      throw new Error(`LMS Questions count mismatch: expected ${commitResult.totalCommitted}, got ${questions?.length}`);
    }

    console.log(`✓ Verified LMS Schema Mapping: Quiz "${quiz.title}" contains ${questions.length} questions.`);

    const q1 = questions.find(q => q.orderIndex === 1);
    if (!q1) throw new Error('Question #1 missing in committed LMS questions');
    if (!q1.questionTextHi || !q1.optionBHi) {
      throw new Error('Question #1 missing Hindi bilingual mapped columns (questionTextHi / optionBHi)');
    }
    console.log(`✓ Verified Bilingual Column Mapping: Q1 EN="${q1.questionText.slice(0, 30)}..." | HI="${q1.questionTextHi.slice(0, 30)}..."`);

    const q3 = questions.find(q => q.orderIndex === 3);
    if (!q3) throw new Error('Question #3 missing in committed LMS questions');
    if (!q3.matchingData) throw new Error('Question #3 missing structured matchingData');
    console.log('✓ Verified MATCHING Question Schema: Q3 matchingData present & structured.');

    // 6. Idempotency Test (Retrying commit must not create duplicate questions)
    console.log('\nStep 6: Testing Commit Idempotency...');
    const retryCommit = await LmsCommitService.commitImport(impRecord.id, {
      quizTitle: 'POLITY E2E Test Quiz Retry',
      adminId: 'test-admin'
    });

    if (retryCommit.success) {
      throw new Error('Idempotency Failed: Retry commit succeeded when all QnAs were already committed!');
    }
    console.log(`✓ Pass: Idempotency Verified (${retryCommit.error})`);

    console.log('\n====================================================');
    console.log('MANDATORY END-TO-END PIPELINE TEST PASSED 100%');
    console.log('====================================================');
  } catch (err: any) {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  }
}

runE2eTest();
