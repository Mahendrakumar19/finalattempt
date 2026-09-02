import { DocumentBlock } from '../core/NormalizedDocument';
import { OptionExtractor } from '../extraction/OptionExtractor';

export interface TopLevelQuestionSpan {
  sourceStartOffset: number;
  sourceEndOffset: number;
  rawQuestionText: string;
  originalQuestionNumber: number;
  blocks: DocumentBlock[];
}

export class TopLevelQuestionSegmenter {
  private static readonly TOP_LEVEL_Q_REGEX =
    /^[ \t]*(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*(\d{1,4})[ \t]*[\.\:\)\-–—]+[ \t]*/i;

  /**
   * PHASE 1: TOP-LEVEL QUESTION SEGMENTATION
   * Isolates exact raw source spans for each top-level question.
   * Does NOT parse internal options, matching rows, or repair content.
   */
  static segment(allBlocks: DocumentBlock[]): TopLevelQuestionSpan[] {
    if (!allBlocks || allBlocks.length === 0) return [];

    const spans: TopLevelQuestionSpan[] = [];
    let currentQNum = 0;
    let currentSpanBlocks: DocumentBlock[] = [];
    let spanStartOffset = 0;

    for (let i = 0; i < allBlocks.length; i++) {
      const block = allBlocks[i];
      const text = block.text.trim();

      if (!text) continue;

      const isTopStart = this.isTopLevelQuestionStart(block, allBlocks, i, currentQNum, currentSpanBlocks);

      if (isTopStart.isStart) {
        // Flush previous top-level question span
        if (currentSpanBlocks.length > 0) {
          const rawText = currentSpanBlocks.map(b => b.text).join('\n');
          spans.push({
            sourceStartOffset: spanStartOffset,
            sourceEndOffset: i - 1,
            rawQuestionText: rawText,
            originalQuestionNumber: currentQNum || (spans.length + 1),
            blocks: [...currentSpanBlocks]
          });
        }

        // Start new top-level question span
        currentQNum = isTopStart.questionNumber;
        spanStartOffset = i;
        currentSpanBlocks = [block];
      } else {
        currentSpanBlocks.push(block);
      }
    }

    // Flush final top-level question span
    if (currentSpanBlocks.length > 0) {
      const rawText = currentSpanBlocks.map(b => b.text).join('\n');
      spans.push({
        sourceStartOffset: spanStartOffset,
        sourceEndOffset: allBlocks.length - 1,
        rawQuestionText: rawText,
        originalQuestionNumber: currentQNum || (spans.length + 1),
        blocks: [...currentSpanBlocks]
      });
    }

    return spans;
  }

  /**
   * Conservative Top-Level Question Start Evaluator
   */
  private static isTopLevelQuestionStart(
    block: DocumentBlock,
    allBlocks: DocumentBlock[],
    index: number,
    currentQNum: number,
    currentSpanBlocks: DocumentBlock[]
  ): { isStart: boolean; questionNumber: number } {
    const text = block.text.trim();

    // Guard 0: Parenthesized option markers e.g. "(a)", "(b)", "(c)", "(d)"
    if (/^[ \t]*\([a-eA-E1-5क-ङ]\)[ \t]+/i.test(text)) {
      return { isStart: false, questionNumber: 0 };
    }

    // Guard 1: Document Section / Chapter Titles e.g. "CHAPTER 12:", "SECTION 3.", "PART II."
    if (/^[ \t]*(?:CHAPTER|SECTION|PART|UNIT|TOPIC|LESSON|MODULE|भाग|अध्याय|खंड|इकाई|विषय)\b/i.test(text)) {
      return { isStart: false, questionNumber: 0 };
    }

    const match = this.TOP_LEVEL_Q_REGEX.exec(text);
    if (!match) {
      return { isStart: false, questionNumber: 0 };
    }

    const candidateNum = parseInt(match[1], 10);
    const hasExplicitQPrefix = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)/i.test(match[0]);

    // Guard 2: Date / Year / Decimal / Percentage formats e.g. "2024.", "1997-98.", "2.4%"
    if (!hasExplicitQPrefix && candidateNum >= 1900 && candidateNum <= 2099) {
      if (/^\d{4}(?:[ \t]*[\-\/][ \t]*\d{2,4})?/i.test(text)) {
        return { isStart: false, questionNumber: 0 };
      }
    }

    // Guard 3: Candidate Number < Active Question Number Invariant
    // Numbers 1., 2., 3., 4. inside active question 951 (where candidateNum < currentQNum) are internal items, NOT question starts!
    if (!hasExplicitQPrefix && currentQNum > 0 && candidateNum < currentQNum) {
      return { isStart: false, questionNumber: 0 };
    }

    // Guard 4: Conservative Split Rule for Active Questions
    // If not explicit prefix and currentQNum exists: candidate must be sequential (currentQNum + 1) or higher AFTER active question has completed options
    if (!hasExplicitQPrefix && currentQNum > 0) {
      const activeSpanText = currentSpanBlocks.map(b => b.text).join('\n');
      const hasCodedOptions = /(?:\n|\s+)\([a-eA-E1-5क-ङ]\)[ \t]+[A-Ea-e1-5\s\d,]+/i.test(activeSpanText);
      const hasLineOptions = (activeSpanText.match(/(?:\n|^)[ \t]*(?:\([a-eA-Eक-ङ]\)|[a-eA-Eक-ङ][\.\:\)\-–—]+)[ \t]+/g) || []).length >= 2;

      const isCompletedQuestion = hasCodedOptions || hasLineOptions;

      if (!isCompletedQuestion && candidateNum !== currentQNum + 1) {
        return { isStart: false, questionNumber: 0 };
      }
    }

    return { isStart: true, questionNumber: candidateNum };
  }
}
