import { DocumentAdapter, AdapterOptions } from './DocumentAdapter';
import { PDFAdapter } from './PDFAdapter';
import { DOCXAdapter } from './DOCXAdapter';
import { TXTAdapter } from './TXTAdapter';
import { HTMLAdapter } from './HTMLAdapter';
import { ImageAdapter } from './ImageAdapter';
import { NormalizedDocument } from '../core/NormalizedDocument';

export class AdapterFactory {
  private static adapters: DocumentAdapter[] = [
    new PDFAdapter(),
    new DOCXAdapter(),
    new TXTAdapter(),
    new HTMLAdapter(),
    new ImageAdapter()
  ];

  /**
   * Automatically resolves the best adapter for the given filename / mimeType and converts to NormalizedDocument.
   */
  static async process(buffer: Buffer, options: AdapterOptions): Promise<NormalizedDocument> {
    const filename = (options.filename || '').toLowerCase();
    const mimeType = (options.mimeType || '').toLowerCase();

    // Find matching adapter
    let matchedAdapter = this.adapters.find(a =>
      a.supportedMimeTypes.includes(mimeType) ||
      a.supportedExtensions.some(ext => filename.endsWith(ext))
    );

    // Default fallback adapter: TXTAdapter
    if (!matchedAdapter) {
      if (mimeType.startsWith('image/')) {
        matchedAdapter = new ImageAdapter();
      } else {
        matchedAdapter = new TXTAdapter();
      }
    }

    return matchedAdapter.processBuffer(buffer, options);
  }
}
