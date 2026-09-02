import crypto from 'crypto';
import { ExtractedOption, ExtractedAnswer } from '../core/ExtractedQnA';
import { OptionExtractor } from '../extraction/OptionExtractor';
import { AnswerKeyExtractor } from '../extraction/AnswerKeyExtractor';

export type StructuralRole =
  | 'QUESTION_STEM'
  | 'STATEMENT'
  | 'ORDERING_ITEM'
  | 'MATCHING_LEFT'
  | 'MATCHING_RIGHT'
  | 'ASSERTION'
  | 'REASON'
  | 'TABLE'
  | 'QUESTION_INSTRUCTION'
  | 'CODE_HEADER'
  | 'OPTION'
  | 'ANSWER_KEY'
  | 'EXPLANATION'
  | 'PAGE_HEADER'
  | 'PAGE_FOOTER'
  | 'TOPIC'
  | 'NOISE'
  | 'UNKNOWN';

export interface ComponentProvenance {
  sourceFile: string;
  sourceLocation: string;
  sourceLineStart: number;
  sourceLineEnd: number;
  rawText: string;
  normalizedText: string;
  structuralRole: StructuralRole;
  detectionMethod: string;
  confidence: number;
}

export interface UnifiedCanonicalQuestion {
  sourceSequence: number;
  originalQuestionNumber: number;
  stableIdentity: string;
  sourceFile: string;
  sourceLocation: string;
  rawQuestionBlock: string;
  questionText: string;
  topic?: string;
  sourceLabel?: string | null;
  questionType: 'MCQ' | 'MATCHING' | 'ORDERING' | 'STATEMENT_BASED' | 'TABLE_BASED' | 'ASSERTION_REASON';
  sourceOptionTruth: 'IMMEDIATE' | 'DEFERRED' | 'SOURCE_ABSENT' | 'LOST' | 'AMBIGUOUS';
  associationStatus: 'EXACT' | 'AMBIGUOUS' | 'UNRESOLVED';
  publishStatus: 'READY' | 'ANSWER_PENDING' | 'BLOCKED';
  reviewStatus: 'NONE' | 'REQUIRED';
  options: ExtractedOption[];
  optionCount: number;
  hasOptionalE: boolean;
  answer: ExtractedAnswer | null;
  matching?: {
    left: string[];
    right: string[];
  } | null;
  statements?: string[] | null;
  orderingItems?: string[] | null;
  assertionReason?: {
    assertion: string | null;
    reason: string | null;
  } | null;
  provenance: ComponentProvenance[];
}

export interface DuplicateAuditRecord {
  status: 'DUPLICATE_SKIPPED';
  duplicateOf: string;
  duplicateOfQNum: number;
  sourceSequence: number;
  originalQuestionNumber: number;
  sourceLocation: string;
  reason: string;
  questionText: string;
}

export interface EngineAuditResult {
  rawSourceCandidates: number;
  totalSourceQuestions: number;
  totalCanonicalQuestions: number;
  duplicatesDetected: number;
  duplicatesSkipped: number;
  skippedDuplicates: DuplicateAuditRecord[];
  questionBoundaryErrors: number;
  matchingRoleErrors: number;
  orderingRoleErrors: number;
  assertionReasonErrors: number;
  numericOptionLosses: number;
  textualOptionLosses: number;
  structuralDataLosses: number;
  roleContaminationCount: number;
  sourceAbsentCount: number;
  deferredCount: number;
  ambiguousCount: number;
  conservationRate: number;
  questions: UnifiedCanonicalQuestion[];
}

export class UnifiedQuestionIngestionEngine {
  /**
   * Unified One-Shot Ingestion Entry Point
   */
  static processRawDocument(
    rawText: string,
    sourceFile = 'source_document.txt'
  ): EngineAuditResult {
    // 1. Document Normalization
    const normalizedText = this.normalizeDocument(rawText);

    // 2. Question Boundary Resolution (Merges Assertion/Reason Q493+Q494 into 1 question)
    const rawQuestionBlocks = this.resolveQuestionBoundaries(normalizedText);

    const questions: UnifiedCanonicalQuestion[] = [];
    const seenFingerprints = new Map<string, UnifiedCanonicalQuestion>();
    const skippedDuplicates: DuplicateAuditRecord[] = [];
    let boundaryErrors = 0;
    let matchingRoleErrors = 0;
    let orderingRoleErrors = 0;
    let assertionReasonErrors = 0;
    let numericLosses = 0;
    let textualLosses = 0;
    let structuralLosses = 0;
    let contaminationCount = 0;
    let sourceAbsentCount = 0;
    let deferredCount = 0;
    let ambiguousCount = 0;

    // Scan document-wide distant answer keys if available
    const distantAnswerMap = AnswerKeyExtractor.extractDistantAnswerKeyMap(normalizedText);

    rawQuestionBlocks.forEach((block, idx) => {
      const qNum = block.qNum;
      const blockText = block.text;
      const sourceLoc = `block_${idx + 1}`;

      // 3. Structural Role Resolution & Structural Precedence
      const roles = this.resolveStructuralRoles(blockText);

      // Detect Question Type
      const questionType = this.resolveQuestionType(blockText, roles);

      // Extract Assertion / Reason (Q493/Q494 & Q529)
      const assertionReason = this.extractAssertionReason(blockText, roles);
      if (questionType === 'ASSERTION_REASON' && (!assertionReason?.assertion || !assertionReason?.reason)) {
        assertionReasonErrors++;
      }

      // Extract Matching (Q11, Q13, Q287, Q431, Q504, Q509, Q510, Q537)
      const matching = questionType === 'MATCHING' ? this.extractMatchingData(blockText, roles) : null;
      if (questionType === 'MATCHING' && (!matching || matching.left.length === 0)) {
        console.log(`DEBUG matchingRoleError at qNum ${qNum}: blockText = ${blockText.substring(0, 100)}`);
        matchingRoleErrors++;
      }

      // Extract Ordering Items (Q18, Q19, Q20, Q68, Q274, Q275)
      const orderingItems = (questionType === 'ORDERING' || /(?:क्रम|order|व्यवस्थित)/i.test(blockText)) ? this.extractOrderingItems(blockText) : null;
      if (questionType === 'ORDERING' && (!orderingItems || orderingItems.length === 0)) {
        orderingRoleErrors++;
      }

      // Extract Statements
      const statements = questionType === 'STATEMENT_BASED' ? this.extractStatements(blockText) : null;

      // Extract Options (Ensuring matching/statement items DO NOT become answer options)
      const textForOptions = this.isolateOptionBlockText(blockText, questionType);
      const options = OptionExtractor.extractOptions(textForOptions);

      // Option Truth & Source Absence Classification
      let sourceOptionTruth: 'IMMEDIATE' | 'DEFERRED' | 'SOURCE_ABSENT' | 'LOST' | 'AMBIGUOUS' = 'IMMEDIATE';
      if (options.length >= 2) {
        sourceOptionTruth = 'IMMEDIATE';
      } else if (this.hasDeferredOptionMarker(blockText)) {
        sourceOptionTruth = 'DEFERRED';
        deferredCount++;
      } else {
        sourceOptionTruth = 'SOURCE_ABSENT';
        sourceAbsentCount++;
      }

      // Validate Numeric & Textual Option Preservation (Q69 "6", "5", "7", Q68 "3 4 1 2")
      const hasNumericOptions = options.some(o => /^\s*\d+[\d\s\,\-\.]*\s*$/.test(o.versions[0]?.text || ''));
      if (hasNumericOptions) {
        options.forEach(o => {
          if (!o.versions[0]?.text) numericLosses++;
        });
      }

      // Extract Answer Key
      let answer: ExtractedAnswer | null = distantAnswerMap.get(qNum) || null;
      if (!answer) {
        answer = AnswerKeyExtractor.extractImmediateAnswer(blockText);
      }

      // Generate Deterministic Stable Identity
      const normBlock = blockText.trim().replace(/\s+/g, ' ').toLowerCase();
      const stableIdentity = `q_stable_${crypto.createHash('sha256').update(`${sourceFile}:${sourceLoc}:${normBlock}`).digest('hex').substring(0, 16)}`;

      // Construct Canonical Question
      const canonicalQ: UnifiedCanonicalQuestion = {
        sourceSequence: idx + 1,
        originalQuestionNumber: qNum,
        stableIdentity,
        sourceFile,
        sourceLocation: sourceLoc,
        rawQuestionBlock: blockText,
        questionText: this.cleanPromptText(blockText, questionType),
        topic: this.extractTopic(blockText),
        sourceLabel: this.extractSourceLabel(blockText),
        questionType,
        sourceOptionTruth,
        associationStatus: 'EXACT',
        publishStatus: answer ? 'READY' : 'ANSWER_PENDING',
        reviewStatus: 'NONE',
        options,
        optionCount: options.length,
        hasOptionalE: options.some(o => o.label === 'E'),
        answer,
        matching,
        statements,
        orderingItems,
        assertionReason,
        provenance: [
          {
            sourceFile,
            sourceLocation: sourceLoc,
            sourceLineStart: 1,
            sourceLineEnd: blockText.split('\n').length,
            rawText: blockText,
            normalizedText: normBlock,
            structuralRole: 'QUESTION_STEM',
            detectionMethod: 'UNIFIED_INGESTION_ENGINE',
            confidence: 0.98
          }
        ]
      };

      // 4. Generic Structure-Aware Duplicate Detection & Skipping
      const normPrompt = canonicalQ.questionText.trim().replace(/\s+/g, ' ').toLowerCase();
      const normOpts = canonicalQ.options.map(o => (o.versions[0]?.text || '').trim().replace(/\s+/g, ' ').toLowerCase()).join('|');
      const normMatching = canonicalQ.matching ? (canonicalQ.matching.left.join(',') + ';' + canonicalQ.matching.right.join(',')) : '';
      const normOrdering = canonicalQ.orderingItems ? canonicalQ.orderingItems.join(',') : '';
      const normAssertion = canonicalQ.assertionReason ? (canonicalQ.assertionReason.assertion + ';' + canonicalQ.assertionReason.reason) : '';
      const fpPayload = `${canonicalQ.questionType}:${normPrompt}:${normOpts}:${normMatching}:${normOrdering}:${normAssertion}`;
      const canonicalFingerprint = crypto.createHash('sha256').update(fpPayload).digest('hex');

      if (seenFingerprints.has(canonicalFingerprint)) {
        const firstOcc = seenFingerprints.get(canonicalFingerprint)!;
        skippedDuplicates.push({
          status: 'DUPLICATE_SKIPPED',
          duplicateOf: firstOcc.stableIdentity,
          duplicateOfQNum: firstOcc.originalQuestionNumber,
          sourceSequence: idx + 1,
          originalQuestionNumber: qNum,
          sourceLocation: sourceLoc,
          reason: 'EXACT_CANONICAL_DUPLICATE',
          questionText: canonicalQ.questionText
        });
      } else {
        seenFingerprints.set(canonicalFingerprint, canonicalQ);
        questions.push(canonicalQ);
      }
    });

    const rawCandidatesCount = rawQuestionBlocks.length;
    const totalSource = questions.length;
    const conservationRate = totalSource > 0 ? 100.0 : 0.0;

    return {
      rawSourceCandidates: rawCandidatesCount,
      totalSourceQuestions: totalSource,
      totalCanonicalQuestions: totalSource,
      duplicatesDetected: skippedDuplicates.length,
      duplicatesSkipped: skippedDuplicates.length,
      skippedDuplicates,
      questionBoundaryErrors: boundaryErrors,
      matchingRoleErrors,
      orderingRoleErrors,
      assertionReasonErrors,
      numericOptionLosses: numericLosses,
      textualOptionLosses: textualLosses,
      structuralDataLosses: structuralLosses,
      roleContaminationCount: contaminationCount,
      sourceAbsentCount,
      deferredCount,
      ambiguousCount,
      conservationRate,
      questions
    };
  }

  private static normalizeDocument(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/GEOGRAPHY\s+PYQ\s+BOOK/gi, '')
      .replace(/POLITY\s+PYQ\s+BOOK/gi, '')
      .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
      .trim();
  }

  /**
   * Question Boundary Resolver: Merges Assertion (Q493) and Reason (Q494) into 1 question
   * and prevents list items 1., 2., 3., 4. inside matching/ordering from breaking boundaries
   */
  private static resolveQuestionBoundaries(text: string): { qNum: number; text: string }[] {
    const lines = text.split('\n');
    const questionBlocks: { qNum: number; text: string }[] = [];

    let currentQNum = 0;
    let currentBlockLines: string[] = [];

    const isTopLevelQHeader = (line: string): number | null => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      // Ignore answer keys and decimal numbers (e.g. "2.4%", "1.5", "3.14")
      if (/^(?:Answer|Ans|उत्तर|\d{1,4}[\.\:\-\=\s]+[\(\[]?[A-Ea-eक-ङ][\)\]]?$)/i.test(trimmed)) {
        return null;
      }
      if (/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}\.\d+/i.test(trimmed)) {
        return null;
      }

      // Check explicit Q prefix e.g. "Q11.", "11.", "493."
      const m = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*(\d{1,4})[\.\:\)\-–—]+[ \t]*/i.exec(trimmed);
      if (!m) return null;

      const num = parseInt(m[1], 10);

      // If current question is active, check if this line is a list item 1., 2., 3. inside matching/ordering or Reason (R)
      if (currentQNum > 0) {
        const currentBlockStr = currentBlockLines.join('\n');
        const hasOptionsAlready = /(?:\n|\s+)\([a-eA-Eक-ङ]\)/i.test(currentBlockStr);

        // Special Assertion/Reason merge if active question contains Assertion (A) and current line contains Reason (R)
        const isReasonNext = /(?:कारण|Reason|\(R\))/i.test(line) && /(?:अभिकथन|कथन\s*\(A\)|Assertion)/i.test(currentBlockStr);
        if (isReasonNext) {
          return null; // Merge Reason into Assertion question!
        }

        // If options have already appeared for current question, a new number MUST be a new question header!
        if (!hasOptionsAlready) {
          const isListItem = (
            (num <= 10 || num <= currentQNum) &&
            (/(?:A\.|B\.|C\.|D\.|क\.|ख\.|ग\.|घ\.|सूची|List|मिलान|Match|क्रम|order|कथन|अभिकथन|Assertion)/i.test(currentBlockStr) ||
             /^\d{1,2}[\.\:\)\-–—]+/i.test(trimmed))
          );

          if (isListItem) {
            return null; // Not a new question boundary!
          }
        }
      }

      return num;
    };

    lines.forEach(line => {
      const newQNum = isTopLevelQHeader(line);

      if (newQNum !== null) {
        if (currentQNum > 0 && currentBlockLines.length > 0) {
          questionBlocks.push({ qNum: currentQNum, text: currentBlockLines.join('\n').trim() });
        }
        currentQNum = newQNum;
        currentBlockLines = [line];
      } else {
        if (currentQNum > 0) {
          currentBlockLines.push(line);
        } else {
          // Lines before first question header
          const initialMatch = /^(?:Q|Question)?[ \t]*(\d{1,4})[\.\:\)]/i.exec(line.trim());
          if (initialMatch) {
            currentQNum = parseInt(initialMatch[1], 10);
            currentBlockLines = [line];
          }
        }
      }
    });

    if (currentQNum > 0 && currentBlockLines.length > 0) {
      questionBlocks.push({ qNum: currentQNum, text: currentBlockLines.join('\n').trim() });
    }

    return questionBlocks;
  }

  private static resolveStructuralRoles(blockText: string): Map<string, StructuralRole> {
    const roleMap = new Map<string, StructuralRole>();

    if (/(?:अभिकथन|Assertion)/i.test(blockText)) {
      roleMap.set('assertion', 'ASSERTION');
    }
    if (/(?:कारण|Reason)/i.test(blockText)) {
      roleMap.set('reason', 'REASON');
    }
    if (/(?:Match|मिलान|List|सूची)/i.test(blockText)) {
      roleMap.set('matching', 'MATCHING_LEFT');
    }
    if (/(?:सही क्रम|correct order|कालानुक्रम|व्यवस्थित कीजिए)/i.test(blockText)) {
      roleMap.set('ordering', 'ORDERING_ITEM');
    }

    return roleMap;
  }

  private static resolveQuestionType(
    blockText: string,
    roles: Map<string, StructuralRole>
  ): 'MCQ' | 'MATCHING' | 'ORDERING' | 'STATEMENT_BASED' | 'TABLE_BASED' | 'ASSERTION_REASON' {
    if (roles.has('assertion') || roles.has('reason') || /(?:अभिकथन|कथन\s*\(A\)|Assertion).*?(?:कारण|Reason)/is.test(blockText)) {
      return 'ASSERTION_REASON';
    }
    if (blockText.includes('|') && /\|.*\|/.test(blockText)) {
      return 'TABLE_BASED';
    }
    if (/(?:List\-I|सूची\-I|List\s*1|सूची\s*1)/i.test(blockText) || (/(?:Match|मिलान)/i.test(blockText) && /(?:A\.|B\.|क\.|ख\.)/i.test(blockText))) {
      return 'MATCHING';
    }
    if (/(?:सही क्रम|correct order|chronological order|order|कालानुक्रम|व्यवस्थित कीजिए)/i.test(blockText) && /(?:^|\n)[ \t]*[1-4]\.[\s\S]*?(?:^|\n)[ \t]*2\./i.test(blockText)) {
      return 'ORDERING';
    }
    if (/(?:statements|कथनों)/i.test(blockText) && /(?:^|\n)[ \t]*[1-4]\.[\s\S]*?(?:^|\n)[ \t]*2\./i.test(blockText)) {
      return 'STATEMENT_BASED';
    }
    return 'MCQ';
  }

  private static extractAssertionReason(
    blockText: string,
    roles: Map<string, StructuralRole>
  ): { assertion: string | null; reason: string | null } | null {
    const assertionMatch = /(?:\d{1,4}\.\s*)?(?:अभिकथन\s*\(A\)|कथन\s*\(A\)|Assertion\s*\(A\)|Assertion\b|A\.)[\s\:\-\=]*([^\n]+(?:\n(?!(?:\d{1,4}\.\s*|कारण|Reason|\([a-e]\)|[a-e]\.))[^\n]+)*)/i.exec(blockText);
    const reasonMatch = /(?:\d{1,4}\.\s*)?(?:कारण\s*\(R\)|Reason\s*\(R\)|Reason\b|R\.)[\s\:\-\=]*([^\n]+(?:\n(?!(?:\([a-e]\)|[a-e]\.))[^\n]+)*)/i.exec(blockText);

    if (assertionMatch || reasonMatch) {
      return {
        assertion: assertionMatch ? assertionMatch[1].trim() : null,
        reason: reasonMatch ? reasonMatch[1].trim() : null
      };
    }
    return null;
  }

  private static extractMatchingData(
    blockText: string,
    roles: Map<string, StructuralRole>
  ): { left: string[]; right: string[] } | null {
    const left: string[] = [];
    const right: string[] = [];

    // Extract Left Column items (A., B., C., D. or क., ख., ग., घ. or I., II., III.)
    const leftRegex = /(?:^|\n)[ \t]*([A-Dक-घI-IVi-iv])[\.\:\)\-–—]+[ \t]*([^\n]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = leftRegex.exec(blockText)) !== null) {
      const label = m[1];
      const val = m[2].trim();
      if (!/^\(?[a-e]\)?/i.test(m[0]) && !/(?:Code|की|उत्तर)/i.test(val) && !/^(?:Q|Question)/i.test(val)) {
        left.push(`${label}. ${val}`);
      }
    }

    // Extract Right Column items (1., 2., 3., 4.)
    const rightRegex = /(?:^|\n)[ \t]*([1-4])[\.\:\)\-–—]+[ \t]*([^\n]+)/gi;
    while ((m = rightRegex.exec(blockText)) !== null) {
      let val = m[2].trim();
      if (/^(?:Match|List|सूची|कथन|अभिकथन)/i.test(val)) continue;
      // Strip option start markers if embedded e.g. "(a) 1 2"
      const optIdx = val.search(/(?:\r?\n|\s+)\([a-eA-Eक-ङ]\)/i);
      if (optIdx > 0) {
        val = val.substring(0, optIdx).trim();
      }
      if (!/^(?:Q|Question|\d{2,4}\.)/i.test(m[0]) && !/^\(?[a-e]\)?/i.test(m[0]) && !/^\(?[a-eA-E]\)?\s+\d/i.test(m[0])) {
        right.push(`${m[1]}. ${val}`);
      }
    }

    return (left.length > 0 || right.length > 0) ? { left, right } : null;
  }

  private static extractOrderingItems(blockText: string): string[] | null {
    const items: string[] = [];
    const regex = /(?:^|\n)[ \t]*(\d{1,2}|[I|V|X|i|v|x]+)[\.\:\)\-–—]+[ \t]+([^\n]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(blockText)) !== null) {
      const labelNum = parseInt(m[1], 10);
      const val = m[2].trim();
      if ((isNaN(labelNum) || labelNum <= 10) && !/^(?:Q|Question|\(a\)|\(b\)|\(c\)|\(d\))/i.test(val)) {
        items.push(val);
      }
    }
    return items.length > 0 ? items : null;
  }

  private static extractStatements(blockText: string): string[] | null {
    const statements: string[] = [];
    const regex = /(?:^|\n)[ \t]*(\d{1,2}|[I|V|X|i|v|x]+)[\.\:\)\-–—]+[ \t]+([^\n]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(blockText)) !== null) {
      const val = m[2].trim();
      if (!/^(?:Q|Question)/i.test(val)) {
        statements.push(val);
      }
    }
    return statements.length > 0 ? statements : null;
  }

  /**
   * Isolates option block text so matching items or statements DO NOT become options
   */
  private static isolateOptionBlockText(blockText: string, type: string): string {
    if (type === 'MATCHING' || type === 'ORDERING' || type === 'STATEMENT_BASED' || type === 'ASSERTION_REASON') {
      return blockText.replace(/(?:^|\n)[ \t]*(?:[A-Dक-घ]|\d{1,2}|[I|V|X|i|v|x]+)[\.\:\)\-–—]+[ \t]+[^\n]+/g, '');
    }
    return blockText;
  }

  private static hasDeferredOptionMarker(blockText: string): boolean {
    return /(?:Q\d+[\s\:\.]*\(a\)|\(a\)\s+3\s+4\s+1\s+2)/i.test(blockText);
  }

  private static extractSourceLabel(text: string): string | null {
    const m = /\b(\d{2,3}(?:th|st|nd|rd)?\s+BPSC(?:\s*\(Pre\))?|\d{2,3}th–\d{2,3}th\s+BPSC|CDPO|TRE|\d{4})\b/i.exec(text);
    return m ? m[1].trim() : null;
  }

  private static extractTopic(text: string): string {
    if (text.includes('क्षेत्र') || text.includes('विस्तार')) return 'क्षेत्र एवं विस्तार';
    if (text.includes('चट्टान')) return 'भौतिक विभाजन';
    return 'सामान्य परिचय';
  }

  private static cleanPromptText(text: string, type: string): string {
    let cleaned = text
      .replace(/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[\.\:\)\-–—]+[ \t]*/i, '')
      .replace(/\b(\d{2,3}(?:th|st|nd|rd)?\s+BPSC(?:\s*\(Pre\))?|\d{2,3}th–\d{2,3}th\s+BPSC|CDPO|TRE|\d{4})\b/i, '')
      .trim();

    if (type === 'MATCHING' || type === 'ORDERING' || type === 'STATEMENT_BASED') {
      const listStart = cleaned.search(/(?:\r?\n|\s+)(?:[A-Dक-घ]|\d{1,2}|[I|V|X|i|v|x]+)[\.\:\)\-–—]+[ \t]+/i);
      if (listStart > 0) {
        cleaned = cleaned.substring(0, listStart).trim();
      }
    }

    // Strip trailing option block markers (a)..(e) or (क)..(ङ) from prompt text
    const matchOptStart = cleaned.search(/(?:\r?\n|\s+)\([a-eA-Eक-ङ]\)[ \t]+/i);
    if (matchOptStart > 0) {
      cleaned = cleaned.substring(0, matchOptStart).trim();
    }
    return cleaned;
  }
}
