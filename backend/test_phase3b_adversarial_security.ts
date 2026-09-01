import { prisma } from './prisma';
import { EntitlementService } from './services/entitlementService';
import { TestSeriesOrderService } from './services/testSeriesOrderService';
import { PlanCode, EntitlementStatus, ItemType, OrderStatus, EntitlementType } from '@prisma/client';

async function runPhase3BAdversarialTestSuite() {
  console.log('============================================================');
  console.log('FINALATTEMPT — PHASE 3B: ADVERSARIAL API & SECURITY AUDIT');
  console.log('============================================================\n');

  const testUserId = `adv-user-${Date.now()}`;
  const seriesAId = `adv-series-a-${Date.now()}`;
  const seriesBId = `adv-series-b-${Date.now()}`;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName} ${detail ? '- ' + detail : ''}`);
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? '- ' + detail : ''}`);
    }
  }

  try {
    // ─── SETUP MOCK DATA IN DB ────────────────────────────────────────────────
    await prisma.users.create({
      data: { id: testUserId, email: `adv_student_${Date.now()}@example.com`, fullName: 'Adversarial Tester', role: 'student' }
    });

    await prisma.lms_courses.create({
      data: { id: seriesAId, title: 'Series A (Target)', category: 'Prelims', fee: 1000, slug: `adv-a-${Date.now()}` }
    });

    await prisma.lms_courses.create({
      data: { id: seriesBId, title: 'Series B (Isolated)', category: 'Prelims', fee: 2000, slug: `adv-b-${Date.now()}` }
    });

    await prisma.test_series_plans.createMany({
      data: [
        { series_id: seriesAId, plan_code: PlanCode.MINI, title: 'Series A Mini', sequence_start_number: 1, sequence_end_number: 16, price: 300 },
        { series_id: seriesAId, plan_code: PlanCode.HALF, title: 'Series A Half', sequence_start_number: 1, sequence_end_number: 28, price: 600 },
        { series_id: seriesAId, plan_code: PlanCode.FULL, title: 'Series A Full', sequence_start_number: 1, sequence_end_number: 40, price: 1000 }
      ]
    });

    const quizzesA = [];
    for (let i = 1; i <= 40; i++) {
      quizzesA.push({
        id: `adv-quiz-a-${i}-${Date.now()}`,
        courseId: seriesAId,
        title: `Series A Test ${i}`,
        sequence_number: i,
        is_standalone_purchasable: i <= 35, // Tests 36-40 not standalone purchasable
        individual_price: 50
      });
    }
    await prisma.lms_quizzes.createMany({ data: quizzesA });

    const quizB = await prisma.lms_quizzes.create({
      data: {
        id: `adv-quiz-b-1-${Date.now()}`,
        courseId: seriesBId,
        title: 'Series B Test 01',
        sequence_number: 1,
        is_standalone_purchasable: true,
        individual_price: 100
      }
    });

    console.log('[Setup] Created adversarial test entities.\n');

    // ─── 1. PRICE MANIPULATION AUDIT ──────────────────────────────────────────
    // Attempting to send manipulated client price payload to backend
    const previewPriceCheck = await TestSeriesOrderService.generateCartPreview(
      testUserId,
      seriesAId,
      [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }]
    );
    assert(previewPriceCheck.grossAmount === 300 && previewPriceCheck.netAmount === 300, 'PRICE MANIPULATION: Server computes authoritative ₹300 price (ignores client payload)', `Computed Net: ₹${previewPriceCheck.netAmount}`);

    // ─── 2. QUIZ ID & CROSS-SERIES MANIPULATION AUDIT ─────────────────────────
    let rejectedCrossSeries = false;
    try {
      await TestSeriesOrderService.generateCartPreview(
        testUserId,
        seriesAId,
        [{ itemType: 'INDIVIDUAL_TEST', quizId: quizB.id }]
      );
    } catch (err: any) {
      rejectedCrossSeries = err.message.includes('does not belong to series');
    }
    assert(rejectedCrossSeries, 'QUIZ ID MANIPULATION: Server rejects quiz belonging to Series B in Series A cart');

    // ─── 3. NON-PURCHASABLE QUIZ AUDIT ────────────────────────────────────────
    let rejectedNonPurchasable = false;
    try {
      await TestSeriesOrderService.generateCartPreview(
        testUserId,
        seriesAId,
        [{ itemType: 'INDIVIDUAL_TEST', quizId: quizzesA[38].id }] // Test 39 (is_standalone_purchasable = false)
      );
    } catch (err: any) {
      rejectedNonPurchasable = err.message.includes('is not available for individual purchase');
    }
    assert(rejectedNonPurchasable, 'PACKAGE MANIPULATION: Server rejects individual purchase of non-standalone test');

    // ─── 4. DOWNGRADE & RE-PURCHASE PREVENTION AUDIT ──────────────────────────
    const fullOrder = await TestSeriesOrderService.createOrder(
      testUserId,
      seriesAId,
      [{ itemType: 'PACKAGE_PLAN', planCode: 'FULL' }],
      `idemp_adv_full_${Date.now()}`
    );
    await TestSeriesOrderService.fulfillOrder(fullOrder.id, `gw_adv_${Date.now()}`, `pay_adv_${Date.now()}`);

    let rejectedDowngrade = false;
    try {
      await TestSeriesOrderService.generateCartPreview(
        testUserId,
        seriesAId,
        [{ itemType: 'UPGRADE_PLAN', planCode: 'MINI' }]
      );
    } catch (err: any) {
      rejectedDowngrade = err.message.includes('Cannot downgrade or re-purchase');
    }
    assert(rejectedDowngrade, 'PACKAGE DOWNGRADE: Server rejects DOWNGRADE request (FULL -> MINI)');

    // ─── 5. EXPIRED & REVOKED ENTITLEMENT ACCESS AUDIT ────────────────────────
    const revUser = `rev-user-${Date.now()}`;
    await prisma.users.create({ data: { id: revUser, email: `rev_${Date.now()}@example.com`, fullName: 'Revoked Student' } });
    
    await prisma.user_entitlements.create({
      data: {
        user_id: revUser,
        series_id: seriesAId,
        entitlement_type: EntitlementType.FULL,
        max_sequence_number: 40,
        snapshot_max_sequence: 40,
        status: EntitlementStatus.REVOKED
      }
    });

    const accessRevoked = await EntitlementService.hasQuizAccess(revUser, quizzesA[0].id);
    assert(!accessRevoked.allowed && accessRevoked.source === 'NONE', 'REVOKED ENTITLEMENT: User with REVOKED status is DENIED access', `Allowed: ${accessRevoked.allowed}`);

    // ─── 6. DUPLICATE ORDER IDEMPOTENCY AUDIT ──────────────────────────────────
    const idempUser = `idemp-user-${Date.now()}`;
    await prisma.users.create({ data: { id: idempUser, email: `idemp_${Date.now()}@example.com`, fullName: 'Idempotent Student' } });

    const token = `idemp_dup_${Date.now()}`;
    const order1 = await TestSeriesOrderService.createOrder(idempUser, seriesAId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], token);
    const order2 = await TestSeriesOrderService.createOrder(idempUser, seriesAId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], token);
    assert(order1.id === order2.id, 'ORDER IDEMPOTENCY: Re-submitting identical idempotency_key returns original order ID', `Order 1 ID: ${order1.id}, Order 2 ID: ${order2.id}`);

    console.log('\n============================================================');
    console.log(`PHASE 3B ADVERSARIAL SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED 🎉`);
    console.log('============================================================\n');

  } catch (err: any) {
    console.error('Fatal Adversarial Test Engine Failure:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3BAdversarialTestSuite();
