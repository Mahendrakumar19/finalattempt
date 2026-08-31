import { mysqlPool, getLocalStore, saveLocalStore } from '../../../db';
import { ExtractedQnA } from '../core/ExtractedQnA';
import { StagingService, StagedQnaRecord } from '../staging/StagingService';
import { v4 as uuidv4 } from 'uuid';

export interface CommitOptions {
  quizTitle?: string;
  courseId?: string;
  lessonId?: string;
  adminId?: string;
  autoApprovePass?: boolean;
  isFree?: boolean;
  isFirstTestFree?: boolean;
}

export interface CommitResult {
  success: boolean;
  quizId: string;
  totalCommitted: number;
  committedQuestionIds: string[];
  error?: string;
}

export class LmsCommitService {
  private static activeCommitLocks = new Set<string>();

  /**
   * Main entry point: Commits approved QnAs from an Import ID into lms_quizzes and lms_questions
   */
  static async commitImport(importId: string, options: CommitOptions = {}): Promise<CommitResult> {
    if (this.activeCommitLocks.has(importId)) {
      return { success: false, quizId: '', totalCommitted: 0, committedQuestionIds: [], error: 'ALREADY_COMMITTED_OR_IN_PROGRESS' };
    }
    this.activeCommitLocks.add(importId);

    try {
      return await this.executeCommit(importId, options);
    } finally {
      this.activeCommitLocks.delete(importId);
    }
  }

  private static async executeCommit(importId: string, options: CommitOptions = {}): Promise<CommitResult> {
    const adminId = options.adminId || 'admin';
    const stagedQnas = await StagingService.getStagedQnas(importId);

    if (stagedQnas.length === 0) {
      return { success: false, quizId: '', totalCommitted: 0, committedQuestionIds: [], error: 'No staged QnAs found for import' };
    }

    // Filter approved or auto-approved QnAs
    const eligibleQnas = stagedQnas.filter(stg => {
      if (stg.committedQuizId) return false; // Skip already committed QnAs (Idempotency)
      if (stg.reviewStatus === 'REJECTED') return false; // REJECTED QnAs MUST NOT be committed
      if (stg.validationStatus === 'ERROR') return false; // ERROR QnAs MUST NOT be committed
      if (stg.reviewStatus === 'APPROVED' || stg.reviewStatus === 'EDITED') return true;
      if (options.autoApprovePass && stg.validationStatus === 'PASS') return true;
      return false;
    });

    if (eligibleQnas.length === 0) {
      return {
        success: false,
        quizId: '',
        totalCommitted: 0,
        committedQuestionIds: [],
        error: 'No approved QnAs eligible for commit. Please approve QnAs in the admin review dashboard first.'
      };
    }

    const imp = await StagingService.getImport(importId);
    if (!imp) {
      return { success: false, quizId: '', totalCommitted: 0, committedQuestionIds: [], error: 'Import record not found' };
    }
    if (imp.status === 'COMPLETED' || imp.status === 'IMPORTING') {
      return { success: false, quizId: '', totalCommitted: 0, committedQuestionIds: [], error: 'ALREADY_COMMITTED_OR_IN_PROGRESS' };
    }

    // Lock import status atomically
    await StagingService.updateImportStatus(importId, 'IMPORTING');

    const quizId = `qz-imp-${uuidv4().substring(0, 8)}`;
    const quizTitle = options.quizTitle || (imp ? `Imported: ${imp.filename}` : 'Imported Question Bank Quiz');
    const courseId = options.courseId || 'course-polity-101';
    const lessonId = options.lessonId || 'lesson-1';
    const now = new Date().toISOString();

    const committedQuestionIds: string[] = [];

    // MySQL Transactional Commit Execution
    if (mysqlPool) {
      const connection = await mysqlPool.getConnection();
      try {
        await connection.beginTransaction();

        const isFreeVal = options.isFree || options.isFirstTestFree ? 1 : 0;
        const isFirstTestFreeVal = options.isFirstTestFree ? 1 : 0;

        // 1. Insert Quiz Master Record into lms_quizzes (Defaults to DRAFT mode: isPublished = 0)
        await connection.query(
          `INSERT INTO lms_quizzes (id, courseId, lessonId, title, description, timeLimitMins, passingScore, isPublished, isFree, isFirstTestFree)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [quizId, courseId, lessonId, quizTitle, `Auto-generated from Import ${importId}`, 30, 40.0, 0, isFreeVal, isFirstTestFreeVal]
        );

        // 2. Insert Question Records into lms_questions preserving source order
        for (const stg of eligibleQnas) {
          const qna: ExtractedQnA = stg.reviewedData || stg.data;
          const mapped = this.canonicalizeToLms(qna, quizId);

          await connection.query(
            `INSERT INTO lms_questions 
             (id, quizId, questionText, optionA, optionB, optionC, optionD, optionE, correctAnswer, explanation, questionTextHi, optionAHi, optionBHi, optionCHi, optionDHi, optionEHi, explanationHi, marks, negativeMarks, orderIndex)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              mapped.id, mapped.quizId, mapped.questionText, mapped.optionA, mapped.optionB,
              mapped.optionC, mapped.optionD, mapped.optionE || null, mapped.correctAnswer, mapped.explanation || null,
              mapped.questionTextHi || null, mapped.optionAHi || null, mapped.optionBHi || null,
              mapped.optionCHi || null, mapped.optionDHi || null, mapped.optionEHi || null, mapped.explanationHi || null,
              1.0, 0.33, mapped.orderIndex
            ]
          );

          // Update staging record commit traceability
          await connection.query(
            `UPDATE document_qnas SET committedQuizId = ?, committedQuestionId = ?, committedAt = ?, reviewStatus = 'APPROVED' WHERE id = ?`,
            [quizId, mapped.id, now, stg.id]
          );

          committedQuestionIds.push(mapped.id);
        }

        // 3. Update Import Status to COMPLETED
        await connection.query(
          `UPDATE document_imports SET status = 'COMPLETED', progress = 100, updatedAt = ? WHERE id = ?`,
          [now, importId]
        );

        await connection.commit();
        connection.release();

        await StagingService.logAudit(importId, 'COMMIT_LMS', adminId, `Committed ${committedQuestionIds.length} questions to LMS Quiz ${quizId}`);

        return {
          success: true,
          quizId,
          totalCommitted: committedQuestionIds.length,
          committedQuestionIds
        };
      } catch (txnErr: any) {
        await connection.rollback();
        connection.release();
        await StagingService.updateImportStatus(importId, 'REVIEW_READY');
        console.error('[LmsCommitService] Transaction failed & rolled back cleanly:', txnErr);
        return {
          success: false,
          quizId: '',
          totalCommitted: 0,
          committedQuestionIds: [],
          error: `Database transaction failed: ${txnErr.message}`
        };
      }
    }

    // Local JSON Store Commit Fallback
    const store = getLocalStore();
    if (!store.lmsQuizzes) store.lmsQuizzes = [];
    if (!store.lmsQuestions) store.lmsQuestions = [];

    store.lmsQuizzes.push({
      id: quizId,
      courseId,
      lessonId,
      title: quizTitle,
      description: `Auto-generated from Import ${importId}`,
      timeLimitMins: 30,
      passingScore: 40.0,
      isPublished: false,
      isFree: !!(options.isFree || options.isFirstTestFree),
      isFirstTestFree: !!options.isFirstTestFree,
      createdAt: now
    });

    for (const stg of eligibleQnas) {
      const qna: ExtractedQnA = stg.reviewedData || stg.data;
      const mapped = this.canonicalizeToLms(qna, quizId);
      store.lmsQuestions.push(mapped);
      stg.committedQuizId = quizId;
      stg.committedQuestionId = mapped.id;
      stg.committedAt = now;
      stg.reviewStatus = 'APPROVED';
      committedQuestionIds.push(mapped.id);
    }

    saveLocalStore(store);
    await StagingService.updateImportStatus(importId, 'COMPLETED', { progress: 100 });
    await StagingService.logAudit(importId, 'COMMIT_LMS', adminId, `Committed ${committedQuestionIds.length} questions to local store Quiz ${quizId}`);

    return {
      success: true,
      quizId,
      totalCommitted: committedQuestionIds.length,
      committedQuestionIds
    };
  }

  /**
   * Maps language-neutral ExtractedQnA into existing LMS schema (questionText, questionTextHi, optionA-D, optionAHi-DHi, correctAnswer, explanation)
   */
  private static canonicalizeToLms(qna: ExtractedQnA, quizId: string) {
    const id = `q-${uuidv4().substring(0, 8)}`;
    const enQVersion = qna.question.versions.find(v => v.language === 'en') || qna.question.versions[0];
    const hiVer = qna.question.versions.find(v => v.language === 'hi') || (qna.question.versions.length > 1 ? qna.question.versions[1] : undefined);

    // Handle Statement-Based questions: append formatted statements to questionText if present
    let questionText = enQVersion?.text || `Question ${qna.questionNumber}`;
    if (qna.question.statements && qna.question.statements.length > 0) {
      const stmtsText = qna.question.statements
        .map(s => {
          const v = s.versions.find(ver => ver.language === 'en') || s.versions[0];
          return `${s.number}. ${v?.text || ''}`;
        })
        .join('\n');
      if (!questionText.includes(stmtsText)) {
        questionText = `${questionText}\n\n${stmtsText}`;
      }
    }

    let questionTextHi = (hiVer && hiVer.text && hiVer.text !== enQVersion?.text) ? hiVer.text : undefined;
    if (questionTextHi && qna.question.statements && qna.question.statements.length > 0) {
      const stmtsTextHi = qna.question.statements
        .map(s => {
          const v = s.versions.find(ver => ver.language === 'hi') || (s.versions.length > 1 ? s.versions[1] : s.versions[0]);
          return `${s.number}. ${v?.text || ''}`;
        })
        .join('\n');
      if (!questionTextHi.includes(stmtsTextHi)) {
        questionTextHi = `${questionTextHi}\n\n${stmtsTextHi}`;
      }
    }

    // Map Options A, B, C, D
    const getEnOptText = (lbl: string) => {
      const opt = qna.options.find(o => o.label === lbl);
      if (!opt) return 'N/A';
      const v = opt.versions.find(ver => ver.language === 'en') || opt.versions[0];
      return v?.text || 'N/A';
    };

    const getHiOptText = (lbl: string) => {
      const opt = qna.options.find(o => o.label === lbl);
      if (!opt) return undefined;
      const enText = getEnOptText(lbl);
      const hV = opt.versions.find(ver => ver.language === 'hi');
      if (hV && hV.text && hV.text.trim() !== enText.trim()) return hV.text.trim();
      if (opt.versions.length > 1 && opt.versions[1]?.text && opt.versions[1].text.trim() !== enText.trim()) return opt.versions[1].text.trim();
      return undefined;
    };

    // Correct Answer Letter ('A', 'B', 'C', 'D', 'E') - NEVER default to A
    const rawAnsLetter = qna.answer.values[0] || '';
    const correctAnswer = ['A', 'B', 'C', 'D', 'E'].includes(rawAnsLetter.toUpperCase()) ? rawAnsLetter.toUpperCase() : null;

    const enExp = qna.explanation.versions.find(v => v.language === 'en') || qna.explanation.versions[0];
    const hiExp = qna.explanation.versions.find(v => v.language === 'hi');

    return {
      id,
      quizId,
      questionText,
      questionImageUrl: qna.question.imageUrl || (qna as any).imageUrl || undefined,
      images: qna.question.images || undefined,
      optionA: getEnOptText('A'),
      optionB: getEnOptText('B'),
      optionC: getEnOptText('C'),
      optionD: getEnOptText('D'),
      optionE: getEnOptText('E') !== 'N/A' ? getEnOptText('E') : undefined,
      correctAnswer,
      explanation: enExp?.text || undefined,
      questionTextHi: questionTextHi || undefined,
      optionAHi: getHiOptText('A'),
      optionBHi: getHiOptText('B'),
      optionCHi: getHiOptText('C'),
      optionDHi: getHiOptText('D'),
      optionEHi: getHiOptText('E'),
      explanationHi: hiExp?.text || undefined,
      matchingData: qna.question.matching || undefined,
      tableData: qna.question.tableData || undefined,
      marks: 1.0,
      negativeMarks: 0.33,
      orderIndex: qna.questionNumber
    };
  }
}
