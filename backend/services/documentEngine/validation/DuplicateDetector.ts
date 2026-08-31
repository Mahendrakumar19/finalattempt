import { ExtractedQnA } from '../core/ExtractedQnA';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchId?: string;
  similarityScore: number;
}

export class DuplicateDetector {
  /**
   * Compares a candidate question against a list of existing questions to detect duplicates
   */
  static findDuplicate(
    candidate: ExtractedQnA,
    existingList: ExtractedQnA[],
    threshold: number = 0.85
  ): DuplicateDetectionResult {
    const candidateText = this.getPrimaryText(candidate);
    if (!candidateText) return { isDuplicate: false, similarityScore: 0.0 };

    let highestScore = 0.0;
    let bestMatchId: string | undefined = undefined;

    for (const existing of existingList) {
      if (existing.id === candidate.id) continue;

      const candLang = candidate.question.versions[0]?.language;
      const existLang = existing.question.versions[0]?.language;

      // Do NOT treat different language versions (e.g. English vs Hindi) as duplicates!
      if (candLang && existLang && candLang !== existLang && candLang !== 'unknown' && existLang !== 'unknown') {
        continue;
      }

      const existingText = this.getPrimaryText(existing);
      if (!existingText) continue;

      const score = this.calculateSimilarity(candidateText, existingText);
      if (score > highestScore) {
        highestScore = score;
        bestMatchId = existing.id;
      }
    }

    return {
      isDuplicate: highestScore >= threshold,
      matchId: bestMatchId,
      similarityScore: highestScore
    };
  }

  private static getPrimaryText(qna: ExtractedQnA): string {
    const version = qna.question.versions[0];
    return version ? version.text.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, '').trim() : '';
  }

  private static calculateSimilarity(t1: string, t2: string): number {
    if (t1 === t2) return 1.0;

    const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0.0;

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0.0;
  }
}
