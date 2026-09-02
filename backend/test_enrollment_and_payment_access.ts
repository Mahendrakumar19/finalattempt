import { EntitlementService } from './services/entitlementService';
import { lmsDB } from './db';
import { prisma } from './prisma';

console.log('========================================================');
console.log('  TEST ENROLLMENT & PAYMENT QUIZ ACCESS INTEGRITY AUDIT  ');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

async function runEnrollmentAndPaymentAudit() {
  const tsStamp = Date.now();
  const testStudentId = `usr_admin_${tsStamp}`;
  const paidStudentId = `usr_paid_${tsStamp}`;
  const testSeriesId = `crs_${tsStamp}`;
  const testSeriesSlug = `bpsc-test-series-slug-${tsStamp}`;
  const quizId = `quiz_access_test_${tsStamp}`;

  // 0. Seed valid users & course record for FK integrity
  await prisma.users.create({
    data: {
      id: testStudentId,
      email: `admin_student_${tsStamp}@example.com`,
      fullName: 'Admin Added Student',
      passwordHash: 'dummy_hash',
      role: 'student'
    }
  });

  await prisma.users.create({
    data: {
      id: paidStudentId,
      email: `paid_student_${tsStamp}@example.com`,
      fullName: 'Paid Student',
      passwordHash: 'dummy_hash',
      role: 'student'
    }
  });

  await prisma.lms_courses.create({
    data: {
      id: testSeriesId,
      title: 'BPSC Test Series Audit',
      slug: testSeriesSlug,
      exam: 'BPSC',
      category: 'Prelims',
      fee: 799
    }
  });

  // Seed active test series plan so this test series is evaluated as a paid series
  const plansDelegate = (prisma as any).test_series_plans;
  if (plansDelegate) {
    await plansDelegate.create({
      data: {
        series_id: testSeriesId,
        plan_code: 'FULL',
        title: 'FULL Series Pass',
        sequence_start_number: 1,
        sequence_end_number: 99,
        price: 799,
        is_active: true
      }
    });
  }

  // Create temporary quiz record for testing
  const quiz = await lmsDB.createQuiz({
    id: quizId,
    title: 'Audit Access Test Quiz',
    courseId: testSeriesSlug,
    timeLimitMins: 60,
    isFree: false,
    isPublished: true,
    sequence_number: 5
  });

  const adminTargetIds = [testSeriesId, testSeriesSlug];

  try {
    // 1. Initial State: Unenrolled student attempt → DENY
    const accessDenied = await EntitlementService.hasQuizAccess(testStudentId, quizId);
    assert(!accessDenied.allowed, 'Unenrolled student is correctly DENIED access to paid test');

    // 2. PATH 1: Admin manually adds student to test series via API logic
    for (const sid of adminTargetIds) {
      await lmsDB.createEnrollment(testStudentId, sid, 'ADMIN_MANUAL', 0);
      const userEntitlementsDelegate = (prisma as any).user_entitlements;
      if (userEntitlementsDelegate) {
        await userEntitlementsDelegate.create({
          data: {
            user_id: testStudentId,
            series_id: sid,
            entitlement_type: 'FULL',
            max_sequence_number: 999,
            snapshot_max_sequence: 999,
            status: 'ACTIVE'
          }
        });
      }
    }

    // Verify access after Admin Manual Addition
    const accessAdminEnrolled = await EntitlementService.hasQuizAccess(testStudentId, quizId);
    assert(accessAdminEnrolled.allowed, 'Student added by admin manually is ALLOWED to give quiz', `Source: ${accessAdminEnrolled.source}`);

    // 3. PATH 2: Paid Registration Student (Simulated new paid student)
    for (const sid of adminTargetIds) {
      await lmsDB.createEnrollment(paidStudentId, sid, 'ORD_PAYMENT_12345', 799);
      const userEntitlementsDelegate = (prisma as any).user_entitlements;
      if (userEntitlementsDelegate) {
        await userEntitlementsDelegate.create({
          data: {
            user_id: paidStudentId,
            series_id: sid,
            entitlement_type: 'FULL',
            max_sequence_number: 999,
            snapshot_max_sequence: 999,
            status: 'ACTIVE'
          }
        });
      }
    }

    const accessPaidStudent = await EntitlementService.hasQuizAccess(paidStudentId, quizId);
    assert(accessPaidStudent.allowed, 'Student registered after making payment is ALLOWED to give quiz', `Source: ${accessPaidStudent.source}`);

    // Clean up test records
    await lmsDB.deleteQuiz(quizId);
    if (plansDelegate) {
      await plansDelegate.deleteMany({ where: { series_id: testSeriesId } });
    }
    await prisma.user_entitlements.deleteMany({ where: { user_id: { in: [testStudentId, paidStudentId] } } });
    await prisma.lms_enrollments.deleteMany({ where: { userId: { in: [testStudentId, paidStudentId] } } });
    await prisma.lms_courses.delete({ where: { id: testSeriesId } });
    await prisma.users.deleteMany({ where: { id: { in: [testStudentId, paidStudentId] } } });

  } catch (err: any) {
    console.error('Fatal audit error:', err);
    failCount++;
  }

  console.log('\n========================================================');
  console.log(`  ENROLLMENT & PAYMENT ACCESS AUDIT: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================\n');

  if (failCount > 0) process.exit(1);
}

runEnrollmentAndPaymentAudit().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
