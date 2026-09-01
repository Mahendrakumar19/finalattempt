import { DocumentAdapter, AdapterOptions } from './DocumentAdapter';
import { NormalizedDocument, DocumentBlock } from '../core/NormalizedDocument';
import { DefaultOCRProvider } from '../ocr/DefaultOCRProvider';
import { v4 as uuidv4 } from 'uuid';
import { LanguageDetector } from '../alignment/LanguageDetector';

export class ImageAdapter extends DocumentAdapter {
  readonly supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  readonly supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  private ocrProvider = new DefaultOCRProvider();

  async processBuffer(buffer: Buffer, options?: AdapterOptions): Promise<NormalizedDocument> {
    const ocrResult = await this.ocrProvider.recognize(buffer, {
      languages: options?.languages || ['en', 'hi']
    });

    const blocks: DocumentBlock[] = [];
    let order = 0;

    for (const line of ocrResult.lines) {
      order++;
      blocks.push({
        id: `blk-img-${uuidv4().substring(0, 8)}`,
        pageNumber: 1,
        type: 'PARAGRAPH',
        text: line.text,
        language: this.detectScript(line.text),
        bbox: line.bbox,
        confidence: line.confidence,
        order
      });
    }

    const docLang = LanguageDetector.detectDocumentLanguage(blocks);

    return {
      id: `doc-${uuidv4().substring(0, 8)}`,
      sourceType: 'IMAGE',
      filename: options?.filename || 'scanned_image.png',
      mimeType: options?.mimeType || 'image/png',
      languages: [ocrResult.language],
      documentLanguage: docLang,
      metadata: {
        title: options?.filename
      },
      pages: [
        {
          pageNumber: 1,
          width: ocrResult.width || 800,
          height: ocrResult.height || 1000,
          isScanned: true,
          digitalTextQualityScore: 0.0,
          blocks
        }
      ],
      rawText: ocrResult.text,
      createdAt: new Date().toISOString()
    };
  }
}
