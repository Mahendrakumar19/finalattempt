import { QuestionType } from '../core/Constants';

export class QuestionTypeDetector {
  /**
   * Detects Question Type using structural and syntax evidence
   */
  static detect(questionText: string, optionsText: string[]): QuestionType {
    const text = (questionText + ' ' + optionsText.join(' ')).toLowerCase();

    // 1. MATCHING Question Detection
    if (
      /match list|list[\s\-_]*i\b|list[\s\-_]*1\b|सूची[\s\-_]*i|सूची[\s\-_]*1|column a|match column/i.test(text)
    ) {
      return 'MATCHING';
    }

    // 2. ASSERTION & REASON Question Detection
    if (
      /assertion\s*\(a\)|reason\s*\(r\)|अभिकथन|कारण\s*\(r\)/i.test(text) ||
      (/\bassertion\b/i.test(text) && /\breason\b/i.test(text))
    ) {
      return 'ASSERTION_REASON';
    }

    // 3. STATEMENT-BASED Question Detection
    if (
      /consider the following statements|which of the above statements|कथनों पर विचार|उपर्युक्त कथनों/i.test(text)
    ) {
      return 'STATEMENT_BASED';
    }

    // 4. TRUE / FALSE Question Detection
    if (
      optionsText.length === 2 &&
      /true/i.test(optionsText[0]) && /false/i.test(optionsText[1])
    ) {
      return 'TRUE_FALSE';
    }

    // 5. Standard MCQ Question Detection
    if (optionsText.length >= 2) {
      return 'MCQ';
    }

    return 'UNKNOWN';
  }
}
