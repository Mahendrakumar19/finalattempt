import { ExtractedAnswer } from '../core/ExtractedQnA';

export class AnswerKeyExtractor {
  /**
   * Answer Key pattern regexes
   */
  private static readonly IMMEDIATE_ANS_REGEX =
    /(?:^|\n)[\r\n\s]*(?:Answer|Ans|Correct\s*Answer|Correct\s*Option|Key|उत्तर)[\s\:\-\=]*([A-Ea-eक-ङ])\b/i;

  /**
   * Extracts immediate answer candidate following question text or options
   */
  static extractImmediateAnswer(textBlock: string): ExtractedAnswer | null {
    const match = this.IMMEDIATE_ANS_REGEX.exec(textBlock);
    if (!match) return null;

    let letter = match[1].toUpperCase();
    if (letter === 'क') letter = 'A';
    else if (letter === 'ख') letter = 'B';
    else if (letter === 'ग') letter = 'C';
    else if (letter === 'घ') letter = 'D';
    else if (letter === 'ङ') letter = 'E';

    return {
      type: 'single',
      values: [letter],
      rawKeyText: match[0].trim(),
      sourceLocation: 'IMMEDIATE',
      confidence: 0.95
    };
  }

  /**
   * Extracts distant answer key table (e.g. at the end of document: "1-A, 2-C, 3-B" or "Q1. B")
   */
  static extractDistantAnswerKeyMap(fullDocumentText: string): Map<number, ExtractedAnswer> {
    const answerMap = new Map<number, ExtractedAnswer>();

    // Locate Answer Key section if present
    const ansKeySectionIdx = fullDocumentText.search(/(?:^|\n)[ \t]*(?:Answer\s*Key|Solutions|उत्तर\s*कुंजी|उत्तर)[\s\:\-\n]+/i);
    const textToScan = ansKeySectionIdx !== -1 ? fullDocumentText.substring(ansKeySectionIdx) : fullDocumentText;

    const regex = /(?:^|\n)[ \t]*(?:Q|Question|Q\.|प्रश्न)?[ \t]*(\d{1,4})[\.\:\-\=\s]+[\(\[]?([A-Ea-eक-ङ])[\)\]]?(?=$|\r|\n|\s+)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(textToScan)) !== null) {
      const qNum = parseInt(match[1], 10);
      let letter = match[2].toUpperCase();

      if (letter === 'क') letter = 'A';
      else if (letter === 'ख') letter = 'B';
      else if (letter === 'ग') letter = 'C';
      else if (letter === 'घ') letter = 'D';
      else if (letter === 'ङ') letter = 'E';

      if (qNum > 0 && !answerMap.has(qNum)) {
        answerMap.set(qNum, {
          type: 'single',
          values: [letter],
          rawKeyText: match[0].trim(),
          sourceLocation: 'END_OF_DOCUMENT',
          confidence: 0.95
        });
      }
    }

    return answerMap;
  }
}
