import { prisma } from './prisma';

async function seedPlans() {
  try {
    const seriesId = 'ts-1786352658132';
    const defaultPlans = [
      {
        id: `plan_full_${Date.now()}`,
        series_id: seriesId,
        plan_code: 'FULL',
        title: 'Full Test Series Package',
        sequence_start_number: 1,
        sequence_end_number: 100,
        price: 999,
        discounted_price: 499,
        is_active: 1
      },
      {
        id: `plan_mini_${Date.now()}`,
        series_id: seriesId,
        plan_code: 'MINI',
        title: 'Mini Test Series Package',
        sequence_start_number: 1,
        sequence_end_number: 10,
        price: 299,
        discounted_price: 149,
        is_active: 1
      }
    ];

    for (const plan of defaultPlans) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO test_series_plans (id, series_id, plan_code, title, sequence_start_number, sequence_end_number, price, discounted_price, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), price=VALUES(price), discounted_price=VALUES(discounted_price)`,
        plan.id, plan.series_id, plan.plan_code, plan.title, plan.sequence_start_number, plan.sequence_end_number, plan.price, plan.discounted_price, plan.is_active
      );
      console.log(`Inserted plan ${plan.id} for series ${seriesId}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding plans:', err);
    process.exit(1);
  }
}

seedPlans();
