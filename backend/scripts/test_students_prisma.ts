import { initEnv } from '../bootstrap';
initEnv();

import { prisma } from '../prisma';

async function getEnrolledStudentsPrisma(testSeriesId: string): Promise<any[]> {
  const targetIds = new Set<string>();
  if (testSeriesId) targetIds.add(testSeriesId);

  // 1. Fetch matching TestSeries IDs and Slugs
  try {
    const tsList = await prisma.testSeries.findMany({
      where: {
        OR: [
          { id: testSeriesId },
          { slug: testSeriesId },
          { id: { contains: testSeriesId } },
          { slug: { contains: testSeriesId } }
        ]
      },
      select: { id: true, slug: true }
    });
    tsList.forEach(t => {
      if (t.id) targetIds.add(t.id);
      if (t.slug) targetIds.add(t.slug);
    });
  } catch (_) {}

  // 2. Fetch lms_courses IDs and Slugs
  try {
    const cList = await prisma.lms_courses.findMany({
      where: {
        OR: [
          { id: testSeriesId },
          { slug: testSeriesId },
          { id: { contains: testSeriesId } },
          { slug: { contains: testSeriesId } }
        ]
      },
      select: { id: true, slug: true }
    });
    cList.forEach(c => {
      if (c.id) targetIds.add(c.id);
      if (c.slug) targetIds.add(c.slug);
    });
  } catch (_) {}

  // 3. Fetch lms_quizzes IDs
  try {
    const quizzes = await prisma.lms_quizzes.findMany({
      where: { courseId: { in: Array.from(targetIds) } },
      select: { id: true }
    });
    quizzes.forEach(q => targetIds.add(q.id));
  } catch (_) {}

  const idList = Array.from(targetIds).filter(Boolean);
  if (idList.length === 0) idList.push(testSeriesId);

  const formattedIds = idList.map(id => `'${id}'`).join(',');

  // Query 1: lms_enrollments
  let lmsRows: any[] = [];
  try {
    lmsRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT e.id as enrollmentId, e.userId, e.paymentOrderId, e.paymentStatus, e.amountPaid, e.enrolledAt,
             u.fullName, u.email, u.mobile, u.targetExam,
             'Full Access' as planName,
             (SELECT COUNT(a.id) FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = e.userId AND (q.courseId IN (${formattedIds}) OR q.id IN (${formattedIds}))) as totalAttempts,
             (SELECT a.score FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = e.userId AND (q.courseId IN (${formattedIds}) OR q.id IN (${formattedIds})) ORDER BY a.submittedAt DESC LIMIT 1) as latestScore
      FROM lms_enrollments e
      JOIN users u ON u.id = e.userId
      WHERE e.courseId IN (${formattedIds}) OR e.courseId IN (SELECT id FROM lms_quizzes WHERE courseId IN (${formattedIds}))
      ORDER BY e.enrolledAt DESC
    `);
  } catch (err: any) {
    console.error('lmsRows err:', err.message);
  }

  // Query 2: user_entitlements
  let entRows: any[] = [];
  try {
    entRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT u_ent.id as entitlementId, u_ent.user_id as userId,
             COALESCE(o.order_number, o.payment_reference_id, 'ONLINE_PAYMENT') as paymentOrderId,
             'paid' as paymentStatus,
             COALESCE(o.net_amount, 0) as amountPaid,
             u_ent.granted_at as enrolledAt,
             u.fullName, u.email, u.mobile, u.targetExam,
             u_ent.entitlement_type as entitlementType,
             q_ent.title as quizTitle,
             (SELECT oi.item_title FROM order_items oi WHERE oi.order_id = u_ent.source_order_id LIMIT 1) as orderItemTitle,
             (SELECT COUNT(a.id) FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = u_ent.user_id AND (q.courseId IN (${formattedIds}) OR q.id IN (${formattedIds}))) as totalAttempts,
             (SELECT a.score FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = u_ent.user_id AND (q.courseId IN (${formattedIds}) OR q.id IN (${formattedIds})) ORDER BY a.submittedAt DESC LIMIT 1) as latestScore
      FROM user_entitlements u_ent
      JOIN users u ON u.id = u_ent.user_id
      LEFT JOIN lms_quizzes q_ent ON q_ent.id = u_ent.quiz_id
      LEFT JOIN orders o ON o.id = u_ent.source_order_id OR (o.user_id = u_ent.user_id AND o.status = 'PAID')
      WHERE u_ent.status = 'ACTIVE' AND (
        u_ent.series_id IN (${formattedIds}) OR
        u_ent.quiz_id IN (${formattedIds})
      )
      ORDER BY u_ent.granted_at DESC
    `);
  } catch (err: any) {
    console.error('entRows err:', err.message);
  }

  // Query 3: orders
  let orderRows: any[] = [];
  try {
    orderRows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT o.id as orderId, o.user_id as userId,
             COALESCE(o.order_number, o.payment_reference_id, 'ONLINE_PAYMENT') as paymentOrderId,
             'paid' as paymentStatus,
             o.net_amount as amountPaid,
             o.paid_at as enrolledAt,
             u.fullName, u.email, u.mobile, u.targetExam,
             (SELECT oi.item_title FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) as orderItemTitle,
             (SELECT COUNT(a.id) FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = o.user_id AND (q.courseId IN (${formattedIds}) OR q.id IN (${formattedIds}))) as totalAttempts,
             (SELECT a.score FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = o.user_id AND (q.courseId IN (${formattedIds}) OR q.id IN (${formattedIds})) ORDER BY a.submittedAt DESC LIMIT 1) as latestScore
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.status = 'PAID' AND (
        o.series_id IN (${formattedIds}) OR 
        o.id IN (SELECT order_id FROM order_items WHERE quiz_id IN (${formattedIds}))
      )
      ORDER BY o.paid_at DESC
    `);
  } catch (err: any) {
    console.error('orderRows err:', err.message);
  }

  const formatPlanName = (r: any): string => {
    if (r.entitlementType === 'INDIVIDUAL_TEST' || r.quizTitle) {
      return r.quizTitle ? `Single Test: ${r.quizTitle}` : (r.orderItemTitle || 'Single Test Purchase');
    }
    if (r.entitlementType === 'MINI') return 'MINI Package';
    if (r.entitlementType === 'HALF') return 'HALF Package';
    if (r.entitlementType === 'FULL') return 'FULL Package';
    if (r.entitlementType === 'COMPLETE') return 'COMPLETE Test Series';
    if (r.orderItemTitle) return r.orderItemTitle;
    if (r.paymentOrderId === 'ADMIN_MANUAL') return 'Admin Manual';
    return 'Full Access';
  };

  const userMap = new Map<string, any>();
  lmsRows.forEach((r: any) => {
    const key = `${r.userId}_Full Access`;
    userMap.set(key, { ...r, planName: r.paymentOrderId === 'ADMIN_MANUAL' ? 'Admin Manual' : 'Full Access' });
  });

  orderRows.forEach((r: any) => {
    const pName = formatPlanName(r);
    const key = `${r.userId}_${pName}`;
    if (!userMap.has(key)) {
      userMap.set(key, {
        enrollmentId: r.orderId || r.userId,
        ...r,
        planName: pName
      });
    } else {
      const existing = userMap.get(key);
      if (Number(r.amountPaid) > 0) existing.amountPaid = Number(r.amountPaid);
      if (r.paymentOrderId && r.paymentOrderId !== 'ADMIN_MANUAL') existing.paymentOrderId = r.paymentOrderId;
    }
  });

  entRows.forEach((r: any) => {
    const pName = formatPlanName(r);
    const key = `${r.userId}_${pName}`;
    if (!userMap.has(key)) {
      userMap.set(key, {
        enrollmentId: r.entitlementId || r.userId,
        ...r,
        planName: pName
      });
    } else {
      const existing = userMap.get(key);
      if (Number(r.amountPaid) > 0 && !existing.amountPaid) existing.amountPaid = Number(r.amountPaid);
      if (r.paymentOrderId && r.paymentOrderId !== 'ADMIN_MANUAL' && existing.paymentOrderId === 'ADMIN_MANUAL') {
        existing.paymentOrderId = r.paymentOrderId;
      }
    }
  });

  return Array.from(userMap.values());
}

async function run() {
  const students = await getEnrolledStudentsPrisma('ts-1788523894202');
  console.log(`\nFound ${students.length} enrolled students for ts-1788523894202:`);
  console.log(JSON.stringify(students, null, 2));
  await prisma.$disconnect();
}

run();
