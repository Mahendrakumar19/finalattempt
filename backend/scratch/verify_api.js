const { EntitlementService } = require('../services/entitlementService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findFirst({ where: { email: 'anjalisru11@gmail.com' } });
  if (!user) return;

  const ents = await EntitlementService.getUserEntitlements(user.id);
  console.log('API getUserEntitlements result:', ents);

  // Check access to Quiz 1 (Free Demo)
  const accessQ1 = await EntitlementService.hasQuizAccess(user.id, 'quiz-1788532983947');
  console.log('Quiz 1 access:', accessQ1);
}

main().catch(console.error).finally(() => prisma.$disconnect());
