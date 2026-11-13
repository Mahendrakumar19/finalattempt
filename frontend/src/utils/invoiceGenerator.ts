import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
 * Generates an official, GST-compliant tax invoice / fee receipt PDF
 * and initiates client-side download.
 */
export async function generateTaxInvoicePdf(data: InvoiceData): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 595 x 842 points
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;

  // Header Background Bar (Navy / Brand Gold Accent)
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

  // Institute Branding in Header
  page.drawText('FINAL ATTEMPT IAS ACADEMY', {
    x: margin,
    y: height - 45,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Empowering BPSC & Civil Services Aspirants | Patna Learning Hub', {
    x: margin,
    y: height - 62,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  page.drawText('GSTIN: 10AAECF9281Q1Z5 • Email: contact@finalattemptias.com • Web: finalattemptias.com', {
    x: margin,
    y: height - 76,
    size: 8,
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

  // Invoice & Student Meta Grid
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

  // Itemized Fee Table
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
  page.drawText('BASE (INR)', { x: margin + 360, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('TOTAL (INR)', { x: width - margin - 75, y: tableTop - 14, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  // Calculation: 18% GST (9% CGST + 9% SGST inclusive or separated)
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
  page.drawText(`Rs. ${basePrice.toFixed(2)}`, { x: margin + 360, y: rowY + 3, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`Rs. ${totalAmount.toFixed(2)}`, { x: width - margin - 75, y: rowY + 3, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

  // Calculation Breakdown Box
  const calcTop = rowY - 50;
  const calcX = width - margin - 220;

  page.drawRectangle({
    x: calcX,
    y: calcTop - 95,
    width: 220,
    height: 110,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.85, 0.88, 0.95),
    borderWidth: 1,
  });

  page.drawText('Taxable Base Amount:', { x: calcX + 12, y: calcTop + 2, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Rs. ${basePrice.toFixed(2)}`, { x: calcX + 145, y: calcTop + 2, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('CGST (9.0%):', { x: calcX + 12, y: calcTop - 18, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Rs. ${cgst.toFixed(2)}`, { x: calcX + 145, y: calcTop - 18, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('SGST (9.0%):', { x: calcX + 12, y: calcTop - 38, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Rs. ${sgst.toFixed(2)}`, { x: calcX + 145, y: calcTop - 38, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

  page.drawLine({
    start: { x: calcX + 8, y: calcTop - 52 },
    end: { x: calcX + 212, y: calcTop - 52 },
    color: rgb(0.8, 0.85, 0.95),
    thickness: 1,
  });

  page.drawText('Total Paid (INR):', { x: calcX + 12, y: calcTop - 70, size: 10, font: fontBold, color: rgb(0.08, 0.15, 0.32) });
  page.drawText(`Rs. ${totalAmount.toFixed(2)}`, { x: calcX + 130, y: calcTop - 70, size: 11, font: fontBold, color: rgb(0.08, 0.15, 0.32) });

  // Paid Stamp Badge
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

  // Terms and Footer
  const footerY = 80;
  page.drawText('Terms & Conditions:', { x: margin, y: footerY + 30, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('1. This is a computer generated tax receipt and requires no physical signature.', { x: margin, y: footerY + 18, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('2. All fees are inclusive of 18% GST (Education Services SAC 999293). Access is non-transferable.', { x: margin, y: footerY + 6, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  page.drawText('3. For support or batch extensions, write to support@finalattemptias.com.', { x: margin, y: footerY - 6, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  page.drawText('FINAL ATTEMPT IAS • PATNA, BIHAR • THANK YOU FOR STUDYING WITH US!', {
    x: (width - 320) / 2,
    y: 25,
    size: 8,
    font: fontBold,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Save PDF and trigger client download
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
