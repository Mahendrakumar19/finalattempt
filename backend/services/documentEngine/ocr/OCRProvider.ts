import { BoundingBox } from '../core/NormalizedDocument';

export interface OCRWord {
  text: string;
  confidence: number; // 0.0 to 1.0
  bbox?: BoundingBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox?: BoundingBox;
  words?: OCRWord[];
}

export interface OCRResult {
  text: string;
  language: 'en' | 'hi' | 'mixed';
  confidence: number; // 0.0 to 1.0
  lines: OCRLine[];
  width?: number;
  height?: number;
}

export interface OCRProviderOptions {
  languages?: ('en' | 'hi')[];
  pageSegmentationMode?: number; // 1-13 (PSM mode)
  imageScaleDpi?: number; // Default 300 DPI
}

export interface OCRProvider {
  readonly name: string;
  recognize(imageBuffer: Buffer, options?: OCRProviderOptions): Promise<OCRResult>;
}
