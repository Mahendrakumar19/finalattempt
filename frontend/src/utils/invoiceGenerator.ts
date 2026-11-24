import { PDFDocument, rgb, StandardFonts, PDFPage, RGB } from 'pdf-lib';

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  paymentId?: string;
  date: string;
  studentName: string;
  studentEmail?: string;
  studentMobile?: string;
  studentAddress?: string;
  courseTitle: string;
  category?: string;
  amountPaid: number; // in INR (Rupees)
}

/**
 * Draws a clean vector Indian Rupee symbol (₹) directly into the PDF.
 * Avoids WinAnsiEncoding exceptions thrown by standard PDF fonts for Unicode U+20B9.
 */
function drawRupeeSymbol(
  page: PDFPage,
  x: number,
  y: number,
  size: number = 9,
  color: RGB = rgb(0.1, 0.1, 0.1)
): number {
  const s = size / 10;
  // Top horizontal bar
  page.drawLine({
    start: { x, y: y + 9.5 * s },
    end: { x: x + 6.8 * s, y: y + 9.5 * s },
    thickness: 1.15 * s,
    color,
  });
  // Middle horizontal bar
  page.drawLine({
    start: { x, y: y + 7.0 * s },
    end: { x: x + 5.6 * s, y: y + 7.0 * s },
    thickness: 1.15 * s,
    color,
  });
  // Vertical stem
  page.drawLine({
    start: { x: x + 1.2 * s, y: y + 9.5 * s },
    end: { x: x + 1.2 * s, y: y + 4.2 * s },
    thickness: 1.15 * s,
    color,
  });
  // Upper semicircle loop (R-curve)
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const a1 = -Math.PI / 2 + (i / steps) * Math.PI;
    const a2 = -Math.PI / 2 + ((i + 1) / steps) * Math.PI;
    const cx = x + 1.2 * s;
    const cy = y + 6.8 * s;
    const rx = 3.6 * s;
    const ry = 2.4 * s;
    page.drawLine({
      start: { x: cx + rx * Math.cos(a1), y: cy + ry * Math.sin(a1) },
      end: { x: cx + rx * Math.cos(a2), y: cy + ry * Math.sin(a2) },
      thickness: 1.15 * s,
      color,
    });
  }
  // Diagonal leg descending right
  page.drawLine({
    start: { x: x + 2.5 * s, y: y + 4.5 * s },
    end: { x: x + 7.0 * s, y },
    thickness: 1.2 * s,
    color,
  });
  return 7.6 * s; // width occupied by symbol
}

function formatINR(val: number): string {
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generates an official, GST-compliant tax invoice / fee receipt PDF
 * with Institute Logo, background watermark, vector ₹ rupee symbols,
 * and initiates client-side download.
 */
export async function generateTaxInvoicePdf(data: InvoiceData): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 595 x 842 points
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;

  // 1. Load Institute Logos for Header & Background Watermark (graceful fallback)
  let headerLogoImg = null;
  let watermarkLogoImg = null;

  try {
    const res = await fetch('/lightlogofull.png');
    if (res.ok) {
      const bytes = await res.arrayBuffer();
      headerLogoImg = await pdfDoc.embedPng(bytes);
    }
  } catch (_) {}

  try {
    const res = await fetch('/fa-logo-mark.png');
    if (res.ok) {
      const bytes = await res.arrayBuffer();
      watermarkLogoImg = await pdfDoc.embedPng(bytes);
    }
  } catch (_) {}

  // 2. Background Subtle Watermark (Centered on page)
  if (watermarkLogoImg) {
    const wmWidth = 260;
    const wmHeight = 173; // 900x600 ratio
    page.drawImage(watermarkLogoImg, {
      x: (width - wmWidth) / 2,
      y: (height - wmHeight) / 2 - 20,
      width: wmWidth,
      height: wmHeight,
      opacity: 0.05,
    });
  }

  // 3. Header Background Bar (Navy / Brand Gold Accent)
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.08, 0.15, 0.32), // Deep Navy
  });

  page.drawRectangle({
    x: 0,
    y: height - 104,
    width: width,
    height: 4,
    color: rgb(0.92, 0.65, 0.15), // Amber Gold
  });

  // 4. Institute Branding in Header (Logo image or Clean Text)
  if (headerLogoImg) {
    const logoW = 160;
    const logoH = logoW * (401 / 2693);
    page.drawImage(headerLogoImg, {
      x: margin,
      y: height - 48,
      width: logoW,
      height: logoH,
    });
  } else {
    page.drawText('FINAL ATTEMPT ACADEMY', {
      x: margin,
      y: height - 45,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  }

  page.drawText('Empowering BPSC & State Civil Services Aspirants | Patna Learning Hub', {
    x: margin,
    y: height - 64,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  page.drawText('GSTIN: 10AAECF9281Q1Z5 • Email: contact@finalattempt.com • Web: finalattempt.com', {
    x: margin,
    y: height - 78,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.75, 0.8, 0.9),
  });

  // Invoice Title Right Aligned
  page.drawText('TAX INVOICE / RECEIPT', {
    x: width - 210,
    y: height - 45,
    size: 13,
    font: fontBold,
    color: rgb(0.95, 0.75, 0.2),
  });

  page.drawText('ORIGINAL FOR RECIPIENT', {
    x: width - 180,
    y: height - 60,
    size: 8,
    font: fontBold,
    color: rgb(0.8, 0.85, 0.95),
  });

  // 5. Invoice & Student Meta Grid
  const metaTop = height - 130;

  // Left: Billed To
  page.drawText('BILLED TO (STUDENT):', {
    x: margin,
    y: metaTop,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(data.studentName.toUpperCase(), {
    x: margin,
    y: metaTop - 16,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  if (data.studentEmail) {
    page.drawText(`Email: ${data.studentEmail}`, {
      x: margin,
      y: metaTop - 30,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  if (data.studentMobile) {
    page.drawText(`Mobile: +91 ${data.studentMobile}`, {
      x: margin,
      y: metaTop - 44,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Right: Invoice Metadata Box
  const metaRightX = width - 220;
  page.drawRectangle({
    x: metaRightX - 10,
    y: metaTop - 60,
    width: 190,
    height: 72,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.88, 0.94),
    borderWidth: 1,
  });

  page.drawText(`Invoice No: ${data.invoiceNumber}`, {
    x: metaRightX,
    y: metaTop - 5,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText(`Invoice Date: ${data.date}`, {
    x: metaRightX,
    y: metaTop - 20,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Order ID: ${data.orderId}`, {
    x: metaRightX,
    y: metaTop - 34,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  if (data.paymentId) {
    page.drawText(`Payment Ref: ${data.paymentId}`, {
      x: metaRightX,
      y: metaTop - 48,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // 6. Itemized Fee Table
  const tableTop = metaTop - 90;

  // Table Header
  page.drawRectangle({
    x: margin,
    y: tableTop - 22,
    width: width - (margin * 2),
    height: 24,
    color: rgb(0.12, 0.18, 0.35),
  });

  page.drawText('SL', { x: margin + 8, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('PROGRAM / COURSE DESCRIPTION', { x: margin + 35, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('SAC CODE', { x: margin + 280, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  // Column Header: BASE (₹)
  page.drawText('BASE (', { x: margin + 355, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  const rwH1 = drawRupeeSymbol(page, margin + 392, tableTop - 14, 8, rgb(1, 1, 1));
  page.drawText(')', { x: margin + 392 + rwH1 + 1, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  // Column Header: TOTAL (₹)
  page.drawText('TOTAL (', { x: width - margin - 85, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  const rwH2 = drawRupeeSymbol(page, width - margin - 45, tableTop - 14, 8, rgb(1, 1, 1));
  page.drawText(')', { x: width - margin - 45 + rwH2 + 1, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  // Calculation: 18% GST (9% CGST + 9% SGST inclusive)
  const totalAmount = Number(data.amountPaid) || 0;
  const basePrice = Math.round((totalAmount / 1.18) * 100) / 100;
  const gstTotal = Math.round((totalAmount - basePrice) * 100) / 100;
  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal - cgst) * 100) / 100;

  // Table Row
  const rowY = tableTop - 50;
  page.drawRectangle({
    x: margin,
    y: rowY - 10,
    width: width - (margin * 2),
    height: 30,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.88, 0.9, 0.95),
    borderWidth: 1,
  });

  page.drawText('01', { x: margin + 8, y: rowY + 3, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // Truncate course title safely if very long
  const displayTitle = data.courseTitle.length > 42 ? `${data.courseTitle.slice(0, 40)}...` : data.courseTitle;
  page.drawText(displayTitle, { x: margin + 35, y: rowY + 7, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`Category: ${data.category || 'Online Program'} • Full Batch Access`, { x: margin + 35, y: rowY - 4, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  page.drawText('999293', { x: margin + 285, y: rowY + 3, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Base price with vector ₹
  const rwRow1 = drawRupeeSymbol(page, margin + 355, rowY + 3, 8.5, rgb(0.2, 0.2, 0.2));
  page.drawText(formatINR(basePrice), { x: margin + 355 + rwRow1 + 2, y: rowY + 3, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // Total price with vector ₹
  const rwRow2 = drawRupeeSymbol(page, width - margin - 85, rowY + 3, 9, rgb(0.1, 0.1, 0.1));
  page.drawText(formatINR(totalAmount), { x: width - margin - 85 + rwRow2 + 2, y: rowY + 3, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  // 7. Calculation Breakdown Box
  const calcTop = rowY - 50;
  const calcX = width - margin - 225;

  page.drawRectangle({
    x: calcX,
    y: calcTop - 95,
    width: 225,
    height: 110,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  // Taxable Base Amount
  page.drawText('Taxable Base Amount:', { x: calcX + 12, y: calcTop + 2, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  const rwB1 = drawRupeeSymbol(page, calcX + 140, calcTop + 2, 8, rgb(0.2, 0.2, 0.2));
  page.drawText(formatINR(basePrice), { x: calcX + 140 + rwB1 + 2, y: calcTop + 2, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // CGST
  page.drawText('CGST (9.0%):', { x: calcX + 12, y: calcTop - 18, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  const rwB2 = drawRupeeSymbol(page, calcX + 140, calcTop - 18, 8, rgb(0.2, 0.2, 0.2));
  page.drawText(formatINR(cgst), { x: calcX + 140 + rwB2 + 2, y: calcTop - 18, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // SGST
  page.drawText('SGST (9.0%):', { x: calcX + 12, y: calcTop - 38, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  const rwB3 = drawRupeeSymbol(page, calcX + 140, calcTop - 38, 8, rgb(0.2, 0.2, 0.2));
  page.drawText(formatINR(sgst), { x: calcX + 140 + rwB3 + 2, y: calcTop - 38, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  // Divider
  page.drawLine({
    start: { x: calcX + 8, y: calcTop - 52 },
    end: { x: calcX + 217, y: calcTop - 52 },
    color: rgb(0.8, 0.85, 0.95),
    thickness: 1,
  });

  // Total Paid
  page.drawText('Total Paid:', { x: calcX + 12, y: calcTop - 70, size: 10, font: fontBold, color: rgb(0.08, 0.15, 0.32) });
  const rwB4 = drawRupeeSymbol(page, calcX + 128, calcTop - 70, 10.5, rgb(0.08, 0.15, 0.32));
  page.drawText(formatINR(totalAmount), { x: calcX + 128 + rwB4 + 2, y: calcTop - 70, size: 11, font: fontBold, color: rgb(0.08, 0.15, 0.32) });

  // 8. Paid Stamp Badge
  page.drawRectangle({
    x: margin + 20,
    y: calcTop - 65,
    width: 140,
    height: 50,
    color: rgb(0.9, 0.98, 0.92),
    borderColor: rgb(0.2, 0.7, 0.35),
    borderWidth: 2,
  });

  page.drawText('PAYMENT RECEIVED', {
    x: margin + 35,
    y: calcTop - 40,
    size: 10,
    font: fontBold,
    color: rgb(0.12, 0.55, 0.25),
  });
  page.drawText('ONLINE (RAZORPAY)', {
    x: margin + 42,
    y: calcTop - 55,
    size: 8,
    font: fontBold,
    color: rgb(0.2, 0.6, 0.3),
  });

  // 9. Terms and Footer (No "IAS" anywhere)
  const footerY = 80;
  page.drawText('Terms & Conditions:', { x: margin, y: footerY + 30, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('1. This is a computer generated tax receipt and requires no physical signature.', { x: margin, y: footerY + 18, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('2. All fees are inclusive of 18% GST (Education Services SAC 999293). Access is non-transferable.', { x: margin, y: footerY + 6, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('3. For support or batch extensions, write to support@finalattempt.com.', { x: margin, y: footerY - 6, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  page.drawText('FINAL ATTEMPT • PATNA, BIHAR • THANK YOU FOR STUDYING WITH US!', {
    x: (width - 300) / 2,
    y: 25,
    size: 8,
    font: fontBold,
    color: rgb(0.6, 0.6, 0.6),
  });

  // 10. Save PDF and trigger client download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `Invoice-${data.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
