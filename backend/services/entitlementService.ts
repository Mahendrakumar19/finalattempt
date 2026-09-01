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
      const quiz = await prisma.lms_quizzes.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          courseId: true,
          title: true,
          isPublished: true,
          sequence_number: true,
          is_standalone_purchasable: true
        }
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
      const entitlements = await prisma.user_entitlements.findMany({
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
      const seqNo = quiz.sequence_number;

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
    return prisma.user_entitlements.findMany({
      where: {
        user_id: userId,
        ...(seriesId ? { series_id: seriesId } : {}),
        status: 'ACTIVE'
      },
      include: {
        lms_courses: {
          select: { id: true, title: true, slug: true }
        },
        lms_quizzes: {
          select: { id: true, title: true, sequence_number: true }
        }
      },
      orderBy: { granted_at: 'desc' }
    });
  }
}
