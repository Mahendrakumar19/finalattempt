import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface WatermarkOptions {
  studentName?: string;
  email?: string;
  mobile?: string;
  rollNo?: string;
  customText?: string;
}

/**
 * Downloads a PDF from a given URL, stamps dynamic student security watermark
 * (Name, Email, Mobile/Roll, Date-Time, and confidential banner) across all pages,
 * and triggers a client-side download of the watermarked PDF.
 */
export async function downloadWatermarkedPdf(pdfUrl: string, filename: string, options: WatermarkOptions = {}): Promise<void> {
  try {
    // 1. Fetch raw PDF bytes
    const res = await fetch(pdfUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch PDF: ${res.statusText}`);
    }
    const pdfBytes = await res.arrayBuffer();

    // 2. Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    // Watermark string components
    const namePart = options.studentName ? options.studentName.toUpperCase() : 'FINAL ATTEMPT ASPIRANT';
    const emailPart = options.email || '';
    const phonePart = options.mobile || options.rollNo || '';
    const datePart = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Primary diagonal watermark line
    const watermarkLine = [namePart, emailPart, phonePart, datePart].filter(Boolean).join(' • ');
    // Header/Footer security notice
    const bannerLine = `REGISTERED TO: ${namePart} ${emailPart ? `(${emailPart})` : ''} • LICENSED FOR INDIVIDUAL STUDY ONLY • DO NOT SHARE`;

    // 3. Stamp every page
    for (const page of pages) {
      const { width, height } = page.getSize();

      // Top security banner
      page.drawText(bannerLine, {
        x: 20,
        y: height - 18,
        size: 7,
        font,
        color: rgb(0.65, 0.2, 0.2),
        opacity: 0.65,
      });

      // Bottom security banner
      page.drawText(`FINAL ATTEMPT IAS • STAMPED ON: ${datePart} • STRICTLY CONFIDENTIAL`, {
        x: 20,
        y: 12,
        size: 7,
        font,
        color: rgb(0.3, 0.3, 0.3),
        opacity: 0.65,
      });

      // Large diagonal repeating watermark across middle
      const textWidth = font.widthOfTextAtSize(watermarkLine, 12);
      page.drawText(watermarkLine, {
        x: Math.max(10, (width - textWidth) / 2),
        y: height / 2,
        size: 12,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.22,
        rotate: degrees(35),
      });

      // Second diagonal watermark offset for dense coverage
      page.drawText(watermarkLine, {
        x: Math.max(10, (width - textWidth) / 2),
        y: (height / 2) - 180,
        size: 11,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.16,
        rotate: degrees(35),
      });

      page.drawText(watermarkLine, {
        x: Math.max(10, (width - textWidth) / 2),
        y: (height / 2) + 180,
        size: 11,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.16,
        rotate: degrees(35),
      });
    }

    // 4. Save and trigger browser download
    const watermarkedBytes = await pdfDoc.save();
    const blob = new Blob([watermarkedBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.warn('[Watermark] Client-side watermarking failed, falling back to direct open:', err);
    // Graceful fallback: open raw PDF directly in a new tab
    window.open(pdfUrl, '_blank');
  }
}
