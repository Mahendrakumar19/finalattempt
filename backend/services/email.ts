import nodemailer from 'nodemailer';
import { validateEmailEnv } from '../bootstrap';

// ─── Zoho Mail SMTP Transporter ───────────────────────────────────────────────
// Uses Zoho SMTP with STARTTLS on port 587.
// Set ZOHO_EMAIL and ZOHO_PASSWORD in your .env file.

function getTransporter() {
  const email = process.env.ZOHO_EMAIL?.trim();
  const password = process.env.ZOHO_PASSWORD?.trim();

  if (!email || !password) {
    const missing: string[] = [];
    if (!email) missing.push('ZOHO_EMAIL');
    if (!password) missing.push('ZOHO_PASSWORD');
    throw new Error(`Zoho SMTP configuration missing: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 587,
    secure: false,          // STARTTLS — NOT SSL. Zoho requires this on port 587.
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function getFromDetails() {
  const email = process.env.ZOHO_EMAIL?.trim() || 'contact@finalattemptias.com';
  return {
    name: 'Final Attempt',
    email,
  };
}

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
  <title>${heading} – Final Attempt</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F59E0B;">Final Attempt</p>
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
                Your <strong>${action}</strong> OTP for Final Attempt is:
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
                &copy; ${new Date().getFullYear()} Final Attempt · Patna, Bihar
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
    verify:   `[Final Attempt] Verify your email — OTP ${otp}`,
    login:    `[Final Attempt] Your login OTP — ${otp}`,
    reset:    `[Final Attempt] Password reset OTP — ${otp}`,
    register: `[Final Attempt] Welcome! Verify your email — OTP ${otp}`,
  };

  const transporter = getTransporter();
  const { name: fromName, email: fromEmail } = getFromDetails();

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: subjectMap[purpose] || `[Final Attempt] Your OTP — ${otp}`,
    html: otpEmailHTML(otp, purpose, recipientName),
    text: `Your Final Attempt OTP for ${purpose} is: ${otp}\nThis OTP expires in 10 minutes. Do not share it with anyone.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email] OTP email sent successfully for purpose: ${purpose}`);
}

// ─── Book Order Shipping Status Notification Email ────────────────────────────

export async function sendBookOrderShippingEmail(order: any): Promise<void> {
  const recipientEmail = order.customerEmail;
  if (!recipientEmail || !recipientEmail.trim() || !recipientEmail.includes('@')) {
    console.log(`[Email] No valid customer email for order ${order.orderId}, skipping shipping notification.`);
    return;
  }

  const statusLabels: Record<string, string> = {
    PROCESSING: 'Order Processing & Packing',
    SHIPPED: 'Order Dispatched & Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Order Delivered Successfully'
  };

  const currentStatusLabel = statusLabels[order.deliveryStatus] || order.deliveryStatus || 'Processing';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Book Order Update – Final Attempt</title>
</head>
<body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #E2E8F0;">
          <!-- Header Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);padding:30px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F59E0B;">Final Attempt Publications</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#FFFFFF;">Book Order Delivery Update</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 12px;font-size:15px;color:#334155;">
                Hi <strong>${order.customerName || 'Aspirant'}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#64748B;line-height:1.6;">
                We have an update regarding your book order for <strong>${order.bookTitle}</strong>.
              </p>

              <!-- Status Badge Box -->
              <div style="text-align:center;margin:0 0 24px;">
                <div style="display:inline-block;background:#FEF3C7;border:1px solid #F59E0B;border-radius:20px;padding:8px 20px;">
                  <span style="font-size:13px;font-weight:800;color:#92400E;text-transform:uppercase;letter-spacing:1px;">
                    ${currentStatusLabel}
                  </span>
                </div>
              </div>

              <!-- Order Details Table Card -->
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#334155;line-height:1.8;">
                  <tr>
                    <td style="color:#64748B;padding-bottom:6px;">Order ID:</td>
                    <td style="font-family:monospace;font-weight:bold;color:#0F172A;text-align:right;padding-bottom:6px;">${order.orderId}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748B;padding-bottom:6px;">Book Title:</td>
                    <td style="font-weight:bold;color:#0F172A;text-align:right;padding-bottom:6px;">${order.bookTitle}</td>
                  </tr>
                  ${order.courierName ? `
                  <tr>
                    <td style="color:#64748B;padding-bottom:6px;">Courier Partner:</td>
                    <td style="font-weight:bold;color:#1E3A8A;text-align:right;padding-bottom:6px;">${order.courierName}</td>
                  </tr>
                  ` : ''}
                  ${order.trackingNumber ? `
                  <tr>
                    <td style="color:#64748B;padding-bottom:6px;">Tracking / AWB No:</td>
                    <td style="font-family:monospace;font-weight:bold;color:#D97706;text-align:right;padding-bottom:6px;">${order.trackingNumber}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color:#64748B;vertical-align:top;">Delivery Address:</td>
                    <td style="font-weight:600;color:#334155;text-align:right;">${order.address}, ${order.city}, ${order.state} - ${order.pincode}</td>
                  </tr>
                </table>
              </div>

              <!-- Track Button CTA -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="https://finalattemptias.com/track-order?orderId=${encodeURIComponent(order.orderId)}" style="display:inline-block;background:#F59E0B;color:#0F172A;font-size:14px;font-weight:800;padding:12px 28px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
                  Track Order Status Online ↗
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />

              <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.6;">
                Have questions about your delivery? Contact our student support helpline at
                <a href="tel:+919709992093" style="color:#F59E0B;text-decoration:none;font-weight:bold;">+91 97099 92093</a> or email
                <a href="mailto:enquiry@finalattemptias.com" style="color:#F59E0B;text-decoration:none;">enquiry@finalattemptias.com</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                &copy; ${new Date().getFullYear()} Final Attempt Publications · Boring Road Crossing, Patna, Bihar
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const transporter = getTransporter();
    const { name: fromName, email: fromEmail } = getFromDetails();
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: `[Final Attempt] Order Status Update: ${currentStatusLabel} (Order #${order.orderId})`,
      html
    });
    console.log(`[Email] Book order shipping email sent successfully to ${recipientEmail} for order ${order.orderId}`);
  } catch (err: any) {
    console.warn(`[Email] Failed sending book order shipping email:`, err?.message || err);
  }
}

// ─── Verify SMTP connection (called on server start) ─────────────────────────

export async function verifyEmailConnection(): Promise<void> {
  const { emailSet, passSet } = validateEmailEnv();
  console.log(`[Email] Configuration status — ZOHO_EMAIL: ${emailSet ? 'SET' : 'MISSING'}, ZOHO_PASSWORD: ${passSet ? 'SET' : 'MISSING'}`);

  if (!emailSet || !passSet) {
    const missing: string[] = [];
    if (!emailSet) missing.push('ZOHO_EMAIL');
    if (!passSet) missing.push('ZOHO_PASSWORD');
    console.warn(`[Email] ⚠️ Zoho SMTP configuration missing: ${missing.join(', ')} — OTP & Order email delivery unavailable.`);
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[Email] ✅ Zoho SMTP connection verified — ready to send OTPs & Order notifications');
  } catch (err: any) {
    const cleanMsg = err?.message ? String(err.message).replace(/:.*/, '') : 'Connection failed';
    console.warn(`[Email] ⚠️ Zoho SMTP authentication/connection failed: ${cleanMsg}`);
  }
}
