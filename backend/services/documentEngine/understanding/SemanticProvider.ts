export interface SemanticComparisonResult {
  similarityScore: number; // 0.0 to 1.0
  isMatch: boolean;
  explanation?: string;
}

export interface SemanticProvider {
  readonly name: string;
  compareTexts(text1: string, text2: string): Promise<SemanticComparisonResult>;
}

export class DefaultSemanticProvider implements SemanticProvider {
  readonly name = 'DefaultSemanticProvider';

  /**
   * Deterministic Jaccard & N-gram similarity calculation for zero-dependency semantic comparison
   */
  async compareTexts(text1: string, text2: string): Promise<SemanticComparisonResult> {
    if (!text1 || !text2) return { similarityScore: 0.0, isMatch: false };

    const t1 = text1.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, '').trim();
    const t2 = text2.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, '').trim();

    if (t1 === t2) return { similarityScore: 1.0, isMatch: true };

    const words1 = new Set(t1.split(/\s+/));
    const words2 = new Set(t2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    const similarityScore = union.size > 0 ? intersection.size / union.size : 0.0;

    return {
      similarityScore,
      isMatch: similarityScore >= 0.7
    };
  }
}
