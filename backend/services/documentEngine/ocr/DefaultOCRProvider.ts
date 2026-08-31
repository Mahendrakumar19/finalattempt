import { OCRProvider, OCRProviderOptions, OCRResult } from './OCRProvider';
import { TesseractOCRProvider } from './TesseractOCRProvider';

export class DefaultOCRProvider implements OCRProvider {
  readonly name = 'DefaultOCRProvider';
  private tesseractEngine = new TesseractOCRProvider();

  async recognize(imageBuffer: Buffer, options?: OCRProviderOptions): Promise<OCRResult> {
    return this.tesseractEngine.recognize(imageBuffer, options);
  }
}
