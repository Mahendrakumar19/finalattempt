import { ExtractedAnswer } from '../core/ExtractedQnA';

export class AnswerKeyExtractor {
  /**
   * Answer Key pattern regexes
   */
  private static readonly IMMEDIATE_ANS_REGEX =
    /(?:^|\n)[ \t]*(?:Answer|Ans|Correct\s*Answer|Correct\s*Option|Key|उत्तर)[\s\:\-\=]*([A-Ea-eक-ङ])\b/i;

  private static readonly DISTANT_ANS_KEY_REGEX =
    /(?:^|\n)[ \t]*(?:Q|Question|Q\.)?[ \t]*(\d{1,4})[\.\:\-\=\s]+[ \t]*([A-Ea-eक-ङ])\b/g;

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
    let match: RegExpExecArray | null;

    const regex = new RegExp(this.DISTANT_ANS_KEY_REGEX);
    while ((match = regex.exec(fullDocumentText)) !== null) {
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
