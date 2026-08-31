import { LocalizedText } from '../core/ExtractedQnA';
import { LanguageDetector } from '../alignment/LanguageDetector';

export class ExplanationExtractor {
  /**
   * Explanation prefix regex
   */
  private static readonly EXPLANATION_PREFIX_REGEX =
    /(?:^|\n)[ \t]*(?:Explanation|Solution|Sol|Detailed\s*Explanation|Answer\s*Explanation|व्याख्या|समाधान)[\s\:\-][ \t]*/i;

  /**
   * Extracts immediate explanation text block
   */
  static extractImmediateExplanation(textBlock: string): LocalizedText[] {
    const match = this.EXPLANATION_PREFIX_REGEX.exec(textBlock);
    if (!match) return [];

    const explanationText = textBlock.substring(match.index + match[0].length).trim();
    if (!explanationText) return [];

    const lang = LanguageDetector.detectLanguage(explanationText);

    return [
      {
        language: lang,
        text: explanationText,
        confidence: 0.9
      }
    ];
  }
}
