import { DocumentAdapter, AdapterOptions } from './DocumentAdapter';
import { NormalizedDocument, DocumentBlock, TableCell } from '../core/NormalizedDocument';
import { v4 as uuidv4 } from 'uuid';
import zlib from 'zlib';

export class DOCXAdapter extends DocumentAdapter {
  readonly supportedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  readonly supportedExtensions = ['.docx', '.doc'];

  async processBuffer(buffer: Buffer, options?: AdapterOptions): Promise<NormalizedDocument> {
    const rawString = buffer.toString('binary');
    let xmlContent = '';

    // Search for XML document body inside DOCX zip container or raw buffer
    const xmlStart = rawString.indexOf('<w:document');
    const xmlEnd = rawString.indexOf('</w:document>');

    if (xmlStart !== -1 && xmlEnd !== -1) {
      xmlContent = rawString.substring(xmlStart, xmlEnd + 13);
    } else {
      // Direct text fallback for legacy binary .doc or plain text stored as buffer
      xmlContent = buffer.toString('utf-8');
    }

    const blocks: DocumentBlock[] = [];
    let order = 0;

    // Extract XML Paragraphs <w:p>
    const paragraphMatches = xmlContent.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];

    for (const pXml of paragraphMatches) {
      // Extract text content inside <w:t> tags
      const textMatches = pXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = textMatches
        .map(t => t.replace(/<[^>]+>/g, ''))
        .join('')
        .trim();

      if (!text) continue;

      order++;
      const lang = this.detectScript(text);

      let blockType: DocumentBlock['type'] = 'PARAGRAPH';
      if (/Heading\s*\d/i.test(pXml) || /<w:pStyle\s+w:val="Heading/i.test(pXml)) {
        blockType = 'HEADING';
      } else if (/<w:numPr>/i.test(pXml)) {
        blockType = 'LIST';
      }

      blocks.push({
        id: `blk-docx-${uuidv4().substring(0, 8)}`,
        pageNumber: 1,
        type: blockType,
        text,
        language: lang,
        confidence: 1.0,
        order,
        style: {
          isBold: /<w:b\/>|<w:b\s+/i.test(pXml),
          isItalic: /<w:i\/>|<w:i\s+/i.test(pXml)
        }
      });
    }

    // Extract XML Tables <w:tbl>
    const tableMatches = xmlContent.match(/<w:tbl[\s>][\s\S]*?<\/w:tbl>/g) || [];
    for (const tXml of tableMatches) {
      const rowMatches = tXml.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/g) || [];
      const tableCells: TableCell[][] = [];

      rowMatches.forEach((rXml, rIdx) => {
        const cellMatches = String(rXml).match(/<w:tc[\s>][\s\S]*?<\/w:tc>/g) || [];
        const row: TableCell[] = [];
        cellMatches.forEach((cXml, cIdx) => {
          const cTextMatches = String(cXml).match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          const cellText = cTextMatches.map(t => String(t).replace(/<[^>]+>/g, '')).join(' ').trim();
          row.push({ rowIndex: rIdx, colIndex: cIdx, text: cellText });
        });
        if (row.length > 0) tableCells.push(row);
      });

      if (tableCells.length > 0) {
        order++;
        const tableText = tableCells.flatMap(r => r.map(c => c.text)).join(' ');
        blocks.push({
          id: `blk-docx-tbl-${uuidv4().substring(0, 8)}`,
          pageNumber: 1,
          type: 'TABLE',
          text: tableText,
          language: this.detectScript(tableText),
          confidence: 1.0,
          order,
          tableData: {
            rowsCount: tableCells.length,
            colsCount: tableCells[0]?.length || 0,
            cells: tableCells
          }
        });
      }
    }

    // Fallback if XML regex produced no blocks
    if (blocks.length === 0) {
      const cleanFallback = xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanFallback) {
        blocks.push({
          id: `blk-docx-fb-${uuidv4().substring(0, 8)}`,
          pageNumber: 1,
          type: 'PARAGRAPH',
          text: cleanFallback,
          language: this.detectScript(cleanFallback),
          confidence: 0.9,
          order: 1
        });
      }
    }

    const fullText = blocks.map(b => b.text).join('\n');

    return {
      id: `doc-${uuidv4().substring(0, 8)}`,
      sourceType: 'DOCX',
      filename: options?.filename || 'document.docx',
      mimeType: options?.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      languages: this.detectScript(fullText) === 'mixed' ? ['en', 'hi'] : [this.detectScript(fullText)],
      metadata: {
        title: options?.filename,
        totalWordCount: fullText.split(/\s+/).length
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
      rawText: fullText,
      createdAt: new Date().toISOString()
    };
  }
}
