import crypto from 'crypto';
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

    // Check if user uploaded a strict 4-section formatted text document
    const has4Sections = /SECTION\s*1\s*[:\-–—]?\s*ENGLISH\s*QUESTIONS?/i.test(rawText) &&
                         /SECTION\s*2\s*[:\-–—]?\s*HINDI\s*QUESTIONS?/i.test(rawText) &&
                         /SECTION\s*3\s*[:\-–—]?\s*ENGLISH\s*ANSWERS?/i.test(rawText) &&
                         /SECTION\s*4\s*[:\-–—]?\s*HINDI\s*ANSWERS?/i.test(rawText);

    if (has4Sections) {
      return BilingualPdfParser.parseText(rawText, report);
    }

    // 1. PRIMARY: Section-Aware Parsing for Explicit Document Sections
    const sectionReport = this.parseText(rawText, report);
    if (sectionReport.isValid && sectionReport.questionsPreview.length > 0) {
      return sectionReport;
    }

    // 2. Fallback: Universal Format-Agnostic Engine
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
            if (opt.versions[0]?.text) return opt.versions[0].text;
            return '';
          };

          const isHiText = (txt?: string) => txt && /[\u0900-\u097F]/.test(txt);
          const isEnText = (txt?: string) => txt && /[a-zA-Z]/.test(txt) && !/[\u0900-\u097F]/.test(txt);

          const enQ = enVersion?.text || (isEnText(primaryVersion?.text) ? primaryVersion?.text : '');
          const hiQ = hiVersion?.text || (isHiText(primaryVersion?.text) ? primaryVersion?.text : '');

          const expEn = qna.explanation?.versions.find(v => v.language === 'en')?.text || (isEnText(qna.explanation?.versions[0]?.text) ? qna.explanation?.versions[0]?.text : '');
          const expHi = qna.explanation?.versions.find(v => v.language === 'hi')?.text || (isHiText(qna.explanation?.versions[0]?.text) ? qna.explanation?.versions[0]?.text : '');

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
            correctAnswer: (qna.answer.values[0] as any) || null,
            explanation: expEn || '',
            explanationHi: expHi || ''
          };
        });

        const repairedPreview = BilingualPdfParser.repairSplitBilingualQuestions(preview);

        // Generic structure-aware deduplication for Admin Copy-Paste Questions
        const seenFps = new Set<string>();
        const deduplicatedPreview = repairedPreview.filter(q => {
          const normEn = (q.questionText || '').trim().replace(/\s+/g, ' ').toLowerCase();
          const normHi = (q.questionTextHi || '').trim().replace(/\s+/g, ' ').toLowerCase();
          const normOptsEn = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE].filter(Boolean).map(s => s.trim().replace(/\s+/g, ' ').toLowerCase()).join('|');
          const normOptsHi = [q.optionAHi, q.optionBHi, q.optionCHi, q.optionDHi, q.optionEHi].filter(Boolean).map(s => s.trim().replace(/\s+/g, ' ').toLowerCase()).join('|');
          const fpPayload = `${normEn}:${normHi}:${normOptsEn}:${normOptsHi}`;
          const fp = crypto.createHash('sha256').update(fpPayload).digest('hex');
          if (seenFps.has(fp)) {
            return false; // Skip duplicate pasted question
          }
          seenFps.add(fp);
          return true;
        });

        const detectedSections = Array.from(new Set(deduplicatedPreview.map(q => q.sectionName).filter(Boolean))) as string[];

        report.isValid = true;
        report.questionsPreview = deduplicatedPreview;
        report.mappedQuestionsCount = deduplicatedPreview.length;
        report.totalQuestionsEn = deduplicatedPreview.filter(q => q.questionText).length;
        report.totalQuestionsHi = deduplicatedPreview.filter(q => q.questionTextHi).length;
        report.totalAnswersEn = deduplicatedPreview.length;
        report.totalAnswersHi = deduplicatedPreview.length;
        report.totalExplanationsEn = deduplicatedPreview.filter(q => q.explanation).length;
        report.totalExplanationsHi = deduplicatedPreview.filter(q => q.explanationHi).length;
        report.sectionsDetected = detectedSections.length > 0 ? detectedSections : ['UNIVERSAL FORMAT-AGNOSTIC ENGINE'];
        report.errors = [];
        return report;
      }
    } catch (_) {}

    return sectionReport;
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
            if (lang === 'en' && opt.versions[0] && opt.versions[0].language === 'en') {
              return opt.versions[0].text;
            }
            if (lang === 'hi' && opt.versions[0] && opt.versions[0].language === 'hi') {
              return opt.versions[0].text;
            }
            return '';
          };

          const isHiText = (txt?: string) => txt && /[\u0900-\u097F]/.test(txt);
          const isEnText = (txt?: string) => txt && /[a-zA-Z]/.test(txt) && !/[\u0900-\u097F]/.test(txt);

          const enQ = enVersion?.text || (isEnText(primaryVersion?.text) ? primaryVersion?.text : '');
          const hiQ = hiVersion?.text || (isHiText(primaryVersion?.text) ? primaryVersion?.text : '');

          const expEn = qna.explanation?.versions.find(v => v.language === 'en')?.text || (isEnText(qna.explanation?.versions[0]?.text) ? qna.explanation?.versions[0]?.text : '');
          const expHi = qna.explanation?.versions.find(v => v.language === 'hi')?.text || (isHiText(qna.explanation?.versions[0]?.text) ? qna.explanation?.versions[0]?.text : '');

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
            correctAnswer: (qna.answer.values[0] as any) || null,
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

      // ─── STEP 1: Locate Section Boundaries (4-Section OR 2-Section) ─────────────────
      const sec1Idx = BilingualPdfParser.findSection(text, /SECTION\s*1\s*[:\-–—]?\s*ENGLISH\s*QUESTIONS?/i);
      const sec2Idx = BilingualPdfParser.findSection(text, /SECTION\s*2\s*[:\-–—]?\s*HINDI\s*QUESTIONS?/i);
      const sec3Idx = BilingualPdfParser.findSection(text, /SECTION\s*3\s*[:\-–—]?\s*ENGLISH\s*ANSWERS?\s*[&+]?\s*EXPLANATIONS?/i);
      const sec4Idx = BilingualPdfParser.findSection(text, /SECTION\s*4\s*[:\-–—]?\s*HINDI\s*ANSWERS?\s*[&+]?\s*EXPLANATIONS?/i);

      let enQText = '', hiQText = '', enAnsText = '', hiAnsText = '';
      let is2SectionMode = false;

      if (sec1Idx !== -1 && sec2Idx !== -1 && sec3Idx !== -1 && sec4Idx !== -1) {
        // Strict 4-Section Format
        report.sectionsDetected.push('SECTION 1: ENGLISH QUESTIONS', 'SECTION 2: HINDI QUESTIONS', 'SECTION 3: ENGLISH ANSWERS & EXPLANATIONS', 'SECTION 4: HINDI ANSWERS & EXPLANATIONS');
        enQText  = text.substring(sec1Idx, sec2Idx);
        hiQText  = text.substring(sec2Idx, sec3Idx);
        enAnsText = text.substring(sec3Idx, sec4Idx);
        hiAnsText = text.substring(sec4Idx);
      } else {
        // Flexible 2-Section Format (QUESTIONS -> SOLUTIONS / EXPLANATIONS)
        const secQIdx = BilingualPdfParser.findSection(text, /(?:^|\n)[ \t]*(?:SECTION\s*1\s*[:\-–—]?[ \t]*)?(?:QUESTIONS|QUESTIONS\s*SECTION|प्रश्न)\b/i);
        const secSIdx = BilingualPdfParser.findSection(text, /(?:^|\n)[ \t]*(?:SECTION\s*2\s*[:\-–—]?[ \t]*)?(?:SOLUTIONS|EXPLANATIONS|EXPLANATION|SOLUTIONS\s*[&+]?\s*EXPLANATIONS|ANSWERS?|व्याख्या|व्याख्याएँ|स्पष्टीकरण|समाधान|उत्तर\s*एवं\s*व्याख्या|उत्तर\/व्याख्या)\b/i);

        if (secSIdx !== -1 && secSIdx > (secQIdx !== -1 ? secQIdx : 0)) {
          is2SectionMode = true;
          report.sectionsDetected.push('SECTION 1: QUESTIONS', 'SECTION 2: SOLUTIONS & EXPLANATIONS');
          const qText = text.substring(secQIdx !== -1 ? secQIdx : 0, secSIdx);
          const sText = text.substring(secSIdx);
          enQText = qText;
          hiQText = '';
          enAnsText = sText;
          hiAnsText = '';
        } else {
          report.errors.push('Section headers not detected. Please ensure your document has clear QUESTIONS and SOLUTIONS / EXPLANATIONS section headers.');
          return report;
        }
      }

      // ─── STEP 3: Parse Questions ────────────────────────────────────────────────
      const enQMap = BilingualPdfParser.parseQuestions(enQText);
      const hiQMap = is2SectionMode ? new Map<number, ParsedBilingualQuestion>() : BilingualPdfParser.parseQuestions(hiQText);
      const enAMap = BilingualPdfParser.parseAnswers(enAnsText);
      const hiAMap = is2SectionMode ? new Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'; explanation: string }>() : BilingualPdfParser.parseAnswers(hiAnsText);

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
      if (!is2SectionMode && hiQMap.size === 0) {
        report.errors.push('No Hindi questions parsed. Each Hindi question must start with "Q1.", "Q2.", etc. on its own line.');
      }
      if (enAMap.size === 0) {
        report.errors.push('No answers parsed in solutions section. Each answer must start with "Q1. B" format.');
      }
      if (!is2SectionMode && hiAMap.size === 0) {
        report.errors.push('No Hindi answers parsed. Each answer must start with "Q1. B" format.');
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
        const enA = enAMap.get(qNum) || hiAMap.get(qNum) || { correctAnswer: null as any, explanation: '' };
        const hiA = hiAMap.get(qNum) || enAMap.get(qNum) || { correctAnswer: null as any, explanation: '' };

        if (!enQMap.get(qNum)) missingEnQs.push(qNum);
        if (!is2SectionMode && !hiQMap.get(qNum)) missingHiQs.push(qNum);
        if (!enAMap.get(qNum)) missingEnAns.push(qNum);
        if (!is2SectionMode && !hiAMap.get(qNum)) missingHiAns.push(qNum);

        if (!enQ) continue;

        report.questionsPreview.push({
          questionNumber: qNum,
          questionText: enQ.questionText,
          optionA: enQ.optionA,
          optionB: enQ.optionB,
          optionC: enQ.optionC,
          optionD: enQ.optionD,
          optionE: enQ.optionE || '',
          questionTextHi: hiQ ? hiQ.questionText : enQ.questionText,
          optionAHi: hiQ ? hiQ.optionA : enQ.optionA,
          optionBHi: hiQ ? hiQ.optionB : enQ.optionB,
          optionCHi: hiQ ? hiQ.optionC : enQ.optionC,
          optionDHi: hiQ ? hiQ.optionD : enQ.optionD,
          optionEHi: hiQ ? (hiQ.optionE || '') : (enQ.optionE || ''),
          correctAnswer: enA.correctAnswer,
          explanation: enA.explanation,
          explanationHi: hiA ? hiA.explanation : enA.explanation
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
    const hasQPrefix = /(?:^|\n)[ \t]*(?:Q|Question|Q\.)[ \t]*\d{1,4}/i.test(cleanText);
    const qBoundaryRegex = hasQPrefix
      ? /(?:^|\n)[ \t]*(?:Q|Question|Q\.)[ \t]*(\d{1,4})[\.\:\)\-–—\s]+[ \t]*/gi
      : /(?:^|\n)[ \t]*(\d{1,4})[\.\:\-–—]+[ \t]+/g;

    const boundaries: { qNum: number; index: number }[] = [];
    let match: RegExpExecArray | null;

    let lastNum = 0;
    while ((match = qBoundaryRegex.exec(cleanText)) !== null) {
      const qNum = parseInt(match[1], 10);

      if (!hasQPrefix) {
        if (boundaries.length > 0 && qNum <= lastNum) {
          continue;
        }
      }

      boundaries.push({ qNum, index: match.index });
      lastNum = qNum;
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
   * into clean, responsive HTML / Markdown Tables.
   */
  public static formatMatchListsInText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    if (input.includes('<table') || input.includes('class="match-list-container"')) {
      if (/<td[^>]*>[\s\S]*?<\/td>/i.test(input) || /<tbody[^>]*>[\s\S]*?<\/tbody>/i.test(input)) {
        return input;
      }
    }

    const hasExplicitList1 = /(?:List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|Column[\s\-_]*I\b|Column[\s\-_]*1\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b)/i.test(input);
    const hasExplicitList2 = /(?:List[\s\-_]*II\b|List[\s\-_]*2\b|Column[\s\-_]*B\b|Column[\s\-_]*II\b|Column[\s\-_]*2\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b)/i.test(input);
    const hasMatchKeyword = /(?:Match List|Match the following|सुमेलित|मिलान|जोड़ी|Column[\s\-_]*[AB]|सूची[\s\-_]*[I1II2])/i.test(input);
    const hasExplicitHeaders = hasExplicitList1 || hasExplicitList2 || hasMatchKeyword || input.includes('|');

    if (!hasExplicitHeaders && !input.includes('|')) {
      return input;
    }

    const rawLines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const promptLines: string[] = [];
    const leftItems: string[] = [];
    const rightItems: string[] = [];
    let footerText = '';
    let headerLeft = 'List-I';
    let headerRight = 'List-II';

    for (const line of rawLines) {
      // Ignore Markdown table divider lines like |---|---|
      if (/^\s*\|?\s*(?::?-+:?\s*\|)+\s*(?::?-+:?\s*)?\|?\s*$/.test(line)) continue;

      const inlinePair = line.match(/^[ \t]*([A-Ea-eक-ङ1-5|IVX]+)[\.\:\)\-–—]+[ \t]+(.+?)[ \t]+([A-Ea-eक-ङ1-5|IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i);
      const isLeft = /^[ \t]*([A-Ea-eक-ङ]|[IVX]+)[\.\:\)\-–—]+[ \t]*/i.test(line);
      const isRight = /^[ \t]*([1-5]|[IVX]+|[A-Ea-eक-ङ])[\.\:\)\-–—]+[ \t]*/i.test(line);

      if (/^(?:Codes?|ूट|ूट|ूट|ूट|ूट|ूट|ूट|कूट)\s*[\:\-\s]*$/i.test(line) || /^(?:Codes?|ूट|ूट|ूट|ूट|ूट|ूट|ूट|कूट)\s*[\:\-\s]*[A-D\s]{1,10}$/i.test(line)) {
        footerText = line;
        continue;
      }

      if (inlinePair && !line.includes('Match') && !line.includes('मिलान') && !line.includes('सुमेलित') && !line.includes('सूची-I') && !line.includes('सूची-II') && !line.includes('List-I') && !line.includes('List-II')) {
        leftItems.push(`${inlinePair[1]}. ${inlinePair[2].trim()}`);
        rightItems.push(`${inlinePair[3]}. ${inlinePair[4].trim()}`);
        continue;
      }

      if (!inlinePair && !isLeft && !isRight) {
        const list2Regex = /(?:List[\s\-_]*II\b|List[\s\-_]*2\b|Column[\s\-_]*B\b|Column[\s\-_]*II\b|Column[\s\-_]*2\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b)/i;
        const list1Regex = /(?:List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|Column[\s\-_]*I\b|Column[\s\-_]*1\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b)/i;

        const isList1Head = list1Regex.test(line);
        const isList2Head = !isList1Head && list2Regex.test(line);

        if (isList1Head) {
          const list2Match = list2Regex.exec(line);
          if (list2Match && list2Match.index > 0) {
            headerLeft = line.substring(0, list2Match.index).trim().replace(/^\|+|\|+$/g, '');
            headerRight = line.substring(list2Match.index).trim().replace(/^\|+|\|+$/g, '');
          } else {
            headerLeft = line.trim().replace(/^\|+|\|+$/g, '');
          }
          continue;
        }

        if (isList2Head) {
          headerRight = line.trim().replace(/^\|+|\|+$/g, '');
          continue;
        }
      }

      // Pipe separated row
      if (line.includes('|')) {
        const parts = line.split('|').map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          if (/List[\s\-_]*I|सूची[\s\-_]*I|Column[\s\-_]*A/i.test(parts[0])) {
            headerLeft = parts[0];
            headerRight = parts[1];
          } else {
            leftItems.push(parts[0]);
            rightItems.push(parts[1]);
          }
          continue;
        }
      }

      if (isLeft) {
        leftItems.push(line);
      } else if (isRight) {
        rightItems.push(line);
      } else if (leftItems.length === 0 && rightItems.length === 0) {
        promptLines.push(line);
      }
    }

    if (!hasExplicitHeaders) {
      if (leftItems.length === 0 || rightItems.length === 0) {
        return input;
      }
    }

    const maxRows = Math.max(leftItems.length, rightItems.length);
    if (maxRows === 0) return input;

    let tableHtml = `<div class="match-list-container my-3 overflow-x-auto">`;
    if (promptLines.length > 0) {
      tableHtml += `<p class="mb-2 font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">${promptLines.join(' ')}</p>`;
    }
    tableHtml += `<table class="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 my-2">`;
    tableHtml += `<thead><tr class="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold">`;
    tableHtml += `<th class="p-2.5 sm:p-3 text-left border-r border-slate-300 dark:border-slate-700 w-1/2">${headerLeft}</th>`;
    tableHtml += `<th class="p-2.5 sm:p-3 text-left w-1/2">${headerRight}</th>`;
    tableHtml += `</tr></thead><tbody class="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">`;

    for (let r = 0; r < maxRows; r++) {
      const lText = leftItems[r] || '';
      const rText = rightItems[r] || '';
      tableHtml += `<tr>`;
      tableHtml += `<td class="p-2.5 sm:p-3 border-r border-slate-200 dark:border-slate-700 font-medium align-top dark:text-white leading-relaxed">${lText}</td>`;
      tableHtml += `<td class="p-2.5 sm:p-3 font-medium align-top dark:text-white leading-relaxed">${rText}</td>`;
      tableHtml += `</tr>`;
    }

    tableHtml += `</tbody></table>`;
    if (footerText) {
      tableHtml += `<p class="font-mono font-bold text-xs tracking-wider text-slate-600 dark:text-slate-300 mt-2 pl-1">${footerText}</p>`;
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

    // Group 1: parenthesized label e.g. "(a)", "(a)", "(A)" (can be inline or start of line)
    // Group 2: dotted label e.g. "a.", "A." (MUST be start of line)
    const optMarkerRegex = /(?:^|\n|\s+)\(([a-eA-Eक-ङ])\)[ \t]+|(?:^|\n)[ \t]*([a-eA-Eक-ङ])[\.\:\)\-–—]+[ \t]+/g;

    const matches: { label: string; isParen: boolean; index: number }[] = [];
    let om: RegExpExecArray | null;

    while ((om = optMarkerRegex.exec(withoutPrefix)) !== null) {
      const isParen = Boolean(om[1]);
      const rawLabel = (om[1] || om[2]).toLowerCase();
      let label = rawLabel;
      if (rawLabel === 'क') label = 'a';
      else if (rawLabel === 'ख') label = 'b';
      else if (rawLabel === 'ग') label = 'c';
      else if (rawLabel === 'घ') label = 'd';
      else if (rawLabel === 'ङ') label = 'e';

      if (['a', 'b', 'c', 'd', 'e'].includes(label)) {
        matches.push({ label, isParen, index: om.index });
      }
    }

    if (matches.length < 2) {
      const formatted = BilingualPdfParser.formatMatchListsInText(withoutPrefix);
      return {
        questionText: formatted,
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: ''
      };
    }

    // Group matches into contiguous candidate option blocks (sequences starting with 'a')
    const blocks: { isParen: boolean; positions: { label: string; index: number }[] }[] = [];
    let currentBlock: { isParen: boolean; positions: { label: string; index: number }[] } | null = null;

    for (const match of matches) {
      if (match.label === 'a') {
        if (currentBlock && currentBlock.positions.length >= 2) {
          blocks.push(currentBlock);
        }
        currentBlock = { isParen: match.isParen, positions: [{ label: match.label, index: match.index }] };
      } else if (currentBlock) {
        const expectedNextChar = String.fromCharCode(currentBlock.positions[currentBlock.positions.length - 1].label.charCodeAt(0) + 1);
        if (match.label === expectedNextChar && !currentBlock.positions.some(p => p.label === match.label)) {
          currentBlock.positions.push({ label: match.label, index: match.index });
        }
      }
    }
    if (currentBlock && currentBlock.positions.length >= 2) {
      blocks.push(currentBlock);
    }

    // Select the authoritative final answer-option block
    let selectedPositions: { label: string; index: number }[] = [];

    if (blocks.length > 0) {
      // Prioritize parenthesized blocks over bare blocks, and pick the LAST candidate block
      const parenBlocks = blocks.filter(b => b.isParen);
      const chosenBlock = parenBlocks.length > 0 ? parenBlocks[parenBlocks.length - 1] : blocks[blocks.length - 1];
      selectedPositions = chosenBlock.positions;
    } else {
      // Fallback: collect last occurrence of each label a..e in reverse order
      const labelsNeeded = ['e', 'd', 'c', 'b', 'a'];
      const found: { label: string; index: number }[] = [];
      for (const lbl of labelsNeeded) {
        const lastMatch = [...matches].reverse().find(m => m.label === lbl);
        if (lastMatch && (!found.length || lastMatch.index < found[found.length - 1].index)) {
          found.push({ label: lastMatch.label, index: lastMatch.index });
        }
      }
      selectedPositions = found.reverse();
    }

    if (selectedPositions.length < 2) {
      const formatted = BilingualPdfParser.formatMatchListsInText(withoutPrefix);
      return {
        questionText: formatted,
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: ''
      };
    }

    const firstOptIndex = selectedPositions[0].index;
    const rawQuestionText = withoutPrefix.substring(0, firstOptIndex).trim();
    let formattedQuestionText = BilingualPdfParser.formatMatchListsInText(rawQuestionText);

    // Extract each option's text completely
    let optionA = '', optionB = '', optionC = '', optionD = '', optionE = '';
    let extraTrailingQuestionText = '';

    for (let i = 0; i < selectedPositions.length; i++) {
      const label = selectedPositions[i].label;
      const start = selectedPositions[i].index;
      const end = i < selectedPositions.length - 1 ? selectedPositions[i + 1].index : withoutPrefix.length;

      const optionChunk = withoutPrefix.substring(start, end).trim();
      let rawText = BilingualPdfParser.stripSeparators(
        optionChunk.replace(/^[\s\n]*(?:\([a-eA-Eक-ङ]\)|[a-eA-Eक-ङ][\.\:\)\-–—]+)[ \t]*/, '')
      ).trim();

      if (i === selectedPositions.length - 1) {
        const trailingSplit = rawText.split(/\n{1,}/);
        if (trailingSplit.length > 1) {
          const firstLine = trailingSplit[0].trim();
          const restLines = trailingSplit.slice(1).join('\n').trim();
          if (restLines && !/^\s*\([a-e]\)/i.test(restLines)) {
            rawText = firstLine;
            extraTrailingQuestionText = restLines;
          }
        }
      }

      if (label === 'a') optionA = rawText;
      else if (label === 'b') optionB = rawText;
      else if (label === 'c') optionC = rawText;
      else if (label === 'd') optionD = rawText;
      else if (label === 'e') optionE = rawText;
    }

    if (extraTrailingQuestionText) {
      const formattedExtra = BilingualPdfParser.formatMatchListsInText(extraTrailingQuestionText);
      formattedQuestionText = (formattedQuestionText ? formattedQuestionText + '\n' + formattedExtra : formattedExtra).trim();
    }

    return { questionText: formattedQuestionText, optionA, optionB, optionC, optionD, optionE };
  }

  /**
   * Parse an answer+explanation section.
   */
  private static parseAnswers(sectionText: string): Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'; explanation: string }> {
    const aMap = new Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'; explanation: string }>();

    const cleanText = BilingualPdfParser.stripSeparators(sectionText);

    // Dedicated Solution/Explanation Segmenter
    // Matches headers: "1. सही उत्तर: (a)", "13. Ans: B", "14. Solution: Option (d)", "Q51. B", "1. (a)", "Q1. A"
    const aBoundaryRegex = /(?:^|\n)[ \t]*(?:S|Sol|Solution|Ans|Answer|Q|Question)?[\.\:\)\-–—\s]*(\d{1,4})[\.\:\)\-–—\s]+(?:सही\s*उत्तर|Ans|Answer|Solution|Option)?[\:\s]*[\(\[]?([A-Ea-eक-ङ])[\)\]]?(?=\s|$)/gi;
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

      const explanation = block.replace(/^[ \t]*(?:S|Sol|Solution|Ans|Answer|Q|Question)?[\.\:\)\-–—\s]*\d{1,4}[\.\:\)\-–—\s]+(?:सही\s*उत्तर|Ans|Answer|Solution|Option)?[\:\s]*[\(\[]?[A-Ea-eक-ङ][\)\]]?\s*/i, '').trim();

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
