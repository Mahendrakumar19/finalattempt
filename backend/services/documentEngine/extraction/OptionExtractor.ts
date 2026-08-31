import { ExtractedOption, StatementItem } from '../core/ExtractedQnA';
import { LanguageDetector } from '../alignment/LanguageDetector';

export class OptionExtractor {
  /**
   * Primary explicit option markers: (a), (b), (c), (d), A., B., C., D., (क), (ख), (ग), (घ), क., ख., ग., घ.
   */
  private static readonly PRIMARY_OPTION_REGEX =
    /(?:^|\n|\s+)(?:\(([abcdeABCDEक-ङ])\)|([abcdeABCDEक-ङ])[\.\:\)\-–—]+)[ \t]+/g;

  /**
   * Numeric option markers: 1., 2., 3., 4.
   */
  private static readonly NUMERIC_OPTION_REGEX =
    /(?:^|\n|\s+)(?:\(([1-5])\)|([1-5])[\.\:\)\-–—]+)[ \t]+/g;

  /**
   * Statement list regex: 1. Statement A, 2. Statement B
   */
  /**
   * Statement list regex: 1. Statement A, 2. Statement B, or I. Statement A, II. Statement B
   */
  private static readonly STATEMENT_REGEX =
    /(?:^|\n)[ \t]*(?:\(?(\d{1,2}|[I|V|X|i|v|x]+)\)?[\.\:\)\-–—]+)[ \t]+([^\n]+)/g;

  /**
   * Helper to convert Roman numeral to integer
   */
  private static parseNumeral(val: string): number {
    const v = val.toUpperCase().trim();
    const romanMap: Record<string, number> = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    if (romanMap[v]) return romanMap[v];
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Extracts statements (1., 2., 3. or I., II., III.) when present in statement-based questions
   */
  static extractStatements(textBlock: string): StatementItem[] {
    const statements: StatementItem[] = [];
    let match: RegExpExecArray | null;

    const regex = new RegExp(this.STATEMENT_REGEX);
    while ((match = regex.exec(textBlock)) !== null) {
      const numStr = match[1];
      const prefixBeforeNum = textBlock.substring(0, match.index).trim();
      
      // Guard: Ignore if this match is the question number prefix itself (e.g. "Q1.", "1." or "प्रश्न 1.")
      if (/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?$/i.test(prefixBeforeNum)) {
        continue;
      }

      const num = this.parseNumeral(numStr);
      const text = match[2].trim();

      // Guard: Ignore chapter/section title headers
      if (/^(?:CHAPTER|SECTION|PART|UNIT)\b/i.test(text) || /^(?:INDIAN POLITY|GOVERNANCE|CONSTITUTION)\b/i.test(text)) {
        continue;
      }

      // Ensure this is not an option line like "1 and 2 only" or "I and II"
      if (num >= 1 && num <= 10 && !/^(?:\d+|[I|V|X|i|v|x]+)\s+(?:and|or|only)\b/i.test(text)) {
        const lang = LanguageDetector.detectLanguage(text);
        statements.push({
          number: num,
          versions: [{ language: lang, text, confidence: 0.95 }]
        });
      }
    }

    return statements;
  }

  /**
   * Extracts all option candidates, cleanly prioritizing explicit options over statement lists
   */
  static extractOptions(textBlock: string): ExtractedOption[] {
    if (!textBlock || !textBlock.trim()) return [];

    const options: ExtractedOption[] = [];
    const positions: { label: string; rawMarker: string; index: number }[] = [];

    // Step 1: Search for explicit line-boundary option markers first (A., B., C., D., E. or (a), (b) at line start)
    const lineBoundaryRegex = /(?:^|\n)[ \t]*(?:\(([abcdeABCDEक-ङकखगघङ])\)|\b([abcdeABCDEक-ङकखगघङ])\b[\.\:\)\-–—]+)[ \t]+/g;
    let match: RegExpExecArray | null;

    while ((match = lineBoundaryRegex.exec(textBlock)) !== null) {
      const matchedSymbol = match[1] || match[2];
      const rawMarker = match[0].trim();
      let label = matchedSymbol.toUpperCase();

      if (matchedSymbol === 'क') label = 'A';
      else if (matchedSymbol === 'ख') label = 'B';
      else if (matchedSymbol === 'ग') label = 'C';
      else if (matchedSymbol === 'घ') label = 'D';
      else if (matchedSymbol === 'ङ') label = 'E';

      // Skip exam metadata acronyms like C.D.P.O., B.P.S.C., P.C.S. or person initials like B. R. Ambedkar
      const afterMatchText = textBlock.substring(match.index + match[0].length, match.index + match[0].length + 15);
      const isInitialOrAcronym = !rawMarker.startsWith('(') && (
        /^[A-Z]\.[A-Z]/i.test(rawMarker) ||
        /^[A-Z]\.[ \t]+[A-Z]\./i.test(rawMarker + ' ' + afterMatchText) ||
        /^\.[A-Z]\./i.test(afterMatchText) ||
        /^DPO\b|^P\.C\.S\b/i.test(afterMatchText)
      );
      if (isInitialOrAcronym) {
        continue;
      }

      if (['A', 'B', 'C', 'D', 'E'].includes(label) && (!positions.some(p => p.label === label) || ['क', 'ख', 'ग', 'घ', 'ङ'].includes(matchedSymbol))) {
        positions.push({ label, rawMarker, index: match.index });
      }
    }

    // Step 2: Fallback to inline primary option markers if line-boundary yielded < 2 options
    if (positions.length < 2) {
      positions.length = 0; // reset
      let regex = new RegExp(this.PRIMARY_OPTION_REGEX);

      while ((match = regex.exec(textBlock)) !== null) {
        const matchedSymbol = match[1] || match[2];
        const rawMarker = match[0].trim();
        let label = matchedSymbol.toUpperCase();

        if (matchedSymbol === 'क') label = 'A';
        else if (matchedSymbol === 'ख') label = 'B';
        else if (matchedSymbol === 'ग') label = 'C';
        else if (matchedSymbol === 'घ') label = 'D';
        else if (matchedSymbol === 'ङ') label = 'E';

        // Skip exam metadata acronyms like C.D.P.O., B.P.S.C., P.C.S. or person initials like B. R. Ambedkar
        const afterMatchTextInline = textBlock.substring(match.index + match[0].length, match.index + match[0].length + 15);
        const isInlineInitialOrAcronym = !rawMarker.startsWith('(') && (
          /^[A-Z]\.[A-Z]/i.test(rawMarker) ||
          /^[A-Z]\.[ \t]+[A-Z]\./i.test(rawMarker + ' ' + afterMatchTextInline) ||
          /^\.[A-Z]\./i.test(afterMatchTextInline) ||
          /^DPO\b|^P\.C\.S\b/i.test(afterMatchTextInline)
        );
        if (isInlineInitialOrAcronym) {
          continue;
        }

        if (['A', 'B', 'C', 'D', 'E'].includes(label) && !positions.some(p => p.label === label)) {
          positions.push({ label, rawMarker, index: match.index });
        }
      }
    }

    // Step 3: Fallback to numeric markers 1.-5. ONLY if no primary markers were found
    if (positions.length < 2) {
      positions.length = 0;
      let regex = new RegExp(this.NUMERIC_OPTION_REGEX);
      while ((match = regex.exec(textBlock)) !== null) {
        const matchedSymbol = match[1] || match[2];
        const rawMarker = match[0].trim();
        let label = 'A';

        if (matchedSymbol === '1') label = 'A';
        else if (matchedSymbol === '2') label = 'B';
        else if (matchedSymbol === '3') label = 'C';
        else if (matchedSymbol === '4') label = 'D';
        else if (matchedSymbol === '5') label = 'E';

        if (['A', 'B', 'C', 'D', 'E'].includes(label) && !positions.some(p => p.label === label)) {
          positions.push({ label, rawMarker, index: match.index });
        }
      }
    }

    if (positions.length < 2) return [];

    positions.sort((a, b) => a.index - b.index);

    for (let i = 0; i < positions.length; i++) {
      const label = positions[i].label;
      const rawMarker = positions[i].rawMarker;
      const start = positions[i].index;
      const end = i < positions.length - 1 ? positions[i + 1].index : textBlock.length;

      let rawText = textBlock.substring(start, end)
        .replace(/^[ \t\r\n]*(?:\(([abcdeABCDE1-5क-ङकखगघङ])\)|[abcdeABCDE1-5क-ङकखगघङ][\.\:\)\-–—]+)[ \t]*/, '')
        .trim();

      // Clean trailing Answer/Explanation keywords if present
      const ansIdx = rawText.search(/(?:\r?\n|\s+)(?:Ans|Answer|Explanation|Solution|Sol|उत्तर|व्याख्या)[\s\:\-]/i);
      if (ansIdx > 0) {
        rawText = rawText.substring(0, ansIdx).trim();
      }

      // Clean trailing embedded question boundary (e.g. "On November 15, 1949 6. The Indian Constitution...")
      const embeddedQIdx = rawText.search(/(?:\r?\n|\s+)\d{1,4}[\.\:\)\-–—]+\s+[A-Z\u0900-\u097F]/);
      if (embeddedQIdx > 0) {
        rawText = rawText.substring(0, embeddedQIdx).trim();
      }

      // Clean PDF page header/footer noise e.g. "-- 1 of 63 -- POLITY POLITY BOOK"
      rawText = rawText
        .replace(/--\s*\d+\s*of\s*\d+\s*--[^\n]*/gi, '')
        .replace(/POLITY\s+POLITY\s+BOOK/gi, '')
        .replace(/POLITY\s+BOOK/gi, '')
        .replace(/page\s*\d+(?:\s*of\s*\d+)?/gi, '')
        .replace(/-\s*\d+\s*-/g, '')
        .trim();

      const lang = LanguageDetector.detectLanguage(rawText);

      options.push({
        label,
        rawMarker,
        versions: [
          {
            language: lang,
            text: rawText,
            confidence: 0.95
          }
        ]
      });
    }

    // Step 4: Post-processing inline split repair inside option text (e.g. Option A containing inline '(b) ...')
    for (let i = 0; i < options.length - 1; i++) {
      const currentOpt = options[i];
      const nextLabelChar = String.fromCharCode('A'.charCodeAt(0) + i + 1); // 'B', 'C', 'D', 'E'
      const nextLowerChar = nextLabelChar.toLowerCase();
      const currentText = currentOpt.versions[0]?.text || '';

      const inlineNextRegex = new RegExp(`(?:\r?\n|\\s)+(?:\\(([${nextLabelChar}${nextLowerChar}])\\)|[${nextLabelChar}${nextLowerChar}][\\.\\:\\)\\-–—]+)\\s+([^\\n]+)`, 'i');
      const matchInline = inlineNextRegex.exec(currentText);

      if (matchInline) {
        const textBeforeInline = currentText.substring(0, matchInline.index).trim();
        const textInlineOption = matchInline[2].trim();

        currentOpt.versions[0].text = textBeforeInline;

        const nextOpt = options[i + 1];
        if (nextOpt) {
          const nextOriginalText = nextOpt.versions[0]?.text || '';
          nextOpt.versions[0].text = `${textInlineOption} ${nextOriginalText}`.trim();
        }
      }
    }

    return options;
  }
}
