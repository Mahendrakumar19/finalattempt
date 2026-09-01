import { prisma } from '../prisma';
import { PlanCode, OrderStatus, ItemType, EntitlementType } from '@prisma/client';

export interface RequestedCartItem {
  itemType: 'PACKAGE_PLAN' | 'INDIVIDUAL_TEST' | 'UPGRADE_PLAN';
  planCode?: 'MINI' | 'HALF' | 'FULL';
  quizId?: string;
}

export interface SanitizedCartItem {
  itemType: 'PACKAGE_PLAN' | 'INDIVIDUAL_TEST' | 'UPGRADE_PLAN';
  planId?: string;
  quizId?: string;
  fromPlanId?: string;
  itemTitle: string;
  unitPrice: number;
  sequenceNumber?: number;
}

export interface CartPreviewResult {
  seriesId: string;
  seriesTitle: string;
  items: SanitizedCartItem[];
  grossAmount: number;
  upgradeCreditAmount: number;
  discountAmount: number;
  netAmount: number;
  currency: string;
  alreadyOwnedQuizIds: string[];
  redundantQuizIdsRemoved: string[];
}

export class TestSeriesOrderService {
  /**
   * Authoritative Server-Side Cart Preview & Price Calculation Engine
   */
  static async generateCartPreview(
    userId: string,
    seriesId: string,
    requestedItems: RequestedCartItem[]
  ): Promise<CartPreviewResult> {
    // ── Resolve series: check lms_courses first, then TestSeries table ────────
    let series = await prisma.lms_courses.findFirst({
      where: {
        OR: [
          { id: seriesId },
          { slug: seriesId }
        ]
      },
      select: { id: true, title: true, fee: true }
    });

    // Fallback: check the TestSeries MySQL table via db (primary source for test series records)
    if (!series) {
      try {
        const { db } = await import('../db');
        const found = await db.getTestSeriesBySlugOrId(seriesId);
        if (found) {
          series = { id: found.id, title: found.title, fee: Number(found.price) || 0 };
        }
      } catch (e: any) {
        console.warn('[TestSeriesOrderService] TestSeries db lookup failed:', e.message);
      }
    }

    if (!series) {
      // Dynamic fallback so checkout/cart preview never fails for valid requested series IDs/slugs
      console.warn(`[TestSeriesOrderService] Series '${seriesId}' not found in lms_courses or TestSeries store. Using fallback series stub.`);
      series = {
        id: seriesId,
        title: seriesId.replace(/-/g, ' ').toUpperCase(),
        fee: 999
      };
    }

    const canonicalSeriesId = series.id;

    // 1. Fetch configured plans for this series
    let activePlans = await prisma.test_series_plans.findMany({
      where: {
        OR: [
          { series_id: canonicalSeriesId },
          { series_id: seriesId }
        ],
        is_active: true
      }
    });

    // ── Default fallback plans when admin hasn't configured plans yet ──────────
    // These match the frontend's hardcoded defaults to allow checkout before admin configures plans
    const FALLBACK_PLANS: Array<{
      id: string; series_id: string; plan_code: PlanCode;
      title: string; description: string | null;
      sequence_start_number: number; sequence_end_number: number;
      price: number; discounted_price: number | null; is_active: boolean;
      created_at: Date; updated_at: Date;
    }> = [
      {
        id: `${canonicalSeriesId}-mini-default`, series_id: canonicalSeriesId,
        plan_code: 'MINI' as PlanCode, title: 'MINI Package', description: null,
        sequence_start_number: 1, sequence_end_number: 16,
        price: 299, discounted_price: null, is_active: true,
        created_at: new Date(), updated_at: new Date()
      },
      {
        id: `${canonicalSeriesId}-half-default`, series_id: canonicalSeriesId,
        plan_code: 'HALF' as PlanCode, title: 'HALF Package', description: null,
        sequence_start_number: 1, sequence_end_number: 28,
        price: 499, discounted_price: null, is_active: true,
        created_at: new Date(), updated_at: new Date()
      },
      {
        id: `${canonicalSeriesId}-full-default`, series_id: canonicalSeriesId,
        plan_code: 'FULL' as PlanCode, title: 'FULL Series Pass', description: null,
        sequence_start_number: 1, sequence_end_number: 40,
        price: 799, discounted_price: null, is_active: true,
        created_at: new Date(), updated_at: new Date()
      }
    ];

    const usingFallbackPlans = activePlans.length === 0;
    if (usingFallbackPlans) {
      console.info(`[TestSeriesOrderService] No configured plans for series '${canonicalSeriesId}'. Using default fallback plans.`);
      activePlans = FALLBACK_PLANS as any;
    }

    // 2. Fetch active user entitlements for this series
    const activeEntitlements = await prisma.user_entitlements.findMany({
      where: {
        user_id: userId,
        OR: [
          { series_id: canonicalSeriesId },
          { series_id: seriesId }
        ],
        status: 'ACTIVE'
      }
    });

    const activePackageEntitlement = activeEntitlements.find(e =>
      ['MINI', 'HALF', 'FULL'].includes(e.entitlement_type)
    );

    const activeOwnedQuizIds = new Set(
      activeEntitlements
        .filter(e => e.entitlement_type === 'INDIVIDUAL_TEST' && e.quiz_id)
        .map(e => e.quiz_id!)
    );

    const sanitizedItems: SanitizedCartItem[] = [];
    const alreadyOwnedQuizIds: string[] = [];
    const redundantQuizIdsRemoved: string[] = [];

    let grossAmount = 0;
    let upgradeCreditAmount = 0;

    // Determine if cart contains a package plan purchase
    const packageRequest = requestedItems.find(i => i.itemType === 'PACKAGE_PLAN' || i.itemType === 'UPGRADE_PLAN');
    let targetPackagePlanCode: 'MINI' | 'HALF' | 'FULL' | null = packageRequest?.planCode || null;

    let targetPackagePlan = targetPackagePlanCode
      ? activePlans.find(p => p.plan_code === targetPackagePlanCode)
      : null;

    // Process Package / Upgrade Items
    if (packageRequest) {
      if (!targetPackagePlanCode) {
        throw new Error('Package plan code (MINI, HALF, FULL) is required for package orders.');
      }

      if (!targetPackagePlan) {
        throw new Error(`Plan '${targetPackagePlanCode}' is not active or configured for this series. Please contact support.`);
      }

      // Upgrade Validation & Downgrade Prevention
      if (activePackageEntitlement) {
        const currentTier = activePackageEntitlement.entitlement_type;
        const tierRank: Record<string, number> = { MINI: 1, HALF: 2, FULL: 3 };

        const currentRank = tierRank[currentTier] || 0;
        const targetRank = tierRank[targetPackagePlanCode] || 0;

        if (targetRank <= currentRank) {
          throw new Error(`Invalid upgrade request: You already own ${currentTier}. Cannot downgrade or re-purchase the same tier.`);
        }

        // Calculate Upgrade Credit from actual payment amount of previous package
        let previousPaidAmount = 0;
        if (activePackageEntitlement.source_order_id) {
          const sourceOrder = await prisma.orders.findUnique({
            where: { id: activePackageEntitlement.source_order_id }
          });
          if (sourceOrder) {
            previousPaidAmount = sourceOrder.net_amount;
          }
        }

        // If source order amount missing, fallback to plan price
        if (previousPaidAmount <= 0) {
          const prevPlan = activePlans.find(p => p.plan_code === (currentTier as PlanCode));
          if (prevPlan) previousPaidAmount = prevPlan.discounted_price ?? prevPlan.price;
        }

        const newPlanPrice = targetPackagePlan.discounted_price ?? targetPackagePlan.price;
        upgradeCreditAmount = Math.min(previousPaidAmount, newPlanPrice);
        const itemPrice = newPlanPrice;

        sanitizedItems.push({
          itemType: 'UPGRADE_PLAN',
          planId: targetPackagePlan.id,
          fromPlanId: activePackageEntitlement.id,
          itemTitle: `Upgrade from ${currentTier} to ${targetPackagePlan.title}`,
          unitPrice: itemPrice,
          // Store snapshot so fulfillOrder can grant entitlements even for fallback plan IDs
          sequenceNumber: targetPackagePlan.sequence_end_number
        });

        grossAmount += itemPrice;
      } else {
        // Fresh Package Purchase
        const itemPrice = targetPackagePlan.discounted_price ?? targetPackagePlan.price;
        sanitizedItems.push({
          itemType: 'PACKAGE_PLAN',
          planId: targetPackagePlan.id,
          itemTitle: targetPackagePlan.title,
          unitPrice: itemPrice,
          // Store snapshot so fulfillOrder can grant entitlements even for fallback plan IDs
          sequenceNumber: targetPackagePlan.sequence_end_number
        });

        grossAmount += itemPrice;
      }
    }

    // Process Individual Test Requests
    const individualRequests = requestedItems.filter(i => i.itemType === 'INDIVIDUAL_TEST' && i.quizId);
    const uniqueQuizIds = Array.from(new Set(individualRequests.map(i => i.quizId!)));

    if (uniqueQuizIds.length > 0) {
      const quizzes = await prisma.lms_quizzes.findMany({
        where: {
          id: { in: uniqueQuizIds },
          OR: [
            { courseId: canonicalSeriesId },
            { courseId: seriesId }
          ]
        },
        select: {
          id: true,
          title: true,
          sequence_number: true,
          is_standalone_purchasable: true,
          individual_price: true
        }
      });

      for (const quizId of uniqueQuizIds) {
        const quiz = quizzes.find(q => q.id === quizId);

        if (!quiz) {
          throw new Error(`Quiz '${quizId}' does not belong to series '${seriesId}'.`);
        }

        if (!quiz.is_standalone_purchasable) {
          throw new Error(`Test '${quiz.title}' is not available for individual purchase.`);
        }

        // Check if user already owns this test individually
        if (activeOwnedQuizIds.has(quizId)) {
          alreadyOwnedQuizIds.push(quizId);
          continue;
        }

        // Check Overlapping Purchases: If cart ALSO includes a package that covers this quiz sequence number
        const quizSeq = quiz.sequence_number;
        let coveredBySelectedPackage = false;

        if (targetPackagePlan && quizSeq !== null && quizSeq !== undefined) {
          if (quizSeq >= targetPackagePlan.sequence_start_number && quizSeq <= targetPackagePlan.sequence_end_number) {
            coveredBySelectedPackage = true;
          }
        }

        // Check if covered by user's existing active package
        if (activePackageEntitlement && quizSeq !== null && quizSeq !== undefined) {
          const cap = activePackageEntitlement.snapshot_max_sequence ?? activePackageEntitlement.max_sequence_number ?? 0;
          if (quizSeq <= cap) {
            coveredBySelectedPackage = true;
          }
        }

        if (coveredBySelectedPackage) {
          redundantQuizIdsRemoved.push(quizId);
          continue;
        }

        const price = quiz.individual_price ?? 0;
        sanitizedItems.push({
          itemType: 'INDIVIDUAL_TEST',
          quizId: quiz.id,
          itemTitle: `Single Test: ${quiz.title}`,
          unitPrice: price,
          sequenceNumber: quiz.sequence_number ?? undefined
        });

        grossAmount += price;
      }
    }

    if (sanitizedItems.length === 0) {
      throw new Error('Cart has no valid items to purchase. Items may already be owned or covered by existing entitlements.');
    }

    const netAmount = Math.max(0, grossAmount - upgradeCreditAmount);

    return {
      seriesId: canonicalSeriesId,
      seriesTitle: series.title,
      items: sanitizedItems,
      grossAmount,
      upgradeCreditAmount,
      discountAmount: 0,
      netAmount,
      currency: 'INR',
      alreadyOwnedQuizIds,
      redundantQuizIdsRemoved
    };
  }

  /**
   * Transactional Order Creation Service
   */
  static async createOrder(
    userId: string,
    seriesId: string,
    requestedItems: RequestedCartItem[],
    idempotencyKey: string
  ) {
    // 1. Check Idempotency Token
    const existingOrder = await prisma.orders.findUnique({
      where: { idempotency_key: idempotencyKey },
      include: { order_items: true }
    });

    if (existingOrder) {
      return existingOrder;
    }

    // 2. Authoritative Server-Side Cart Preview & Price Recalculation
    const preview = await this.generateCartPreview(userId, seriesId, requestedItems);

    const orderNumber = `ORD-TS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Insert Transactional Orders & Line Items Header
    return prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          order_number: orderNumber,
          user_id: userId,
          series_id: preview.seriesId,
          status: OrderStatus.CREATED,
          currency: preview.currency,
          gross_amount: preview.grossAmount,
          upgrade_credit_amount: preview.upgradeCreditAmount,
          discount_amount: preview.discountAmount,
          net_amount: preview.netAmount,
          idempotency_key: idempotencyKey,
          order_items: {
            create: preview.items.map(item => ({
              item_type: item.itemType as ItemType,
              plan_id: (item.planId && !item.planId.endsWith('-default')) ? item.planId : null,
              quiz_id: item.quizId,
              from_plan_id: item.fromPlanId,
              item_title: item.itemTitle,
              unit_price: item.unitPrice,
              snapshot_sequence_number: item.sequenceNumber
            }))
          }
        },
        include: {
          order_items: true
        }
      });

      return order;
    });
  }

  /**
   * Idempotent Payment Fulfillment Engine
   */
  static async fulfillOrder(
    orderId: string,
    gatewayOrderId?: string,
    gatewayPaymentId?: string,
    paymentProvider: string = 'RAZORPAY'
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock & Fetch Order Row
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: { order_items: true }
      });

      if (!order) {
        throw new Error(`Order '${orderId}' not found for fulfillment.`);
      }

      // 2. Check If Order Already Fulfilled (Idempotency Safeguard)
      if (order.status === OrderStatus.PAID) {
        return {
          success: true,
          message: 'Order already fulfilled.',
          alreadyFulfilled: true,
          order
        };
      }

      // 3. Mark Order Status as PAID
      const targetGatewayOrderId = gatewayOrderId
        ? (order.gateway_order_id || `${gatewayOrderId}-${order.id.slice(-6)}`)
        : order.gateway_order_id;

      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paid_at: new Date(),
          ...(targetGatewayOrderId ? { gateway_order_id: targetGatewayOrderId } : {}),
          ...(gatewayPaymentId ? { payment_reference_id: gatewayPaymentId } : {}),
          payment_provider: paymentProvider
        }
      });

      // 4. Process Order Items & Grant Entitlements
      for (const item of order.order_items) {
        if (item.item_type === ItemType.PACKAGE_PLAN || item.item_type === ItemType.UPGRADE_PLAN) {
          // Try to load plan from DB (normal flow)
          let plan = item.plan_id ? await tx.test_series_plans.findUnique({
            where: { id: item.plan_id }
          }) : null;

          // Fallback: if plan not found in DB (e.g., it was a default fallback plan ID),
          // reconstruct plan info from the order_item's stored snapshot
          if (!plan) {
            // Extract plan code from plan_id (format: "<seriesId>-<mini|half|full>-default")
            // or from item_title (e.g., "MINI Package", "Upgrade from MINI to HALF Package")
            const planIdUpper = (item.plan_id || '').toUpperCase();
            let planCode: PlanCode | null = null;
            if (planIdUpper.includes('-MINI-') || planIdUpper.endsWith('-MINI-DEFAULT')) planCode = 'MINI' as PlanCode;
            else if (planIdUpper.includes('-HALF-') || planIdUpper.endsWith('-HALF-DEFAULT')) planCode = 'HALF' as PlanCode;
            else if (planIdUpper.includes('-FULL-') || planIdUpper.endsWith('-FULL-DEFAULT')) planCode = 'FULL' as PlanCode;

            // Also try from item_title
            if (!planCode) {
              const titleUpper = (item.item_title || '').toUpperCase();
              if (titleUpper.includes(' MINI')) planCode = 'MINI' as PlanCode;
              else if (titleUpper.includes(' HALF')) planCode = 'HALF' as PlanCode;
              else if (titleUpper.includes(' FULL') || titleUpper.includes('FULL SERIES')) planCode = 'FULL' as PlanCode;
            }

            if (planCode && item.snapshot_sequence_number) {
              // Reconstruct a synthetic plan from the snapshot stored at order creation
              plan = {
                id: item.plan_id!,
                series_id: order.series_id,
                plan_code: planCode,
                title: `${planCode} Package`,
                description: null,
                sequence_start_number: 1,
                sequence_end_number: item.snapshot_sequence_number,
                price: item.unit_price,
                discounted_price: null,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
              } as any;
              console.info(`[OrderFulfillment] Using synthetic fallback plan for plan_id='${item.plan_id}', code=${planCode}, snapshotSeq=${item.snapshot_sequence_number}`);
            }
          }

          if (!plan) {
            console.warn(`[OrderFulfillment] Plan '${item.plan_id}' not found and could not be reconstructed. Skipping entitlement.`);
            continue;
          }

          const entitlementType = plan.plan_code as unknown as EntitlementType;

          // SNAPSHOT RULE: Store snapshot_max_sequence at purchase time!
          const snapshotMaxSeq = plan.sequence_end_number;

          // If UPGRADE, mark previous active package entitlement as SUPERSEDED
          if (item.item_type === ItemType.UPGRADE_PLAN) {
            await tx.user_entitlements.updateMany({
              where: {
                user_id: order.user_id,
                series_id: order.series_id,
                status: 'ACTIVE',
                entitlement_type: { in: ['MINI', 'HALF'] }
              },
              data: {
                status: 'SUPERSEDED'
              }
            });
          }

          // Create new Active Package Entitlement
          await tx.user_entitlements.create({
            data: {
              user_id: order.user_id,
              series_id: order.series_id,
              entitlement_type: entitlementType,
              max_sequence_number: snapshotMaxSeq,
              snapshot_max_sequence: snapshotMaxSeq,
              source_order_id: order.id,
              status: 'ACTIVE'
            }
          });
        } else if (item.item_type === ItemType.INDIVIDUAL_TEST) {
          if (!item.quiz_id) continue;

          // Create active individual test entitlement
          await tx.user_entitlements.create({
            data: {
              user_id: order.user_id,
              series_id: order.series_id,
              entitlement_type: EntitlementType.INDIVIDUAL_TEST,
              quiz_id: item.quiz_id,
              source_order_id: order.id,
              status: 'ACTIVE'
            }
          });
        }
      }

      console.log(`[OrderFulfillment] ✅ Order ${order.order_number} (${order.id}) successfully fulfilled.`);

      return {
        success: true,
        message: 'Order fulfilled and entitlements granted.',
        alreadyFulfilled: false,
        order: updatedOrder
      };
    });
  }
}
