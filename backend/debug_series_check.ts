import { prisma } from './prisma';

async function main() {
  // Find all lms_courses that look like test series (ts- prefix or bpsc in slug)
  const courses = await prisma.lms_courses.findMany({
    select: { id: true, slug: true, title: true },
    take: 20
  });
  console.log('\n=== ALL LMS COURSES ===');
  courses.forEach(c => console.log(`  id=${c.id}  slug=${c.slug}  title=${c.title}`));

  // Show ALL plans grouped by series_id
  const allPlans = await prisma.test_series_plans.findMany({
    select: { series_id: true, plan_code: true, price: true, is_active: true }
  });
  console.log('\n=== ALL PLANS (grouped by series_id) ===');
  const grouped: Record<string, any[]> = {};
  for (const p of allPlans) {
    if (!grouped[p.series_id]) grouped[p.series_id] = [];
    grouped[p.series_id].push({ plan: p.plan_code, price: p.price, active: p.is_active });
  }
  for (const [sid, plans] of Object.entries(grouped)) {
    console.log(`  series_id="${sid}" → ${JSON.stringify(plans)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
