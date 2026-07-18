import nodemailer from 'nodemailer';

// ─── Zoho Mail SMTP Transporter ───────────────────────────────────────────────
// Uses Zoho SMTP with STARTTLS on port 587.
// Set ZOHO_EMAIL and ZOHO_PASSWORD in your .env file.

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 587,
  secure: false,          // STARTTLS — NOT SSL. Zoho requires this on port 587.
  auth: {
    user: process.env.ZOHO_EMAIL || 'contact@finalattemptias.com',
    pass: process.env.ZOHO_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FROM_NAME = 'Final Attempt IAS';
const FROM_EMAIL = process.env.ZOHO_EMAIL || 'contact@finalattemptias.com';

// ─── OTP Email Templates ──────────────────────────────────────────────────────

function otpEmailHTML(otp: string, purpose: string, recipientName?: string): string {
  const purposeLabels: Record<string, { heading: string; action: string; color: string }> = {
    verify:   { heading: 'Verify Your Email',         action: 'Email Verification',  color: '#10B981' },
    login:    { heading: 'Your Login OTP',             action: 'Login',               color: '#1E3A8A' },
    reset:    { heading: 'Password Reset OTP',         action: 'Password Reset',      color: '#F59E0B' },
    register: { heading: 'Welcome — Verify Your Email', action: 'Registration',       color: '#8B5CF6' },
  };
  const { heading, action, color } = purposeLabels[purpose] || purposeLabels.verify;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${heading} – Final Attempt IAS</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F59E0B;">Final Attempt IAS</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">${heading}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:14px;color:#475569;">
                ${recipientName ? `Hi <strong>${recipientName}</strong>,` : 'Hello,'}
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748B;line-height:1.6;">
                Your <strong>${action}</strong> OTP for Final Attempt IAS is:
              </p>

              <!-- OTP Box -->
              <div style="text-align:center;margin:0 0 28px;">
                <div style="display:inline-block;background:#F8FAFC;border:2px dashed ${color};border-radius:12px;padding:18px 40px;">
                  <span style="font-size:38px;font-weight:900;letter-spacing:10px;color:${color};font-family:'Courier New',monospace;">${otp}</span>
                </div>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#94A3B8;text-align:center;">
                ⏱ This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
              </p>

              <hr style="border:none;border-top:1px solid #E2E8F0;margin:28px 0;" />

              <p style="margin:0;font-size:12px;color:#CBD5E1;text-align:center;line-height:1.6;">
                If you did not request this OTP, please ignore this email or contact us at
                <a href="mailto:enquiry@finalattemptias.com" style="color:#F59E0B;text-decoration:none;">enquiry@finalattemptias.com</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                &copy; ${new Date().getFullYear()} Final Attempt IAS · Patna, Bihar
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── sendOTPEmail ─────────────────────────────────────────────────────────────

export async function sendOTPEmail(
  toEmail: string,
  otp: string,
  purpose: 'verify' | 'login' | 'reset' | 'register',
  recipientName?: string
): Promise<void> {
  const subjectMap: Record<string, string> = {
    verify:   `[Final Attempt IAS] Verify your email — OTP ${otp}`,
    login:    `[Final Attempt IAS] Your login OTP — ${otp}`,
    reset:    `[Final Attempt IAS] Password reset OTP — ${otp}`,
    register: `[Final Attempt IAS] Welcome! Verify your email — OTP ${otp}`,
  };

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: toEmail,
    subject: subjectMap[purpose] || `[Final Attempt IAS] Your OTP — ${otp}`,
    html: otpEmailHTML(otp, purpose, recipientName),
    text: `Your Final Attempt IAS OTP for ${purpose} is: ${otp}\nThis OTP expires in 10 minutes. Do not share it with anyone.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email] OTP sent to ${toEmail} for purpose: ${purpose}`);
}

// ─── Verify SMTP connection (called on server start) ─────────────────────────

export async function verifyEmailConnection(): Promise<void> {
  try {
    await transporter.verify();
    console.log('[Email] ✅ Zoho SMTP connection verified — ready to send OTPs');
  } catch (err: any) {
    console.warn('[Email] ⚠️  SMTP connection failed — OTP emails will be logged to console only:', err.message);
  }
}
