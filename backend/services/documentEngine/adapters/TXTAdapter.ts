import { DocumentAdapter, AdapterOptions } from './DocumentAdapter';
import { NormalizedDocument, DocumentBlock } from '../core/NormalizedDocument';
import { v4 as uuidv4 } from 'uuid';
import { LanguageDetector } from '../alignment/LanguageDetector';

export class TXTAdapter extends DocumentAdapter {
  readonly supportedMimeTypes = ['text/plain', 'text/markdown', 'text/rtf', 'application/rtf'];
  readonly supportedExtensions = ['.txt', '.md', '.markdown', '.rtf'];

  async processBuffer(buffer: Buffer, options?: AdapterOptions): Promise<NormalizedDocument> {
    const rawText = buffer.toString('utf-8');
    const lines = this.splitTextIntoLines(rawText);
    const blocks: DocumentBlock[] = [];

    let lineOrder = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      lineOrder++;
      const lang = this.detectScript(line);

      let blockType: DocumentBlock['type'] = 'PARAGRAPH';
      if (/^#{1,6}\s+/.test(line)) {
        blockType = 'DOCUMENT_HEADING';
      } else if (/^[=\-]{3,}$/.test(line)) {
        blockType = 'NOISE';
      }

      blocks.push({
        id: `blk-txt-${uuidv4().substring(0, 8)}`,
        pageNumber: 1,
        type: blockType,
        text: line.replace(/^#{1,6}\s+/, ''),
        language: lang,
        confidence: 1.0,
        order: lineOrder,
        sourceReference: {
          originalLine: i + 1
        }
      });
    }

    const docLang = LanguageDetector.detectDocumentLanguage(blocks);

    return {
      id: `doc-${uuidv4().substring(0, 8)}`,
      sourceType: options?.mimeType?.includes('markdown') ? 'MD' : 'TXT',
      filename: options?.filename || 'pasted_text.txt',
      mimeType: options?.mimeType || 'text/plain',
      languages: this.detectScript(rawText) === 'mixed' ? ['en', 'hi'] : [this.detectScript(rawText)],
      documentLanguage: docLang,
      metadata: {
        totalWordCount: rawText.split(/\s+/).length
      },
      pages: [
        {
          pageNumber: 1,
          width: 800,
          height: 1000,
          isScanned: false,
          digitalTextQualityScore: 1.0,
          blocks
        }
      ],
      rawText,
      createdAt: new Date().toISOString()
    };
  }
}
