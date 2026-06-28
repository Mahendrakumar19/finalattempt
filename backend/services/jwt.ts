import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'finalattempt_access_secret_change_in_production_64chars';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'finalattempt_refresh_secret_change_in_production_64chars';
const ACCESS_EXPIRY  = (process.env.JWT_ACCESS_EXPIRY  || '15m') as string;
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '30d') as string;

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  sessionId: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

export function generateSessionId(): string {
  return uuidv4();
}

// Returns expiry date for refresh token (30 days from now)
export function refreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}
