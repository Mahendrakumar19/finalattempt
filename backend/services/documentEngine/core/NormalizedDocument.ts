import { BlockType } from './Constants';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextStyle {
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;
}

export interface TableCell {
  rowIndex: number;
  colIndex: number;
  rowSpan?: number;
  colSpan?: number;
  text: string;
}

export interface TableData {
  rowsCount: number;
  colsCount: number;
  headers?: string[];
  cells: TableCell[][];
  rawHtml?: string;
}

export interface DocumentBlock {
  id: string;
  pageNumber: number;
  type: BlockType;
  text: string;
  language: 'en' | 'hi' | 'mixed' | 'unknown';
  bbox?: BoundingBox;
  confidence: number; // 0.0 to 1.0
  order: number;
  style?: TextStyle;
  tableData?: TableData;
  sourceReference?: {
    startChar?: number;
    endChar?: number;
    originalLine?: number;
  };
  children?: DocumentBlock[];
}

export interface PageAnalysis {
  pageNumber: number;
  width: number;
  height: number;
  imageReference?: string;
  isScanned: boolean;
  digitalTextQualityScore: number; // 0.0 to 1.0 (low score triggers page-level OCR)
  blocks: DocumentBlock[];
}

export interface NormalizedDocument {
  id: string;
  sourceType: 'PDF' | 'DOCX' | 'DOC' | 'TXT' | 'RTF' | 'MD' | 'HTML' | 'IMAGE' | 'PASTED_TEXT';
  filename: string;
  mimeType: string;
  languages: ('en' | 'hi' | 'mixed')[];
  documentLanguage: 'ENGLISH' | 'HINDI' | 'BILINGUAL' | 'UNKNOWN';
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    exam?: string;
    year?: string;
    totalWordCount?: number;
  };
  pages: PageAnalysis[];
  rawText?: string;
  createdAt: string;
}
