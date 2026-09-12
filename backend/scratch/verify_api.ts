import { EntitlementService } from '../services/entitlementService';
import { prisma } from '../prisma';

async function main() {
  const user = await prisma.users.findFirst({ where: { email: 'anjalisru11@gmail.com' } });
  if (!user) return;

  const ents = await EntitlementService.getUserEntitlements(user.id);
  console.log('API getUserEntitlements result:', ents);
}

main().catch(console.error).finally(() => prisma.$disconnect());
