import fs from 'fs';
import path from 'path';

export interface ImportRunOptions {
  mode: 'dry-run' | 'import' | 'verify';
  gateJsonPath?: string;
}

export interface ImportRunResult {
  mode: string;
  totalSourceQuestions: number;
  importCandidates: number;
  skippedStructuralReview: number;
  readyQuestions: number;
  answerPendingQuestions: number;
  databaseInserts: number;
  success: boolean;
  message: string;
}

export class QuestionBankImporter {
  public static async run(options: ImportRunOptions): Promise<ImportRunResult> {
    const jsonPath = options.gateJsonPath || path.join(__dirname, '..', '..', '..', 'phase5_pre_import_gate.json');

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Gate JSON file not found at: ${jsonPath}`);
    }

    const gateData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const records: any[] = gateData.records || [];

    const totalSourceQuestions = records.length;
    let importCandidates = 0;
    let skippedStructuralReview = 0;
    let readyQuestions = 0;
    let answerPendingQuestions = 0;
    let databaseInserts = 0;

    records.forEach((rec) => {
      if (rec.importToQuestionBank === 'YES') {
        importCandidates++;
        if (rec.publishStatus === 'READY') {
          readyQuestions++;
        } else if (rec.publishStatus === 'ANSWER_PENDING') {
          answerPendingQuestions++;
        }
      } else {
        skippedStructuralReview++;
      }
    });

    if (options.mode === 'dry-run') {
      // In dry-run mode, NO database inserts are executed.
      databaseInserts = 0;
      return {
        mode: 'dry-run',
        totalSourceQuestions,
        importCandidates,
        skippedStructuralReview,
        readyQuestions,
        answerPendingQuestions,
        databaseInserts,
        success: true,
        message: 'Dry-run executed successfully. Zero database writes performed.'
      };
    } else if (options.mode === 'verify') {
      const isValid = (importCandidates === 240) && (skippedStructuralReview === 6) && (readyQuestions === 11) && (answerPendingQuestions === 229);
      return {
        mode: 'verify',
        totalSourceQuestions,
        importCandidates,
        skippedStructuralReview,
        readyQuestions,
        answerPendingQuestions,
        databaseInserts: 0,
        success: isValid,
        message: isValid ? 'Dataset verification passed.' : 'Dataset verification failed!'
      };
    } else {
      // Import mode (Blocked until explicit controlled trigger)
      throw new Error('Real database import mode is currently locked in Phase 6 pre-import stage.');
    }
  }
}
