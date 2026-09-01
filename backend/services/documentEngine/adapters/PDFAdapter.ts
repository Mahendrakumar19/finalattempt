import { DocumentAdapter, AdapterOptions } from './DocumentAdapter';
import { NormalizedDocument, DocumentBlock, PageAnalysis } from '../core/NormalizedDocument';
import { DefaultOCRProvider } from '../ocr/DefaultOCRProvider';
import { PDFParse } from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { LanguageDetector } from '../alignment/LanguageDetector';

export class PDFAdapter extends DocumentAdapter {
  readonly supportedMimeTypes = ['application/pdf'];
  readonly supportedExtensions = ['.pdf'];

  private ocrProvider = new DefaultOCRProvider();

  async processBuffer(buffer: Buffer, options?: AdapterOptions): Promise<NormalizedDocument> {
    const uint8 = new Uint8Array(buffer);

    let rawPdfText = '';
    let totalPdfPages = 1;

    try {
      const pdfParser = new PDFParse(uint8);
      const data = await pdfParser.getText();
      rawPdfText = data.text || '';
      totalPdfPages = (data.pages && data.pages.length) || (data.text ? (data.text.match(/\f/g) || []).length + 1 : 1);
    } catch (parseErr) {
      console.warn('[PDFAdapter] Digital pdf-parse failed, falling back to page OCR:', parseErr);
    }

    const pages: PageAnalysis[] = [];
    const pageTextChunks = this.splitTextIntoPageChunks(rawPdfText, totalPdfPages);

    let globalOrder = 0;

    for (let pIdx = 0; pIdx < pageTextChunks.length; pIdx++) {
      const pageNum = pIdx + 1;
      const pageText = pageTextChunks[pIdx].trim();

      // Page-Level Digital Text Quality Evaluation
      // Score = text length & alpha density per page
      const alphaChars = (pageText.match(/[a-zA-Z\u0900-\u097F]/g) || []).length;
      const qualityScore = pageText.length > 0 ? Math.min(1.0, alphaChars / 50) : 0.0;
      const isPageScanned = qualityScore < 0.05 && pageText.length === 0;

      const pageBlocks: DocumentBlock[] = [];

      if (!isPageScanned || pageText.length > 0) {
        // Digital Text Extraction Mode for this page
        const lines = this.splitTextIntoLines(pageText);
        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const line = lines[lIdx].trim();
          if (!line) continue;

          globalOrder++;
          pageBlocks.push({
            id: `blk-pdf-d-${uuidv4().substring(0, 8)}`,
            pageNumber: pageNum,
            type: 'PARAGRAPH',
            text: line,
            language: this.detectScript(line),
            confidence: 1.0,
            order: globalOrder,
            sourceReference: { originalLine: lIdx + 1 }
          });
        }
      } else {
        // Scanned Page OCR Fallback Mode is only for image buffers, not raw PDF buffer
        console.warn(`[PDFAdapter] Page ${pageNum} has no digital text.`);
      }

      pages.push({
        pageNumber: pageNum,
        width: 800,
        height: 1100,
        isScanned: isPageScanned,
        digitalTextQualityScore: qualityScore,
        blocks: pageBlocks
      });
    }

    const fullDocText = pages.flatMap(p => p.blocks.map(b => b.text)).join('\n');
    const allBlocks = pages.flatMap(p => p.blocks);
    const docLang = LanguageDetector.detectDocumentLanguage(allBlocks);

    return {
      id: `doc-${uuidv4().substring(0, 8)}`,
      sourceType: pages.some(p => p.isScanned) ? 'PDF' : 'PDF',
      filename: options?.filename || 'document.pdf',
      mimeType: 'application/pdf',
      languages: this.detectScript(fullDocText) === 'mixed' ? ['en', 'hi'] : [this.detectScript(fullDocText)],
      documentLanguage: docLang,
      metadata: {
        title: options?.filename,
        totalWordCount: fullDocText.split(/\s+/).length
      },
      pages,
      rawText: fullDocText,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Helper to split raw concatenated PDF text into estimated page chunks
   */
  private splitTextIntoPageChunks(rawText: string, pageCount: number): string[] {
    if (!rawText.trim() || pageCount <= 1) return [rawText];

    // Check if form-feed \f page boundaries exist
    if (rawText.includes('\f')) {
      const ffChunks = rawText.split('\f').filter(c => c.trim().length > 0);
      if (ffChunks.length > 0) return ffChunks;
    }

    // Split by lines to avoid cutting lines in half
    const lines = rawText.split('\n');
    const totalLines = lines.length;
    const linesPerPage = Math.ceil(totalLines / pageCount);
    const chunks: string[] = [];

    for (let i = 0; i < pageCount; i++) {
      const startLine = i * linesPerPage;
      const endLine = Math.min(totalLines, (i + 1) * linesPerPage);
      const pageLines = lines.slice(startLine, endLine);
      if (pageLines.length > 0) {
        chunks.push(pageLines.join('\n'));
      }
    }
    return chunks.length > 0 ? chunks : [rawText];
  }
}
