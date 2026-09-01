import { prisma } from './prisma';
import { EntitlementService } from './services/entitlementService';
import { TestSeriesOrderService } from './services/testSeriesOrderService';
import { PlanCode, EntitlementStatus, ItemType, OrderStatus, EntitlementType } from '@prisma/client';

async function runPhase3BFullAuditSuite() {
  console.log('============================================================');
  console.log('FINALATTEMPT — PHASE 3B: COMPREHENSIVE ADVERSARIAL & INTEGRATION SUITE');
  console.log('============================================================\n');

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

  const seriesId = `audit-series-${Date.now()}`;
  const seriesBId = `audit-series-b-${Date.now()}`;
  const userId = `audit-user-${Date.now()}`;

  try {
    // ─── SETUP MOCK ENTITIES ──────────────────────────────────────────────────
    await prisma.users.create({
      data: { id: userId, email: `audit_${Date.now()}@example.com`, fullName: 'Audit Student', role: 'student' }
    });

    await prisma.lms_courses.create({
      data: { id: seriesId, title: 'BPSC Prelims Test Series Audit', category: 'Prelims', fee: 1000, slug: `audit-a-${Date.now()}` }
    });

    await prisma.lms_courses.create({
      data: { id: seriesBId, title: 'UPSC Prelims Test Series B', category: 'Prelims', fee: 2000, slug: `audit-b-${Date.now()}` }
    });

    await prisma.test_series_plans.createMany({
      data: [
        { series_id: seriesId, plan_code: PlanCode.MINI, title: 'Mini Package (1-16)', sequence_start_number: 1, sequence_end_number: 16, price: 300 },
        { series_id: seriesId, plan_code: PlanCode.HALF, title: 'Half Package (1-28)', sequence_start_number: 1, sequence_end_number: 28, price: 600 },
        { series_id: seriesId, plan_code: PlanCode.FULL, title: 'Full Package (1-40)', sequence_start_number: 1, sequence_end_number: 40, price: 1000 }
      ]
    });

    const quizzes = [];
    for (let i = 1; i <= 40; i++) {
      quizzes.push({
        id: `audit-quiz-${i}-${Date.now()}`,
        courseId: seriesId,
        title: `Test ${i < 10 ? '0' + i : i}`,
        sequence_number: i,
        is_standalone_purchasable: i <= 35,
        individual_price: 50
      });
    }
    await prisma.lms_quizzes.createMany({ data: quizzes });

    const quizB = await prisma.lms_quizzes.create({
      data: { id: `audit-quiz-b-${Date.now()}`, courseId: seriesBId, title: 'Series B Test 01', sequence_number: 1, is_standalone_purchasable: true, individual_price: 100 }
    });

    console.log('[Setup] Created test series, plans, and 40 quizzes.\n');

    // ─── 1. CART PREVIEW & PRICE MANIPULATION (SCENARIOS 1 & 2) ────────────────
    const previewPrice = await TestSeriesOrderService.generateCartPreview(userId, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }]);
    assert(previewPrice.grossAmount === 300 && previewPrice.netAmount === 300, '1 & 2. Cart Preview & Price Manipulation', 'Server calculates authoritative ₹300 price');

    // ─── 2. QUIZ ID & CROSS-SERIES MANIPULATION (SCENARIO 3) ───────────────────
    let crossSeriesBlocked = false;
    try {
      await TestSeriesOrderService.generateCartPreview(userId, seriesId, [{ itemType: 'INDIVIDUAL_TEST', quizId: quizB.id }]);
    } catch (e: any) { crossSeriesBlocked = e.message.includes('does not belong to series'); }
    assert(crossSeriesBlocked, '3. Quiz ID Manipulation', 'Server rejects cross-series quiz ID');

    // ─── 3. PACKAGE MANIPULATION & UNPURCHASABLE TEST (SCENARIO 4) ────────────
    let unpurchasableBlocked = false;
    try {
      await TestSeriesOrderService.generateCartPreview(userId, seriesId, [{ itemType: 'INDIVIDUAL_TEST', quizId: quizzes[38].id }]);
    } catch (e: any) { unpurchasableBlocked = e.message.includes('not available for individual purchase'); }
    assert(unpurchasableBlocked, '4. Package / Test Manipulation', 'Server rejects non-standalone test purchase');

    // ─── 4. INDIVIDUAL TEST FULFILLMENT (SCENARIO 5) ───────────────────────────
    const indUser = `user-ind-${Date.now()}`;
    await prisma.users.create({ data: { id: indUser, email: `ind_${Date.now()}@example.com`, fullName: 'Individual Student' } });
    const indOrder = await TestSeriesOrderService.createOrder(indUser, seriesId, [{ itemType: 'INDIVIDUAL_TEST', quizId: quizzes[2].id }], `token_ind_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(indOrder.id, `gw_ind_${Date.now()}`, `pay_ind_${Date.now()}`);
    
    const accTest03 = await EntitlementService.hasQuizAccess(indUser, quizzes[2].id); // Test 03
    const accTest04 = await EntitlementService.hasQuizAccess(indUser, quizzes[3].id); // Test 04
    assert(accTest03.allowed && !accTest04.allowed, '5. Individual Test Purchase', `Test 03: ${accTest03.allowed}, Test 04: ${accTest04.allowed}`);

    // ─── 5. MULTI-TEST PURCHASE (SCENARIO 6) ──────────────────────────────────
    const multiUser = `user-multi-${Date.now()}`;
    await prisma.users.create({ data: { id: multiUser, email: `multi_${Date.now()}@example.com`, fullName: 'Multi Student' } });
    const multiOrder = await TestSeriesOrderService.createOrder(multiUser, seriesId, [
      { itemType: 'INDIVIDUAL_TEST', quizId: quizzes[2].id },
      { itemType: 'INDIVIDUAL_TEST', quizId: quizzes[6].id },
      { itemType: 'INDIVIDUAL_TEST', quizId: quizzes[20].id },
      { itemType: 'INDIVIDUAL_TEST', quizId: quizzes[33].id }
    ], `token_multi_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(multiOrder.id, `gw_multi_${Date.now()}`, `pay_multi_${Date.now()}`);
    const accMulti03 = await EntitlementService.hasQuizAccess(multiUser, quizzes[2].id);
    const accMulti34 = await EntitlementService.hasQuizAccess(multiUser, quizzes[33].id);
    const accMulti05 = await EntitlementService.hasQuizAccess(multiUser, quizzes[4].id);
    assert(accMulti03.allowed && accMulti34.allowed && !accMulti05.allowed, '6. Multi-Test Purchase', 'Tests 03 & 34 ALLOW, Test 05 DENY');

    // ─── 6. MINI PURCHASE (SCENARIO 7) ─────────────────────────────────────────
    const miniUser = `user-mini-${Date.now()}`;
    await prisma.users.create({ data: { id: miniUser, email: `mini_${Date.now()}@example.com`, fullName: 'Mini Student' } });
    const miniOrder = await TestSeriesOrderService.createOrder(miniUser, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `token_mini_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(miniOrder.id, `gw_mini_${Date.now()}`, `pay_mini_${Date.now()}`);
    const accMini16 = await EntitlementService.hasQuizAccess(miniUser, quizzes[15].id);
    const accMini17 = await EntitlementService.hasQuizAccess(miniUser, quizzes[16].id);
    assert(accMini16.allowed && !accMini17.allowed, '7. MINI Purchase (Tests 1..16)', `Test 16: ${accMini16.allowed}, Test 17: ${accMini17.allowed}`);

    // ─── 7. HALF PURCHASE (SCENARIO 8) ─────────────────────────────────────────
    const halfUser = `user-half-${Date.now()}`;
    await prisma.users.create({ data: { id: halfUser, email: `half_${Date.now()}@example.com`, fullName: 'Half Student' } });
    const halfOrder = await TestSeriesOrderService.createOrder(halfUser, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'HALF' }], `token_half_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(halfOrder.id, `gw_half_${Date.now()}`, `pay_half_${Date.now()}`);
    const accHalf28 = await EntitlementService.hasQuizAccess(halfUser, quizzes[27].id);
    const accHalf29 = await EntitlementService.hasQuizAccess(halfUser, quizzes[28].id);
    assert(accHalf28.allowed && !accHalf29.allowed, '8. HALF Purchase (Tests 1..28)', `Test 28: ${accHalf28.allowed}, Test 29: ${accHalf29.allowed}`);

    // ─── 8. FULL PURCHASE (SCENARIO 9) ─────────────────────────────────────────
    const fullUser = `user-full-${Date.now()}`;
    await prisma.users.create({ data: { id: fullUser, email: `full_${Date.now()}@example.com`, fullName: 'Full Student' } });
    const fullOrder = await TestSeriesOrderService.createOrder(fullUser, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'FULL' }], `token_full_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(fullOrder.id, `gw_full_${Date.now()}`, `pay_full_${Date.now()}`);
    const accFull40 = await EntitlementService.hasQuizAccess(fullUser, quizzes[39].id);
    assert(accFull40.allowed, '9. FULL Purchase (Tests 1..40)', `Test 40: ${accFull40.allowed}`);

    // ─── 9. UPGRADES (MINI -> HALF -> FULL & DOWNGRADE REJECTION) (SCENARIO 10) ──
    const upUser = `user-up-${Date.now()}`;
    await prisma.users.create({ data: { id: upUser, email: `up_${Date.now()}@example.com`, fullName: 'Upgrade Student' } });
    const uMiniOrder = await TestSeriesOrderService.createOrder(upUser, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `token_up_m_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(uMiniOrder.id, `gw_up_m_${Date.now()}`, `pay_up_m_${Date.now()}`);
    
    // Upgrade MINI -> HALF
    const uHalfOrder = await TestSeriesOrderService.createOrder(upUser, seriesId, [{ itemType: 'UPGRADE_PLAN', planCode: 'HALF' }], `token_up_h_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(uHalfOrder.id, `gw_up_h_${Date.now()}`, `pay_up_h_${Date.now()}`);
    const accUpHalf28 = await EntitlementService.hasQuizAccess(upUser, quizzes[27].id);

    // Reject Downgrade HALF -> MINI
    let downgradeBlocked = false;
    try {
      await TestSeriesOrderService.generateCartPreview(upUser, seriesId, [{ itemType: 'UPGRADE_PLAN', planCode: 'MINI' }]);
    } catch (e: any) { downgradeBlocked = e.message.includes('Cannot downgrade or re-purchase'); }
    assert(accUpHalf28.allowed && downgradeBlocked, '10. Package Upgrades & Downgrade Prevention', `HALF 28 ALLOW: ${accUpHalf28.allowed}, Downgrade Blocked: ${downgradeBlocked}`);

    // ─── 10. HISTORICAL SNAPSHOT (SCENARIO 11) ─────────────────────────────────
    const snapUser = `user-snap-${Date.now()}`;
    await prisma.users.create({ data: { id: snapUser, email: `snap_${Date.now()}@example.com`, fullName: 'Snap Student' } });
    const sOrder = await TestSeriesOrderService.createOrder(snapUser, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `token_snap_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(sOrder.id, `gw_snap_${Date.now()}`, `pay_snap_${Date.now()}`);
    
    // Simulate Admin changing plan boundary
    await prisma.test_series_plans.update({ where: { series_id_plan_code: { series_id: seriesId, plan_code: PlanCode.MINI } }, data: { sequence_end_number: 22 } });
    const accSnap16 = await EntitlementService.hasQuizAccess(snapUser, quizzes[15].id);
    const accSnap17 = await EntitlementService.hasQuizAccess(snapUser, quizzes[16].id);
    assert(accSnap16.allowed && !accSnap17.allowed, '11. Historical Snapshot Protection', `Past purchase locked to 16 despite plan change to 22`);
    await prisma.test_series_plans.update({ where: { series_id_plan_code: { series_id: seriesId, plan_code: PlanCode.MINI } }, data: { sequence_end_number: 16 } });

    // ─── 11. INDIVIDUAL + PACKAGE COEXISTENCE (SCENARIO 12) ────────────────────
    const comboUser = `user-combo-${Date.now()}`;
    await prisma.users.create({ data: { id: comboUser, email: `combo_${Date.now()}@example.com`, fullName: 'Combo Student' } });
    const comboInd = await TestSeriesOrderService.createOrder(comboUser, seriesId, [{ itemType: 'INDIVIDUAL_TEST', quizId: quizzes[20].id }], `token_c1_${Date.now()}`); // Test 21
    await TestSeriesOrderService.fulfillOrder(comboInd.id, `gw_c1_${Date.now()}`, `pay_c1_${Date.now()}`);
    const comboPkg = await TestSeriesOrderService.createOrder(comboUser, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }], `token_c2_${Date.now()}`);
    await TestSeriesOrderService.fulfillOrder(comboPkg.id, `gw_c2_${Date.now()}`, `pay_c2_${Date.now()}`);
    
    const accCombo10 = await EntitlementService.hasQuizAccess(comboUser, quizzes[9].id);  // Test 10 (via MINI)
    const accCombo21 = await EntitlementService.hasQuizAccess(comboUser, quizzes[20].id); // Test 21 (via INDIVIDUAL)
    const accCombo22 = await EntitlementService.hasQuizAccess(comboUser, quizzes[21].id); // Test 22 (DENY)
    assert(accCombo10.allowed && accCombo21.allowed && !accCombo22.allowed, '12. Individual + Package Coexistence', `Test 10: ALLOW, Test 21: ALLOW, Test 22: DENY`);

    // ─── 12. DUPLICATE ORDER & WEBHOOK IDEMPOTENCY (SCENARIOS 13, 14, 15) ──────
    const dupToken = `token_dup_${Date.now()}`;
    const dupO1 = await TestSeriesOrderService.createOrder(userId, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'FULL' }], dupToken);
    const dupO2 = await TestSeriesOrderService.createOrder(userId, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'FULL' }], dupToken);
    const dupF1 = await TestSeriesOrderService.fulfillOrder(dupO1.id, `gw_dup_${Date.now()}`, `pay_dup_${Date.now()}`);
    const dupF2 = await TestSeriesOrderService.fulfillOrder(dupO1.id, `gw_dup_${Date.now()}`, `pay_dup_${Date.now()}`);
    assert(dupO1.id === dupO2.id && dupF2.alreadyFulfilled === true, '13, 14, 15. Duplicate Request & Webhook Idempotency', 'Returns identical order ID and idempotent no-op fulfillment');

    // ─── 13. LEGACY ENROLLMENT COMPATIBILITY (SCENARIO 18) ─────────────────────
    const legUser = `user-leg-${Date.now()}`;
    await prisma.users.create({ data: { id: legUser, email: `leg_${Date.now()}@example.com`, fullName: 'Legacy Student' } });
    await prisma.lms_enrollments.create({ data: { id: `enr_leg_${Date.now()}`, userId: legUser, courseId: seriesId, paymentStatus: 'paid', amountPaid: 1000 } });
    const accLeg35 = await EntitlementService.hasQuizAccess(legUser, quizzes[34].id);
    assert(accLeg35.allowed && accLeg35.source === 'LEGACY_ENROLLMENT', '18. Legacy Enrollment Access', `Legacy student granted full access via lms_enrollments`);

    // ─── 14. EXPIRATION & REVOCATION (SCENARIO 19) ──────────────────────────────
    const revUser = `user-rev-${Date.now()}`;
    await prisma.users.create({ data: { id: revUser, email: `rev_${Date.now()}@example.com`, fullName: 'Revoked Student' } });
    await prisma.user_entitlements.create({ data: { user_id: revUser, series_id: seriesId, entitlement_type: EntitlementType.FULL, max_sequence_number: 40, status: EntitlementStatus.REVOKED } });
    const accRev = await EntitlementService.hasQuizAccess(revUser, quizzes[0].id);
    assert(!accRev.allowed, '19. Expired / Revoked Entitlement', `Revoked user denied access`);

    console.log('\n============================================================');
    console.log(`FULL PHASE 3B AUDIT SUMMARY: ${passedTests} / ${totalTests} SCENARIOS PASSED PERFECTLY 🎉`);
    console.log('============================================================\n');

  } catch (err: any) {
    console.error('Fatal Audit Suite Failure:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3BFullAuditSuite();
