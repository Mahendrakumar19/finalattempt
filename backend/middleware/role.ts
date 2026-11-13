import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type AppRole = 'student' | 'faculty' | 'admin' | 'evaluator' | 'content_manager' | 'counselor';

// Require one of the given roles
export function requireRole(...roles: AppRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized', code: 'AUTH_MISSING_TOKEN' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        code: 'AUTH_INSUFFICIENT_ROLE'
      });
      return;
    }

    next();
  };
}

// Shorthand helpers
export const requireStudent = requireRole('student', 'faculty', 'admin', 'evaluator', 'content_manager', 'counselor');
export const requireFaculty = requireRole('faculty', 'admin');
export const requireAdmin   = requireRole('admin');
export const requireEvaluator = requireRole('admin', 'evaluator', 'faculty');
export const requireContentManager = requireRole('admin', 'content_manager');
export const requireCounselor = requireRole('admin', 'counselor');
