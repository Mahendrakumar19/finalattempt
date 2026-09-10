import { initEnv } from '../bootstrap';
initEnv();

import { prisma } from '../prisma';

async function testPrismaRaw() {
  const testSeriesId = 'ts-1788523894202';
  console.log('Testing prisma.$queryRawUnsafe for testSeriesId:', testSeriesId);

  // 1. Fetch matching TestSeries IDs and Slugs
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

  const targetIds = new Set<string>();
  targetIds.add(testSeriesId);
  tsList.forEach(t => {
    if (t.id) targetIds.add(t.id);
    if (t.slug) targetIds.add(t.slug);
  });

  // Also check lms_quizzes for quizzes under this course/series
  const quizzes = await prisma.lms_quizzes.findMany({
    where: {
      courseId: { in: Array.from(targetIds) }
    },
    select: { id: true }
  });
  quizzes.forEach(q => targetIds.add(q.id));

  const idList = Array.from(targetIds).filter(Boolean);
  console.log('All Target IDs:', idList);

  const formattedIds = idList.map(id => `'${id}'`).join(',');

  // 2. Fetch Orders
  const ordersQuery = `
    SELECT o.id as orderId, o.user_id as userId,
           COALESCE(o.order_number, o.payment_reference_id, 'ONLINE_PAYMENT') as paymentOrderId,
           'paid' as paymentStatus,
           o.net_amount as amountPaid,
           o.paid_at as enrolledAt,
           u.fullName, u.email, u.mobile, u.targetExam,
           (SELECT oi.item_title FROM order_items oi WHERE oi.order_id = o.id LIMIT 1) as orderItemTitle
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.status = 'PAID' AND (
      o.series_id IN (${formattedIds}) OR 
      o.id IN (SELECT order_id FROM order_items WHERE quiz_id IN (${formattedIds}))
    )
    ORDER BY o.paid_at DESC
  `;

  const orderRows = await prisma.$queryRawUnsafe<any[]>(ordersQuery);
  console.log('Orders found:', orderRows.length);
  console.log('Orders data:', orderRows);

  // 3. Fetch Entitlements
  const entQuery = `
    SELECT u_ent.id as entitlementId, u_ent.user_id as userId,
           COALESCE(o.order_number, o.payment_reference_id, 'ONLINE_PAYMENT') as paymentOrderId,
           'paid' as paymentStatus,
           COALESCE(o.net_amount, 0) as amountPaid,
           u_ent.granted_at as enrolledAt,
           u.fullName, u.email, u.mobile, u.targetExam,
           u_ent.entitlement_type as entitlementType,
           q_ent.title as quizTitle,
           (SELECT oi.item_title FROM order_items oi WHERE oi.order_id = u_ent.source_order_id LIMIT 1) as orderItemTitle
    FROM user_entitlements u_ent
    JOIN users u ON u.id = u_ent.user_id
    LEFT JOIN lms_quizzes q_ent ON q_ent.id = u_ent.quiz_id
    LEFT JOIN orders o ON o.id = u_ent.source_order_id OR (o.user_id = u_ent.user_id AND o.status = 'PAID')
    WHERE u_ent.status = 'ACTIVE' AND (
      u_ent.series_id IN (${formattedIds}) OR
      u_ent.quiz_id IN (${formattedIds})
    )
    ORDER BY u_ent.granted_at DESC
  `;

  const entRows = await prisma.$queryRawUnsafe<any[]>(entQuery);
  console.log('Entitlements found:', entRows.length);
  console.log('Entitlements data:', entRows);

  await prisma.$disconnect();
}

testPrismaRaw();
