import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { ExtractedQnA, LocalizedText, ExtractedOption } from '../documentEngine/core/ExtractedQnA';

export interface ExcelImportRowResult {
  rowNumber: number;
  questionNumber: number;
  qna: ExtractedQnA | null;
  status: 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'ERROR';
  issues: string[];
}

export interface ExcelParseReport {
  filename: string;
  sheetName: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  reviewRows: number;
  errorRows: number;
  isValid: boolean;
  documentLanguage: 'ENGLISH' | 'HINDI' | 'BILINGUAL' | 'UNKNOWN';
  errors: string[];
  rowResults: ExcelImportRowResult[];
  qnas: ExtractedQnA[];
}

export const CANONICAL_EXCEL_COLUMNS = [
  'questionText',
  'optionA',
  'optionB',
  'optionC',
  'optionD',
  'optionE',
  'correctAnswer',
  'explanation',
  'questionTextHi',
  'optionAHi',
  'optionBHi',
  'optionCHi',
  'optionDHi',
  'optionEHi',
  'explanationHi',
  'marks',
  'negativeMarks'
] as const;

export class ExcelQuestionBankAdapter {
  /**
   * Main Entry Point: Parses Excel file Buffer using canonical 17-column schema.
   */
  static parseBuffer(buffer: Buffer, filename: string): ExcelParseReport {
    // 1. Basic File Validation
    if (!buffer || buffer.length === 0) {
      return this.createErrorReport(filename, 'Excel file buffer is empty.');
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (err: any) {
      return this.createErrorReport(filename, `Failed to open Excel workbook: ${err.message}`);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return this.createErrorReport(filename, 'Excel workbook contains no worksheets.');
    }

    // 2. Worksheet Selection: Prefer "Question Bank", ignore "Instructions"
    let targetSheetName = workbook.SheetNames.find(
      s => s.trim().toLowerCase() === 'question bank'
    );

    if (!targetSheetName) {
      // Find first non-empty sheet that is NOT "Instructions"
      targetSheetName = workbook.SheetNames.find(
        s => s.trim().toLowerCase() !== 'instructions'
      );
    }

    if (!targetSheetName) {
      return this.createErrorReport(
        filename,
        'No valid question bank sheet found. Sheet "Question Bank" is missing and no non-instructions sheet was found.'
      );
    }

    const worksheet = workbook.Sheets[targetSheetName];
    if (!worksheet) {
      return this.createErrorReport(filename, `Worksheet "${targetSheetName}" could not be loaded.`);
    }

    // 3. Read Header Row (Row 1)
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!rawMatrix || rawMatrix.length === 0) {
      return this.createErrorReport(filename, `Worksheet "${targetSheetName}" is empty.`);
    }

    const headerRow: string[] = (rawMatrix[0] || []).map((cell: any) => String(cell || '').trim());
    if (headerRow.length === 0 || headerRow.every(h => !h)) {
      return this.createErrorReport(filename, 'Header row is missing or empty.');
    }

    // 4. Header Exact Validation
    const headerValidation = this.validateHeaders(headerRow);
    if (!headerValidation.isValid) {
      return this.createErrorReport(filename, headerValidation.errors.join('; '));
    }

    // Column Index Mapping
    const colIndices: Record<string, number> = {};
    headerRow.forEach((colName, idx) => {
      if (colName) colIndices[colName] = idx;
    });

    // 5. Row-by-Row Processing (Row 2 onwards, 1 Row = 1 Question)
    const rowResults: ExcelImportRowResult[] = [];
    const qnas: ExtractedQnA[] = [];
    let validCount = 0;
    let warningCount = 0;
    let reviewCount = 0;
    let errorCount = 0;

    let questionSequence = 0;

    // Detect overall document language from populated columns
    let hasEnglishContent = false;
    let hasHindiContent = false;

    for (let r = 1; r < rawMatrix.length; r++) {
      const rowNum = r + 1;
      const rowData = rawMatrix[r] || [];

      const getVal = (col: string): string => {
        const idx = colIndices[col];
        if (idx === undefined || idx < 0 || idx >= rowData.length) return '';
        const cellVal = rowData[idx];
        if (cellVal === null || cellVal === undefined) return '';
        return String(cellVal).trim();
      };

      if (getVal('questionText') || getVal('optionA')) hasEnglishContent = true;
      if (getVal('questionTextHi') || getVal('optionAHi')) hasHindiContent = true;
    }

    let documentLanguage: 'ENGLISH' | 'HINDI' | 'BILINGUAL' | 'UNKNOWN' = 'UNKNOWN';
    if (hasEnglishContent && hasHindiContent) documentLanguage = 'BILINGUAL';
    else if (hasEnglishContent) documentLanguage = 'ENGLISH';
    else if (hasHindiContent) documentLanguage = 'HINDI';

    for (let r = 1; r < rawMatrix.length; r++) {
      const rowNum = r + 1; // 1-indexed Excel row number
      const rowData = rawMatrix[r] || [];

      // Check if row is completely empty
      const isCompletelyEmpty = rowData.every((cell: any) => String(cell || '').trim() === '');
      if (isCompletelyEmpty) {
        continue; // Completely empty rows between questions are safely ignored per rule #19
      }

      questionSequence++;
      const result = this.processRow(rowData, colIndices, rowNum, questionSequence, filename, targetSheetName, documentLanguage);
      rowResults.push(result);

      if (result.status === 'PASS') validCount++;
      else if (result.status === 'WARNING') warningCount++;
      else if (result.status === 'REVIEW_REQUIRED') reviewCount++;
      else if (result.status === 'ERROR') errorCount++;

      if (result.qna) {
        qnas.push(result.qna);
      }
    }

    if (questionSequence === 0) {
      return this.createErrorReport(filename, `No data rows found in worksheet "${targetSheetName}".`);
    }

    const hasFatalErrors = errorCount > 0;

    return {
      filename,
      sheetName: targetSheetName,
      totalRows: questionSequence,
      validRows: validCount,
      warningRows: warningCount,
      reviewRows: reviewCount,
      errorRows: errorCount,
      isValid: !hasFatalErrors,
      documentLanguage,
      errors: hasFatalErrors ? [`Excel import contains ${errorCount} error row(s) that must be fixed.`] : [],
      rowResults,
      qnas
    };
  }

  /**
   * Validate Excel Headers strictly against canonical 17 columns schema
   */
  private static validateHeaders(headerRow: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const headerSet = new Set(headerRow);

    // Check missing required columns
    for (const reqCol of CANONICAL_EXCEL_COLUMNS) {
      if (!headerSet.has(reqCol)) {
        errors.push(`Invalid Excel format. Missing column: ${reqCol}`);
      }
    }

    // Check unexpected extra columns
    for (const suppliedCol of headerRow) {
      if (suppliedCol && !CANONICAL_EXCEL_COLUMNS.includes(suppliedCol as any)) {
        errors.push(`Unsupported column: ${suppliedCol}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process a single Excel row into an ExtractedQnA instance
   */
  private static processRow(
    rowData: any[],
    colIndices: Record<string, number>,
    excelRowNumber: number,
    questionNumber: number,
    filename: string,
    sheetName: string,
    documentLanguage: 'ENGLISH' | 'HINDI' | 'BILINGUAL' | 'UNKNOWN' = 'UNKNOWN'
  ): ExcelImportRowResult {
    const issues: string[] = [];
    let status: 'PASS' | 'WARNING' | 'REVIEW_REQUIRED' | 'ERROR' = 'PASS';

    const getVal = (col: string): string => {
      const idx = colIndices[col];
      if (idx === undefined || idx < 0 || idx >= rowData.length) return '';
      const cellVal = rowData[idx];
      if (cellVal === null || cellVal === undefined) return '';
      return String(cellVal).trim();
    };

    // Extract raw cell values without altering internal text/newlines
    const questionText = getVal('questionText');
    const optionA = getVal('optionA');
    const optionB = getVal('optionB');
    const optionC = getVal('optionC');
    const optionD = getVal('optionD');
    const optionE = getVal('optionE');
    const rawCorrectAns = getVal('correctAnswer');
    const explanation = getVal('explanation');

    const questionTextHi = getVal('questionTextHi');
    const optionAHi = getVal('optionAHi');
    const optionBHi = getVal('optionBHi');
    const optionCHi = getVal('optionCHi');
    const optionDHi = getVal('optionDHi');
    const optionEHi = getVal('optionEHi');
    const explanationHi = getVal('explanationHi');

    const rawMarks = getVal('marks');
    const rawNegMarks = getVal('negativeMarks');

    // Rule #19: Check for partially populated invalid rows
    const hasEnglish = !!(questionText || optionA || optionB || optionC || optionD);
    const hasHindi = !!(questionTextHi || optionAHi || optionBHi || optionCHi || optionDHi);

    if (!hasEnglish && !hasHindi) {
      issues.push('Missing required field: questionText or questionTextHi');
      status = 'ERROR';
    } else if (!hasEnglish && hasHindi) {
      // Hindi-only mode: English fields not required
      if (!questionTextHi) {
        issues.push('Missing required field: questionTextHi');
        status = 'ERROR';
      }
    } else if (hasEnglish && !hasHindi) {
      // English-only mode: Hindi fields not required
      if (!questionText) {
        issues.push('Missing required field: questionText');
        status = 'ERROR';
      }
    } else {
      // Bilingual mode: both required
      if (!questionText) {
        issues.push('Missing required field: questionText');
        status = 'ERROR';
      }
      if (!questionTextHi) {
        issues.push('Missing required field: questionTextHi');
        status = 'ERROR';
      }
    }

    if (hasEnglish && (!optionA || !optionB || !optionC || !optionD)) {
      const missingOpts = [];
      if (!optionA) missingOpts.push('optionA');
      if (!optionB) missingOpts.push('optionB');
      if (!optionC) missingOpts.push('optionC');
      if (!optionD) missingOpts.push('optionD');
      issues.push(`Required MCQ options missing: ${missingOpts.join(', ')}`);
      status = 'ERROR';
    }

    // Rule #11: Answer Validation
    const normalizedAns = rawCorrectAns.toUpperCase();
    if (!normalizedAns) {
      issues.push('correctAnswer is required.');
      status = 'ERROR';
    } else if (!['A', 'B', 'C', 'D', 'E'].includes(normalizedAns)) {
      issues.push(`correctAnswer must be A, B, C, D, or E (supplied: "${rawCorrectAns}")`);
      status = 'ERROR';
    }

    // Rule #12: Option E & Answer cross-validation
    if (normalizedAns === 'E' && !optionE && !optionEHi) {
      issues.push('Option E is missing but correctAnswer is set to E.');
      status = 'ERROR';
    }

    // Rule #13: Bilingual Option Completeness Validation
    if (hasEnglish && hasHindi) {
      const hiOptsPresent = [!!optionAHi, !!optionBHi, !!optionCHi, !!optionDHi];
      const anyHiOptPresent = hiOptsPresent.some(Boolean);
      const allHiOptsPresent = hiOptsPresent.every(Boolean);

      if (anyHiOptPresent && !allHiOptsPresent) {
        issues.push('Hindi question present but Hindi options (A-D) are only partially supplied.');
        if (status !== 'ERROR') status = 'REVIEW_REQUIRED';
      }
    }

    // Rule #14 & #15: Marks & Negative Marks Validation
    let marks = 1.0;
    if (rawMarks !== '') {
      const parsedM = Number(rawMarks);
      if (isNaN(parsedM)) {
        issues.push(`marks must be numeric (supplied: "${rawMarks}")`);
        if (status !== 'ERROR') status = 'REVIEW_REQUIRED';
      } else {
        marks = parsedM;
      }
    }

    let negativeMarks = 0.33;
    if (rawNegMarks !== '') {
      const parsedNM = Number(rawNegMarks);
      if (isNaN(parsedNM)) {
        issues.push(`negativeMarks must be numeric (supplied: "${rawNegMarks}")`);
        if (status !== 'ERROR') status = 'REVIEW_REQUIRED';
      } else {
        negativeMarks = parsedNM;
      }
    }

    // Build Question Versions based on document language
    const qVersions: LocalizedText[] = [];
    if (questionText) {
      qVersions.push({ language: 'en', text: questionText, confidence: 1.0 });
    }
    if (questionTextHi) {
      qVersions.push({ language: 'hi', text: questionTextHi, confidence: 1.0 });
    }

    // Build Option List
    const optionsList: ExtractedOption[] = [];

    const addOpt = (lbl: 'A' | 'B' | 'C' | 'D' | 'E', enVal: string, hiVal: string) => {
      if (!enVal && !hiVal && lbl === 'E') return; // Option E is optional
      const optVersions: LocalizedText[] = [];
      if (enVal) optVersions.push({ language: 'en', text: enVal, confidence: 1.0 });
      if (hiVal) optVersions.push({ language: 'hi', text: hiVal, confidence: 1.0 });
      optionsList.push({ label: lbl, versions: optVersions });
    };

    addOpt('A', optionA, optionAHi);
    addOpt('B', optionB, optionBHi);
    addOpt('C', optionC, optionCHi);
    addOpt('D', optionD, optionDHi);
    if (optionE || optionEHi || normalizedAns === 'E') {
      addOpt('E', optionE, optionEHi);
    }

    // Build Explanation Versions
    const expVersions: LocalizedText[] = [];
    if (explanation) expVersions.push({ language: 'en', text: explanation, confidence: 1.0 });
    if (explanationHi) expVersions.push({ language: 'hi', text: explanationHi, confidence: 1.0 });

    // Canonical ExtractedQnA Construction
    const qnaId = `q-xl-${uuidv4().substring(0, 8)}`;
    const qna: ExtractedQnA = {
      id: qnaId,
      documentId: filename,
      questionNumber,
      questionType: 'MCQ',
      metadata: {},
      question: {
        versions: qVersions
      },
      options: optionsList,
      answer: {
        type: 'single',
        values: normalizedAns ? [normalizedAns] : ['A'],
        sourceLocation: 'IMMEDIATE',
        hasConflict: false,
        confidence: 1.0
      },
      explanation: {
        versions: expVersions
      },
      confidence: {
        question: 1.0,
        options: 1.0,
        answer: 1.0,
        explanation: 1.0,
        bilingualAlignment: 1.0,
        overall: 1.0
      },
      source: {
        pages: [1],
        blockIds: [`excel-row-${excelRowNumber}`]
      },
      validation: {
        status,
        warnings: ((status as any) === 'WARNING' || status === 'REVIEW_REQUIRED') ? issues : [],
        errors: status === 'ERROR' ? issues : []
      }
    };

    // Attach custom Excel metadata fields to QnA instance
    (qna as any).sourceType = 'EXCEL';
    (qna as any).sourceFile = filename;
    (qna as any).sourceSheet = sheetName;
    (qna as any).sourceRow = excelRowNumber;
    (qna as any).orderIndex = questionNumber;
    (qna as any).marks = marks;
    (qna as any).negativeMarks = negativeMarks;
    (qna as any).structureConfidence = 'HIGH';
    (qna as any).ocrConfidence = 'NOT_APPLICABLE';

    return {
      rowNumber: excelRowNumber,
      questionNumber,
      qna: status === 'ERROR' ? null : qna,
      status,
      issues
    };
  }

  /**
   * Helper to create a clean error report
   */
  private static createErrorReport(filename: string, errorMessage: string): ExcelParseReport {
    return {
      filename,
      sheetName: '',
      totalRows: 0,
      validRows: 0,
      warningRows: 0,
      reviewRows: 0,
      errorRows: 0,
      isValid: false,
      documentLanguage: 'UNKNOWN',
      errors: [errorMessage],
      rowResults: [],
      qnas: []
    };
  }

  /**
   * Helper to create the Golden Template Workbook (Question_Bank_Import_Template.xlsx)
   */
  static createTemplateBuffer(): Buffer {
    const wb = XLSX.utils.book_new();

    // 1. Instructions Sheet
    const instructionsData = [
      ['Question Bank Excel Import Instructions'],
      [''],
      ['1. DO NOT change or rename the column headers in the "Question Bank" sheet.'],
      ['2. Each non-empty row in the "Question Bank" sheet represents exactly ONE question.'],
      ['3. Required fields for English questions: questionText, optionA, optionB, optionC, optionD, correctAnswer.'],
      ['4. Optional fields: optionE, explanation, questionTextHi, optionAHi-optionEHi, explanationHi, marks, negativeMarks.'],
      ['5. correctAnswer MUST be one of: A, B, C, D, or E.'],
      ['6. Default marks = 1.0, negativeMarks = 0.33 if left blank.']
    ];
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

    // 2. Question Bank Sheet
    const qbHeaders = Array.from(CANONICAL_EXCEL_COLUMNS);
    const sampleRow = [
      'Which of the following is not a feature of the Government of India Act, 1935?',
      'Evaluation of the 1935 Act',
      'Union of India proposal',
      "Reconstitution of the Governor General's Executive Council",
      'Provincial autonomy',
      '', // optionE
      'A', // correctAnswer
      'The 1935 Act introduced provincial autonomy and proposed an All-India Federation.',
      'निम्नलिखित में से कौन-सी भारत सरकार अधिनियम, 1935 की विशेषता नहीं थी?',
      '1935 के अधिनियम का मूल्यांकन',
      'भारतीय संघ का प्रस्ताव',
      'गवर्नर जनरल की कार्यकारिणी परिषद का पुनर्गठन',
      'प्रांतीय स्वायत्तता',
      '', // optionEHi
      '1935 के अधिनियम ने प्रांतीय स्वायत्तता पेश की थी।',
      1, // marks
      0.33 // negativeMarks
    ];

    const qbSheet = XLSX.utils.aoa_to_sheet([qbHeaders, sampleRow]);
    XLSX.utils.book_append_sheet(wb, qbSheet, 'Question Bank');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
