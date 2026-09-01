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

  /**
   * Strips structural markers from text before language detection
   */
  private static stripStructuralMarkers(text: string): string {
    return text
      .replace(/(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d{1,4}[ \t]*[\.\:\)\-–—]+[ \t]*/gi, '')
      .replace(/(?:^|\s+)(?:\([a-eA-Eक-ङकखगघङ]\)|[a-eA-Eक-ङकखगघङ][\.\:\)\-–—]+)[ \t]*/gi, '')
      .replace(/(?:Ans|Answer|Correct\s*Answer|Key|उत्तर)[\s\:\-\=]*[A-Ea-eक-ङ][ \t]*/gi, '')
      .replace(/(?:Explanation|Solution|Sol|व्याख्या|समाधान)[\s\:\-][ \t]*/gi, '')
      .trim();
  }

  /**
   * Detect document-level language from an array of blocks.
   * Returns ENGLISH, HINDI, BILINGUAL, or UNKNOWN.
   */
  static detectDocumentLanguage(blocks: { text: string; language?: string; type?: string }[]): 'ENGLISH' | 'HINDI' | 'BILINGUAL' | 'UNKNOWN' {
    let hasEnglish = false;
    let hasHindi = false;

    for (const block of blocks) {
      // Skip noise and structural blocks
      if (block.type === 'NOISE' || block.type === 'HEADER' || block.type === 'FOOTER' || block.type === 'DOCUMENT_HEADING') continue;

      const cleanedText = this.stripStructuralMarkers(block.text);
      if (!cleanedText || cleanedText.length < 2) continue;

      const lang = this.detectLanguage(cleanedText);
      if (lang === 'en' || lang === 'mixed') hasEnglish = true;
      if (lang === 'hi' || lang === 'mixed') hasHindi = true;
      if (hasEnglish && hasHindi) return 'BILINGUAL';
    }

    if (hasEnglish) return 'ENGLISH';
    if (hasHindi) return 'HINDI';
    return 'UNKNOWN';
  }

  /**
   * Detect page-level language from page blocks.
   */
  static detectPageLanguage(blocks: { text: string; language?: string; type?: string }[]): 'EN' | 'HI' | 'MIXED' | 'UNKNOWN' {
    let hasEn = false;
    let hasHi = false;

    for (const block of blocks) {
      if (block.type === 'NOISE' || block.type === 'HEADER' || block.type === 'FOOTER' || block.type === 'DOCUMENT_HEADING') continue;

      const cleanedText = this.stripStructuralMarkers(block.text);
      if (!cleanedText || cleanedText.length < 2) continue;

      const lang = this.detectLanguage(cleanedText);
      if (lang === 'en' || lang === 'mixed') hasEn = true;
      if (lang === 'hi' || lang === 'mixed') hasHi = true;
      if (hasEn && hasHi) return 'MIXED';
    }

    if (hasEn) return 'EN';
    if (hasHi) return 'HI';
    return 'UNKNOWN';
  }
}
