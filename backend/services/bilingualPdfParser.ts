import { PDFParse } from 'pdf-parse';
import { AdapterFactory } from './documentEngine/adapters/AdapterFactory';
import { QnaExtractor } from './documentEngine/extraction/QnaExtractor';

export interface ParsedBilingualQuestion {
  questionNumber: number;
  sectionName?: string;
  partName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  questionTextHi: string;
  optionAHi: string;
  optionBHi: string;
  optionCHi: string;
  optionDHi: string;
  optionEHi?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  explanationHi: string;
  marks?: number;
  negativeMarks?: number;
}

export interface BilingualValidationReport {
  isValid: boolean;
  totalQuestionsEn: number;
  totalQuestionsHi: number;
  totalAnswersEn: number;
  totalAnswersHi: number;
  totalExplanationsEn: number;
  totalExplanationsHi: number;
  mappedQuestionsCount: number;
  sectionsDetected: string[];
  errors: string[];
  warnings: string[];
  questionsPreview: ParsedBilingualQuestion[];
  debug?: {
    englishQuestions: number;
    hindiQuestions: number;
    englishAnswers: number;
    hindiAnswers: number;
    englishExplanations: number;
    hindiExplanations: number;
    mappedQuestions: number;
    answerKeyMismatches: number;
    missingEnglishQuestions: number[];
    missingHindiQuestions: number[];
    missingEnglishAnswers: number[];
    missingHindiAnswers: number[];
    missingEnglishExplanations: number[];
    missingHindiExplanations: number[];
  };
}

export class BilingualPdfParser {

  /**
   * Universal Primary Parser using the Universal Question Bank Ingestion & Extraction Engine.
   * Accepts ANY format, layout, structure, or language ordering without template restrictions.
   */
  static async parseTextAsync(rawText: string, initialReport?: BilingualValidationReport): Promise<BilingualValidationReport> {
    const report: BilingualValidationReport = initialReport || {
      isValid: false,
      totalQuestionsEn: 0,
      totalQuestionsHi: 0,
      totalAnswersEn: 0,
      totalAnswersHi: 0,
      totalExplanationsEn: 0,
      totalExplanationsHi: 0,
      mappedQuestionsCount: 0,
      sectionsDetected: [],
      errors: [],
      warnings: [],
      questionsPreview: []
    };

    // 1. PRIMARY: Universal Format-Agnostic Engine
    try {
      const doc = await AdapterFactory.process(Buffer.from(rawText, 'utf-8'), { filename: 'pasted_import.txt', mimeType: 'text/plain' });
      const qnas = await QnaExtractor.extractQna(doc);

      if (qnas && qnas.length > 0) {
        const preview: ParsedBilingualQuestion[] = qnas.map((qna, idx) => {
          const enVersion = qna.question.versions.find(v => v.language === 'en');
          const hiVersion = qna.question.versions.find(v => v.language === 'hi');
          const primaryVersion = qna.question.versions[0];

          const getOpt = (label: string, lang: 'en' | 'hi') => {
            const opt = qna.options.find(o => o.label === label);
            if (!opt) return '';
            const v = opt.versions.find(ver => ver.language === lang);
            if (v) return v.text;
            // Fallback for primary language if version language wasn't specifically marked
            if (lang === 'en' && opt.versions[0] && opt.versions[0].language !== 'hi') {
              return opt.versions[0].text;
            }
            if (lang === 'hi' && opt.versions[0] && opt.versions[0].language === 'hi') {
              return opt.versions[0].text;
            }
            return '';
          };

          const enQ = enVersion?.text || (primaryVersion?.language !== 'hi' ? primaryVersion?.text : '');
          const hiQ = hiVersion?.text || (primaryVersion?.language === 'hi' ? primaryVersion?.text : '');

          const expEn = qna.explanation?.versions.find(v => v.language === 'en')?.text || (qna.explanation?.versions[0]?.language !== 'hi' ? qna.explanation?.versions[0]?.text : '');
          const expHi = qna.explanation?.versions.find(v => v.language === 'hi')?.text || (qna.explanation?.versions[0]?.language === 'hi' ? qna.explanation?.versions[0]?.text : '');

          return {
            questionNumber: idx + 1,
            sectionName: qna.metadata?.sectionHeader || '',
            questionText: enQ || '',
            optionA: getOpt('A', 'en'),
            optionB: getOpt('B', 'en'),
            optionC: getOpt('C', 'en'),
            optionD: getOpt('D', 'en'),
            optionE: getOpt('E', 'en'),
            questionTextHi: hiQ || '',
            optionAHi: getOpt('A', 'hi'),
            optionBHi: getOpt('B', 'hi'),
            optionCHi: getOpt('C', 'hi'),
            optionDHi: getOpt('D', 'hi'),
            optionEHi: getOpt('E', 'hi'),
            correctAnswer: (qna.answer.values[0] as any) || 'A',
            explanation: expEn || '',
            explanationHi: expHi || ''
          };
        });

        const repairedPreview = BilingualPdfParser.repairSplitBilingualQuestions(preview);
        const detectedSections = Array.from(new Set(repairedPreview.map(q => q.sectionName).filter(Boolean))) as string[];

        report.isValid = true;
        report.questionsPreview = repairedPreview;
        report.mappedQuestionsCount = repairedPreview.length;
        report.totalQuestionsEn = repairedPreview.filter(q => q.questionText).length;
        report.totalQuestionsHi = repairedPreview.filter(q => q.questionTextHi).length;
        report.totalAnswersEn = repairedPreview.length;
        report.totalAnswersHi = repairedPreview.length;
        report.totalExplanationsEn = repairedPreview.filter(q => q.explanation).length;
        report.totalExplanationsHi = repairedPreview.filter(q => q.explanationHi).length;
        report.sectionsDetected = detectedSections.length > 0 ? detectedSections : ['UNIVERSAL FORMAT-AGNOSTIC ENGINE'];
        report.errors = [];
        return report;
      }
    } catch (_) {}

    // 2. Fallback Section-based parsing
    return this.parseText(rawText, report);
  }

  /**
   * Parses a PDF or binary document buffer format-agnostically with OCR support.
   */
  static async parseBuffer(buffer: Buffer): Promise<BilingualValidationReport> {
    const report: BilingualValidationReport = {
      isValid: false,
      totalQuestionsEn: 0,
      totalQuestionsHi: 0,
      totalAnswersEn: 0,
      totalAnswersHi: 0,
      totalExplanationsEn: 0,
      totalExplanationsHi: 0,
      mappedQuestionsCount: 0,
      sectionsDetected: [],
      errors: [],
      warnings: [],
      questionsPreview: []
    };

    try {
      // 1. PRIMARY: Universal Adapter Engine with OCR support
      const doc = await AdapterFactory.process(buffer, { filename: 'upload_document.pdf', mimeType: 'application/pdf' });
      const qnas = await QnaExtractor.extractQna(doc);

      if (qnas && qnas.length > 0) {
        const preview: ParsedBilingualQuestion[] = qnas.map((qna, idx) => {
          const enVersion = qna.question.versions.find(v => v.language === 'en');
          const hiVersion = qna.question.versions.find(v => v.language === 'hi');
          const primaryVersion = qna.question.versions[0];

          const getOpt = (label: string, lang: 'en' | 'hi') => {
            const opt = qna.options.find(o => o.label === label);
            if (!opt) return '';
            const v = opt.versions.find(ver => ver.language === lang);
            if (v) return v.text;
            if (lang === 'en' && opt.versions[0] && opt.versions[0].language !== 'hi') {
              return opt.versions[0].text;
            }
            if (lang === 'hi' && opt.versions[0] && opt.versions[0].language === 'hi') {
              return opt.versions[0].text;
            }
            return '';
          };

          const enQ = enVersion?.text || (primaryVersion?.language !== 'hi' ? primaryVersion?.text : '');
          const hiQ = hiVersion?.text || (primaryVersion?.language === 'hi' ? primaryVersion?.text : '');

          const expEn = qna.explanation?.versions.find(v => v.language === 'en')?.text || (qna.explanation?.versions[0]?.language !== 'hi' ? qna.explanation?.versions[0]?.text : '');
          const expHi = qna.explanation?.versions.find(v => v.language === 'hi')?.text || (qna.explanation?.versions[0]?.language === 'hi' ? qna.explanation?.versions[0]?.text : '');

          return {
            questionNumber: idx + 1,
            questionText: enQ || '',
            optionA: getOpt('A', 'en'),
            optionB: getOpt('B', 'en'),
            optionC: getOpt('C', 'en'),
            optionD: getOpt('D', 'en'),
            optionE: getOpt('E', 'en'),
            questionTextHi: hiQ || '',
            optionAHi: getOpt('A', 'hi'),
            optionBHi: getOpt('B', 'hi'),
            optionCHi: getOpt('C', 'hi'),
            optionDHi: getOpt('D', 'hi'),
            optionEHi: getOpt('E', 'hi'),
            correctAnswer: (qna.answer.values[0] as any) || 'A',
            explanation: expEn || '',
            explanationHi: expHi || ''
          };
        });

        const repairedPreview = BilingualPdfParser.repairSplitBilingualQuestions(preview);

        report.isValid = true;
        report.questionsPreview = repairedPreview;
        report.mappedQuestionsCount = repairedPreview.length;
        report.totalQuestionsEn = repairedPreview.filter(q => q.questionText).length;
        report.totalQuestionsHi = repairedPreview.filter(q => q.questionTextHi).length;
        report.totalAnswersEn = repairedPreview.length;
        report.totalAnswersHi = repairedPreview.length;
        report.totalExplanationsEn = repairedPreview.filter(q => q.explanation).length;
        report.totalExplanationsHi = repairedPreview.filter(q => q.explanationHi).length;
        report.sectionsDetected = ['UNIVERSAL FORMAT-AGNOSTIC ENGINE (OCR/TEXT)'];
        report.errors = [];
        return report;
      }
    } catch (_) {}

    // 2. Fallback text parsing
    try {
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParse(uint8);
      const data = await parser.getText();
      const rawText = BilingualPdfParser.cleanText(data.text || '');

      if (rawText.trim()) {
        return await BilingualPdfParser.parseTextAsync(rawText, report);
      }
    } catch (_) {}

    report.errors.push('Could not detect valid questions in document.');
    return report;
  }

  /**
   * Parses plain text (pasted or from PDF) strictly following the 4-section format.
   */
  static parseText(rawText: string, report?: BilingualValidationReport): BilingualValidationReport {
    if (!report) {
      report = {
        isValid: false,
        totalQuestionsEn: 0,
        totalQuestionsHi: 0,
        totalAnswersEn: 0,
        totalAnswersHi: 0,
        totalExplanationsEn: 0,
        totalExplanationsHi: 0,
        mappedQuestionsCount: 0,
        sectionsDetected: [],
        errors: [],
        warnings: [],
        questionsPreview: []
      };
    }

    try {
      const text = BilingualPdfParser.cleanText(rawText);

      // ─── STEP 1: Locate 4 Section Boundaries ───────────────────────────────────
      // Section markers (case-insensitive, flexible spacing):
      // SECTION 1: ENGLISH QUESTIONS
      // SECTION 2: HINDI QUESTIONS
      // SECTION 3: ENGLISH ANSWERS & EXPLANATIONS
      // SECTION 4: HINDI ANSWERS & EXPLANATIONS
      const sec1Idx = BilingualPdfParser.findSection(text, /SECTION\s*1\s*[:\-–—]?\s*ENGLISH\s*QUESTIONS?/i);
      const sec2Idx = BilingualPdfParser.findSection(text, /SECTION\s*2\s*[:\-–—]?\s*HINDI\s*QUESTIONS?/i);
      const sec3Idx = BilingualPdfParser.findSection(text, /SECTION\s*3\s*[:\-–—]?\s*ENGLISH\s*ANSWERS?\s*[&+]?\s*EXPLANATIONS?/i);
      const sec4Idx = BilingualPdfParser.findSection(text, /SECTION\s*4\s*[:\-–—]?\s*HINDI\s*ANSWERS?\s*[&+]?\s*EXPLANATIONS?/i);

      if (sec1Idx === -1) report.errors.push('SECTION 1: ENGLISH QUESTIONS — not found. Add this header before your English questions.');
      if (sec2Idx === -1) report.errors.push('SECTION 2: HINDI QUESTIONS — not found. Add this header before your Hindi questions.');
      if (sec3Idx === -1) report.errors.push('SECTION 3: ENGLISH ANSWERS & EXPLANATIONS — not found. Add this header before your English answers.');
      if (sec4Idx === -1) report.errors.push('SECTION 4: HINDI ANSWERS & EXPLANATIONS — not found. Add this header before your Hindi answers.');

      if (sec1Idx !== -1) report.sectionsDetected.push('SECTION 1: ENGLISH QUESTIONS');
      if (sec2Idx !== -1) report.sectionsDetected.push('SECTION 2: HINDI QUESTIONS');
      if (sec3Idx !== -1) report.sectionsDetected.push('SECTION 3: ENGLISH ANSWERS & EXPLANATIONS');
      if (sec4Idx !== -1) report.sectionsDetected.push('SECTION 4: HINDI ANSWERS & EXPLANATIONS');

      if (report.errors.length > 0) {
        return report;
      }

      if (!(sec1Idx < sec2Idx && sec2Idx < sec3Idx && sec3Idx < sec4Idx)) {
        report.errors.push('Section order is invalid. Sections must appear in order: 1 → 2 → 3 → 4.');
        return report;
      }

      // ─── STEP 2: Slice out each section's content ──────────────────────────────
      const enQText  = text.substring(sec1Idx, sec2Idx);
      const hiQText  = text.substring(sec2Idx, sec3Idx);
      const enAnsText = text.substring(sec3Idx, sec4Idx);
      const hiAnsText = text.substring(sec4Idx);

      // ─── STEP 3: Parse Questions ────────────────────────────────────────────────
      const enQMap = BilingualPdfParser.parseQuestions(enQText);
      const hiQMap = BilingualPdfParser.parseQuestions(hiQText);
      const enAMap = BilingualPdfParser.parseAnswers(enAnsText);
      const hiAMap = BilingualPdfParser.parseAnswers(hiAnsText);

      report.totalQuestionsEn = enQMap.size;
      report.totalQuestionsHi = hiQMap.size;
      report.totalAnswersEn = enAMap.size;
      report.totalAnswersHi = hiAMap.size;
      report.totalExplanationsEn = Array.from(enAMap.values()).filter(a => a.explanation.trim()).length;
      report.totalExplanationsHi = Array.from(hiAMap.values()).filter(a => a.explanation.trim()).length;

      // ─── STEP 4: Validate ────────────────────────────────────────────────────────
      if (enQMap.size === 0) {
        report.errors.push('No English questions parsed. Each English question must start with "Q1.", "Q2.", etc. on its own line.');
      }
      if (hiQMap.size === 0) {
        report.errors.push('No Hindi questions parsed. Each Hindi question must start with "Q1.", "Q2.", etc. on its own line.');
      }
      if (enAMap.size === 0) {
        report.errors.push('No English answers parsed. Each answer must start with "Q1. B" format (Q + number + . + space + letter).');
      }
      if (hiAMap.size === 0) {
        report.errors.push('No Hindi answers parsed. Each answer must start with "Q1. B" format (Q + number + . + space + letter).');
      }

      if (report.errors.length > 0) {
        return report;
      }

      // ─── STEP 5: Map questions ────────────────────────────────────────────────────
      const allQNums = Array.from(new Set([
        ...enQMap.keys(), ...hiQMap.keys(), ...enAMap.keys(), ...hiAMap.keys()
      ])).sort((a, b) => a - b);

      const missingEnQs: number[] = [];
      const missingHiQs: number[] = [];
      const missingEnAns: number[] = [];
      const missingHiAns: number[] = [];

      for (const qNum of allQNums) {
        const enQ = enQMap.get(qNum) || hiQMap.get(qNum);
        const hiQ = hiQMap.get(qNum) || enQMap.get(qNum);
        const enA = enAMap.get(qNum) || hiAMap.get(qNum) || { correctAnswer: 'A' as const, explanation: '' };
        const hiA = hiAMap.get(qNum) || enAMap.get(qNum) || { correctAnswer: 'A' as const, explanation: '' };

        if (!enQMap.get(qNum)) missingEnQs.push(qNum);
        if (!hiQMap.get(qNum)) missingHiQs.push(qNum);
        if (!enAMap.get(qNum)) missingEnAns.push(qNum);
        if (!hiAMap.get(qNum)) missingHiAns.push(qNum);

        if (!enQ || !hiQ) continue;

        report.questionsPreview.push({
          questionNumber: qNum,
          questionText: enQ.questionText,
          optionA: enQ.optionA,
          optionB: enQ.optionB,
          optionC: enQ.optionC,
          optionD: enQ.optionD,
          optionE: enQ.optionE || '',
          questionTextHi: hiQ.questionText,
          optionAHi: hiQ.optionA,
          optionBHi: hiQ.optionB,
          optionCHi: hiQ.optionC,
          optionDHi: hiQ.optionD,
          optionEHi: hiQ.optionE || '',
          correctAnswer: enA.correctAnswer,
          explanation: enA.explanation,
          explanationHi: hiA.explanation
        });
      }

      if (missingEnQs.length > 0) report.warnings.push(`Missing English questions: Q${missingEnQs.join(', Q')}`);
      if (missingHiQs.length > 0) report.warnings.push(`Missing Hindi questions: Q${missingHiQs.join(', Q')}`);
      if (missingEnAns.length > 0) report.warnings.push(`Missing English answers: Q${missingEnAns.join(', Q')}`);
      if (missingHiAns.length > 0) report.warnings.push(`Missing Hindi answers: Q${missingHiAns.join(', Q')}`);

      report.mappedQuestionsCount = report.questionsPreview.length;
      report.isValid = report.mappedQuestionsCount > 0 && report.errors.length === 0;

      const missingEnExp = allQNums.filter(n => !enAMap.get(n)?.explanation?.trim());
      const missingHiExp = allQNums.filter(n => !hiAMap.get(n)?.explanation?.trim());

      let answerKeyMismatches = 0;
      for (const qNum of allQNums) {
        const enA = enAMap.get(qNum);
        const hiA = hiAMap.get(qNum);
        if (enA && hiA && enA.correctAnswer !== hiA.correctAnswer) answerKeyMismatches++;
      }

      report.debug = {
        englishQuestions: enQMap.size,
        hindiQuestions: hiQMap.size,
        englishAnswers: enAMap.size,
        hindiAnswers: hiAMap.size,
        englishExplanations: report.totalExplanationsEn,
        hindiExplanations: report.totalExplanationsHi,
        mappedQuestions: report.mappedQuestionsCount,
        answerKeyMismatches,
        missingEnglishQuestions: missingEnQs,
        missingHindiQuestions: missingHiQs,
        missingEnglishAnswers: missingEnAns,
        missingHindiAnswers: missingHiAns,
        missingEnglishExplanations: missingEnExp,
        missingHindiExplanations: missingHiExp
      };

      return report;
    } catch (err: any) {
      report.errors.push(`Parse Exception: ${err.message || err}`);
      report.isValid = false;
      return report;
    }
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  /**
   * Find the position of a section header in text.
   */
  private static findSection(text: string, pattern: RegExp): number {
    const m = text.search(pattern);
    return m;
  }

  /**
   * Strip separator/header-only lines from a section block so they don't
   * bleed into option or question text.
   * Removes:
   *  - Lines that are only = or - characters (section dividers)
   *  - Lines that are SECTION ... headers
   */
  private static stripSeparators(text: string): string {
    return text
      .split('\n')
      .map(line => {
        const t = line.trim();
        // Pure divider lines: === or ---
        if (/^[=\-]{3,}$/.test(t)) return '';
        // SECTION header lines
        if (/^SECTION\s+\d/i.test(t)) return '';
        return line;
      })
      .join('\n');
  }

  /**
   * Parse a question section into a map of question number → question data.
   *
   * Questions MUST start with "Q<num>." at the beginning of a line.
   * Example: "Q1. With reference to..."
   * Options MUST be formatted as "(a) ...", "(b) ...", "(c) ...", "(d) ..."
   */
  private static parseQuestions(sectionText: string): Map<number, {
    questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; optionE: string;
  }> {
    const qMap = new Map<number, { questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; optionE: string }>();

    const cleanText = BilingualPdfParser.stripSeparators(sectionText);
    const qBoundaryRegex = /(?:^|\n)[ \t]*(?:Q|Question|Q\.)?[ \t]*(\d{1,4})[\.\:\)\-–—\s]+[ \t]*/g;
    const boundaries: { qNum: number; index: number }[] = [];
    let m: RegExpExecArray | null;

    while ((m = qBoundaryRegex.exec(cleanText)) !== null) {
      boundaries.push({ qNum: parseInt(m[1], 10), index: m.index });
    }

    for (let i = 0; i < boundaries.length; i++) {
      const qNum = boundaries[i].qNum;
      const start = boundaries[i].index;
      const end = i < boundaries.length - 1 ? boundaries[i + 1].index : cleanText.length;
      const block = cleanText.substring(start, end).trim();

      if (qMap.has(qNum)) continue; // skip duplicates

      const parsed = BilingualPdfParser.parseQuestionBlock(block, qNum);
      if (parsed) {
        qMap.set(qNum, parsed);
      }
    }

    return qMap;
  }

  /**
   * Auto-formats "Match List-I with List-II" (and Hindi सूची-I, सूची-II) text blocks
   * into clean, responsive HTML Tables.
   */
  public static formatMatchListsInText(input: string): string {
    if (!input) return '';
    if (input.includes('<table') || input.includes('class="match-list-container"')) return input;

    const hasList1 = /List[\s\-_]*I\b|List[\s\-_]*1\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b/i.test(input);
    const hasList2 = /List[\s\-_]*II\b|List[\s\-_]*2\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b/i.test(input);

    if (!hasList1 || !hasList2) return input;

    const rawLines = input.split('\n');
    const promptLines: string[] = [];
    const listRows: { left: string; right: string }[] = [];
    let headerLeft = 'List-I';
    let headerRight = 'List-II';
    let codesHeader = '';
    let inListSection = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      // Header line detection e.g. "List-I (Items of the Constitution)   List-II (Taken from Countries)"
      const isHeaderLine = /List[\s\-_]*I|List[\s\-_]*1|सूची[\s\-_]*I|सूची[\s\-_]*1/i.test(line) &&
                           /List[\s\-_]*II|List[\s\-_]*2|सूची[\s\-_]*II|सूची[\s\-_]*2/i.test(line);

      if (isHeaderLine) {
        inListSection = true;
        const parts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          headerLeft = parts[0];
          headerRight = parts[1];
        }
        continue;
      }

      // Column Codes header e.g. "A B C D" or "Code: A B C D" or "कूट: A B C D"
      if (/^(?:Codes?|कूट)?\s*[\:\-\s]*[A-D\s]{3,15}$/i.test(line) || /^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(line)) {
        codesHeader = line;
        inListSection = false;
        continue;
      }

      if (inListSection) {
        const rowParts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);
        if (rowParts.length >= 2) {
          listRows.push({ left: rowParts[0], right: rowParts[1] });
        } else if (listRows.length > 0) {
          const lastRow = listRows[listRows.length - 1];
          if (/^[1-4A-D][\.\)]/.test(line)) {
            lastRow.right += ' ' + line;
          } else {
            lastRow.left += ' ' + line;
          }
        } else {
          promptLines.push(line);
        }
      } else {
        promptLines.push(line);
      }
    }

    if (listRows.length === 0) return input;

    let tableHtml = `<div class="match-list-container my-3 overflow-x-auto">`;
    if (promptLines.length > 0) {
      tableHtml += `<p class="mb-2 font-semibold">${promptLines.join(' ')}</p>`;
    }
    tableHtml += `<table class="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs my-2">`;
    tableHtml += `<thead><tr class="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 font-bold">`;
    tableHtml += `<th class="p-2.5 sm:p-3 text-left border-r border-slate-200 dark:border-white/10 w-1/2">${headerLeft}</th>`;
    tableHtml += `<th class="p-2.5 sm:p-3 text-left w-1/2">${headerRight}</th>`;
    tableHtml += `</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-white/5">`;

    listRows.forEach((row, idx) => {
      const bgClass = idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/30' : '';
      tableHtml += `<tr class="${bgClass}">`;
      tableHtml += `<td class="p-2.5 sm:p-3 border-r border-slate-100 dark:border-white/5 font-medium align-top">${row.left}</td>`;
      tableHtml += `<td class="p-2.5 sm:p-3 font-medium align-top">${row.right}</td>`;
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    if (codesHeader) {
      tableHtml += `<p class="font-mono font-bold text-xs tracking-wider text-slate-600 dark:text-slate-300 mt-2 pl-1">${codesHeader}</p>`;
    }
    tableHtml += `</div>`;

    return tableHtml;
  }

  /**
   * Parse a single question block.
   * Block starts with "Q<num>. <question text>" and ends at next Q or end of section.
   * Options are "(a) ...", "(b) ...", "(c) ...", "(d) ...", "(e) ..."
   */
  private static parseQuestionBlock(block: string, qNum: number): {
    questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; optionE: string;
  } | null {
    // Strip the question prefix
    const withoutPrefix = block.replace(/^[ \t]*(?:Q|Question|Q\.)?[ \t]*\d{1,4}[\.\:\)\-–—\s]+/, '').trim();

    // Find option positions — strictly "(a)"–"(e)" or "a."–"e." or "(क)"–"(ङ)"
    const optRegex = /(?:^|\n)[ \t]*(?:\(([abcdeABCDEक-ङ])\)|([abcdeABCDEक-ङ])[\.\:\)\-–—]+)[ \t]+/g;
    const optPositions: { label: string; index: number }[] = [];
    let om: RegExpExecArray | null;

    while ((om = optRegex.exec(withoutPrefix)) !== null) {
      const matchedLabel = om[1] || om[2];
      const rawLabel = matchedLabel.toLowerCase();
      let label = rawLabel;
      if (rawLabel === 'क') label = 'a';
      else if (rawLabel === 'ख') label = 'b';
      else if (rawLabel === 'ग') label = 'c';
      else if (rawLabel === 'घ') label = 'd';
      else if (rawLabel === 'ङ') label = 'e';

      if (['a', 'b', 'c', 'd', 'e'].includes(label) && !optPositions.some(o => o.label === label)) {
        optPositions.push({ label, index: om.index });
      }
    }

    if (optPositions.length < 2) {
      const formattedWithoutPrefix = BilingualPdfParser.formatMatchListsInText(withoutPrefix);
      return {
        questionText: formattedWithoutPrefix,
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: ''
      };
    }

    // Question text = everything before the first option
    const questionText = withoutPrefix.substring(0, optPositions[0].index).trim();
    const formattedQuestionText = BilingualPdfParser.formatMatchListsInText(questionText);

    // Extract each option's text
    let optionA = '', optionB = '', optionC = '', optionD = '', optionE = '';
    for (let i = 0; i < optPositions.length; i++) {
      const label = optPositions[i].label;
      const start = optPositions[i].index;
      const end = i < optPositions.length - 1 ? optPositions[i + 1].index : withoutPrefix.length;
      const raw = BilingualPdfParser.stripSeparators(
        withoutPrefix.substring(start, end).replace(/^\s*(?:\([abcdeABCDE\u0915-\u0919]\)|[abcdeABCDE\u0915-\u0919][\.\:\)\-–—]+)[ \t]+/, '')
      ).trim();

      if (label === 'a') optionA = raw;
      else if (label === 'b') optionB = raw;
      else if (label === 'c') optionC = raw;
      else if (label === 'd') optionD = raw;
      else if (label === 'e') optionE = raw;
    }

    return { questionText: formattedQuestionText, optionA, optionB, optionC, optionD, optionE };
  }

  /**
   * Parse an answer+explanation section.
   */
  private static parseAnswers(sectionText: string): Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'; explanation: string }> {
    const aMap = new Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'; explanation: string }>();

    const cleanText = BilingualPdfParser.stripSeparators(sectionText);

    // Match "Q1. B", "1. B", "Q50: E", "100. D", etc.
    const aBoundaryRegex = /(?:^|\n)[ \t]*(?:Q|Question|Q\.)?[ \t]*(\d{1,4})[\.\:\)\-–—\s]+[ \t]*([A-Ea-eक-ङ])\b/g;
    const boundaries: { qNum: number; letter: string; index: number }[] = [];
    let m: RegExpExecArray | null;

    while ((m = aBoundaryRegex.exec(cleanText)) !== null) {
      const qNum = parseInt(m[1], 10);
      const rawLetter = m[2].toUpperCase();
      let letter = rawLetter;
      if (rawLetter === 'क') letter = 'A';
      else if (rawLetter === 'ख') letter = 'B';
      else if (rawLetter === 'ग') letter = 'C';
      else if (rawLetter === 'घ') letter = 'D';
      else if (rawLetter === 'ङ') letter = 'E';

      if (['A', 'B', 'C', 'D', 'E'].includes(letter) && !boundaries.some(b => b.qNum === qNum)) {
        boundaries.push({ qNum, letter, index: m.index });
      }
    }

    for (let i = 0; i < boundaries.length; i++) {
      const { qNum, letter } = boundaries[i];
      const start = boundaries[i].index;
      const end = i < boundaries.length - 1 ? boundaries[i + 1].index : cleanText.length;
      const block = cleanText.substring(start, end).trim();

      const explanation = block.replace(/^[ \t]*(?:Q|Question|Q\.)?[ \t]*\d{1,4}[\.\:\)\-–—\s]+[ \t]*[A-Ea-eक-ङ]\b\s*/, '').trim();

      aMap.set(qNum, {
        correctAnswer: letter as 'A' | 'B' | 'C' | 'D' | 'E',
        explanation
      });
    }

    return aMap;
  }

  /**
   * Removes PDF font artifacts (control bytes, zero-width chars) and normalizes whitespace.
   */
  public static cleanText(input: string): string {
    if (!input) return '';
    return input
      .normalize('NFC')
      // Remove non-printable PDF font encoding artifacts
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B-\u200D\uFEFF]/g, '')
      .replace(/\t/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  /** @deprecated use cleanText */
  public static normalizeIndicText(input: string): string {
    return this.cleanText(input);
  }

  /**
   * Post-processing repair for split preview questions
   */
  private static repairSplitBilingualQuestions(list: ParsedBilingualQuestion[]): ParsedBilingualQuestion[] {
    if (list.length <= 1) return list;

    const repaired: ParsedBilingualQuestion[] = [];
    let i = 0;

    while (i < list.length) {
      const curr = list[i];
      const next = i < list.length - 1 ? list[i + 1] : null;

      if (next) {
        const currHasOptions = Boolean(curr.optionA || curr.optionB || curr.optionAHi || curr.optionBHi);
        const nextHasOptions = Boolean(next.optionA || next.optionB || next.optionAHi || next.optionBHi);

        const currText = (curr.questionText || curr.questionTextHi || '').trim();
        const nextText = (next.questionText || next.questionTextHi || '').trim();

        const isNextTextJustNumber = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[ \t]*[\.\:\)\-–—]*$/i.test(nextText);
        const isCurrTextJustNumber = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[ \t]*[\.\:\)\-–—]*$/i.test(currText);

        // Pattern 1: Current has real question text but NO options, Next has number-only text AND has options
        if (!currHasOptions && nextHasOptions && currText.length > 5 && isNextTextJustNumber) {
          curr.optionA = next.optionA;
          curr.optionB = next.optionB;
          curr.optionC = next.optionC;
          curr.optionD = next.optionD;
          curr.optionE = next.optionE;
          curr.optionAHi = next.optionAHi;
          curr.optionBHi = next.optionBHi;
          curr.optionCHi = next.optionCHi;
          curr.optionDHi = next.optionDHi;
          curr.optionEHi = next.optionEHi;
          curr.correctAnswer = next.correctAnswer || curr.correctAnswer;
          if (next.explanation) curr.explanation = next.explanation;
          if (next.explanationHi) curr.explanationHi = next.explanationHi;
          repaired.push(curr);
          i += 2;
          continue;
        }

        // Pattern 2: Current has number-only text AND NO options, Next has real question text AND options
        if (!currHasOptions && nextHasOptions && isCurrTextJustNumber && nextText.length > 5) {
          next.questionNumber = curr.questionNumber;
          repaired.push(next);
          i += 2;
          continue;
        }
      }

      repaired.push(curr);
      i++;
    }

    return repaired.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
  }
}
