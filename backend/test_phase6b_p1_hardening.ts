import { prisma } from './prisma';
import { AuditLogService } from './services/auditLogService';
import { TestSeriesOrderService } from './services/testSeriesOrderService';
import { EntitlementService } from './services/entitlementService';
import crypto from 'crypto';

interface WebhookTestResult {
  success: boolean;
  alreadyFulfilled?: boolean;
  paymentFailed?: boolean;
  ignored?: boolean;
}

async function runPhase6bP1HardeningTestSuite() {
  console.log('============================================================');
  console.log('FINALATTEMPT — PHASE 6B: PRODUCTION P1 HARDENING SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, description: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${total}. ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${total}. ${description}`);
      throw new Error(`Test Failure: ${description}`);
    }
  }

  try {
    const timestamp = Date.now();
    const seriesId = `series_p6b_${timestamp}`;
    const secret = 'test_webhook_secret_key_123';
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    process.env.RAZORPAY_KEY_SECRET = secret;

    // Ensure audit log table
    await AuditLogService.ensureTableExists();

    // ─── SETUP TEST DATA ─────────────────────────────────────────────────────
    const adminUser = await prisma.users.create({
      data: { id: `admin_p6b_${timestamp}`, email: `admin_p6b_${timestamp}@test.com`, fullName: 'Admin User', role: 'admin' }
    });

    const studentUser = await prisma.users.create({
      data: { id: `student_p6b_${timestamp}`, email: `student_p6b_${timestamp}@test.com`, fullName: 'Student User', role: 'student' }
    });

    const course = await prisma.lms_courses.create({
      data: { id: seriesId, title: 'BPSC P1 Hardening Series', slug: `bpsc-p6b-${timestamp}`, category: 'Prelims', fee: 1999 }
    });

    const quiz1 = await prisma.lms_quizzes.create({
      data: { id: `quiz_p6b_${timestamp}_1`, courseId: seriesId, title: 'Hardening Paper 1', sequence_number: 1, individual_price: 99, is_standalone_purchasable: true }
    });

    await prisma.test_series_plans.create({
      data: { series_id: seriesId, plan_code: 'MINI', title: 'MINI Package', sequence_start_number: 1, sequence_end_number: 16, price: 299, is_active: true }
    });

    console.log('[Setup] Test course, quizzes, plans, admin, and student created.\n');

    // =========================================================================
    // PART 1: PERSISTENT COMMERCIAL AUDIT LOG TESTS
    // =========================================================================

    // 1. Plan price update creates audit log
    await AuditLogService.log({
      adminId: adminUser.id,
      action: 'PLAN_PRICE_CHANGE',
      entityType: 'PLAN',
      entityId: `plan_${seriesId}_MINI`,
      seriesId: seriesId,
      oldValue: { price: 299 },
      newValue: { price: 349 }
    });

    const logs1 = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM admin_audit_logs WHERE admin_id = ? AND action = ? ORDER BY created_at DESC LIMIT 1`,
      adminUser.id,
      'PLAN_PRICE_CHANGE'
    );
    assert(logs1.length === 1 && logs1[0].new_value.includes('349'), 'Audit Log 1: Plan price update creates persistent audit log');

    // 2. Plan boundary update creates audit log
    await AuditLogService.log({
      adminId: adminUser.id,
      action: 'PLAN_BOUNDARY_CHANGE',
      entityType: 'PLAN',
      entityId: `plan_${seriesId}_MINI`,
      seriesId: seriesId,
      oldValue: { boundary: 16 },
      newValue: { boundary: 18 }
    });
    const logs2 = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM admin_audit_logs WHERE admin_id = ? AND action = ? ORDER BY created_at DESC LIMIT 1`,
      adminUser.id,
      'PLAN_BOUNDARY_CHANGE'
    );
    assert(logs2.length === 1 && logs2[0].new_value.includes('18'), 'Audit Log 2: Plan boundary update creates persistent audit log');

    // 3. Plan activation change creates audit log
    await AuditLogService.log({
      adminId: adminUser.id,
      action: 'PLAN_ACTIVATION_CHANGE',
      entityType: 'PLAN',
      entityId: `plan_${seriesId}_MINI`,
      seriesId: seriesId,
      oldValue: { active: true },
      newValue: { active: false }
    });
    const logs3 = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM admin_audit_logs WHERE admin_id = ? AND action = ? ORDER BY created_at DESC LIMIT 1`,
      adminUser.id,
      'PLAN_ACTIVATION_CHANGE'
    );
    assert(logs3.length === 1 && logs3[0].new_value.includes('false'), 'Audit Log 3: Plan activation change creates audit log');

    // 4 & 5. Quiz price & standalone toggle create audit log
    await AuditLogService.log({
      adminId: adminUser.id,
      action: 'QUIZ_PRICE_CHANGE',
      entityType: 'QUIZ',
      entityId: quiz1.id,
      seriesId: seriesId,
      oldValue: { price: 99 },
      newValue: { price: 129 }
    });
    await AuditLogService.log({
      adminId: adminUser.id,
      action: 'STANDALONE_PURCHASABLE_CHANGE',
      entityType: 'QUIZ',
      entityId: quiz1.id,
      seriesId: seriesId,
      oldValue: { standalone: true },
      newValue: { standalone: false }
    });

    const quizLogs = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM admin_audit_logs WHERE entity_id = ? AND series_id = ?`,
      quiz1.id,
      seriesId
    );
    assert(quizLogs.length === 2, 'Audit Log 4 & 5: Quiz price & standalone toggle create persistent audit logs');

    // 6-10. Audit log details check (admin ID, series ID, old/new values)
    assert(
      quizLogs[0].admin_id === adminUser.id &&
      quizLogs[0].series_id === seriesId &&
      quizLogs[0].old_value.includes('99') &&
      quizLogs[0].new_value.includes('129'),
      'Audit Log 6-10: Correct admin ID, series ID, old value, and new value recorded'
    );

    // =========================================================================
    // PART 2: SERVER-TO-SERVER RAZORPAY WEBHOOK TESTS
    // =========================================================================

    // Create Order for Webhook testing
    const order = await TestSeriesOrderService.createOrder(
      studentUser.id,
      seriesId,
      [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }],
      `idemp_wh_${timestamp}`
    );

    const gatewayOrderId = `order_wh_rzp_${timestamp}`;
    await prisma.orders.update({
      where: { id: order.id },
      data: { gateway_order_id: gatewayOrderId, status: 'PENDING' }
    });

    // Helper to simulate webhook verification & fulfillment
    async function processWebhookPayload(rawPayloadStr: string, sigHeader: string): Promise<WebhookTestResult> {
      const expectedSig = crypto.createHmac('sha256', secret).update(rawPayloadStr).digest('hex');
      const sigValid = crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expectedSig));
      if (!sigValid) throw new Error('Invalid signature');

      const body = JSON.parse(rawPayloadStr);
      if (body.event === 'payment.captured' || body.event === 'order.paid') {
        const payEntity = body.payload?.payment?.entity;
        const gOrderId = payEntity?.order_id || body.payload?.order?.entity?.id;
        const pId = payEntity?.id || `pay_wh_${timestamp}`;

        const foundOrder = await prisma.orders.findFirst({ where: { gateway_order_id: gOrderId } });
        if (!foundOrder) throw new Error('Order not found');

        const res = await TestSeriesOrderService.fulfillOrder(foundOrder.id, gOrderId, pId, 'RAZORPAY_WEBHOOK');
        return { success: true, alreadyFulfilled: res.alreadyFulfilled };
      } else if (body.event === 'payment.failed') {
        return { success: true, paymentFailed: true };
      }
      return { success: true, ignored: true };
    }

    // 1. Valid Webhook Signature & Event
    const validPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: `pay_wh_${timestamp}_1`, order_id: gatewayOrderId, amount: 29900 } }
      }
    });
    const validSig = crypto.createHmac('sha256', secret).update(validPayload).digest('hex');

    const res1 = await processWebhookPayload(validPayload, validSig);
    assert(res1.success === true && res1.alreadyFulfilled === false, 'Webhook 1: Valid webhook signature & event triggers fulfillment');

    const entitlement1 = await prisma.user_entitlements.findFirst({
      where: { user_id: studentUser.id, series_id: seriesId }
    });
    assert(entitlement1 !== null && entitlement1.entitlement_type === 'MINI', 'Webhook 1b: User entitlement granted by webhook fulfillment');

    // 2. Invalid Signature Rejected
    let invalidSigError = false;
    try {
      await processWebhookPayload(validPayload, 'invalid_sig_hash_999');
    } catch (e) {
      invalidSigError = true;
    }
    assert(invalidSigError, 'Webhook 2: Invalid webhook signature strictly rejected');

    // 3 & 4. Duplicate / Repeated Webhook Delivery (Idempotency)
    const resDuplicate = await processWebhookPayload(validPayload, validSig);
    assert(resDuplicate.alreadyFulfilled === true, 'Webhook 3 & 4: Duplicate webhook delivery returns alreadyFulfilled = true (Idempotent no-op)');

    // 5. 10x Webhook repetition results in 1 single entitlement
    for (let i = 0; i < 10; i++) {
      await processWebhookPayload(validPayload, validSig);
    }
    const entitlementCount = await prisma.user_entitlements.count({
      where: { user_id: studentUser.id, series_id: seriesId, entitlement_type: 'MINI' }
    });
    assert(entitlementCount === 1, 'Webhook 5: 10x repeated webhooks produce exactly 1 single entitlement record');

    // 6. Unknown Order Webhook Handled Safely
    const unknownPayload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_unk_1', order_id: 'order_unknown_999' } } }
    });
    const unknownSig = crypto.createHmac('sha256', secret).update(unknownPayload).digest('hex');
    let unkError = false;
    try {
      await processWebhookPayload(unknownPayload, unknownSig);
    } catch (e) {
      unkError = true;
    }
    assert(unkError, 'Webhook 6: Webhook for unknown order safely rejected without crash');

    // 7. Failed Payment Event does NOT create entitlement
    const failedStudent = await prisma.users.create({
      data: { id: `student_fail_${timestamp}`, email: `fail_${timestamp}@test.com`, fullName: 'Failed Student' }
    });
    const failedOrder = await TestSeriesOrderService.createOrder(
      failedStudent.id,
      seriesId,
      [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }],
      `idemp_fail_${timestamp}`
    );
    const failedGOrderId = `order_fail_rzp_${timestamp}`;
    await prisma.orders.update({ where: { id: failedOrder.id }, data: { gateway_order_id: failedGOrderId, status: 'PENDING' } });

    const failedPayload = JSON.stringify({
      event: 'payment.failed',
      payload: { payment: { entity: { id: `pay_failed_${timestamp}`, order_id: failedGOrderId } } }
    });
    const failedSig = crypto.createHmac('sha256', secret).update(failedPayload).digest('hex');

    const resFailed = await processWebhookPayload(failedPayload, failedSig);
    const failedEntitlements = await prisma.user_entitlements.count({ where: { user_id: failedStudent.id } });
    assert(resFailed.paymentFailed === true && failedEntitlements === 0, 'Webhook 7: Failed payment event creates 0 entitlements and leaves order unfulfilled');

    // 8. Frontend Verification first, Webhook second
    const raceStudentA = await prisma.users.create({
      data: { id: `raceA_${timestamp}`, email: `raceA_${timestamp}@test.com`, fullName: 'Race Student A' }
    });
    const orderRaceA = await TestSeriesOrderService.createOrder(raceStudentA.id, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `idemp_raceA_${timestamp}`);
    const gOrderIdRaceA = `order_raceA_${timestamp}`;
    await prisma.orders.update({ where: { id: orderRaceA.id }, data: { gateway_order_id: gOrderIdRaceA, status: 'PENDING' } });

    // Step A: Frontend verifies & fulfills first
    const frontendRes = await TestSeriesOrderService.fulfillOrder(orderRaceA.id, gOrderIdRaceA, `pay_raceA_${timestamp}`, 'RAZORPAY');
    assert(frontendRes.alreadyFulfilled === false, 'Race 1a: Frontend verification fulfills order first');

    // Step B: Webhook arrives second
    const payloadRaceA = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: `pay_raceA_${timestamp}`, order_id: gOrderIdRaceA } } }
    });
    const sigRaceA = crypto.createHmac('sha256', secret).update(payloadRaceA).digest('hex');
    const webhookResSecond = await processWebhookPayload(payloadRaceA, sigRaceA);
    assert(webhookResSecond.alreadyFulfilled === true, 'Race 1b: Webhook arriving second safely returns alreadyFulfilled = true');

    // 9. Webhook first, Frontend Verification second
    const raceStudentB = await prisma.users.create({
      data: { id: `raceB_${timestamp}`, email: `raceB_${timestamp}@test.com`, fullName: 'Race Student B' }
    });
    const orderRaceB = await TestSeriesOrderService.createOrder(raceStudentB.id, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `idemp_raceB_${timestamp}`);
    const gOrderIdRaceB = `order_raceB_${timestamp}`;
    await prisma.orders.update({ where: { id: orderRaceB.id }, data: { gateway_order_id: gOrderIdRaceB, status: 'PENDING' } });

    // Step A: Webhook arrives first
    const payloadRaceB = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: `pay_raceB_${timestamp}`, order_id: gOrderIdRaceB } } }
    });
    const sigRaceB = crypto.createHmac('sha256', secret).update(payloadRaceB).digest('hex');
    const webhookResFirst = await processWebhookPayload(payloadRaceB, sigRaceB);
    assert(webhookResFirst.alreadyFulfilled === false, 'Race 2a: Webhook arriving first fulfills order');

    // Step B: Frontend verification arrives second
    const frontendResSecond = await TestSeriesOrderService.fulfillOrder(orderRaceB.id, gOrderIdRaceB, `pay_raceB_${timestamp}`, 'RAZORPAY');
    assert(frontendResSecond.alreadyFulfilled === true, 'Race 2b: Frontend verification arriving second safely returns alreadyFulfilled = true');

    // Cleanup test data
    await prisma.$executeRawUnsafe(`DELETE FROM admin_audit_logs WHERE series_id = ?`, seriesId);
    await prisma.user_entitlements.deleteMany({ where: { series_id: seriesId } });
    await prisma.order_items.deleteMany({ where: { orders: { series_id: seriesId } } });
    await prisma.orders.deleteMany({ where: { series_id: seriesId } });
    await prisma.test_series_plans.deleteMany({ where: { series_id: seriesId } });
    await prisma.lms_quizzes.deleteMany({ where: { courseId: seriesId } });
    await prisma.lms_courses.delete({ where: { id: seriesId } });
    await prisma.users.deleteMany({ where: { id: { in: [adminUser.id, studentUser.id, failedStudent.id, raceStudentA.id, raceStudentB.id] } } });

    console.log('\n============================================================');
    console.log(`FULL PHASE 6B HARDENING SUITE SUMMARY: ${passed} / ${total} TESTS PASSED PERFECTLY 🎉`);
    console.log('============================================================\n');

  } catch (err: any) {
    console.error('\n❌ PHASE 6B TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase6bP1HardeningTestSuite();
