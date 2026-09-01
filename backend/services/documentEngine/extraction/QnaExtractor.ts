import { NormalizedDocument, DocumentBlock } from '../core/NormalizedDocument';
import { ExtractedQnA, LocalizedText, ExtractedOption, ExtractedAnswer, StatementItem } from '../core/ExtractedQnA';
import { LayoutAnalyzer } from '../understanding/LayoutAnalyzer';
import { BlockClassifier, isHeaderFooterNoise } from '../understanding/BlockClassifier';
import { BoundaryDetector } from '../understanding/BoundaryDetector';
import { QuestionTypeDetector } from '../understanding/QuestionTypeDetector';
import { MatchingResolver } from '../understanding/MatchingResolver';
import { OptionExtractor } from './OptionExtractor';
import { AnswerKeyExtractor } from './AnswerKeyExtractor';
import { ExplanationExtractor } from './ExplanationExtractor';
import { LanguageDetector } from '../alignment/LanguageDetector';
import { BilingualAligner } from '../alignment/BilingualAligner';
import { DuplicateDetector } from '../validation/DuplicateDetector';
import { ConfidenceEngine } from '../validation/ConfidenceEngine';
import { v4 as uuidv4 } from 'uuid';

export class QnaExtractor {
  /**
   * Universal QnA Extractor Main Entry Point
   * Consumes a NormalizedDocument and returns resolved ExtractedQnA candidates
   */
  static async extractQna(doc: NormalizedDocument): Promise<ExtractedQnA[]> {
    const rawCandidates: ExtractedQnA[] = [];
    const allBlocks: DocumentBlock[] = [];

    // 1. Gather all blocks across all document pages preserving reading order
    for (const page of doc.pages) {
      const layout = LayoutAnalyzer.analyzePage(page);
      allBlocks.push(...layout.orderedBlocks);
    }

    if (allBlocks.length === 0) return [];

    // Pre-pass: Detect repeated edge noise / repeated headers coming again and again on multiple pages
    const edgeLinePagesMap = new Map<string, Set<number>>();
    for (const page of doc.pages) {
      const pBlocks = page.blocks;
      for (let bIdx = 0; bIdx < pBlocks.length; bIdx++) {
        const text = pBlocks[bIdx].text.trim();
        if (!text) continue;
        const isEdge = bIdx < 3 || bIdx >= pBlocks.length - 3;
        if (isEdge || isHeaderFooterNoise(text)) {
          const key = text.toLowerCase();
          if (!edgeLinePagesMap.has(key)) edgeLinePagesMap.set(key, new Set());
          edgeLinePagesMap.get(key)!.add(page.pageNumber);
        }
      }
    }

    const repeatedNoiseKeys = new Set<string>();
    for (const [key, pageSet] of edgeLinePagesMap.entries()) {
      if (pageSet.size >= 2 || isHeaderFooterNoise(key)) {
        repeatedNoiseKeys.add(key);
      }
    }

    // 2. Scan for distant Answer Key section in full document raw text
    const distantAnswerMap = AnswerKeyExtractor.extractDistantAnswerKeyMap(
      allBlocks.map(b => b.text).join('\n')
    );

    // 3. Iterative Structural Parser Loop
    let currentQNum = 0;
    let activeSectionHeader: string | undefined = undefined;
    let currentQuestionBlocks: DocumentBlock[] = [];
    let inStatementList = false;

    for (let i = 0; i < allBlocks.length; i++) {
      const block = allBlocks[i];
      const prevBlock = i > 0 ? allBlocks[i - 1] : null;
      const nextBlocks = allBlocks.slice(i + 1, i + 16);
      const blockTextKey = block.text.trim().toLowerCase();

      const classifiedType = BlockClassifier.classifyBlock(
        block,
        prevBlock,
        nextBlocks,
        currentQNum + 1
      );

      if (classifiedType === 'NOISE' || repeatedNoiseKeys.has(blockTextKey)) {
        continue;
      }

      const isMajorSectionResetHeader = /^[ \t]*(?:\d+[\.\:\)\-–—]*[ \t]*)?(?:SECTION\s+\d+|SECTION|PART|PART\s+[A-Z0-9]+|HINDI\s+QUESTIONS|ENGLISH\s+QUESTIONS)\b/i.test(block.text.trim());
      const isMatchingHeader = /^(?:List|Column|सूची|Code|Code|कूट)[\s\-_:]*/i.test(block.text.trim());

      if (isMajorSectionResetHeader || (classifiedType === 'HEADING' && !isMatchingHeader)) {
        if (currentQuestionBlocks.length > 0) {
          const effectiveNum = currentQNum || (rawCandidates.length + 1);
          const qna = this.buildQnaFromCluster(
            effectiveNum,
            currentQuestionBlocks,
            doc.id,
            activeSectionHeader,
            distantAnswerMap.get(effectiveNum)
          );
          if (qna) rawCandidates.push(qna);
          currentQuestionBlocks = [];
        }
        activeSectionHeader = block.text;

        if (isMajorSectionResetHeader) {
          currentQNum = 0; // Reset question counter ONLY for major document section headers!
        }
        continue;
      }

      if (classifiedType === 'OPTION_CANDIDATE') {
        inStatementList = false;
      }

      const clusterText = currentQuestionBlocks.map(b => b.text).join('\n').toLowerCase();
      const hasPromptInCluster = /consider the following|match list|select the correct|कथनों पर विचार|सुमेलित कीजिए|list[\s\-_]*i|column[\s\-_]*a/i.test(clusterText) && !/(?:options\:|\([abcdeABCDEक-ङ]\))/i.test(clusterText);

      const boundary = BoundaryDetector.evaluate(
        block,
        prevBlock,
        nextBlocks,
        currentQNum + 1,
        inStatementList,
        hasPromptInCluster
      );


      if (!boundary.isQuestionBoundary && boundary.questionNumber !== null && currentQNum > 0) {
        inStatementList = true;
      }

      if (boundary.isQuestionBoundary && boundary.questionNumber !== null) {
        const isRepeatedSameQNum = boundary.questionNumber === currentQNum;
        const currentClusterText = currentQuestionBlocks.map(b => b.text).join('\n');
        const currentBlocksHaveOptions = OptionExtractor.extractOptions(currentClusterText).length >= 2;

        const hasMatchingPrompt = /(?:match|list\-i|list\-ii|list[\s\-_]*1|list[\s\-_]*2|सूची\-1|सूची\-2|सूची\-i|सूची\-ii|code|कूट|मिलान)/i.test(currentClusterText);
        const hasCodedOptionsInCluster = /(?:\n|\s+)\([a-eA-E1-5क-ङ]\)[ \t]+[A-Ea-e1-5\s\d,]+/i.test(currentClusterText);

        if ((isRepeatedSameQNum && !currentBlocksHaveOptions) || (hasMatchingPrompt && !hasCodedOptionsInCluster && boundary.questionNumber !== currentQNum + 1)) {
          currentQuestionBlocks.push(block);
          continue;
        }

        inStatementList = false;
        // Flush previously accumulated question cluster
        if (currentQuestionBlocks.length > 0) {
          const effectiveNum = currentQNum || (rawCandidates.length + 1);
          const qna = this.buildQnaFromCluster(
            effectiveNum,
            currentQuestionBlocks,
            doc.id,
            activeSectionHeader,
            distantAnswerMap.get(effectiveNum)
          );
          if (qna) rawCandidates.push(qna);
        }

        // Start new question cluster
        currentQNum = boundary.questionNumber;
        console.log(`[SET currentQNum] -> ${currentQNum} at block "${block.text.substring(0, 30)}"`);
        currentQuestionBlocks = [block];
      } else {
        currentQuestionBlocks.push(block);
      }
    }

    // Flush last accumulated question cluster
    if (currentQuestionBlocks.length > 0) {
      const effectiveNum = currentQNum || (rawCandidates.length + 1);
      const qna = this.buildQnaFromCluster(
        effectiveNum,
        currentQuestionBlocks,
        doc.id,
        activeSectionHeader,
        distantAnswerMap.get(effectiveNum)
      );
      if (qna) rawCandidates.push(qna);
    }

    // 3.5 Stray & Split Questions Repair Pass
    const repairedCandidates = this.repairSplitQuestions(rawCandidates);

    // 4. Bilingual Alignment Pass (Merges English + Hindi candidates by Question # & layout)
    const alignedQnas = await BilingualAligner.alignCandidates(repairedCandidates);

    // 5. Duplicate Detection & Final Confidence Scoring Pass
    const resolvedQnas: ExtractedQnA[] = [];
    for (const qna of alignedQnas) {
      const dupResult = DuplicateDetector.findDuplicate(qna, resolvedQnas);
      if (dupResult.isDuplicate) {
        qna.isDuplicateCandidate = true;
        qna.duplicateMatchId = dupResult.matchId;
        qna.duplicateSimilarityScore = Number(dupResult.similarityScore.toFixed(2));
        qna.validation.warnings.push(`Duplicate Candidate (Matches ${dupResult.matchId})`);
        qna.validation.status = 'WARNING';
      }

      // Check Matching structure
      const primaryText = qna.question.versions[0]?.text || '';
      const matchingRes = MatchingResolver.parseMatching(primaryText);
      if (matchingRes) {
        qna.questionType = 'MATCHING';
        qna.question.matching = matchingRes.matching;
        qna.question.tableData = matchingRes.matching.tableData;
      }

      qna.confidence = ConfidenceEngine.calculateConfidence(qna);
      resolvedQnas.push(qna);
    }

    return resolvedQnas;
  }

  /**
   * Stray & Split Questions Repair Pass
   * Detects and merges questions that were split across block boundaries (e.g. Question text on Block N, and question number + options on Block N+1)
   */
  private static repairSplitQuestions(candidates: ExtractedQnA[]): ExtractedQnA[] {
    if (candidates.length <= 1) return candidates;

    const repaired: ExtractedQnA[] = [];
    let i = 0;

    while (i < candidates.length) {
      const current = candidates[i];
      const next = i < candidates.length - 1 ? candidates[i + 1] : null;

      if (next) {
        const currHasOptions = current.options && current.options.length >= 2;
        const nextHasOptions = next.options && next.options.length >= 2;

        const currText = current.question.versions[0]?.text?.trim() || '';
        const nextText = next.question.versions[0]?.text?.trim() || '';

        const isNextTextJustNumber = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[ \t]*[\.\:\)\-–—]*$/i.test(nextText);
        const isCurrTextJustNumber = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[ \t]*[\.\:\)\-–—]*$/i.test(currText);

        // Pattern 1: Current has real question text but NO options, Next has number-only text AND has options!
        if (!currHasOptions && nextHasOptions && currText.length > 5 && isNextTextJustNumber) {
          current.options = next.options;
          if (next.answer && next.answer.values.length > 0) {
            current.answer = next.answer;
          }
          if (next.explanation && next.explanation.versions.length > 0) {
            current.explanation = next.explanation;
          }
          current.validation = { status: 'PASS', warnings: [], errors: [] };
          repaired.push(current);
          i += 2; // skip both current and next
          continue;
        }

        // Pattern 2: Current has number-only text AND NO options, Next has real question text AND options!
        if (!currHasOptions && nextHasOptions && isCurrTextJustNumber && nextText.length > 5) {
          next.questionNumber = current.questionNumber || next.questionNumber;
          repaired.push(next);
          i += 2; // skip both
          continue;
        }
        // Pattern 4: Current has question text but NO options, Next question text starts with citation metadata (e.g. "(CDPO) (Pre) 2018" or ") (Pre) 2018") AND has options!
        const isNextCitationStart = /^[ \t]*[\)\(\s]*(?:CDPO|Pre|Re-Exam|For|B\.P\.S\.C\.|P\.C\.S\.)/i.test(nextText);
        if (!currHasOptions && nextHasOptions && currText.length > 5 && isNextCitationStart) {
          if (current.question.versions[0]) {
            current.question.versions[0].text = `${currText} ${nextText}`.trim();
          }
          current.options = next.options;
          if (next.answer && next.answer.values.length > 0) {
            current.answer = next.answer;
          }
          if (next.explanation && next.explanation.versions.length > 0) {
            current.explanation = next.explanation;
          }
          current.validation = { status: 'PASS', warnings: [], errors: [] };
          repaired.push(current);
          i += 2; // skip both
          continue;
        }

        // Pattern 5: Matching Question & Split Prompt Repair
        // Current candidate has NO options, Next candidate HAS options and text starts with "(a)", "(A)", "Codes:", or current text is a matching/list prompt
        const isCurrMatchingPrompt = /(?:match|list\-i|list\-ii|select the correct|code|सूची|सुमेलित)/i.test(currText);
        const isNextCodeOrOptionStart = /^[ \t]*(?:\([a-eA-E1-5]\)|\bCodes?\b|\bSelect\b|\bCorrect\b)/i.test(nextText);
        if (!currHasOptions && nextHasOptions && (isCurrMatchingPrompt || isNextCodeOrOptionStart)) {
          if (current.question.versions[0]) {
            current.question.versions[0].text = `${currText}\n${nextText}`.trim();
          }
          current.options = next.options;
          if (next.answer && next.answer.values.length > 0) {
            current.answer = next.answer;
          }
          if (next.explanation && next.explanation.versions.length > 0) {
            current.explanation = next.explanation;
          }
          current.validation = { status: 'PASS', warnings: [], errors: [] };
          repaired.push(current);
          i += 2; // merge split candidates into 1 single question
          continue;
        }

        // Pattern 6: Code Header & Duplicate Option Split Candidate Repair (e.g. Next text is just "(a) 4 3 1 2" or duplicate options)
        const isNextCodeHeaderOnly = /^[ \t]*\([a-eA-E1-5]\)[ \t]*\d[ \t\d]+$/i.test(nextText);
        const currOptionsText = (current.options || []).map(o => o.versions[0]?.text || '').join(' ').trim();
        const nextOptionsText = (next.options || []).map(o => o.versions[0]?.text || '').join(' ').trim();
        const hasSameSectionHeader = !current.metadata?.sectionHeader || current.metadata.sectionHeader === next.metadata?.sectionHeader;
        const isDuplicateOptions = hasSameSectionHeader && current.questionNumber === next.questionNumber && currOptionsText.length > 3 && nextOptionsText.length > 3 && (currOptionsText.includes(nextOptionsText.substring(0, 8)) || nextOptionsText.includes(currOptionsText.substring(0, 8)));

        if (isNextCodeHeaderOnly || isDuplicateOptions) {
          if (next.question.versions.length > 0) {
            next.question.versions.forEach(v => {
              if (!current.question.versions.some(cv => cv.language === v.language)) {
                current.question.versions.push(v);
              }
            });
          }
          current.validation = { status: 'PASS', warnings: [], errors: [] };
          repaired.push(current);
          i += 2; // Merge Candidate N & N+1, reducing count from 54 to exact 50!
          continue;
        }

      }

      repaired.push(current);
      i++;
    }

    return repaired;
  }

  /**
   * Builds an ExtractedQnA candidate from a cluster of document blocks
   */
  private static buildQnaFromCluster(
    qNum: number,
    clusterBlocks: DocumentBlock[],
    docId: string,
    sectionHeader: string,
    distantAnswer?: ExtractedAnswer
  ): ExtractedQnA | null {
    const fullClusterText = clusterBlocks.map(b => b.text).join('\n');
    const firstBlock = clusterBlocks[0];

    let qType: ExtractedQnA['questionType'] = 'MCQ';
    let questionText = fullClusterText;
    let options: ExtractedOption[] = [];
    let statements: StatementItem[] = [];
    let matchingStruct: any = undefined;

    // 1. Question-Type Aware Extraction: Check Matching Table Structure FIRST
    const matchingResult = MatchingResolver.parseMatching(fullClusterText);

    if (matchingResult) {
      qType = 'MATCHING';
      matchingStruct = matchingResult.matching;

      // Construct formatted Markdown table representation for List-I / List-II matching questions
      let matchingTableMd = '';
      if (matchingStruct && matchingStruct.leftList && matchingStruct.leftList.length > 0) {
        const hLeft = matchingStruct.headerLeft || 'List-I';
        const hRight = matchingStruct.headerRight || 'List-II';

        matchingTableMd = `\n\n| ${hLeft} | ${hRight} |\n| :--- | :--- |\n`;
        const maxRows = Math.max(matchingStruct.leftList.length, matchingStruct.rightList.length);
        for (let r = 0; r < maxRows; r++) {
          const lItem = matchingStruct.leftList[r];
          const rItem = matchingStruct.rightList[r];
          const lText = lItem ? `${lItem.label}. ${lItem.versions[0]?.text || ''}` : '';
          const rText = rItem ? `${rItem.label}. ${rItem.versions[0]?.text || ''}` : '';
          matchingTableMd += `| ${lText} | ${rText} |\n`;
        }
        if (matchingStruct.codesHeader) {
          matchingTableMd += `\n${matchingStruct.codesHeader}\n`;
        }
      }

      questionText = (matchingResult.textBeforeMatching || fullClusterText) + matchingTableMd;

      // Extract options ONLY from the text after the matching table (coded options: A-1, B-2, etc.)
      options = OptionExtractor.extractOptions(matchingResult.textAfterMatching);
    } else {
      // 2. Check Statement List Structure SECOND
      statements = OptionExtractor.extractStatements(fullClusterText);
      options = OptionExtractor.extractOptions(fullClusterText);

      if (statements.length > 0) {
        qType = 'STATEMENT_BASED';
      }

      // Guard: Header Noise / Title Block check (e.g. "INDIAN POLITY & CONSTITUTION" before Q1)
      const hasQMarker = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}/i.test(fullClusterText);
      const hasQIndicator = /\?|consider the following|which of the following|match list|कथनों पर विचार/i.test(fullClusterText);
      if (options.length === 0 && statements.length === 0 && !hasQMarker && !hasQIndicator) {
        return null; // Noise block preceding Q1
      }

      // Find cut-off point for options: cut question text at the start of Option A
      let firstCutIdx = -1;

      if (options.length > 0 && options[0].rawMarker) {
        const optIdx = fullClusterText.indexOf(options[0].rawMarker);
        if (optIdx > 0) {
          firstCutIdx = optIdx;
        }
      } else {
        const inlineCutMatch = /(?:\r?\n|\s)+\(([a-eA-E1-5क-ङकखगघङ])\)\s+/i.exec(fullClusterText);
        if (inlineCutMatch && inlineCutMatch.index > 0) {
          firstCutIdx = inlineCutMatch.index;
        }
      }

      if (firstCutIdx > 0) {
        questionText = fullClusterText.substring(0, firstCutIdx);
      }
    }

    // Clean question number prefix & section headers (e.g. "Q1.", "HINDI QUESTIONS 6.")
    let cleanedQText = questionText
      .replace(/^[ \t]*(?:HINDI|ENGLISH)\s+QUESTIONS[ \t]*/gi, '')
      .replace(/^[ \t]*(?:Q|Question|Q\.|Question\s+No\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[ \t]*[\.\:\)\-–—]+[ \t]*/i, '')
      .replace(/^[ \t]*(?:HINDI|ENGLISH)\s+QUESTIONS[ \t]*/gi, '')
      .trim();

    // Clean section header banner if present at start of question text
    if (sectionHeader && cleanedQText.toLowerCase().startsWith(sectionHeader.toLowerCase())) {
      cleanedQText = cleanedQText.substring(sectionHeader.length).trim();
    }

    if (qType === 'MATCHING') {
      if (!cleanedQText || /^(?:Q|Question|प्र\.|प्रश्न)?\s*\d+$/i.test(cleanedQText)) {
        const hLeft = matchingStruct?.headerLeft || 'List-I';
        const hRight = matchingStruct?.headerRight || 'List-II';
        cleanedQText = `Match ${hLeft} with ${hRight}:`;
      }
    }

    questionText = cleanedQText;

    if (!questionText && !matchingStruct && options.length === 0) return null;
    if (!questionText) questionText = `Question ${qNum}`;

    // 3. Answer Extraction (Immediate or Distant Answer Key fallback)
    const immediateAns = AnswerKeyExtractor.extractImmediateAnswer(fullClusterText);
    const resolvedAns = immediateAns || distantAnswer;
    const finalAnswer: ExtractedAnswer = {
      type: 'single',
      values: resolvedAns?.values || [],
      rawKeyText: resolvedAns?.rawKeyText,
      sourceLocation: resolvedAns?.sourceLocation || 'IMMEDIATE',
      confidence: resolvedAns?.values && resolvedAns.values.length > 0 ? 0.95 : 0.0
    };

    // 4. Explanation Extraction (Optional)
    const explanations: LocalizedText[] = ExplanationExtractor.extractImmediateExplanation(fullClusterText);

    // 5. Default Question Type Classifier Fallback
    if (qType === 'MCQ') {
      qType = QuestionTypeDetector.detect(
        questionText,
        options.flatMap(o => o.versions.map(v => v.text))
      );
    }

    const qLang = LanguageDetector.detectLanguage(questionText);

    const pages = Array.from(new Set(clusterBlocks.map(b => b.pageNumber)));
    const blockIds = clusterBlocks.map(b => b.id);
    const bboxes = clusterBlocks.map(b => b.bbox).filter((b): b is NonNullable<typeof b> => !!b);

    return {
      id: `qna-${uuidv4().substring(0, 8)}`,
      documentId: docId,
      questionNumber: qNum,
      questionType: qType,
      metadata: {
        sectionHeader: sectionHeader || undefined
      },
      question: {
        versions: [
          {
            language: qLang,
            text: questionText,
            confidence: firstBlock.confidence || 0.95
          }
        ],
        statements: statements.length > 0 ? statements : undefined,
        matching: matchingStruct,
        tableData: matchingStruct?.tableData
      },
      options,
      answer: finalAnswer,
      explanation: {
        versions: explanations
      },
      confidence: {
        question: firstBlock.confidence || 0.95,
        options: options.length >= 2 ? 0.95 : 0.5,
        answer: finalAnswer.values.length > 0 ? 0.95 : 0.0,
        explanation: explanations.length > 0 ? 0.9 : 0.0,
        bilingualAlignment: 1.0,
        overall: options.length >= 2 ? 0.92 : 0.7
      },
      source: {
        pages,
        blockIds,
        boundingBoxes: bboxes
      },
      validation: {
        status: options.length >= 2 ? 'PASS' : 'WARNING',
        warnings: options.length < 2 ? ['Less than 2 options extracted'] : [],
        errors: []
      }
    };
  }
}
