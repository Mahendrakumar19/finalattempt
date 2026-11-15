import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type AppRole = 'student' | 'faculty' | 'admin' | 'evaluator' | 'content_manager' | 'counselor';

// Require one of the given roles
export function requireRole(...roles: (AppRole | string)[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized', code: 'AUTH_MISSING_TOKEN' });
      return;
    }

    const userRole = (req.user.role || '').toLowerCase();
    const allowed = roles.map(r => r.toLowerCase());

    // Master admin key or admin/superadmin accounts have full access to all roles
    if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin' || req.user.userId === 'admin-master') {
      return next();
    }

    if (!allowed.includes(userRole)) {
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
