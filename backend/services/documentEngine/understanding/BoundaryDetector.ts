import { DocumentBlock } from '../core/NormalizedDocument';

export interface BoundaryEvidence {
  isQuestionBoundary: boolean;
  questionNumber: number | null;
  rawPrefix: string | null;
  confidence: number; // 0.0 to 1.0
  reason: string;
}

export class BoundaryDetector {
  /**
   * Question prefix candidate regex
   * Matches: "Q1.", "Q.1", "Q1)", "1.", "1)", "1-", "Question 1", "Question No. 1", "प्र.1", "प्रश्न 1"
   */
  private static readonly QUESTION_PREFIX_REGEX =
    /^[ \t]*(?:Q|Question|Q\.|Question\s+No\.|प्र\.|प्रश्न)?[ \t]*(\d{1,4})[ \t]*[\.\:\)\-–—]+[ \t]*/i;

  /**
   * Evaluates if a document block is a TRUE Question Boundary versus a Numbered Sub-Statement
   */
  static evaluate(
    block: DocumentBlock,
    previousBlock: DocumentBlock | null,
    nextBlocks: DocumentBlock[],
    expectedNextNum: number | null,
    inStatementList: boolean = false,
    hasPromptInCluster: boolean = false
  ): BoundaryEvidence {
    const text = block.text.trim();

    // Guard 0: Parenthesized option line e.g. "(a) 4 3 1 2", "(b) 3 4 2 1", "(A) Article 14"
    if (/^[ \t]*\([a-eA-E1-5क-ङ]\)[ \t]+/i.test(text)) {
      return {
        isQuestionBoundary: false,
        questionNumber: null,
        rawPrefix: null,
        confidence: 0.0,
        reason: 'Parenthesized option marker line'
      };
    }

    // Guard 0.5: Document Section / Chapter Title line e.g. "CHAPTER 12:", "SECTION 3.", "PART II.", "अध्याय 4."
    if (/^[ \t]*(?:CHAPTER|SECTION|PART|UNIT|TOPIC|LESSON|MODULE|भाग|अध्याय|खंड|इकाई|विषय)\b/i.test(text)) {
      return {
        isQuestionBoundary: false,
        questionNumber: null,
        rawPrefix: null,
        confidence: 0.0,
        reason: 'Document section/chapter title line'
      };
    }

    const match = this.QUESTION_PREFIX_REGEX.exec(text);

    if (!match) {
      return {
        isQuestionBoundary: false,
        questionNumber: null,
        rawPrefix: null,
        confidence: 0.0,
        reason: 'No question number prefix matched'
      };
    }

    const qNum = parseInt(match[1], 10);
    const rawPrefix = match[0];

    // Year / Date Metadata Guard (e.g. "1992-93", "1997-98", "2001-02", "2020")
    let isExplicitQPrefix = !!match[0].match(/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)/i);
    if (!isExplicitQPrefix && previousBlock && /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)[ \t]*$/i.test(previousBlock.text.trim())) {
      isExplicitQPrefix = true;
    }
    if (!isExplicitQPrefix && qNum >= 1900 && qNum <= 2099) {
      const isYearFormat = /^\d{4}(?:[ \t]*[\-\/][ \t]*\d{2,4})?/i.test(text);
      if (isYearFormat) {
        return {
          isQuestionBoundary: false,
          questionNumber: null,
          rawPrefix: null,
          confidence: 0.0,
          reason: 'Year or date range citation metadata (e.g. 1992-93)'
        };
      }
    }

    // Evidence 2: Preceding context check for statement prompt, matching list, active statement list or open prompt cluster
    const prevText = previousBlock ? previousBlock.text.toLowerCase() : '';
    const isStatementPrompt = /consider the following|match list|select the correct|कथनों पर विचार|सुमेलित कीजिए|list[\s\-_]*i|column[\s\-_]*a/i.test(prevText);
    
    if ((inStatementList || isStatementPrompt || hasPromptInCluster) && qNum <= 10 && !isExplicitQPrefix) {
      return {
        isQuestionBoundary: false,
        questionNumber: qNum,
        rawPrefix,
        confidence: 0.95,
        reason: 'Internal list item inside question'
      };
    }

    // Evidence 1: Sequence Continuity check (HIGHEST PRIORITY for genuine questions)
    // If expectedNextNum is 6, and this block starts with "6.", it is 100% a question boundary!
    if (expectedNextNum !== null && qNum === expectedNextNum) {
      return {
        isQuestionBoundary: true,
        questionNumber: qNum,
        rawPrefix,
        confidence: 0.95,
        reason: 'Matches expected sequential question number'
      };
    }

    // Evidence 4: Sub-item number smaller than expected next question number
    if (expectedNextNum !== null && expectedNextNum > 1) {
      // If qNum <= 10 AND qNum < expectedNextNum (e.g. "1. Australia" inside Q14 where expectedNextNum is 15),
      // it is a sub-statement / list item of the current question, NOT a new question boundary!
      if (qNum <= 10 && qNum < expectedNextNum && !isExplicitQPrefix) {
        return {
          isQuestionBoundary: false,
          questionNumber: null,
          rawPrefix,
          confidence: 0.95,
          reason: 'Sub-item / statement number smaller than expected next question number'
        };
      }
    }

    // Evidence 5: Lookahead for Typo Number Correction (e.g. "35." appearing between Q114 and Q116 in source PDF)
    if (expectedNextNum !== null && expectedNextNum > 10 && qNum !== expectedNextNum) {
      const targetNextNum = expectedNextNum + 1;
      const hasNextSequentialNumInWindow = nextBlocks.slice(0, 8).some(b => {
        const m = b.text.trim().match(/^[ \t]*(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*(\d{1,4})[ \t]*[\.\:\)\-–—]+/i);
        return m ? parseInt(m[1], 10) === targetNextNum : false;
      });

      if (hasNextSequentialNumInWindow) {
        return {
          isQuestionBoundary: true,
          questionNumber: expectedNextNum, // Auto-correct sequence typo (e.g. 35 -> 115)
          rawPrefix,
          confidence: 0.95,
          reason: `Auto-corrected sequence typo (${qNum} -> ${expectedNextNum}) based on lookahead ${targetNextNum}`
        };
      }
    }

    // Evidence 6: Lookahead for Option Markers (a)-(e) or A-E in following blocks
    const hasOptionsInWindow = nextBlocks.some(b =>
      /^[ \t]*(?:\(([abcdeABCDEक-ङकखगघङ])\)|\b([abcdeABCDEक-ङकखगघङ])\b[\.\:\)\-–—]+)[ \t]+/i.test(b.text.trim())
    );

    if (hasOptionsInWindow) {
      if (expectedNextNum !== null && expectedNextNum > 5 && qNum < expectedNextNum && !isExplicitQPrefix) {
        return {
          isQuestionBoundary: false,
          questionNumber: null,
          rawPrefix,
          confidence: 0.95,
          reason: 'Sub-item list number preceding option codes'
        };
      }
      return {
        isQuestionBoundary: true,
        questionNumber: qNum,
        rawPrefix,
        confidence: 0.92,
        reason: 'Question candidate accompanied by option candidates'
      };
    }

    // Default heuristic for standalone numbered candidate
    return {
      isQuestionBoundary: true,
      questionNumber: qNum,
      rawPrefix,
      confidence: 0.75,
      reason: 'Numbered candidate at line start'
    };
  }
}
