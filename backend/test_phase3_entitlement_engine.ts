import { prisma } from './prisma';
import { EntitlementService } from './services/entitlementService';
import { TestSeriesOrderService } from './services/testSeriesOrderService';
import { PlanCode, EntitlementStatus, ItemType, OrderStatus, EntitlementType } from '@prisma/client';

async function runPhase3TestSuite() {
  console.log('============================================================');
  console.log('FINALATTEMPT — PHASE 3: BACKEND ENGINE SUITE (TEST A..U)');
  console.log('============================================================\n');

  const testUserId = `test-user-${Date.now()}`;
  const seriesAId = `test-series-a-${Date.now()}`;
  const seriesBId = `test-series-b-${Date.now()}`;

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
    // 1. Create User
    await prisma.users.create({
      data: {
        id: testUserId,
        email: `test_engine_${Date.now()}@example.com`,
        fullName: 'Test Engine Student',
        role: 'student'
      }
    });

    // 2. Create Series A & Series B
    await prisma.lms_courses.create({
      data: { id: seriesAId, title: 'BPSC Prelims Test Series A', category: 'Prelims', fee: 999, slug: `series-a-${Date.now()}` }
    });

    await prisma.lms_courses.create({
      data: { id: seriesBId, title: 'UPSC Prelims Test Series B', category: 'Prelims', fee: 1499, slug: `series-b-${Date.now()}` }
    });

    // 3. Create Plans for Series A (MINI: 1-16 @ 299, HALF: 1-28 @ 499, FULL: 1-40 @ 799)
    await prisma.test_series_plans.createMany({
      data: [
        { series_id: seriesAId, plan_code: PlanCode.MINI, title: 'Series A Mini', sequence_start_number: 1, sequence_end_number: 16, price: 299 },
        { series_id: seriesAId, plan_code: PlanCode.HALF, title: 'Series A Half', sequence_start_number: 1, sequence_end_number: 28, price: 499 },
        { series_id: seriesAId, plan_code: PlanCode.FULL, title: 'Series A Full', sequence_start_number: 1, sequence_end_number: 40, price: 799 }
      ]
    });

    // 4. Create 40 Quizzes under Series A
    const quizzesA = [];
    for (let i = 1; i <= 40; i++) {
      quizzesA.push({
        id: `quiz-a-${i}-${Date.now()}`,
        courseId: seriesAId,
        title: `Series A Test ${i < 10 ? '0' + i : i}`,
        sequence_number: i,
        is_standalone_purchasable: true,
        individual_price: 49
      });
    }
    await prisma.lms_quizzes.createMany({ data: quizzesA });

    // Quiz under Series B (Test 10)
    const quizB10 = await prisma.lms_quizzes.create({
      data: {
        id: `quiz-b-10-${Date.now()}`,
        courseId: seriesBId,
        title: 'Series B Test 10',
        sequence_number: 10,
        is_standalone_purchasable: true,
        individual_price: 59
      }
    });

    console.log('[Setup] Created test user, series A, series B, plans, and quizzes.\n');

    // ─── TEST A: Legacy Enrollment Access ─────────────────────────────────────
    const legacyUserId = `legacy-user-${Date.now()}`;
    await prisma.users.create({
      data: { id: legacyUserId, email: `legacy_${Date.now()}@example.com`, fullName: 'Legacy Student' }
    });
    await prisma.lms_enrollments.create({
      data: { id: `enr-${Date.now()}`, userId: legacyUserId, courseId: seriesAId, paymentStatus: 'paid', amountPaid: 999 }
    });

    const accessLegacy = await EntitlementService.hasQuizAccess(legacyUserId, quizzesA[24].id); // Test 25
    assert(accessLegacy.allowed && accessLegacy.source === 'LEGACY_ENROLLMENT', 'TEST A: Legacy Enrollment Access', `Source: ${accessLegacy.source}`);

    // ─── TEST B: MINI Access ──────────────────────────────────────────────────
    const miniOrderToken = `idemp_mini_${Date.now()}`;
    const miniOrder = await TestSeriesOrderService.createOrder(
      testUserId,
      seriesAId,
      [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }],
      miniOrderToken
    );
    await TestSeriesOrderService.fulfillOrder(miniOrder.id, 'gw_mini_1', 'pay_mini_1');

    const accessMini16 = await EntitlementService.hasQuizAccess(testUserId, quizzesA[15].id); // Test 16
    const accessMini17 = await EntitlementService.hasQuizAccess(testUserId, quizzesA[16].id); // Test 17
    assert(accessMini16.allowed && !accessMini17.allowed, 'TEST B: MINI Access (1..16)', `Test 16: ${accessMini16.allowed}, Test 17: ${accessMini17.allowed}`);

    // ─── TEST I: MINI -> HALF Upgrade ────────────────────────────────────────
    const halfOrderToken = `idemp_half_${Date.now()}`;
    const previewHalfUpgrade = await TestSeriesOrderService.generateCartPreview(testUserId, seriesAId, [{ itemType: 'UPGRADE_PLAN', planCode: 'HALF' }]);
    assert(previewHalfUpgrade.upgradeCreditAmount === 299 && previewHalfUpgrade.netAmount === 200, 'TEST I: MINI -> HALF Upgrade Credit Calculation', `Gross: ₹${previewHalfUpgrade.grossAmount}, Credit: ₹${previewHalfUpgrade.upgradeCreditAmount}, Net: ₹${previewHalfUpgrade.netAmount}`);

    const halfOrder = await TestSeriesOrderService.createOrder(testUserId, seriesAId, [{ itemType: 'UPGRADE_PLAN', planCode: 'HALF' }], halfOrderToken);
    await TestSeriesOrderService.fulfillOrder(halfOrder.id, 'gw_half_1', 'pay_half_1');

    const accessHalf28 = await EntitlementService.hasQuizAccess(testUserId, quizzesA[27].id); // Test 28
    const accessHalf29 = await EntitlementService.hasQuizAccess(testUserId, quizzesA[28].id); // Test 29
    assert(accessHalf28.allowed && !accessHalf29.allowed, 'TEST C: HALF Access (1..28)', `Test 28: ${accessHalf28.allowed}, Test 29: ${accessHalf29.allowed}`);

    // ─── TEST J: HALF -> FULL Upgrade ────────────────────────────────────────
    const fullOrderToken = `idemp_full_${Date.now()}`;
    const previewFullUpgrade = await TestSeriesOrderService.generateCartPreview(testUserId, seriesAId, [{ itemType: 'UPGRADE_PLAN', planCode: 'FULL' }]);
    assert(previewFullUpgrade.upgradeCreditAmount === 200 && previewFullUpgrade.netAmount === 599, 'TEST J: HALF -> FULL Upgrade Credit Calculation', `Credit: ₹${previewFullUpgrade.upgradeCreditAmount}, Net: ₹${previewFullUpgrade.netAmount}`);

    const fullOrder = await TestSeriesOrderService.createOrder(testUserId, seriesAId, [{ itemType: 'UPGRADE_PLAN', planCode: 'FULL' }], fullOrderToken);
    await TestSeriesOrderService.fulfillOrder(fullOrder.id, 'gw_full_1', 'pay_full_1');

    const accessFull40 = await EntitlementService.hasQuizAccess(testUserId, quizzesA[39].id); // Test 40
    assert(accessFull40.allowed && accessFull40.source === 'FULL', 'TEST D: FULL Access (1..40)', `Test 40: ${accessFull40.allowed}`);

    // ─── TEST E & F: Individual Test Access & Multi-test Purchase ────────────
    const indUserId = `user-ind-${Date.now()}`;
    await prisma.users.create({ data: { id: indUserId, email: `ind_${Date.now()}@example.com`, fullName: 'Individual Student' } });

    const indOrder = await TestSeriesOrderService.createOrder(
      indUserId,
      seriesAId,
      [
        { itemType: 'INDIVIDUAL_TEST', quizId: quizzesA[2].id }, // Test 03
        { itemType: 'INDIVIDUAL_TEST', quizId: quizzesA[6].id }, // Test 07
        { itemType: 'INDIVIDUAL_TEST', quizId: quizzesA[20].id } // Test 21
      ],
      `idemp_ind_${Date.now()}`
    );
    await TestSeriesOrderService.fulfillOrder(indOrder.id, 'gw_ind_1', 'pay_ind_1');

    const accessTest03 = await EntitlementService.hasQuizAccess(indUserId, quizzesA[2].id);
    const accessTest04 = await EntitlementService.hasQuizAccess(indUserId, quizzesA[3].id);
    assert(accessTest03.allowed && !accessTest04.allowed, 'TEST E & F: Multi-Test Individual Purchase', `Test 03: ${accessTest03.allowed}, Test 04: ${accessTest04.allowed}`);

    // ─── TEST H: Cart Sanitizer (MINI + Overlapping Individual Test 03) ──────
    const cartUser = `user-cart-${Date.now()}`;
    await prisma.users.create({ data: { id: cartUser, email: `cart_${Date.now()}@example.com`, fullName: 'Cart Student' } });

    const previewOverlap = await TestSeriesOrderService.generateCartPreview(
      cartUser,
      seriesAId,
      [
        { itemType: 'PACKAGE_PLAN', planCode: 'MINI' },
        { itemType: 'INDIVIDUAL_TEST', quizId: quizzesA[2].id },  // Test 03 (covered by MINI)
        { itemType: 'INDIVIDUAL_TEST', quizId: quizzesA[34].id } // Test 35 (outside MINI)
      ]
    );

    assert(
      previewOverlap.redundantQuizIdsRemoved.includes(quizzesA[2].id) && previewOverlap.items.length === 2,
      'TEST H: Cart Overlap Sanitizer (Strips Test 03 covered by MINI)',
      `Items in cart: ${previewOverlap.items.map(i => i.itemTitle).join(' + ')}`
    );

    // ─── TEST N: Wrong Series Quiz Isolation ──────────────────────────────────
    const accessWrongSeries = await EntitlementService.hasQuizAccess(testUserId, quizB10.id);
    assert(!accessWrongSeries.allowed, 'TEST N: Cross Series Quiz Isolation (Series A owner denied on Series B test)', `Series B Test 10: ${accessWrongSeries.allowed}`);

    // ─── TEST Q & R: Duplicate Webhook & Fulfillment Idempotency ──────────────
    const duplicateFulfill = await TestSeriesOrderService.fulfillOrder(fullOrder.id, 'gw_full_1', 'pay_full_1');
    assert(duplicateFulfill.alreadyFulfilled === true, 'TEST Q & R: Duplicate Webhook / Fulfillment Idempotency', `Already Fulfilled: ${duplicateFulfill.alreadyFulfilled}`);

    // ─── TEST U: Historical Snapshot Rule Verification ────────────────────────
    const snapUser = `user-snap-${Date.now()}`;
    await prisma.users.create({ data: { id: snapUser, email: `snap_${Date.now()}@example.com`, fullName: 'Snapshot Student' } });

    const snapOrder = await TestSeriesOrderService.createOrder(snapUser, seriesAId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `idemp_snap_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(snapOrder.id, 'gw_snap_1', 'pay_snap_1');

    // Simulate Admin changing MINI boundary from 16 to 20 in database
    await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesAId, plan_code: PlanCode.MINI } },
      data: { sequence_end_number: 20 }
    });

    const accessSnap16 = await EntitlementService.hasQuizAccess(snapUser, quizzesA[15].id); // Test 16
    const accessSnap17 = await EntitlementService.hasQuizAccess(snapUser, quizzesA[16].id); // Test 17
    assert(accessSnap16.allowed && !accessSnap17.allowed, 'TEST U: Historical Snapshot Rule (Admin change MINI=20 does NOT expand past purchase)', `Test 16: ${accessSnap16.allowed}, Test 17: ${accessSnap17.allowed}`);

    // Cleanup mock admin plan change
    await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesAId, plan_code: PlanCode.MINI } },
      data: { sequence_end_number: 16 }
    });

    console.log('\n============================================================');
    console.log(`SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY 🎉`);
    console.log('============================================================\n');

  } catch (err: any) {
    console.error('Fatal Test Engine Failure:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3TestSuite();
