export class LanguageDetector {
  /**
   * Detect script/language of a text string based on Unicode character ranges
   */
  static detectLanguage(text: string): 'en' | 'hi' | 'mixed' | 'unknown' {
    if (!text || !text.trim()) return 'unknown';

    const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    const latinCount = (text.match(/[a-zA-Z]/g) || []).length;

    if (devanagariCount > 0 && latinCount > 0) {
      if (devanagariCount >= latinCount) return 'hi';
      return 'en';
    }

    if (devanagariCount > 0) return 'hi';
    if (latinCount > 0) return 'en';

    return 'unknown';
  }
}
