import { DocumentAdapter, AdapterOptions } from './DocumentAdapter';
import { NormalizedDocument, DocumentBlock, TableCell } from '../core/NormalizedDocument';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { LanguageDetector } from '../alignment/LanguageDetector';

export class HTMLAdapter extends DocumentAdapter {
  readonly supportedMimeTypes = ['text/html', 'application/xhtml+xml'];
  readonly supportedExtensions = ['.html', '.htm', '.xhtml'];

  async processBuffer(buffer: Buffer, options?: AdapterOptions): Promise<NormalizedDocument> {
    const html = buffer.toString('utf-8');
    const $ = cheerio.load(html);
    const blocks: DocumentBlock[] = [];
    let order = 0;

    // Traverse body elements preserving semantic tags and tables
    $('body').find('h1, h2, h3, h4, p, li, table').each((_, el) => {
      const $el = $(el);
      const tag = ($el.prop('tagName') || '').toLowerCase();
      const text = $el.text().trim();

      if (!text && tag !== 'table') return;

      order++;
      const lang = this.detectScript(text);

      if (tag.startsWith('h')) {
        blocks.push({
          id: `blk-html-${uuidv4().substring(0, 8)}`,
          pageNumber: 1,
          type: 'DOCUMENT_HEADING',
          text,
          language: lang,
          confidence: 1.0,
          order
        });
      } else if (tag === 'table') {
        const rows: TableCell[][] = [];
        $el.find('tr').each((rIdx, tr) => {
          const rowCells: TableCell[] = [];
          $(tr).find('th, td').each((cIdx, cell) => {
            rowCells.push({
              rowIndex: rIdx,
              colIndex: cIdx,
              text: $(cell).text().trim()
            });
          });
          if (rowCells.length > 0) rows.push(rowCells);
        });

        blocks.push({
          id: `blk-html-${uuidv4().substring(0, 8)}`,
          pageNumber: 1,
          type: 'TABLE',
          text,
          language: lang,
          confidence: 1.0,
          order,
          tableData: {
            rowsCount: rows.length,
            colsCount: rows[0]?.length || 0,
            cells: rows,
            rawHtml: $.html($el)
          }
        });
      } else {
        blocks.push({
          id: `blk-html-${uuidv4().substring(0, 8)}`,
          pageNumber: 1,
          type: 'PARAGRAPH',
          text,
          language: lang,
          confidence: 1.0,
          order
        });
      }
    });

    const docText = blocks.map(b => b.text).join('\n');
    const docLang = LanguageDetector.detectDocumentLanguage(blocks);

    return {
      id: `doc-${uuidv4().substring(0, 8)}`,
      sourceType: 'HTML',
      filename: options?.filename || 'document.html',
      mimeType: 'text/html',
      languages: this.detectScript(docText) === 'mixed' ? ['en', 'hi'] : [this.detectScript(docText)],
      documentLanguage: docLang,
      metadata: {
        title: $('title').text() || options?.filename
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
      rawText: docText,
      createdAt: new Date().toISOString()
    };
  }
}
