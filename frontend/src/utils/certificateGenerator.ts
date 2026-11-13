import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateData {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  category?: string;
  completionDate: string;
  duration?: string;
  verificationUrl?: string;
}

/**
 * Generates an official, high-resolution course completion certificate PDF
 * with student name, certificate ID, completion date, and direct verification link.
 */
export async function generateCourseCertificatePdf(data: CertificateData): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  // Landscape A4: 841.89 x 595.28 points
  const page = pdfDoc.addPage([841.89, 595.28]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  // 1. Elegant Multi-Layer Border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    color: rgb(0.99, 0.99, 1),
    borderColor: rgb(0.08, 0.15, 0.32), // Navy Blue
    borderWidth: 6,
  });

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(0.85, 0.65, 0.15), // Gold Accent
    borderWidth: 1.5,
  });

  // 2. Corner Floral / Geometric Accents
  const cornerSize = 25;
  // Top-left gold square
  page.drawRectangle({ x: 34, y: height - 34 - cornerSize, width: cornerSize, height: cornerSize, color: rgb(0.92, 0.72, 0.2) });
  // Top-right
  page.drawRectangle({ x: width - 34 - cornerSize, y: height - 34 - cornerSize, width: cornerSize, height: cornerSize, color: rgb(0.92, 0.72, 0.2) });
  // Bottom-left
  page.drawRectangle({ x: 34, y: 34, width: cornerSize, height: cornerSize, color: rgb(0.92, 0.72, 0.2) });
  // Bottom-right
  page.drawRectangle({ x: width - 34 - cornerSize, y: 34, width: cornerSize, height: cornerSize, color: rgb(0.92, 0.72, 0.2) });

  // 3. Header Branding
  const topY = height - 85;
  page.drawText('FINAL ATTEMPT IAS ACADEMY', {
    x: (width - 340) / 2,
    y: topY,
    size: 22,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.32),
  });

  page.drawText('CENTRE FOR CIVIL SERVICES & STATE PCS EXCELLENCE • PATNA', {
    x: (width - 350) / 2,
    y: topY - 18,
    size: 9,
    font: fontBold,
    color: rgb(0.7, 0.5, 0.1),
  });

  // 4. Certificate Title
  const titleY = topY - 60;
  page.drawText('CERTIFICATE OF COURSE COMPLETION', {
    x: (width - 380) / 2,
    y: titleY,
    size: 18,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.32),
  });

  page.drawText('This is proudly presented to certify that', {
    x: (width - 200) / 2,
    y: titleY - 24,
    size: 11,
    font: fontOblique,
    color: rgb(0.4, 0.45, 0.55),
  });

  // 5. Student Name (Large Calligraphic Style)
  const nameY = titleY - 65;
  const studentNameStr = data.studentName.toUpperCase();
  const nameWidth = fontBold.widthOfTextAtSize(studentNameStr, 24);
  page.drawText(studentNameStr, {
    x: (width - nameWidth) / 2,
    y: nameY,
    size: 24,
    font: fontBold,
    color: rgb(0.12, 0.2, 0.45),
  });

  // Underline beneath name
  page.drawLine({
    start: { x: (width - Math.max(nameWidth, 260)) / 2, y: nameY - 8 },
    end: { x: (width + Math.max(nameWidth, 260)) / 2, y: nameY - 8 },
    color: rgb(0.85, 0.65, 0.15),
    thickness: 2,
  });

  // 6. Course & Completion Statement
  const descY = nameY - 40;
  const statement = `has successfully completed all required syllabus lectures, mock test evaluations, and curriculum modules for`;
  const stmtWidth = fontRegular.widthOfTextAtSize(statement, 10.5);
  page.drawText(statement, {
    x: (width - stmtWidth) / 2,
    y: descY,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  const courseTitleStr = `"${data.courseTitle}"`;
  const courseWidth = fontBold.widthOfTextAtSize(courseTitleStr, 14);
  page.drawText(courseTitleStr, {
    x: (width - courseWidth) / 2,
    y: descY - 24,
    size: 14,
    font: fontBold,
    color: rgb(0.08, 0.15, 0.32),
  });

  page.drawText(`Conducted by the Mentorship & Faculty Board of Final Attempt IAS with distinguished merit.`, {
    x: (width - 420) / 2,
    y: descY - 44,
    size: 10,
    font: fontOblique,
    color: rgb(0.4, 0.45, 0.55),
  });

  // 7. Footer Signatures & Metadata
  const signY = 110;

  // Left: Director / Academic Dean Signature
  page.drawLine({
    start: { x: 75, y: signY },
    end: { x: 235, y: signY },
    color: rgb(0.3, 0.3, 0.3),
    thickness: 1,
  });
  page.drawText('ACADEMIC DIRECTOR', { x: 95, y: signY - 14, size: 9, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText('Final Attempt IAS Mentorship Board', { x: 75, y: signY - 26, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Center: Official Gold Seal Badge
  const sealCenterX = width / 2;
  page.drawCircle({
    x: sealCenterX,
    y: signY + 5,
    size: 36,
    color: rgb(0.98, 0.94, 0.8),
    borderColor: rgb(0.85, 0.65, 0.15),
    borderWidth: 3,
  });
  page.drawText('VERIFIED', { x: sealCenterX - 22, y: signY + 8, size: 9, font: fontBold, color: rgb(0.65, 0.45, 0.1) });
  page.drawText('EXCELLENCE', { x: sealCenterX - 25, y: signY - 4, size: 7, font: fontBold, color: rgb(0.65, 0.45, 0.1) });

  // Right: Certificate Verification Data
  page.drawLine({
    start: { x: width - 235, y: signY },
    end: { x: width - 75, y: signY },
    color: rgb(0.3, 0.3, 0.3),
    thickness: 1,
  });
  page.drawText('CERTIFICATE DETAILS', { x: width - 200, y: signY - 14, size: 9, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Cert ID: ${data.certificateId}`, { x: width - 215, y: signY - 26, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Issued: ${data.completionDate}`, { x: width - 215, y: signY - 37, size: 7.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Bottom Security Verification Bar
  page.drawText(`VERIFICATION URL: https://finalattemptias.com/verify-certificate?id=${data.certificateId}`, {
    x: (width - 380) / 2,
    y: 35,
    size: 7.5,
    font: fontBold,
    color: rgb(0.5, 0.55, 0.65),
  });

  // Save PDF and trigger client download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `Certificate-${data.certificateId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
