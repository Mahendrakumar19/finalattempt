import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS   = 5;
const LOCKOUT_MINUTES    = 30;

// Generate a 6-digit numeric OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Hash OTP using bcrypt (cost factor 10)
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

// Verify an OTP against its stored hash
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

// Returns expiry datetime for an OTP
export function otpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

// Returns lockout expiry datetime
export function lockoutExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + LOCKOUT_MINUTES);
  return d;
}

export { MAX_OTP_ATTEMPTS, OTP_EXPIRY_MINUTES };
