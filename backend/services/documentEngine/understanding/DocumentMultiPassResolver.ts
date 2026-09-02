import crypto from 'crypto';
import { ExtractedOption, ExtractedAnswer } from '../core/ExtractedQnA';
import { OptionExtractor } from '../extraction/OptionExtractor';
import { AnswerKeyExtractor } from '../extraction/AnswerKeyExtractor';

export interface DocumentQuestionInventoryItem {
  sourceSequence: number;
  originalQuestionNumber: number;
  sourceFile: string;
  sourceLocation: string;
  sourceFingerprint: string;
  stableIdentity: string;
  questionTextCandidate: string;
  questionTypeCandidate: string;
  optionResolutionStatus: 'IMMEDIATE' | 'DEFERRED' | 'RESOLVED_DEFERRED' | 'UNRESOLVED' | 'AMBIGUOUS';
  options: ExtractedOption[];
  answer: ExtractedAnswer | null;
  associationStatus?: 'EXACT' | 'AMBIGUOUS' | 'UNRESOLVED';
}

export interface MultiPassResolverResult {
  totalTrueQuestions: number;
  immediateOptionQuestions: number;
  deferredOptionQuestions: number;
  answerKeyQuestions: number;
  unresolvedQuestions: number;
  ambiguousAssociations: number;
  questions: DocumentQuestionInventoryItem[];
}

export class DocumentMultiPassResolver {
  /**
   * Universal 6-Pass Document-Wide Question, Option & Answer Key Engine
   */
  static processDocumentText(
    fullDocumentText: string,
    sourceFile = 'document.txt'
  ): MultiPassResolverResult {
    // ── PASS 1: COMPLETE QUESTION STRUCTURAL INVENTORY ──────────────────────
    const inventory: DocumentQuestionInventoryItem[] = [];
    const allBlocks = this.splitIntoAllBlocks(fullDocumentText);

    const questionPromptBlocks: { qNum: number; text: string; seq: number }[] = [];
    const deferredOptionBlocks: { qNum: number; opts: ExtractedOption[] }[] = [];

    let seqCounter = 1;

    allBlocks.forEach(b => {
      const qNum = this.extractQuestionNumber(b.text) || seqCounter;
      const isPureOptionBlock = this.isDeferredOptionBlock(b.text);
      const isAnswerKeyBlock = /^(?:Answer Key|उत्तर|Solutions|व्याख्या)/i.test(b.text.trim()) ||
                               /^\d{1,4}[\.\:\-\=\s]+[\(\[]?[A-Ea-eक-ङ][\)\]]?$/i.test(b.text.trim());

      if (isAnswerKeyBlock) {
        // Skip answer key block from question prompt inventory
      } else if (isPureOptionBlock) {
        const trimmed = b.text.replace(/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[\.\:\)\-–—]+[ \t]*/i, '').trim();
        const opts = OptionExtractor.extractOptions(trimmed);
        if (opts.length >= 2) {
          deferredOptionBlocks.push({ qNum, opts });
        }
      } else {
        questionPromptBlocks.push({ qNum, text: b.text, seq: seqCounter++ });
      }
    });

    questionPromptBlocks.forEach((item, idx) => {
      const sourceLocation = `block_${idx + 1}`;
      const normText = item.text.trim().replace(/\s+/g, ' ').toLowerCase();
      const sourceFingerprint = crypto.createHash('sha256').update(normText).digest('hex');
      const stableIdentity = `q_stable_${crypto.createHash('sha256').update(`${sourceFile}:${sourceLocation}:${normText}`).digest('hex').substring(0, 16)}`;

      inventory.push({
        sourceSequence: item.seq,
        originalQuestionNumber: item.qNum,
        sourceFile,
        sourceLocation,
        sourceFingerprint,
        stableIdentity,
        questionTextCandidate: item.text,
        questionTypeCandidate: this.detectQuestionType(item.text),
        optionResolutionStatus: 'UNRESOLVED',
        options: [],
        answer: null,
        associationStatus: 'UNRESOLVED'
      });
    });

    // ── PASS 2: QUESTION BOUNDARY + QUESTION TYPE EXTRACTION ───────────────
    // Completed in Pass 1.

    // ── PASS 3: IMMEDIATE OPTION BLOCK DETECTION ────────────────────────────
    inventory.forEach(item => {
      // If question is STATEMENT_BASED or MATCHING, numbered list items are not MCQ options
      if (item.questionTypeCandidate === 'STATEMENT_BASED' || item.questionTypeCandidate === 'MATCHING' || item.questionTypeCandidate === 'TABLE_BASED') {
        const textWithoutStatements = item.questionTextCandidate.replace(/(?:^|\n)[ \t]*(?:\d{1,2}|[IVX]+|[A-Ea-e])[\.\:\)\-–—]+[ \t]+.+/g, '');
        const immediateOpts = OptionExtractor.extractOptions(textWithoutStatements);
        if (immediateOpts.length >= 2) {
          item.options = immediateOpts;
          item.optionResolutionStatus = 'IMMEDIATE';
          item.associationStatus = 'EXACT';
        } else {
          item.optionResolutionStatus = 'DEFERRED';
        }
      } else {
        const immediateOpts = OptionExtractor.extractOptions(item.questionTextCandidate);
        if (immediateOpts.length >= 2) {
          item.options = immediateOpts;
          item.optionResolutionStatus = 'IMMEDIATE';
          item.associationStatus = 'EXACT';
        } else {
          item.optionResolutionStatus = 'DEFERRED';
        }
      }
    });

    // ── PASS 4: ANSWER-KEY DETECTION (DISTANT / END OF DOCUMENT) ────────────
    const distantAnswerMap = AnswerKeyExtractor.extractDistantAnswerKeyMap(fullDocumentText);
    let answerKeyQuestionsCount = 0;

    distantAnswerMap.forEach((ans, qNum) => {
      const matchingItems = inventory.filter(i => i.originalQuestionNumber === qNum);
      if (matchingItems.length === 1) {
        matchingItems[0].answer = ans;
        answerKeyQuestionsCount++;
      } else if (matchingItems.length > 1) {
        matchingItems.forEach(i => {
          i.associationStatus = 'AMBIGUOUS';
        });
      }
    });

    // ── PASS 5: DOCUMENT-WIDE DEFERRED OPTION ASSOCIATION ───────────────────
    deferredOptionBlocks.forEach(def => {
      const targetItems = inventory.filter(i => i.originalQuestionNumber === def.qNum && (i.optionResolutionStatus === 'DEFERRED' || i.options.length < 2));
      if (targetItems.length === 1) {
        targetItems[0].options = def.opts;
        targetItems[0].optionResolutionStatus = 'RESOLVED_DEFERRED';
        targetItems[0].associationStatus = 'EXACT';
      } else if (targetItems.length > 1) {
        targetItems.forEach(i => {
          i.associationStatus = 'AMBIGUOUS';
        });
      }
    });

    // Also extract immediate answer keys if not distant
    inventory.forEach(item => {
      if (!item.answer) {
        const immediateAns = AnswerKeyExtractor.extractImmediateAnswer(item.questionTextCandidate);
        if (immediateAns) {
          item.answer = immediateAns;
        }
      }
    });

    // ── PASS 6: CONSERVATION & AMBIGUITY VALIDATION ─────────────────────────
    let immediateCount = 0;
    let deferredCount = 0;
    let unresolvedCount = 0;
    let ambiguousCount = 0;

    inventory.forEach(item => {
      if (item.associationStatus === 'AMBIGUOUS') {
        ambiguousCount++;
      }
      if (item.optionResolutionStatus === 'IMMEDIATE') {
        immediateCount++;
      } else if (item.optionResolutionStatus === 'RESOLVED_DEFERRED') {
        deferredCount++;
      } else if (item.optionResolutionStatus === 'DEFERRED' || item.optionResolutionStatus === 'UNRESOLVED') {
        unresolvedCount++;
      }
    });

    return {
      totalTrueQuestions: inventory.length,
      immediateOptionQuestions: immediateCount,
      deferredOptionQuestions: deferredCount,
      answerKeyQuestions: answerKeyQuestionsCount,
      unresolvedQuestions: unresolvedCount,
      ambiguousAssociations: ambiguousCount,
      questions: inventory
    };
  }

  private static splitIntoAllBlocks(text: string): { text: string }[] {
    const qMarkerRegex = /(?:^|\n)(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)[ \t]*(\d{1,4})[\.\:\)\-–—]+|(?:^|\n)(?!(?:Answer|Ans|उत्तर|\d{1,4}[\.\:\-\=\s]+[\(\[]?[A-Ea-eक-ङ][\)\]]?(?=$|\r|\n|\s+)))[ \t]*(\d{1,4})[\.\:\)\.\-–—]+[ \t]+(?![A-Ea-eक-ङ][\)\.\:]|\d+[\-–]\d+)/gi;
    const matches: { index: number; qNum: number }[] = [];
    let match: RegExpExecArray | null;

    while ((match = qMarkerRegex.exec(text)) !== null) {
      const qNumStr = match[1] || match[2];
      if (qNumStr) {
        matches.push({ index: match.index, qNum: parseInt(qNumStr, 10) });
      }
    }

    if (matches.length === 0) {
      return [{ text }];
    }

    const blocks: { text: string }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
      blocks.push({ text: text.substring(start, end).trim() });
    }
    return blocks;
  }

  private static isDeferredOptionBlock(text: string): boolean {
    const trimmed = text.replace(/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[\.\:\)\-–—]*[\s\t\r\n]*/i, '').trim();
    const optMatches = OptionExtractor.extractOptions(trimmed);
    if (optMatches.length < 2) return false;

    const firstOptIdx = trimmed.indexOf(optMatches[0].rawMarker || '(a)');
    if (firstOptIdx <= 10) {
      return true;
    }
    return false;
  }

  private static extractQuestionNumber(block: string): number | null {
    const m = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*(\d{1,4})[\.\:\)\-–—]+/i.exec(block.trim());
    return m ? parseInt(m[1], 10) : null;
  }

  private static detectQuestionType(block: string): string {
    if (block.includes('Match') || block.includes('मिलान')) return 'MATCHING';
    if (block.includes('statements') || block.includes('कथन')) return 'STATEMENT_BASED';
    if (block.includes('|')) return 'TABLE_BASED';
    return 'MCQ';
  }
}
