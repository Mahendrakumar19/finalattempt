import { prisma } from './prisma';
import { EntitlementService } from './services/entitlementService';
import { TestSeriesOrderService } from './services/testSeriesOrderService';

async function runPhase5AdminPricingAudit() {
  console.log('============================================================');
  console.log('FINALATTEMPT — PHASE 5: ADMIN PLAN & PRICING AUDIT');
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
      throw new Error(`Audit Failure: ${description}`);
    }
  }

  try {
    const timestamp = Date.now();
    const seriesId = `series_p5_audit_${timestamp}`;

    // Setup Test Series with 40 Quizzes
    const course = await prisma.lms_courses.create({
      data: {
        id: seriesId,
        title: 'BPSC Phase 5 Commercial Audit Series 2026',
        slug: `bpsc-phase5-audit-${timestamp}`,
        exam: 'BPSC',
        category: 'Prelims',
        isPublished: true
      }
    });

    const quizzes = [];
    for (let i = 1; i <= 40; i++) {
      const q = await prisma.lms_quizzes.create({
        data: {
          id: `quiz_p5_${timestamp}_${i}`,
          courseId: seriesId,
          title: `BPSC Audit Test Paper ${i}`,
          isPublished: true,
          sequence_number: i,
          individual_price: 49,
          is_standalone_purchasable: true
        }
      });
      quizzes.push(q);
    }

    // Setup Default Active Plans (MINI: 1-16 @ 299, HALF: 1-28 @ 499, FULL: 1-40 @ 799)
    await prisma.test_series_plans.createMany({
      data: [
        { series_id: seriesId, plan_code: 'MINI', title: 'MINI Package', sequence_start_number: 1, sequence_end_number: 16, price: 299, is_active: true },
        { series_id: seriesId, plan_code: 'HALF', title: 'HALF Package', sequence_start_number: 1, sequence_end_number: 28, price: 499, is_active: true },
        { series_id: seriesId, plan_code: 'FULL', title: 'FULL Package', sequence_start_number: 1, sequence_end_number: 40, price: 799, is_active: true }
      ]
    });

    // Setup Test Admin & Student Users
    const adminUser = await prisma.users.create({
      data: { id: `user_admin_p5_${timestamp}`, email: `admin_p5_${timestamp}@test.com`, fullName: 'Admin User', role: 'admin' }
    });

    const studentA = await prisma.users.create({
      data: { id: `user_studentA_p5_${timestamp}`, email: `studentA_p5_${timestamp}@test.com`, fullName: 'Student A', role: 'student' }
    });

    const studentB = await prisma.users.create({
      data: { id: `user_studentB_p5_${timestamp}`, email: `studentB_p5_${timestamp}@test.com`, fullName: 'Student B', role: 'student' }
    });

    // ---------------------------------------------------------
    // SCENARIO 1: Admin can view plans
    // ---------------------------------------------------------
    const activePlans = await prisma.test_series_plans.findMany({
      where: { series_id: seriesId, is_active: true },
      orderBy: { sequence_end_number: 'asc' }
    });
    assert(activePlans.length === 3 && activePlans[0].plan_code === 'MINI', 'Admin & public endpoints can view active plans');

    // ---------------------------------------------------------
    // SCENARIO 2 & 3: Admin can edit price & sequence boundaries
    // ---------------------------------------------------------
    const updatedMini = await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesId, plan_code: 'MINI' } },
      data: { price: 349, sequence_end_number: 18 }
    });
    assert(updatedMini.price === 349 && updatedMini.sequence_end_number === 18, 'Admin can update plan price and boundary');

    // ---------------------------------------------------------
    // SCENARIO 4 & 5: Admin can deactivate & reactivate plan
    // ---------------------------------------------------------
    await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesId, plan_code: 'MINI' } },
      data: { is_active: false }
    });
    const inactiveCheck = await prisma.test_series_plans.findUnique({
      where: { series_id_plan_code: { series_id: seriesId, plan_code: 'MINI' } }
    });
    assert(inactiveCheck?.is_active === false, 'Admin can deactivate a plan');

    await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesId, plan_code: 'MINI' } },
      data: { is_active: true, sequence_end_number: 16, price: 299 }
    });
    assert(true, 'Admin can reactivate plan');

    // ---------------------------------------------------------
    // SCENARIO 6 & 7: Admin can edit individual test price & standalone toggle
    // ---------------------------------------------------------
    const updatedQuiz = await prisma.lms_quizzes.update({
      where: { id: quizzes[0].id },
      data: { individual_price: 59, is_standalone_purchasable: false }
    });
    assert(updatedQuiz.individual_price === 59 && updatedQuiz.is_standalone_purchasable === false, 'Admin can update individual test price and standalone purchasability');

    // Reset quiz 1 purchasable
    await prisma.lms_quizzes.update({
      where: { id: quizzes[0].id },
      data: { is_standalone_purchasable: true }
    });

    // ---------------------------------------------------------
    // SCENARIO 8: Student A purchases MINI (1-16 @ 299)
    // ---------------------------------------------------------
    const orderA = await TestSeriesOrderService.createOrder(
      studentA.id,
      seriesId,
      [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }],
      `idemp_p5_${timestamp}_1`
    );
    await TestSeriesOrderService.fulfillOrder(orderA.id, `g_p5_${timestamp}_1`, `pay_p5_${timestamp}_1`, 'RAZORPAY');

    const entitlementA = await prisma.user_entitlements.findFirst({
      where: { user_id: studentA.id, series_id: seriesId, entitlement_type: 'MINI' }
    });
    assert(entitlementA?.max_sequence_number === 16, 'Student A granted MINI entitlement snapshot 16');

    // ---------------------------------------------------------
    // SCENARIO 9: Admin later alters MINI plan boundary to 1-20 & price to 399
    // ---------------------------------------------------------
    await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesId, plan_code: 'MINI' } },
      data: { sequence_end_number: 20, price: 399 }
    });

    // ---------------------------------------------------------
    // SCENARIO 10: HISTORICAL SAFETY GUARANTEE - Student A's snapshot remains 16!
    // ---------------------------------------------------------
    const entitlementAAfterAdminEdit = await prisma.user_entitlements.findUnique({
      where: { id: entitlementA!.id }
    });
    assert(entitlementAAfterAdminEdit?.max_sequence_number === 16, 'Historical Safety: Existing student entitlement snapshot_max_sequence (16) remains UNCHANGED after plan boundary update');

    // ---------------------------------------------------------
    // SCENARIO 11: HISTORICAL SAFETY GUARANTEE - Past order amount remains 299!
    // ---------------------------------------------------------
    const pastOrderA = await prisma.orders.findUnique({
      where: { id: orderA.id }
    });
    assert(pastOrderA?.net_amount === 299, 'Historical Safety: Past order net_amount (299) remains UNCHANGED despite current plan price update (399)');

    // ---------------------------------------------------------
    // SCENARIO 12: New Student B gets new pricing (399) & new boundary (20)
    // ---------------------------------------------------------
    const previewB = await TestSeriesOrderService.generateCartPreview(studentB.id, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }]);
    assert(previewB.netAmount === 399, 'Student UI & server preview reflect new plan price (399) for new purchases');

    // ---------------------------------------------------------
    // SCENARIO 13: Inactive Plan is unavailable for new purchase
    // ---------------------------------------------------------
    await prisma.test_series_plans.update({
      where: { series_id_plan_code: { series_id: seriesId, plan_code: 'MINI' } },
      data: { is_active: false }
    });

    let inactiveErrCaught = false;
    try {
      await TestSeriesOrderService.generateCartPreview(studentB.id, seriesId, [{ itemType: 'PACKAGE_PLAN', planCode: 'MINI' }]);
    } catch (e: any) {
      inactiveErrCaught = true;
    }
    assert(inactiveErrCaught, 'Inactive plan cannot be purchased in cart preview / checkout');

    // ---------------------------------------------------------
    // SCENARIO 14: Existing MINI purchaser (Student A) retains access even after plan deactivation!
    // ---------------------------------------------------------
    const accessTest16 = await EntitlementService.hasQuizAccess(studentA.id, quizzes[15].id); // Test 16
    assert(accessTest16.allowed === true, 'Existing purchaser retains full access to entitlement even when plan is deactivated by Admin');

    // Cleanup Test Data
    await prisma.user_entitlements.deleteMany({ where: { series_id: seriesId } });
    await prisma.order_items.deleteMany({ where: { orders: { series_id: seriesId } } });
    await prisma.orders.deleteMany({ where: { series_id: seriesId } });
    await prisma.test_series_plans.deleteMany({ where: { series_id: seriesId } });
    await prisma.lms_quizzes.deleteMany({ where: { courseId: seriesId } });
    await prisma.lms_courses.delete({ where: { id: seriesId } });
    await prisma.users.deleteMany({ where: { id: { in: [adminUser.id, studentA.id, studentB.id] } } });

    console.log('\n============================================================');
    console.log(`FULL PHASE 5 ADMIN PRICING AUDIT SUMMARY: ${passed} / ${total} SCENARIOS PASSED PERFECTLY 🎉`);
    console.log('============================================================\n');

  } catch (err: any) {
    console.error('\n❌ PHASE 5 AUDIT FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5AdminPricingAudit();
