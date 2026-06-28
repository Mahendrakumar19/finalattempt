import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateSessionId,
  refreshTokenExpiry
} from '../services/jwt';
import { generateOTP, hashOTP, verifyOTPHash, otpExpiry, MAX_OTP_ATTEMPTS } from '../services/otp';
import { authDB } from '../db';

const router = Router();

// ─────────────────────────── Rate Limiters ──────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many attempts. Please wait 15 minutes.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: { success: false, error: 'Too many OTP requests. Please wait 10 minutes.', code: 'RATE_LIMIT' },
});

// ─────────────────────────── Validation Schemas ──────────────────────────────

const RegisterSchema = z.object({
  fullName:   z.string().min(2, 'Name too short').max(100),
  email:      z.string().email('Invalid email address'),
  mobile:     z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  targetExam: z.string().optional()
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1)
});

const OTPRequestSchema = z.object({
  identifier: z.string().min(1),             // email or mobile
  type:       z.enum(['email', 'mobile']),
  purpose:    z.enum(['login', 'register', 'reset', 'verify'])
});

const OTPVerifySchema = z.object({
  identifier: z.string().min(1),
  type:       z.enum(['email', 'mobile']),
  otp:        z.string().length(6),
  purpose:    z.enum(['login', 'register', 'reset', 'verify'])
});

const ResetPasswordSchema = z.object({
  email:       z.string().email(),
  otp:         z.string().length(6),
  newPassword: z.string().min(8)
});

// ─────────────────────────── Helpers ─────────────────────────────────────────

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production' || !process.env.DB_HOST?.includes('localhost') && !process.env.DB_HOST?.includes('127.0.0.1');
  return {
    httpOnly: true,
    secure: true, // Must be true for SameSite=None cross-origin cookies to write on Vercel
    sameSite: 'none' as const, // Allow cross-site cookies
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in ms
  };
}


async function issueTokens(res: Response, user: { id: string; email: string; role: string }) {
  const sessionId = generateSessionId();
  const payload = {
    userId:    user.id,
    email:     user.email,
    role:      user.role as 'student' | 'faculty' | 'admin',
    sessionId
  };

  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Persist session in DB
  await authDB.createSession(user.id, sessionId, refreshToken, refreshTokenExpiry());

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, cookieOptions());

  return { accessToken, sessionId };
}

// ─────────────────────────── POST /api/auth/register ─────────────────────────

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { fullName, email, mobile, password, targetExam } = parsed.data;

  try {
    // Check if email already taken
    const existing = await authDB.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email already exists.', code: 'EMAIL_TAKEN' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const user = await authDB.createUser({
      id: userId,
      fullName,
      email,
      mobile,
      passwordHash,
      role: 'student',
      targetExam: targetExam || '',
      isEmailVerified: false,
      isActive: true
    });

    // Send OTP for email verification
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    await authDB.createOTP(email, 'email', otpHash, 'verify', otpExpiry());

    // TODO: Replace with real email send (Nodemailer)
    console.log(`[OTP] Verification OTP for ${email}: ${otp}`);

    const { accessToken } = await issueTokens(res, user);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isEmailVerified: false }
      },
      message: 'Account created. Please verify your email.'
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────── POST /api/auth/login ────────────────────────────

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid email or password format.' });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await authDB.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      // Generic message — don't reveal which field is wrong
      res.status(401).json({ success: false, error: 'Invalid email or password.', code: 'AUTH_001' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: 'Account is suspended. Contact support.', code: 'AUTH_SUSPENDED' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password.', code: 'AUTH_001' });
      return;
    }

    // Update last login timestamp
    await authDB.updateLastLogin(user.id);

    const { accessToken } = await issueTokens(res, user);

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatarUrl: user.avatarUrl,
          targetExam: user.targetExam
        }
      }
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────── POST /api/auth/send-otp ─────────────────────────

router.post('/send-otp', otpLimiter, async (req: Request, res: Response) => {
  const parsed = OTPRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { identifier, type, purpose } = parsed.data;

  try {
    const otp     = generateOTP();
    const otpHash = await hashOTP(otp);
    await authDB.createOTP(identifier, type, otpHash, purpose, otpExpiry());

    // TODO: Hook up real email (Nodemailer) / SMS (MSG91) here
    console.log(`[OTP] ${purpose} OTP for ${identifier}: ${otp}`);

    res.json({ success: true, message: `OTP sent to your ${type}.` });
  } catch (err: any) {
    console.error('[Auth] Send OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP.' });
  }
});

// ─────────────────────────── POST /api/auth/verify-otp ───────────────────────

router.post('/verify-otp', authLimiter, async (req: Request, res: Response) => {
  const parsed = OTPVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { identifier, type, otp, purpose } = parsed.data;

  try {
    const record = await authDB.getLatestOTP(identifier, type, purpose);

    if (!record) {
      res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.', code: 'AUTH_003' });
      return;
    }

    if (record.usedAt) {
      res.status(400).json({ success: false, error: 'OTP already used. Please request a new one.', code: 'AUTH_003' });
      return;
    }

    if (new Date() > new Date(record.expiresAt)) {
      res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.', code: 'AUTH_003' });
      return;
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      res.status(429).json({ success: false, error: 'Too many failed OTP attempts. Request a new OTP.', code: 'AUTH_002' });
      return;
    }

    const valid = await verifyOTPHash(otp, record.otpHash);

    if (!valid) {
      await authDB.incrementOTPAttempts(record.id);
      res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.', code: 'AUTH_004' });
      return;
    }

    // Mark OTP as used
    await authDB.markOTPUsed(record.id);

    // If purpose is 'verify' (email/mobile verification), update user flag
    if (purpose === 'verify' && type === 'email') {
      const user = await authDB.findUserByEmail(identifier);
      if (user) {
        await authDB.verifyUserEmail(user.id);
        const { accessToken } = await issueTokens(res, user);
        res.json({
          success: true,
          data: {
            accessToken,
            user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isEmailVerified: true }
          },
          message: 'Email verified successfully.'
        });
        return;
      }
    }

    // If purpose is 'login' (OTP login flow)
    if (purpose === 'login') {
      const user = type === 'email'
        ? await authDB.findUserByEmail(identifier)
        : await authDB.findUserByMobile(identifier);

      if (!user) {
        res.status(404).json({ success: false, error: 'Account not found.', code: 'AUTH_001' });
        return;
      }

      const { accessToken } = await issueTokens(res, user);
      res.json({
        success: true,
        data: {
          accessToken,
          user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified }
        }
      });
      return;
    }

    res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (err: any) {
    console.error('[Auth] Verify OTP error:', err);
    res.status(500).json({ success: false, error: 'OTP verification failed.' });
  }
});

// ─────────────────────────── POST /api/auth/refresh ──────────────────────────

router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401).json({ success: false, error: 'No refresh token.', code: 'AUTH_MISSING_TOKEN' });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    // Verify session exists and is not revoked
    const session = await authDB.findSession(payload.userId, payload.sessionId);
    if (!session) {
      res.clearCookie('refreshToken');
      res.status(401).json({ success: false, error: 'Session expired. Please login again.', code: 'AUTH_SESSION_EXPIRED' });
      return;
    }

    const user = await authDB.findUserById(payload.userId);
    if (!user || !user.isActive) {
      res.clearCookie('refreshToken');
      res.status(401).json({ success: false, error: 'Account not found or suspended.', code: 'AUTH_001' });
      return;
    }

    // Rotate: delete old session, issue new tokens
    await authDB.deleteSession(payload.sessionId);
    const { accessToken } = await issueTokens(res, user);

    res.json({
      success: true,
      data: { accessToken, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified, avatarUrl: user.avatarUrl } }
    });
  } catch (err) {
    res.clearCookie('refreshToken');
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token.', code: 'AUTH_INVALID_TOKEN' });
  }
});

// ─────────────────────────── POST /api/auth/logout ───────────────────────────

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.sessionId) {
      await authDB.deleteSession(req.user.sessionId);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out.' });
  }
});

// ─────────────────────────── GET /api/auth/me ────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authDB.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        targetExam: user.targetExam,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

// ─────────────────────────── POST /api/auth/forgot-password ──────────────────

router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required.' });
    return;
  }

  try {
    const user = await authDB.findUserByEmail(email);
    // Always return success to prevent email enumeration
    if (user) {
      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      await authDB.createOTP(email, 'email', otpHash, 'reset', otpExpiry());
      // TODO: Send via Nodemailer
      console.log(`[OTP] Password reset OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: 'If that email exists, a reset OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Request failed.' });
  }
});

// ─────────────────────────── POST /api/auth/reset-password ───────────────────

router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { email, otp, newPassword } = parsed.data;

  try {
    const record = await authDB.getLatestOTP(email, 'email', 'reset');
    if (!record || record.usedAt || new Date() > new Date(record.expiresAt)) {
      res.status(400).json({ success: false, error: 'OTP invalid or expired.', code: 'AUTH_003' });
      return;
    }

    const valid = await verifyOTPHash(otp, record.otpHash);
    if (!valid) {
      await authDB.incrementOTPAttempts(record.id);
      res.status(400).json({ success: false, error: 'Invalid OTP.', code: 'AUTH_004' });
      return;
    }

    await authDB.markOTPUsed(record.id);

    const user = await authDB.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ success: false, error: 'Account not found.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await authDB.updatePassword(user.id, passwordHash);
    // Invalidate all existing sessions for security
    await authDB.deleteAllUserSessions(user.id);

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Password reset failed.' });
  }
});

export default router;
