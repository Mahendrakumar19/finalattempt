const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.users.findFirst({ where: { email: 'anjalisru11@gmail.com' } });
  console.log('USER:', u?.id, u?.email);
  if (!u) return;

  // Raw query to inspect all tables relating to orders and entitlements
  const invalidEnts = await prisma.$queryRawUnsafe(`SELECT * FROM user_entitlements WHERE entitlement_type = '' OR entitlement_type IS NULL`);
  console.log('INVALID ENTITLEMENTS IN DB:', invalidEnts);

  const userEnts = await prisma.$queryRawUnsafe(`SELECT * FROM user_entitlements WHERE user_id = '${u.id}'`);
  console.log('USER ALL ENTITLEMENTS:', userEnts);

  // Check tables for orders
  const tables = await prisma.$queryRawUnsafe(`SHOW TABLES`);
  console.log('DB TABLES:', tables.map(t => Object.values(t)[0]));

  // Check any orders table
  try {
    const orders = await prisma.$queryRawUnsafe(`SELECT * FROM test_series_orders WHERE user_id = '${u.id}'`);
    console.log('TEST_SERIES_ORDERS:', orders);
  } catch (e) {
    console.log('Could not query test_series_orders:', e.message);
  }

  try {
    const lmsOrders = await prisma.$queryRawUnsafe(`SELECT * FROM lms_orders WHERE userId = '${u.id}' OR user_id = '${u.id}'`);
    console.log('LMS_ORDERS:', lmsOrders);
  } catch (e) {
    console.log('Could not query lms_orders:', e.message);
  }

  try {
    const payments = await prisma.$queryRawUnsafe(`SELECT * FROM payments WHERE userId = '${u.id}' OR user_id = '${u.id}'`);
    console.log('PAYMENTS:', payments);
  } catch (e) {
    console.log('Could not query payments:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
