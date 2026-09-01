import { ExtractedQnA, ExtractedOption, LocalizedText, StatementItem, MatchingStructure, MatchingListItem } from '../core/ExtractedQnA';
import { DefaultSemanticProvider } from '../understanding/SemanticProvider';
import { ConfidenceEngine } from '../validation/ConfidenceEngine';

export class BilingualAligner {
  private static semanticProvider = new DefaultSemanticProvider();

  /**
   * Main entry point: Aligns and merges an array of raw extracted QnA candidates
   * into a list of unified logical ExtractedQnA objects.
   */
  static async alignCandidates(candidates: ExtractedQnA[]): Promise<ExtractedQnA[]> {
    if (candidates.length <= 1) return candidates;

    const enCandidates = candidates.filter(c => {
      const sec = (c.metadata?.sectionHeader || '').toLowerCase();
      if (sec.includes('english')) return true;
      if (sec.includes('hindi')) return false;
      const lang = c.question.versions[0]?.language;
      return lang === 'en' || lang === 'mixed' || lang === 'unknown';
    });

    const hiCandidates = candidates.filter(c => {
      const sec = (c.metadata?.sectionHeader || '').toLowerCase();
      if (sec.includes('hindi')) return true;
      if (sec.includes('english')) return false;
      const lang = c.question.versions[0]?.language;
      return lang === 'hi' || lang === 'mixed' || c.question.versions.some(v => v.language === 'hi');
    });

    // If document is single-language, return candidates as-is
    if (enCandidates.length === 0 || hiCandidates.length === 0) {
      return candidates;
    }

    const mergedQnas: ExtractedQnA[] = [];
    const pairedHiIds = new Set<string>();

    for (const enQ of enCandidates) {
      // Find matching Hindi candidate by Question Number & Similarity
      let bestHiMatch: ExtractedQnA | null = null;
      let highestScore = 0.0;

      for (const hiQ of hiCandidates) {
        if (pairedHiIds.has(hiQ.id)) continue;

        let score = 0.0;

        // Signal 1: Question Number Match
        if (enQ.questionNumber === hiQ.questionNumber) {
          score += 0.5;
        }

        // Signal 2: Option Count Symmetry
        if (enQ.options.length > 0 && enQ.options.length === hiQ.options.length) {
          score += 0.2;
        }

        // Signal 3: Answer Letter Concordance
        const enVal = enQ.answer.values[0];
        const hiVal = hiQ.answer.values[0];
        if (enVal && hiVal && enVal === hiVal) {
          score += 0.2;
        }

        // Signal 4: Entity / Semantic Number Match
        const enText = enQ.question.versions[0]?.text || '';
        const hiText = hiQ.question.versions[0]?.text || '';
        const enNums = enText.match(/\b\d+\b/g) || [];
        const hiNums = hiText.match(/\b\d+\b/g) || [];
        if (enNums.length > 0 && enNums.join(',') === hiNums.join(',')) {
          score += 0.1;
        }

        if (score > highestScore) {
          highestScore = score;
          bestHiMatch = hiQ;
        }
      }

      if (bestHiMatch && highestScore >= 0.5) {
        pairedHiIds.add(bestHiMatch.id);
        const merged = this.mergePair(enQ, bestHiMatch, highestScore);
        mergedQnas.push(merged);
      } else {
        mergedQnas.push(enQ);
      }
    }

    // Include any unpaired Hindi questions
    for (const hiQ of hiCandidates) {
      if (!pairedHiIds.has(hiQ.id)) {
        mergedQnas.push(hiQ);
      }
    }

    return mergedQnas.sort((a, b) => a.questionNumber - b.questionNumber);
  }

  /**
   * Merges English and Hindi QnA candidates into a unified ExtractedQnA structure
   */
  private static mergePair(enQ: ExtractedQnA, hiQ: ExtractedQnA, alignScore: number): ExtractedQnA {
    const enTextVersion = enQ.question.versions.find(v => v.language === 'en') || enQ.question.versions[0];
    const hiTextVersion = hiQ.question.versions.find(v => v.language === 'hi') || hiQ.question.versions[0];

    const mergedQuestionVersions: LocalizedText[] = [];
    if (enTextVersion) mergedQuestionVersions.push({ ...enTextVersion, language: 'en' });
    if (hiTextVersion) mergedQuestionVersions.push({ ...hiTextVersion, language: 'hi' });

    // Merge Statements (1, 2, 3...)
    const mergedStatements: StatementItem[] = [];
    const enStmts = enQ.question.statements || [];
    const hiStmts = hiQ.question.statements || [];
    const maxStmts = Math.max(enStmts.length, hiStmts.length);

    for (let sIdx = 1; sIdx <= maxStmts; sIdx++) {
      const enS = enStmts.find(s => s.number === sIdx);
      const hiS = hiStmts.find(s => s.number === sIdx);

      const stmtVersions: LocalizedText[] = [];
      if (enS && enS.versions[0]) stmtVersions.push({ ...enS.versions[0], language: 'en' });
      if (hiS && hiS.versions[0]) stmtVersions.push({ ...hiS.versions[0], language: 'hi' });

      if (stmtVersions.length > 0) {
        mergedStatements.push({
          number: sIdx,
          versions: stmtVersions
        });
      }
    }

    // Merge Matching Structure (leftList & rightList)
    let mergedMatching: MatchingStructure | undefined = undefined;
    const enM = enQ.question.matching;
    const hiM = hiQ.question.matching;

    if (enM || hiM) {
      const leftList: MatchingListItem[] = [];
      const rightList: MatchingListItem[] = [];

      const enLeft = enM?.leftList || [];
      const hiLeft = hiM?.leftList || [];
      const allLeftLabels = Array.from(new Set([...enLeft.map(i => i.label), ...hiLeft.map(i => i.label), 'A', 'B', 'C', 'D', 'E', 'I', 'II', 'III', 'IV', 'V', '1', '2', '3', '4', '5']));

      for (const lbl of allLeftLabels) {
        const enItem = enLeft.find(i => i.label === lbl);
        const hiItem = hiLeft.find(i => i.label === lbl);
        const versions: LocalizedText[] = [];

        if (enItem && enItem.versions[0]) versions.push({ ...enItem.versions[0], language: 'en' });
        if (hiItem && hiItem.versions[0]) versions.push({ ...hiItem.versions[0], language: 'hi' });

        if (versions.length > 0) {
          leftList.push({ label: lbl, versions });
        }
      }

      const enRight = enM?.rightList || [];
      const hiRight = hiM?.rightList || [];
      const allRightLabels = Array.from(new Set([...enRight.map(i => i.label), ...hiRight.map(i => i.label), '1', '2', '3', '4', '5', 'A', 'B', 'C', 'D', 'E', 'I', 'II', 'III', 'IV', 'V']));

      for (const lbl of allRightLabels) {
        const enItem = enRight.find(i => i.label === lbl);
        const hiItem = hiRight.find(i => i.label === lbl);
        const versions: LocalizedText[] = [];

        if (enItem && enItem.versions[0]) versions.push({ ...enItem.versions[0], language: 'en' });
        if (hiItem && hiItem.versions[0]) versions.push({ ...hiItem.versions[0], language: 'hi' });

        if (versions.length > 0) {
          rightList.push({ label: lbl, versions });
        }
      }

      mergedMatching = {
        headerLeft: enM?.headerLeft || hiM?.headerLeft,
        headerRight: enM?.headerRight || hiM?.headerRight,
        leftList,
        rightList,
        tableData: enM?.tableData || hiM?.tableData
      };
    }

    // Merge Options (A, B, C, D, E)
    const mergedOptions: ExtractedOption[] = [];
    const maxOpts = Math.max(enQ.options.length, hiQ.options.length);
    const labels = ['A', 'B', 'C', 'D', 'E'];

    for (let i = 0; i < maxOpts; i++) {
      const label = labels[i] || `OPT_${i + 1}`;
      const enOpt = enQ.options.find(o => o.label === label) || enQ.options[i];
      const hiOpt = hiQ.options.find(o => o.label === label) || hiQ.options[i];

      const optVersions: LocalizedText[] = [];
      if (enOpt && enOpt.versions[0]) optVersions.push({ ...enOpt.versions[0], language: 'en' });
      if (hiOpt && hiOpt.versions[0]) optVersions.push({ ...hiOpt.versions[0], language: 'hi' });

      if (optVersions.length > 0) {
        mergedOptions.push({
          label,
          rawMarker: enOpt?.rawMarker || hiOpt?.rawMarker,
          versions: optVersions
        });
      }
    }

    // Answer conflict detection
    let hasAnswerConflict = false;
    let conflictDetails = undefined;
    const enVal = enQ.answer.values[0];
    const hiVal = hiQ.answer.values[0];
    const resolvedAnsValue = enVal || hiVal;

    if (enVal && hiVal && enVal !== hiVal) {
      hasAnswerConflict = true;
      conflictDetails = `English key says ${enVal}, Hindi key says ${hiVal}`;
    }

    // Explanation versions
    const explanationVersions: LocalizedText[] = [];
    if (enQ.explanation.versions[0]) explanationVersions.push(enQ.explanation.versions[0]);
    if (hiQ.explanation.versions[0]) explanationVersions.push(hiQ.explanation.versions[0]);

    const warnings: string[] = [];
    if (hasAnswerConflict) warnings.push(`Answer Conflict: ${conflictDetails}`);
    if (alignScore < 0.7) warnings.push(`Low Bilingual Alignment Confidence (${Math.round(alignScore * 100)}%)`);

    const mergedQna: ExtractedQnA = {
      id: enQ.id,
      documentId: enQ.documentId,
      questionNumber: enQ.questionNumber,
      questionType: enQ.questionType !== 'UNKNOWN' ? enQ.questionType : hiQ.questionType,
      metadata: {
        ...enQ.metadata,
        ...hiQ.metadata
      },
      question: {
        versions: mergedQuestionVersions,
        statements: mergedStatements.length > 0 ? mergedStatements : undefined,
        matching: mergedMatching,
        tableData: enQ.question.tableData || hiQ.question.tableData
      },
      options: mergedOptions,
      answer: {
        type: 'single',
        values: resolvedAnsValue ? [resolvedAnsValue] : [],
        rawKeyText: enQ.answer.rawKeyText || hiQ.answer.rawKeyText,
        sourceLocation: enQ.answer.sourceLocation,
        confidence: hasAnswerConflict ? 0.4 : 0.95,
        hasConflict: hasAnswerConflict,
        conflictDetails
      },
      explanation: {
        versions: explanationVersions
      },
      confidence: {
        question: 0.95,
        options: 0.95,
        answer: hasAnswerConflict ? 0.4 : 0.95,
        explanation: explanationVersions.length > 0 ? 0.9 : 0.0,
        bilingualAlignment: Number(alignScore.toFixed(2)),
        overall: hasAnswerConflict ? 0.65 : 0.95
      },
      source: {
        pages: Array.from(new Set([...enQ.source.pages, ...hiQ.source.pages])),
        blockIds: Array.from(new Set([...enQ.source.blockIds, ...hiQ.source.blockIds])),
        boundingBoxes: [...(enQ.source.boundingBoxes || []), ...(hiQ.source.boundingBoxes || [])]
      },
      validation: {
        status: hasAnswerConflict ? 'REVIEW_REQUIRED' : (warnings.length > 0 ? 'WARNING' : 'PASS'),
        warnings,
        errors: []
      }
    };

    mergedQna.confidence = ConfidenceEngine.calculateConfidence(mergedQna);
    return mergedQna;
  }
}
