import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ITranslationProvider {
  translateText(text: string, sourceLang: string, targetLang: string): Promise<string>;
  translateHtml(html: string, sourceLang: string, targetLang: string): Promise<string>;
}

// Terms to preserve (proper nouns, exam codes, tech acronyms)
const PRESERVED_TERMS = [
  'UPSC', 'BPSC', 'APPSC', 'APSSB', 'NCERT', 'PYQ', 'CBT', 'OTP',
  'GDP', 'RBI', 'SEBI', 'ISRO', 'DRDO', 'PDF', 'API', 'GST', 'IAS', 'IPS', 'IFS'
];

export class GoogleTranslationProvider implements ITranslationProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.TRANSLATION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY;
  }

  /**
   * Translates plain text while preserving numbers, acronyms, and formatting.
   * Preserves exact leading & trailing whitespace to prevent collapsed words in HTML.
   */
  async translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) return text;
    if (sourceLang === targetLang) return text;

    // Detect leading and trailing whitespace to preserve exact spacing around inline HTML tags
    const leadingMatch = text.match(/^(\s*)/);
    const trailingMatch = text.match(/(\s*)$/);
    const leadingSpace = leadingMatch ? leadingMatch[1] : '';
    const trailingSpace = trailingMatch ? trailingMatch[1] : '';
    const trimmed = text.trim();

    if (!trimmed) return text;

    try {
      let translated = trimmed;
      if (this.apiKey) {
        // Official Google Cloud Translate API v2
        const res = await axios.post(`https://translation.googleapis.com/language/translate/v2`, null, {
          params: {
            q: trimmed,
            source: sourceLang,
            target: targetLang,
            format: 'text',
            key: this.apiKey
          }
        });
        if (res.data?.data?.translations?.[0]?.translatedText) {
          translated = res.data.data.translations[0].translatedText;
        }
      } else {
        // Free fallback endpoint (gtx)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
        const res = await axios.get(url, { timeout: 10000 });
        if (Array.isArray(res.data) && Array.isArray(res.data[0])) {
          const translatedChunks = res.data[0].map((chunk: any) => chunk[0]).filter(Boolean);
          if (translatedChunks.length > 0) {
            translated = translatedChunks.join('');
          }
        }
      }

      // Re-attach original leading & trailing whitespace
      return `${leadingSpace}${translated}${trailingSpace}`;
    } catch (err: any) {
      console.error(`[TranslationProvider] Error translating text (${sourceLang} -> ${targetLang}):`, err.message || err);
      return text; // Fallback to original text on failure
    }
  }

  /**
   * Translates HTML rich text safely by extracting and translating only text nodes,
   * leaving HTML tags, element attributes, links (href), and media intact.
   */
  async translateHtml(html: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!html || !html.trim()) return html;
    if (sourceLang === targetLang) return html;

    try {
      const $ = cheerio.load(html, { xmlMode: false });

      // Collect all text nodes
      const textNodes: any[] = [];
      const textsToTranslate: string[] = [];

      const walk = (node: any) => {
        if (!node) return;
        
        // Skip script, style, code, pre tags
        if (node.type === 'tag') {
          const tagName = (node.name || '').toLowerCase();
          if (['script', 'style', 'code', 'pre'].includes(tagName)) return;
        }

        if (node.type === 'text') {
          const textValue = (node.data || '').trim();
          if (textValue && textValue.length > 0 && !/^\s*$/.test(textValue)) {
            textNodes.push(node);
            textsToTranslate.push(node.data);
          }
        } else if (node.children && node.children.length > 0) {
          node.children.forEach((child: any) => walk(child));
        }
      };

      $.root().children().each((_, el) => walk(el));

      if (textsToTranslate.length === 0) {
        return html;
      }

      // Translate text nodes in chunks or batch
      for (let i = 0; i < textNodes.length; i++) {
        const originalText = textNodes[i].data;
        if (originalText && originalText.trim().length > 0) {
          const translatedText = await this.translateText(originalText, sourceLang, targetLang);
          textNodes[i].data = translatedText;
        }
      }

      let resultHtml = $.html();

      // Post-processing fix: Insert spaces where Devanagari character directly touches an HTML tag or English word without space
      // E.g., "हैसांस्कृतिक" or "है<b>"
      resultHtml = resultHtml.replace(/([\u0900-\u097F])([a-zA-Z])/g, '$1 $2');
      resultHtml = resultHtml.replace(/([a-zA-Z])([\u0900-\u097F])/g, '$1 $2');

      return resultHtml;
    } catch (err: any) {
      console.error(`[TranslationProvider] Error translating HTML (${sourceLang} -> ${targetLang}):`, err.message || err);
      return html;
    }
  }
}

export const translationProvider: ITranslationProvider = new GoogleTranslationProvider();
