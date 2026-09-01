import { prisma } from './prisma';

async function checkQuestion() {
  try {
    const res1 = await prisma.lms_questions.findMany({
      where: {
        OR: [
          { questionText: { contains: 'चट्टानी' } },
          { questionTextHi: { contains: 'चट्टानी' } }
        ]
      },
      take: 5
    });
    console.log("=== LMS QUESTIONS ===");
    console.log(JSON.stringify(res1, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestion();
