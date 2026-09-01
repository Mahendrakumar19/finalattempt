import { prisma } from '../prisma';

export interface QuizAccessResult {
  allowed: boolean;
  source: string;
  reason: string;
  entitlementId?: string;
  seriesId?: string;
  quizId: string;
}

export class EntitlementService {
  /**
   * Canonical Backend Quiz Access Check Algorithm
   * 
   * Evaluation Hierarchy:
   * 1. If Quiz is Free (isPublished / isFree metadata) -> ALLOW
   * 2. Check Legacy Enrollment (lms_enrollments with paymentStatus='paid') -> ALLOW (LEGACY)
   * 3. Check ACTIVE FULL entitlement for user on seriesId -> ALLOW (FULL)
   * 4. Check ACTIVE HALF entitlement AND quiz.sequence_number <= HALF.snapshot_max_sequence -> ALLOW (HALF)
   * 5. Check ACTIVE MINI entitlement AND quiz.sequence_number <= MINI.snapshot_max_sequence -> ALLOW (MINI)
   * 6. Check ACTIVE INDIVIDUAL_TEST entitlement for quizId -> ALLOW (INDIVIDUAL)
   * 7. Otherwise -> DENY
   */
  static async hasQuizAccess(userId: string, quizId: string): Promise<QuizAccessResult> {
    try {
      // 1. Fetch Quiz & Series Details
      const quiz: any = await prisma.lms_quizzes.findUnique({
        where: { id: quizId }
      });

      if (!quiz) {
        return {
          allowed: false,
          source: 'NONE',
          reason: 'QUIZ_NOT_FOUND',
          quizId
        };
      }

      const seriesId = quiz.courseId;

      // 1b. Auto-detect sequence number if null/undefined
      let seqNo = quiz.sequence_number;

      if (seqNo === null || seqNo === undefined) {
        try {
          const seriesQuizzes = await prisma.lms_quizzes.findMany({
            where: { courseId: seriesId },
            select: { id: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
          });
          const idx = seriesQuizzes.findIndex(q => q.id === quizId);
          if (idx >= 0) seqNo = idx + 1;
        } catch (_) {}
      }

      // Free Demo Test Policy: Test #1 in any test series is always free for all candidates
      if (quiz.isFree || seqNo === 1 || seqNo === 0) {
        return {
          allowed: true,
          source: 'FREE_DEMO',
          reason: 'Test #1 is a free demo test for all candidates.',
          seriesId,
          quizId
        };
      }

      // Check if test series has active paid plans configured
      const plansDelegate = (prisma as any).test_series_plans;
      if (plansDelegate) {
        try {
          const activePlans = await plansDelegate.findMany({
            where: { series_id: seriesId, is_active: true }
          });
          if (!activePlans || activePlans.length === 0) {
            return {
              allowed: true,
              source: 'FREE_PRACTICE_SERIES',
              reason: 'Test series has no paid pricing plans and is free for practice.',
              seriesId,
              quizId
            };
          }
        } catch (_) {}
      }

      // 2. Check Legacy Enrollment Compatibility (lms_enrollments)
      const legacyEnrollment = await prisma.lms_enrollments.findFirst({
        where: {
          userId,
          courseId: seriesId,
          paymentStatus: 'paid'
        }
      });

      if (legacyEnrollment) {
        return {
          allowed: true,
          source: 'LEGACY_ENROLLMENT',
          reason: 'Valid legacy series enrollment grants full access.',
          entitlementId: legacyEnrollment.id,
          seriesId,
          quizId
        };
      }

      // 3. Fetch Active Entitlements for User on Series
      const userEntitlementsDelegate = (prisma as any).user_entitlements;
      if (!userEntitlementsDelegate) {
        return { allowed: true, source: 'FALLBACK', reason: 'Entitlement table fallback.', seriesId, quizId };
      }

      const entitlements: any[] = await userEntitlementsDelegate.findMany({
        where: {
          user_id: userId,
          series_id: seriesId,
          status: 'ACTIVE'
        }
      });

      // Check FULL Entitlement
      const fullEntitlement = entitlements.find(e => e.entitlement_type === 'FULL');
      if (fullEntitlement) {
        return {
          allowed: true,
          source: 'FULL',
          reason: 'Full Test Series package entitlement.',
          entitlementId: fullEntitlement.id,
          seriesId,
          quizId
        };
      }

      // Quiz sequence number check for HALF & MINI
      seqNo = seqNo ?? quiz.sequence_number;

      if (seqNo !== null && seqNo !== undefined) {
        // Check HALF Entitlement using snapshot_max_sequence
        const halfEntitlement = entitlements.find(e => e.entitlement_type === 'HALF');
        if (halfEntitlement) {
          const cap = halfEntitlement.snapshot_max_sequence ?? halfEntitlement.max_sequence_number ?? 28;
          if (seqNo <= cap) {
            return {
              allowed: true,
              source: 'HALF',
              reason: `Half Test Series entitlement covers test sequence #${seqNo} (Cap: #${cap}).`,
              entitlementId: halfEntitlement.id,
              seriesId,
              quizId
            };
          }
        }

        // Check MINI Entitlement using snapshot_max_sequence
        const miniEntitlement = entitlements.find(e => e.entitlement_type === 'MINI');
        if (miniEntitlement) {
          const cap = miniEntitlement.snapshot_max_sequence ?? miniEntitlement.max_sequence_number ?? 16;
          if (seqNo <= cap) {
            return {
              allowed: true,
              source: 'MINI',
              reason: `Mini Test Series entitlement covers test sequence #${seqNo} (Cap: #${cap}).`,
              entitlementId: miniEntitlement.id,
              seriesId,
              quizId
            };
          }
        }
      }

      // Check INDIVIDUAL_TEST Entitlement
      const individualEntitlement = entitlements.find(
        e => e.entitlement_type === 'INDIVIDUAL_TEST' && e.quiz_id === quizId
      );

      if (individualEntitlement) {
        return {
          allowed: true,
          source: 'INDIVIDUAL_TEST',
          reason: 'Standalone individual test entitlement.',
          entitlementId: individualEntitlement.id,
          seriesId,
          quizId
        };
      }

      // DENY Access
      return {
        allowed: false,
        source: 'NONE',
        reason: 'No active package or individual test entitlement covers this quiz.',
        seriesId,
        quizId
      };
    } catch (error: any) {
      console.error('[EntitlementService] Error checking quiz access:', error);
      return {
        allowed: false,
        source: 'ERROR',
        reason: `Access check failed: ${error.message}`,
        quizId
      };
    }
  }

  /**
   * Get all active entitlements for a user across all test series or a specific series.
   */
  static async getUserEntitlements(userId: string, seriesId?: string) {
    const userEntitlementsDelegate = (prisma as any).user_entitlements;
    if (!userEntitlementsDelegate) return [];
    return userEntitlementsDelegate.findMany({
      where: {
        user_id: userId,
        ...(seriesId ? { series_id: seriesId } : {}),
        status: 'ACTIVE'
      },
      orderBy: { granted_at: 'desc' }
    });
  }
}
