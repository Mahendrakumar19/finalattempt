import { initEnv } from '../bootstrap';
initEnv();

import { prisma } from '../prisma';
import { getLocalStore } from '../db';

async function checkPayments() {
  console.log('--- CHECKING TEST SERIES PURCHASES & PAYMENTS IN DB ---\n');

  // 1. Check orders table
  try {
    const orders = await prisma.$queryRawUnsafe<any[]>(`
      SELECT o.*, u.fullName, u.email, u.mobile 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    console.log(`Total Orders in DB: ${orders.length}`);
    
    const paidOrders = orders.filter(o => o.status === 'PAID');
    console.log(`Paid Orders (status = 'PAID'): ${paidOrders.length}`);
    
    paidOrders.forEach((o, i) => {
      console.log(`\n[Paid Order #${i + 1}]`);
      console.log(`  Order Number: ${o.order_number}`);
      console.log(`  User: ${o.fullName || 'N/A'} (${o.email || 'N/A'}, Phone: ${o.mobile || 'N/A'})`);
      console.log(`  Series ID: ${o.series_id}`);
      console.log(`  Net Amount: ₹${o.net_amount}`);
      console.log(`  Gateway Order ID: ${o.gateway_order_id || 'N/A'}`);
      console.log(`  Payment Reference ID: ${o.payment_reference_id || 'N/A'}`);
      console.log(`  Paid At: ${o.paid_at || o.created_at}`);
    });

    const otherOrders = orders.filter(o => o.status !== 'PAID');
    if (otherOrders.length > 0) {
      console.log(`\nNon-PAID Orders Breakdown:`);
      const statusCounts: Record<string, number> = {};
      otherOrders.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      console.log(statusCounts);
    }
  } catch (err: any) {
    console.error('Error querying orders table:', err.message);
  }

  // 2. Check lms_enrollments table
  try {
    const enrollments = await prisma.lms_enrollments.findMany({
      include: {
        users: {
          select: { fullName: true, email: true, mobile: true }
        },
        lms_courses: {
          select: { title: true }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    console.log(`\nTotal LMS Enrollments in DB: ${enrollments.length}`);
    const paidEnrollments = enrollments.filter(e => e.paymentStatus === 'paid' || (e.amountPaid && e.amountPaid > 0));
    console.log(`Paid LMS Enrollments (paymentStatus = 'paid' or amountPaid > 0): ${paidEnrollments.length}`);
    
    paidEnrollments.forEach((e, i) => {
      console.log(`\n[Paid Enrollment #${i + 1}]`);
      console.log(`  User: ${e.users?.fullName} (${e.users?.email}, Mobile: ${e.users?.mobile})`);
      console.log(`  Course/Series: ${e.lms_courses?.title || e.courseId}`);
      console.log(`  Payment Status: ${e.paymentStatus}`);
      console.log(`  Amount Paid: ₹${e.amountPaid || 0}`);
      console.log(`  Payment Order ID: ${e.paymentOrderId || 'N/A'}`);
      console.log(`  Enrolled At: ${e.enrolledAt}`);
    });

    const freeOrPending = enrollments.filter(e => e.paymentStatus !== 'paid' && (!e.amountPaid || e.amountPaid === 0));
    console.log(`Free / Pending LMS Enrollments: ${freeOrPending.length}`);
  } catch (err: any) {
    console.error('Error querying lms_enrollments table:', err.message);
  }

  // 3. Check user_entitlements table
  try {
    const entitlements = await prisma.$queryRawUnsafe<any[]>(`
      SELECT e.*, u.fullName, u.email, u.mobile 
      FROM user_entitlements e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.granted_at DESC
    `);

    console.log(`\nTotal User Entitlements in DB: ${entitlements.length}`);
    
    // Group distinct users in entitlements
    const uniqueEntitledUsers = new Set(entitlements.map(e => e.user_id));
    console.log(`Unique Entitled Users: ${uniqueEntitledUsers.size}`);

    entitlements.forEach((e, i) => {
      console.log(`\n[Entitlement #${i + 1}]`);
      console.log(`  User: ${e.fullName} (${e.email}, Mobile: ${e.mobile})`);
      console.log(`  Series ID: ${e.series_id} | Type: ${e.entitlement_type} | Quiz ID: ${e.quiz_id || 'All'}`);
      console.log(`  Source Order ID: ${e.source_order_id || 'N/A'}`);
      console.log(`  Status: ${e.status} | Granted At: ${e.granted_at}`);
    });
  } catch (err: any) {
    console.error('Error querying user_entitlements table:', err.message);
  }

  // 4. Check JSON Store (if any stored there)
  try {
    const store = getLocalStore();
    if (store && store.enrollments && store.enrollments.length > 0) {
      console.log(`\nTotal Enrollments in JSON Store: ${store.enrollments.length}`);
    }
  } catch (_) {}

  await prisma.$disconnect();
}

checkPayments().catch(err => {
  console.error('Fatal error checking payments:', err);
  process.exit(1);
});
