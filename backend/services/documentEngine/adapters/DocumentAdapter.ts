import { NormalizedDocument } from '../core/NormalizedDocument';

export interface AdapterOptions {
  filename?: string;
  mimeType?: string;
  languages?: ('en' | 'hi')[];
  ocrFallbackEnabled?: boolean;
}

export abstract class DocumentAdapter {
  abstract readonly supportedMimeTypes: string[];
  abstract readonly supportedExtensions: string[];

  /**
   * Main entry point to convert an incoming buffer/stream into a NormalizedDocument.
   */
  abstract processBuffer(buffer: Buffer, options?: AdapterOptions): Promise<NormalizedDocument>;

  /**
   * Utility helper to split raw text blocks into lines with metadata.
   */
  protected splitTextIntoLines(text: string): string[] {
    if (!text) return [];

    // 1. Clean PDF page footers/headers e.g. "-- 1 of 63 -- POLITY POLITY BOOK"
    let cleaned = text
      .replace(/--\s*\d+\s*of\s*\d+\s*--[^\n]*/gi, '')
      .replace(/POLITY\s+POLITY\s+BOOK/gi, '');

    // 2. Insert newlines before embedded question numbers e.g. "On November 15, 1949 6. The Indian" -> "On November 15, 1949\n6. The Indian"
    cleaned = cleaned.replace(/([^\n])\s+(\d{1,4})[\.\:\)\-–—]+[ \t]+([a-zA-Z\u0900-\u097F])/g, '$1\n$2. $3');

    return cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  }

  /**
   * Helper to detect language script of a text segment.
   */
  protected detectScript(text: string): 'en' | 'hi' | 'mixed' {
    if (!text) return 'en';
    const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    const latinCount = (text.match(/[a-zA-Z]/g) || []).length;

    if (devanagariCount > 0 && latinCount > 0) return 'mixed';
    if (devanagariCount > latinCount) return 'hi';
    return 'en';
  }
}
