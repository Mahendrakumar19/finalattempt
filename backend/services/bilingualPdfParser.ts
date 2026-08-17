import { PDFParse } from 'pdf-parse';

export interface ParsedBilingualQuestion {
  questionNumber: number;
  partName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionTextHi: string;
  optionAHi: string;
  optionBHi: string;
  optionCHi: string;
  optionDHi: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
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

/**
 * STRICT BILINGUAL PDF PARSER
 *
 * Expected input format (text/pdf):
 *
 * ==================================================
 * SECTION 1: ENGLISH QUESTIONS
 * ==================================================
 * Q1. <question text>
 * (a) <option A>
 * (b) <option B>
 * (c) <option C>
 * (d) <option D>
 *
 * Q2. ...
 * --------------------------------------------------
 * ==================================================
 * SECTION 2: HINDI QUESTIONS
 * ==================================================
 * Q1. <hindi question text>
 * (a) <option A>
 * ...
 * ==================================================
 * SECTION 3: ENGLISH ANSWERS & EXPLANATIONS
 * ==================================================
 * Q1. B
 * <explanation text>
 * Q2. D
 * ...
 * ==================================================
 * SECTION 4: HINDI ANSWERS & EXPLANATIONS
 * ==================================================
 * Q1. B
 * <hindi explanation text>
 * Q2. D
 * ...
 */
export class BilingualPdfParser {

  /**
   * Parses a PDF buffer strictly following the 4-section format.
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
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParse(uint8);
      const data = await parser.getText();
      const rawText = this.cleanText(data.text || '');

      if (!rawText.trim()) {
        report.errors.push('Unreadable or empty PDF. Scanned PDFs without embedded text are not supported.');
        return report;
      }

      return this.parseText(rawText, report);
    } catch (err: any) {
      report.errors.push(`PDF Parsing Exception: ${err.message || err}`);
      report.isValid = false;
      return report;
    }
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
      const text = this.cleanText(rawText);

      // ─── STEP 1: Locate 4 Section Boundaries ───────────────────────────────────
      // Section markers (case-insensitive, flexible spacing):
      // SECTION 1: ENGLISH QUESTIONS
      // SECTION 2: HINDI QUESTIONS
      // SECTION 3: ENGLISH ANSWERS & EXPLANATIONS
      // SECTION 4: HINDI ANSWERS & EXPLANATIONS
      const sec1Idx = this.findSection(text, /SECTION\s*1\s*[:\-–—]?\s*ENGLISH\s*QUESTIONS?/i);
      const sec2Idx = this.findSection(text, /SECTION\s*2\s*[:\-–—]?\s*HINDI\s*QUESTIONS?/i);
      const sec3Idx = this.findSection(text, /SECTION\s*3\s*[:\-–—]?\s*ENGLISH\s*ANSWERS?\s*[&+]?\s*EXPLANATIONS?/i);
      const sec4Idx = this.findSection(text, /SECTION\s*4\s*[:\-–—]?\s*HINDI\s*ANSWERS?\s*[&+]?\s*EXPLANATIONS?/i);

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
      const enQMap = this.parseQuestions(enQText);
      const hiQMap = this.parseQuestions(hiQText);
      const enAMap = this.parseAnswers(enAnsText);
      const hiAMap = this.parseAnswers(hiAnsText);

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
        const enQ = enQMap.get(qNum);
        const hiQ = hiQMap.get(qNum);
        const enA = enAMap.get(qNum);
        const hiA = hiAMap.get(qNum);

        if (!enQ) { missingEnQs.push(qNum); continue; }
        if (!hiQ) { missingHiQs.push(qNum); continue; }
        if (!enA) { missingEnAns.push(qNum); continue; }
        if (!hiA) { missingHiAns.push(qNum); continue; }

        report.questionsPreview.push({
          questionNumber: qNum,
          questionText: enQ.questionText,
          optionA: enQ.optionA,
          optionB: enQ.optionB,
          optionC: enQ.optionC,
          optionD: enQ.optionD,
          questionTextHi: hiQ.questionText,
          optionAHi: hiQ.optionA,
          optionBHi: hiQ.optionB,
          optionCHi: hiQ.optionC,
          optionDHi: hiQ.optionD,
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
    questionText: string; optionA: string; optionB: string; optionC: string; optionD: string;
  }> {
    const qMap = new Map<number, { questionText: string; optionA: string; optionB: string; optionC: string; optionD: string }>();

    // Strip section dividers and headers so they don't confuse boundary detection
    const cleanText = this.stripSeparators(sectionText);

    // Match line-start "Q<number>." — MUST be at start of line (after optional whitespace)
    // Allow \s* after the period so "Q1.\n<question>" also matches
    const qBoundaryRegex = /(?:^|\n)[ \t]*Q(\d{1,3})\.[ \t]*/g;
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

      const parsed = this.parseQuestionBlock(block, qNum);
      if (parsed) {
        qMap.set(qNum, parsed);
      }
    }

    return qMap;
  }

  /**
   * Parse a single question block.
   * Block starts with "Q<num>. <question text>" and ends at next Q or end of section.
   * Options are "(a) ...", "(b) ...", "(c) ...", "(d) ..."
   */
  private static parseQuestionBlock(block: string, qNum: number): {
    questionText: string; optionA: string; optionB: string; optionC: string; optionD: string;
  } | null {
    // Strip the "Q<num>." prefix
    const withoutPrefix = block.replace(/^[ \t]*Q\d{1,3}\.\s+/, '').trim();

    // Find option positions — strictly "(a)", "(b)", "(c)", "(d)" or "(क)", "(ख)", "(ग)", "(घ)"
    // Must be at start of line (after optional whitespace)
    const optRegex = /(?:^|\n)[ \t]*\(([abcdABCDक-घ])\)[ \t]+/g;
    const optPositions: { label: string; index: number }[] = [];
    let om: RegExpExecArray | null;

    while ((om = optRegex.exec(withoutPrefix)) !== null) {
      const rawLabel = om[1].toLowerCase();
      let label = rawLabel;
      if (rawLabel === 'क') label = 'a';
      else if (rawLabel === 'ख') label = 'b';
      else if (rawLabel === 'ग') label = 'c';
      else if (rawLabel === 'घ') label = 'd';

      if (['a', 'b', 'c', 'd'].includes(label) && !optPositions.some(o => o.label === label)) {
        optPositions.push({ label, index: om.index });
      }
    }

    if (optPositions.length < 2) {
      // Return question without options rather than null (to avoid silent drops)
      return {
        questionText: withoutPrefix,
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: ''
      };
    }

    // Question text = everything before the first option
    const questionText = withoutPrefix.substring(0, optPositions[0].index).trim();

    // Extract each option's text
    let optionA = '', optionB = '', optionC = '', optionD = '';
    for (let i = 0; i < optPositions.length; i++) {
      const label = optPositions[i].label;
      const start = optPositions[i].index;
      const end = i < optPositions.length - 1 ? optPositions[i + 1].index : withoutPrefix.length;
      // Strip leading whitespace/newlines + "(x) " prefix, then strip any trailing separator lines
      const raw = this.stripSeparators(
        withoutPrefix.substring(start, end).replace(/^\s*\([abcdABCD\u0915-\u0918]\)[ \t]+/, '')
      ).trim();

      if (label === 'a') optionA = raw;
      else if (label === 'b') optionB = raw;
      else if (label === 'c') optionC = raw;
      else if (label === 'd') optionD = raw;
    }

    return { questionText, optionA, optionB, optionC, optionD };
  }

  /**
   * Parse an answer+explanation section.
   *
   * Each answer block starts with "Q<num>. <letter>" at the beginning of a line.
   * Example:
   *   Q1. B
   *   • Statement 1: ...
   *   Q2. D
   *   • ...
   */
  private static parseAnswers(sectionText: string): Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D'; explanation: string }> {
    const aMap = new Map<number, { correctAnswer: 'A' | 'B' | 'C' | 'D'; explanation: string }>();

    // Strip separators so they don't bleed into explanation text
    const cleanText = this.stripSeparators(sectionText);

    // Strictly match "Q<num>. <letter>" at start of line
    // e.g. "Q1. B", "Q2. D", "Q7. B"
    const aBoundaryRegex = /(?:^|\n)[ \t]*Q(\d{1,3})\.[ \t]+([A-Da-dक-घ])\b/g;
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

      if (['A', 'B', 'C', 'D'].includes(letter) && !boundaries.some(b => b.qNum === qNum)) {
        boundaries.push({ qNum, letter, index: m.index });
      }
    }

    for (let i = 0; i < boundaries.length; i++) {
      const { qNum, letter } = boundaries[i];
      const start = boundaries[i].index;
      const end = i < boundaries.length - 1 ? boundaries[i + 1].index : cleanText.length;
      const block = cleanText.substring(start, end).trim();

      // Strip "Q<num>. <letter>" prefix — remainder is the explanation
      const explanation = block.replace(/^[ \t]*Q\d{1,3}\.[ \t]+[A-Da-dक-घ]\b\s*/, '').trim();

      aMap.set(qNum, {
        correctAnswer: letter as 'A' | 'B' | 'C' | 'D',
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
}
