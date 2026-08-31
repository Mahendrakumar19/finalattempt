import { mysqlPool, getLocalStore, saveLocalStore } from '../../../db';
import { ExtractedQnA } from '../core/ExtractedQnA';
import { v4 as uuidv4 } from 'uuid';

export type ImportState =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'EXTRACTING'
  | 'OCR_PROCESSING'
  | 'RESOLVING'
  | 'VALIDATING'
  | 'REVIEW_READY'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface DocumentImportRecord {
  id: string;
  adminId: string;
  filename: string;
  sourceType: string;
  mimeType: string;
  fileSize: number;
  storageReference?: string;
  status: ImportState;
  progress: number;
  totalPages: number;
  processedPages: number;
  questionsDetected: number;
  questionsReady: number;
  questionsReview: number;
  questionsFailed: number;
  createdAt: string;
  updatedAt: string;
}

export interface StagedQnaRecord {
  id: string;
  importId: string;
  questionNumber: number;
  questionType: string;
  data: ExtractedQnA;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED';
  reviewedData?: ExtractedQnA;
  validationStatus: 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'ERROR';
  isDuplicateCandidate: boolean;
  duplicateMatchId?: string;
  duplicateSimilarityScore?: number;
  committedQuizId?: string;
  committedQuestionId?: string;
  committedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class StagingService {
  /**
   * Create a new Document Import record
   */
  static async createImport(data: {
    adminId: string;
    filename: string;
    sourceType: string;
    mimeType: string;
    fileSize: number;
    storageReference?: string;
  }): Promise<DocumentImportRecord> {
    const id = `imp-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const record: DocumentImportRecord = {
      id,
      adminId: data.adminId || 'admin',
      filename: data.filename,
      sourceType: data.sourceType,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      storageReference: data.storageReference,
      status: 'UPLOADED',
      progress: 0,
      totalPages: 1,
      processedPages: 0,
      questionsDetected: 0,
      questionsReady: 0,
      questionsReview: 0,
      questionsFailed: 0,
      createdAt: now,
      updatedAt: now
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO document_imports 
           (id, adminId, filename, sourceType, mimeType, fileSize, storageReference, status, progress, totalPages, processedPages, questionsDetected, questionsReady, questionsReview, questionsFailed, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.id, record.adminId, record.filename, record.sourceType, record.mimeType,
            record.fileSize, record.storageReference || null, record.status, record.progress,
            record.totalPages, record.processedPages, record.questionsDetected, record.questionsReady,
            record.questionsReview, record.questionsFailed, record.createdAt, record.updatedAt
          ]
        );
      } catch (err) {
        console.warn('[StagingService] MySQL insert failed, saving to local store:', err);
      }
    }

    const store = getLocalStore();
    if (!store.documentImports) store.documentImports = [];
    store.documentImports.push(record);
    saveLocalStore(store);

    await this.logAudit(id, 'UPLOAD', data.adminId || 'admin', `Created import for file ${data.filename}`);
    return record;
  }

  private static readonly VALID_TRANSITIONS: Record<ImportState, ImportState[]> = {
    UPLOADED: ['ANALYZING', 'EXTRACTING', 'VALIDATING', 'REVIEW_READY', 'CANCELLED', 'FAILED'],
    ANALYZING: ['EXTRACTING', 'OCR_PROCESSING', 'CANCELLED', 'FAILED'],
    EXTRACTING: ['RESOLVING', 'VALIDATING', 'REVIEW_READY', 'CANCELLED', 'FAILED'],
    OCR_PROCESSING: ['EXTRACTING', 'CANCELLED', 'FAILED'],
    RESOLVING: ['VALIDATING', 'REVIEW_READY', 'CANCELLED', 'FAILED'],
    VALIDATING: ['REVIEW_READY', 'CANCELLED', 'FAILED'],
    REVIEW_READY: ['IMPORTING', 'COMPLETED', 'CANCELLED', 'FAILED'],
    IMPORTING: ['COMPLETED', 'FAILED'],
    COMPLETED: [], // Terminal state
    FAILED: ['ANALYZING', 'EXTRACTING', 'VALIDATING'], // Retry allowed
    CANCELLED: []  // Terminal state
  };

  /**
   * Update Import status & progress metrics with state machine validation
   */
  static async updateImportStatus(
    id: string,
    status: ImportState,
    updates: Partial<DocumentImportRecord> = {}
  ): Promise<void> {
    const currentImport = await this.getImport(id);

    if (currentImport && currentImport.status !== status) {
      const allowedNextStates = this.VALID_TRANSITIONS[currentImport.status] || [];
      if (!allowedNextStates.includes(status)) {
        throw new Error(`Invalid state transition from ${currentImport.status} to ${status}`);
      }
    }

    const now = new Date().toISOString();

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `UPDATE document_imports SET 
           status = ?, 
           progress = COALESCE(?, progress),
           totalPages = COALESCE(?, totalPages),
           processedPages = COALESCE(?, processedPages),
           questionsDetected = COALESCE(?, questionsDetected),
           questionsReady = COALESCE(?, questionsReady),
           questionsReview = COALESCE(?, questionsReview),
           questionsFailed = COALESCE(?, questionsFailed),
           updatedAt = ?
           WHERE id = ?`,
          [
            status, updates.progress, updates.totalPages, updates.processedPages,
            updates.questionsDetected, updates.questionsReady, updates.questionsReview,
            updates.questionsFailed, now, id
          ]
        );
      } catch (err: any) {
        console.error('[StagingService] MySQL update failed:', err);
      }
    }

    const store = getLocalStore();
    if (store.documentImports) {
      const imp = store.documentImports.find(i => i.id === id);
      if (imp) {
        imp.status = status;
        imp.updatedAt = now;
        Object.assign(imp, updates);
        saveLocalStore(store);
      }
    }
  }

  /**
   * Save extracted QnAs into staging records
   */
  static async saveStagedQnas(importId: string, qnas: ExtractedQnA[]): Promise<StagedQnaRecord[]> {
    const stagedRecords: StagedQnaRecord[] = [];
    const now = new Date().toISOString();

    let readyCount = 0;
    let reviewCount = 0;
    let failedCount = 0;

    for (const qna of qnas) {
      const stagedId = `stg-${uuidv4().substring(0, 8)}`;
      qna.stagingId = stagedId;

      let vStatus: 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'ERROR' = qna.validation?.status || 'PASS';
      if (qna.answer?.hasConflict) vStatus = 'REVIEW_REQUIRED';
      if (qna.questionType === 'ASSERTION_REASON' || qna.questionType === 'UNKNOWN') vStatus = 'REVIEW_REQUIRED';
      if (!qna.options || qna.options.length < 2) vStatus = 'REVIEW_REQUIRED';

      if (vStatus === 'PASS') readyCount++;
      else if (vStatus === 'WARNING' || vStatus === 'REVIEW_REQUIRED') reviewCount++;
      else if (vStatus === 'ERROR') failedCount++;

      const record: StagedQnaRecord = {
        id: stagedId,
        importId,
        questionNumber: qna.questionNumber,
        questionType: qna.questionType,
        data: qna,
        reviewStatus: 'PENDING',
        validationStatus: vStatus,
        isDuplicateCandidate: !!qna.isDuplicateCandidate,
        duplicateMatchId: qna.duplicateMatchId,
        duplicateSimilarityScore: qna.duplicateSimilarityScore,
        createdAt: now,
        updatedAt: now
      };

      stagedRecords.push(record);

      if (mysqlPool) {
        try {
          await mysqlPool.query(
            `INSERT INTO document_qnas 
             (id, importId, questionNumber, questionType, data, reviewStatus, validationStatus, isDuplicateCandidate, duplicateMatchId, duplicateSimilarityScore, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              record.id, record.importId, record.questionNumber, record.questionType,
              JSON.stringify(record.data), record.reviewStatus, record.validationStatus,
              record.isDuplicateCandidate ? 1 : 0, record.duplicateMatchId || null,
              record.duplicateSimilarityScore || 0.0, record.createdAt, record.updatedAt
            ]
          );
        } catch (_) {}
      }
    }

    const store = getLocalStore();
    if (!store.documentQnas) store.documentQnas = [];
    store.documentQnas.push(...stagedRecords);
    saveLocalStore(store);

    await this.updateImportStatus(importId, 'REVIEW_READY', {
      progress: 100,
      questionsDetected: qnas.length,
      questionsReady: readyCount,
      questionsReview: reviewCount,
      questionsFailed: failedCount
    });

    return stagedRecords;
  }

  /**
   * Get Import Details by ID
   */
  static async getImport(id: string): Promise<DocumentImportRecord | null> {
    const store = getLocalStore();
    if (store.documentImports) {
      const imp = store.documentImports.find(i => i.id === id);
      if (imp) return imp;
    }

    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM document_imports WHERE id = ?', [id]);
        if (rows && rows.length > 0) return rows[0] as DocumentImportRecord;
      } catch (_) {}
    }

    return null;
  }

  /**
   * Get Staged QnAs for an Import ID
   */
  static async getStagedQnas(importId: string): Promise<StagedQnaRecord[]> {
    const store = getLocalStore();
    if (store.documentQnas) {
      const qnas = store.documentQnas.filter(q => q.importId === importId);
      if (qnas && qnas.length > 0) return qnas;
    }

    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM document_qnas WHERE importId = ? ORDER BY questionNumber ASC', [importId]);
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r,
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
            reviewedData: r.reviewedData ? (typeof r.reviewedData === 'string' ? JSON.parse(r.reviewedData) : r.reviewedData) : undefined,
            isDuplicateCandidate: !!r.isDuplicateCandidate
          }));
        }
      } catch (_) {}
    }

    return [];
  }

  /**
   * Update Staged QnA Review Status or Admin Edits
   */
  static async updateStagedQna(
    qnaId: string,
    action: 'APPROVE' | 'REJECT' | 'EDIT',
    reviewedData?: ExtractedQnA,
    adminId: string = 'admin'
  ): Promise<StagedQnaRecord | null> {
    const now = new Date().toISOString();
    const store = getLocalStore();
    let record: StagedQnaRecord | null = null;

    if (store.documentQnas) {
      const q = store.documentQnas.find(q => q.id === qnaId);
      if (q) {
        if (action === 'APPROVE') q.reviewStatus = 'APPROVED';
        else if (action === 'REJECT') q.reviewStatus = 'REJECTED';
        else if (action === 'EDIT' && reviewedData) {
          q.reviewStatus = 'EDITED';
          q.reviewedData = reviewedData;
        }
        q.updatedAt = now;
        saveLocalStore(store);
        record = q;
      }
    }

    if (mysqlPool && record) {
      try {
        await mysqlPool.query(
          `UPDATE document_qnas SET reviewStatus = ?, reviewedData = ?, updatedAt = ? WHERE id = ?`,
          [record.reviewStatus, record.reviewedData ? JSON.stringify(record.reviewedData) : null, now, qnaId]
        );
      } catch (_) {}
    }

    if (record) {
      await this.logAudit(record.importId, `${action}_QNA`, adminId, `Updated QnA #${record.questionNumber} to ${action}`);
    }

    return record;
  }

  /**
   * Log an audit event
   */
  static async logAudit(importId: string, action: string, performedBy: string, details?: string): Promise<void> {
    const id = `aud-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO document_import_audit_logs (id, importId, action, performedBy, details, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, importId, action, performedBy, details || null, now]
        );
      } catch (_) {}
    }

    const store = getLocalStore();
    if (!store.documentAuditLogs) store.documentAuditLogs = [];
    store.documentAuditLogs.push({ id, importId, action, performedBy, details, createdAt: now });
    saveLocalStore(store);
  }
}
