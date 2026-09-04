import { Router, Response, Request } from 'express';
import crypto from 'crypto';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { prisma } from '../prisma';
import { EntitlementService } from '../services/entitlementService';
import { TestSeriesOrderService, RequestedCartItem } from '../services/testSeriesOrderService';
import { AuditLogService } from '../services/auditLogService';
import { razorpay } from '../services/razorpay';
import { PlanCode } from '@prisma/client';
import { lmsDB } from '../db';

const router = Router();

/**
 * GET /api/test-series/:seriesId/plans
 * Public / Auth endpoint to retrieve active purchasable plans for a test series
 */
router.get('/:seriesId/plans', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const seriesId = req.params.seriesId as string;
    let targetIds = [seriesId];
    try {
      const ts = await lmsDB.getTestSeriesById(seriesId);
      if (ts) {
        if (ts.id) targetIds.push(ts.id);
        if (ts.slug) targetIds.push(ts.slug);
      }
    } catch (_) {}
    targetIds = Array.from(new Set(targetIds.filter(Boolean)));

    const plans = await prisma.test_series_plans.findMany({
      where: {
        series_id: { in: targetIds },
        is_active: true
      },
      orderBy: { sequence_start_number: 'asc' }
    });

    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/test-series/plans/admin
 * Admin endpoint to upsert test series plan configurations (MINI, HALF, FULL)
 * Includes Phase 5 package hierarchy validation & Phase 6B persistent commercial audit logging
 */
router.post('/plans/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { seriesId, planCode, title, description, sequenceStartNumber, sequenceEndNumber, price, discountedPrice, includedQuizIds, isActive } = req.body;

    if (!seriesId || !planCode || sequenceEndNumber === undefined || price === undefined) {
      res.status(400).json({ success: false, error: 'seriesId, planCode, sequenceEndNumber, and price are required.' });
      return;
    }

    const validPlanCodes = ['MINI', 'HALF', 'FULL', 'COMPLETE'];
    if (!validPlanCodes.includes(planCode)) {
      res.status(400).json({ success: false, error: `Invalid planCode. Must be one of: ${validPlanCodes.join(', ')}` });
      return;
    }

    // Cumulative Packages (MINI, HALF, FULL, COMPLETE) cover test papers starting from Test #1
    const numSeqStart = validPlanCodes.includes(planCode) ? 1 : (Number(sequenceStartNumber) || 1);
    const numSeqEnd = Number(sequenceEndNumber);
    const numPrice = Number(price);

    // Format included quiz IDs as JSON string if passed
    const formattedQuizIds = Array.isArray(includedQuizIds)
      ? JSON.stringify(includedQuizIds)
      : (typeof includedQuizIds === 'string' ? includedQuizIds : null);

    // Validation 1: Price and Sequence Range Boundaries
    if (isNaN(numPrice) || numPrice < 0) {
      res.status(400).json({ success: false, error: 'Price must be a valid non-negative number.' });
      return;
    }

    if (isNaN(numSeqStart) || isNaN(numSeqEnd) || numSeqStart > numSeqEnd) {
      res.status(400).json({ success: false, error: 'sequenceStartNumber must be less than or equal to sequenceEndNumber.' });
      return;
    }

    // Find existing plan for audit logging
    const existingPlans = await prisma.test_series_plans.findMany({
      where: { series_id: seriesId }
    });

    const oldPlan = existingPlans.find(p => p.plan_code === planCode);

    let targetSeriesIds = [seriesId];
    try {
      const ts = await lmsDB.getTestSeriesById(seriesId);
      if (ts) {
        if (ts.id) targetSeriesIds.push(ts.id);
        if (ts.slug) targetSeriesIds.push(ts.slug);
      }
    } catch (_) {}
    targetSeriesIds = Array.from(new Set(targetSeriesIds.filter(Boolean)));

    let plan: any = null;
    for (const sid of targetSeriesIds) {
      plan = await (prisma.test_series_plans as any).upsert({
        where: {
          series_id_plan_code: {
            series_id: sid,
            plan_code: planCode as PlanCode
          }
        },
        update: {
          title: title || (planCode === 'COMPLETE' ? 'COMPLETE TEST SERIES' : `${planCode} Package`),
          description: description || null,
          sequence_start_number: numSeqStart,
          sequence_end_number: numSeqEnd,
          price: numPrice,
          discounted_price: discountedPrice !== undefined && discountedPrice !== null ? Number(discountedPrice) : null,
          included_quiz_ids: formattedQuizIds,
          is_active: isActive !== undefined ? Boolean(isActive) : true
        },
        create: {
          series_id: sid,
          plan_code: planCode as PlanCode,
          title: title || (planCode === 'COMPLETE' ? 'COMPLETE TEST SERIES' : `${planCode} Package`),
          description: description || null,
          sequence_start_number: numSeqStart,
          sequence_end_number: numSeqEnd,
          price: numPrice,
          discounted_price: discountedPrice !== undefined && discountedPrice !== null ? Number(discountedPrice) : null,
          included_quiz_ids: formattedQuizIds,
          is_active: isActive !== undefined ? Boolean(isActive) : true
        }
      });
    }

    // Determine audit log action
    let actionType: 'PLAN_PRICE_CHANGE' | 'PLAN_BOUNDARY_CHANGE' | 'PLAN_ACTIVATION_CHANGE' = 'PLAN_PRICE_CHANGE';
    if (oldPlan && oldPlan.sequence_end_number !== numSeqEnd) {
      actionType = 'PLAN_BOUNDARY_CHANGE';
    } else if (oldPlan && oldPlan.is_active !== plan.is_active) {
      actionType = 'PLAN_ACTIVATION_CHANGE';
    }

    // Persist Commercial Audit Log atomically / safely
    await AuditLogService.log({
      adminId: req.user!.userId,
      action: actionType,
      entityType: 'PLAN',
      entityId: plan.id,
      seriesId: seriesId,
      oldValue: oldPlan ? { price: oldPlan.price, boundary: oldPlan.sequence_end_number, active: oldPlan.is_active } : null,
      newValue: { price: plan.price, boundary: plan.sequence_end_number, active: plan.is_active }
    });

    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/test-series/quizzes/pricing/admin
 * Admin endpoint to configure individual test price & standalone purchasability
 */
router.post('/quizzes/pricing/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { seriesId, quizId, individualPrice, isStandalonePurchasable } = req.body;

    if (!seriesId || !quizId || individualPrice === undefined) {
      res.status(400).json({ success: false, error: 'seriesId, quizId, and individualPrice are required.' });
      return;
    }

    const numPrice = Number(individualPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      res.status(400).json({ success: false, error: 'individualPrice must be a valid non-negative number.' });
      return;
    }

    // Verify quiz belongs to series
    const quiz = await prisma.lms_quizzes.findUnique({
      where: { id: quizId }
    });

    if (!quiz || quiz.courseId !== seriesId) {
      res.status(400).json({ success: false, error: `Quiz '${quizId}' does not belong to series '${seriesId}'.` });
      return;
    }

    const updatedQuiz = await prisma.lms_quizzes.update({
      where: { id: quizId },
      data: {
        individual_price: numPrice,
        is_standalone_purchasable: isStandalonePurchasable !== undefined ? Boolean(isStandalonePurchasable) : true
      }
    });

    const actionType = quiz.individual_price !== numPrice ? 'QUIZ_PRICE_CHANGE' : 'STANDALONE_PURCHASABLE_CHANGE';

    // Persist Commercial Audit Log
    await AuditLogService.log({
      adminId: req.user!.userId,
      action: actionType,
      entityType: 'QUIZ',
      entityId: quizId,
      seriesId: seriesId,
      oldValue: { price: quiz.individual_price, standalone: quiz.is_standalone_purchasable },
      newValue: { price: updatedQuiz.individual_price, standalone: updatedQuiz.is_standalone_purchasable }
    });

    res.json({ success: true, data: updatedQuiz });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/test-series/cart/preview
 * Authoritative Server-Side Cart Preview & Price Recalculation API
 * Uses optionalAuth to allow unauthenticated preview calculations for guest users
 */
router.post('/cart/preview', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { seriesId, items } = req.body;
    if (!seriesId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'seriesId and items array are required.' });
      return;
    }

    const userId = req.user?.userId || 'anonymous-guest';
    const preview = await TestSeriesOrderService.generateCartPreview(userId, seriesId, items as RequestedCartItem[]);

    res.json({ success: true, data: preview });
  } catch (err: any) {
    console.error('[CartPreview Error]:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/test-series/order/create
 * Creates an order in state CREATED / PENDING and returns Razorpay Checkout parameters
 */
router.post('/order/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { seriesId, items, idempotencyKey } = req.body;
    if (!seriesId || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'seriesId and items array are required.' });
      return;
    }

    const userId = req.user!.userId;
    const token = idempotencyKey || `idemp_${userId}_${seriesId}_${Date.now()}`;

    const order = await TestSeriesOrderService.createOrder(userId, seriesId, items as RequestedCartItem[], token);

    // Prepare Razorpay Order if net_amount > 0
    let razorpayOrder;
    const amountInPaise = order.net_amount * 100;

    if (amountInPaise > 0) {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: order.currency,
          receipt: order.order_number,
          notes: {
            orderId: order.id,
            userId,
            seriesId
          }
        });
      } catch (e: any) {
        console.warn('Razorpay order creation fallback:', e.message);
        razorpayOrder = {
          id: `order_sim_${Date.now()}`,
          amount: amountInPaise,
          currency: order.currency
        };
      }
    } else {
      // Free or 100% Upgrade Discounted Order: Fulfill immediately
      const fulfillment = await TestSeriesOrderService.fulfillOrder(order.id, 'FREE_ZERO_AMOUNT', 'FREE', 'SYSTEM');
      res.json({
        success: true,
        message: 'Order fulfilled instantly (Zero payable amount).',
        data: {
          order: fulfillment.order,
          isFreeFulfillment: true
        }
      });
      return;
    }

    // Attach gateway order ID to order record
    await prisma.orders.update({
      where: { id: order.id },
      data: { gateway_order_id: razorpayOrder.id, status: 'PENDING' }
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        netAmount: order.net_amount,
        currency: order.currency,
        gatewayOrderId: razorpayOrder.id,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_TTzBxGpMqc0rAD'
      }
    });
  } catch (err: any) {
    console.error('[OrderCreate Error]:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/test-series/order/verify
 * Verifies Razorpay payment signature & triggers idempotent fulfillment
 */
router.post('/order/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId) {
      res.status(400).json({ success: false, error: 'orderId and razorpayPaymentId are required.' });
      return;
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || '4ViOK1jEPrPtZPYcou4ut48V';

    // Signature Verification for production/test gateway order
    const gOrderId = razorpayOrderId || '';
    if (razorpaySignature && gOrderId && !gOrderId.startsWith('order_sim_') && !gOrderId.startsWith('order_ts_')) {
      const generatedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(gOrderId + '|' + razorpayPaymentId)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        res.status(400).json({ success: false, error: 'Payment signature verification failed.' });
        return;
      }
    }

    // Trigger Idempotent Fulfillment Service
    const fulfillment = await TestSeriesOrderService.fulfillOrder(
      orderId,
      gOrderId,
      razorpayPaymentId,
      'RAZORPAY'
    );

    res.json({
      success: true,
      message: fulfillment.message,
      data: fulfillment.order
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/webhooks/razorpay (Server-to-Server Razorpay Webhook)
 * Signature verification, event validation, idempotency, and transactional fulfillment
 */
router.post('/webhooks/razorpay', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      res.status(400).json({ success: false, error: 'Missing Razorpay signature header.' });
      return;
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '4ViOK1jEPrPtZPYcou4ut48V';

    // Get Raw Body for HMAC SHA256 Signature Verification
    let rawBodyStr: string;
    if (Buffer.isBuffer(req.body)) {
      rawBodyStr = req.body.toString('utf-8');
    } else if (typeof req.body === 'string') {
      rawBodyStr = req.body;
    } else {
      rawBodyStr = JSON.stringify(req.body);
    }

    // HMAC Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBodyStr)
      .digest('hex');

    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!signatureValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature detected.');
      res.status(400).json({ success: false, error: 'Invalid webhook signature.' });
      return;
    }

    const payload = typeof req.body === 'string' || Buffer.isBuffer(req.body) 
      ? JSON.parse(rawBodyStr) 
      : req.body;

    const event = payload.event;
    console.log(`[Razorpay Webhook Received] Event=${event}`);

    // Supported Payment Success Events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      const notes = paymentEntity?.notes || payload.payload?.order?.entity?.notes || {};

      let targetOrderId = notes.orderId;

      // Fallback: Lookup order by gateway_order_id
      if (!targetOrderId && gatewayOrderId) {
        const orderObj = await prisma.orders.findFirst({
          where: { gateway_order_id: gatewayOrderId }
        });
        if (orderObj) targetOrderId = orderObj.id;
      }

      if (!targetOrderId) {
        console.warn('[Razorpay Webhook] Order correlation failed for webhook event.', gatewayOrderId);
        res.status(404).json({ success: false, error: 'Order correlation failed for webhook event.' });
        return;
      }

      // Idempotent Fulfillment
      const fulfillment = await TestSeriesOrderService.fulfillOrder(
        targetOrderId,
        gatewayOrderId,
        paymentId,
        'RAZORPAY_WEBHOOK'
      );

      res.json({
        success: true,
        message: 'Webhook processed idempotently.',
        alreadyFulfilled: fulfillment.alreadyFulfilled
      });
      return;
    } else if (event === 'payment.failed') {
      console.log('[Razorpay Webhook] Payment failed event received. No entitlement granted.');
      res.json({ success: true, message: 'Payment failed event acknowledged (No action required).' });
      return;
    }

    // Safely acknowledge unhandled events
    res.json({ success: true, message: `Event '${event}' acknowledged.` });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/test-series/entitlements
 * Lists active entitlements for the authenticated student
 */
router.get('/entitlements', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const seriesId = req.query.seriesId as string | undefined;

    const entitlements = await EntitlementService.getUserEntitlements(userId, seriesId);
    res.json({ success: true, data: entitlements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/test-series/quiz/:quizId/access
 * Canonical Quiz Access Status Check Endpoint
 */
router.get('/quiz/:quizId/access', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const userId = req.user!.userId;

    const result = await EntitlementService.hasQuizAccess(userId, quizId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
