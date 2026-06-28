import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../services/jwt';

// Extend Request to carry user payload
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Verify JWT access token in Authorization header
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided', code: 'AUTH_MISSING_TOKEN' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Token expired', code: 'AUTH_TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid token', code: 'AUTH_INVALID_TOKEN' });
    }
  }
}

// Optional auth — attaches user if token present but does not block if missing
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch {
      // Silently ignore invalid token in optional auth
    }
  }
  next();
}
