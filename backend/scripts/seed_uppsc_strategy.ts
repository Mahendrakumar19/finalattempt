import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';

async function seedUppscStrategyToDb() {
  console.log('[Seed Script] Starting UPPSC Exam & Strategy Block database push...');

  // 1. Push to MySQL / Prisma Database
  try {
    let uppscExam = await prisma.exam.findFirst({
      where: { OR: [{ code: 'UPPSC' }, { slug: 'uppsc' }] }
    });

    if (!uppscExam) {
      uppscExam = await prisma.exam.create({
        data: {
          name: 'UPPSC (Uttar Pradesh PCS)',
          code: 'UPPSC',
          slug: 'uppsc',
          description: 'Uttar Pradesh Public Service Commission Combined State / Upper Subordinate Services Exam',
          hasStages: true,
          displayOrder: 2,
          isActive: true
        }
      });
      console.log('✅ Created UPPSC Exam in Prisma DB:', uppscExam.id);
    } else {
      console.log('ℹ️ UPPSC Exam already exists in Prisma DB:', uppscExam.id);
    }

    const strategySlug = 'uppsc-prelims-10yr-pyq-analysis';
    const strategyTitle = 'UPPSC Prelims 2026: Complete 10-Year PYQ Analysis & Strategy';
    const strategyCategory = 'UPPSC Strategy';

    const strategyContent = `
<h2>🎯 UPPSC Prelims 2026: Complete 10-Year PYQ Analysis</h2>
<p>Data-Driven Preparation Strategy based on 10 Years of Data (2016-2025), 1,500+ Questions Analyzed, across 8 Main Subjects (150 Questions/Exam).</p>

<h3>👑 Core Subject Weightages & Trends</h3>
<ul>
  <li><strong>History Dominates:</strong> 24 Qs/yr avg. Spectrum Modern India & NCERT Class 6-12 form the foundation.</li>
  <li><strong>Polity is Most Stable:</strong> 22 Qs/yr avg. M. Laxmikanth covers 95% of questions. Parliament, Rights & Panchayati Raj repeat annually.</li>
  <li><strong>Current Affairs Volatility:</strong> 22-38 Qs range. High-risk if ignored. Daily news tracking is mandatory.</li>
  <li><strong>Geography's Rising Importance:</strong> 21 Qs/yr avg. Indian & World Geography. Daily 20-min atlas practice is mandatory.</li>
  <li><strong>Science Strategy (Biology First):</strong> 19 Qs/yr avg. Biology yields 7-12 Qs. NCERT Class 9-12 coverage is sufficient.</li>
  <li><strong>UP Special GK: Low Priority:</strong> 1-8 Qs/yr. Maximum 2% time allocation is optimal.</li>
</ul>

<h3>📊 Subject Priority Tier Matrix</h3>
<ul>
  <li><strong>Tier 1 (Foundation):</strong> Current Affairs (22-38 Qs), History (18-28 Qs), Indian Polity (15-27 Qs)</li>
  <li><strong>Tier 2 (Support):</strong> Geography (18-24 Qs), General Science (17-21 Qs)</li>
  <li><strong>Tier 3 (Final Polish):</strong> Economy & Schemes (12-15 Qs), Environment (7-10 Qs), UP Special (1-8 Qs)</li>
</ul>

<h3>📚 Gold Standard Resource Stack</h3>
<ul>
  <li><strong>Indian Polity:</strong> M. Laxmikanth (6th Edition)</li>
  <li><strong>Modern History:</strong> Spectrum — Modern India</li>
  <li><strong>Ancient & Medieval:</strong> NCERT Class 6-12 & R.S. Sharma</li>
  <li><strong>Geography Maps:</strong> Oxford / Orient Blackswan Student Atlas (Daily 20 min)</li>
  <li><strong>Current Affairs:</strong> Ghatnachakra Monthly / Drishti IAS Magazine</li>
  <li><strong>Environment:</strong> Shankar IAS + ISFR State of Forest Report</li>
</ul>
    `.trim();

    const existingStrategy = await prisma.strategyBlock.findFirst({
      where: { slug: strategySlug }
    });

    if (!existingStrategy) {
      const created = await prisma.strategyBlock.create({
        data: {
          title: strategyTitle,
          slug: strategySlug,
          content: strategyContent,
          category: strategyCategory,
          sortOrder: 1,
          isPublished: true
        }
      });
      console.log('✅ Created UPPSC Strategy Block in Prisma DB:', created.id);
    } else {
      await prisma.strategyBlock.update({
        where: { id: existingStrategy.id },
        data: {
          title: strategyTitle,
          content: strategyContent,
          category: strategyCategory,
          isPublished: true
        }
      });
      console.log('✅ Updated existing UPPSC Strategy Block in Prisma DB:', existingStrategy.id);
    }
  } catch (err: any) {
    console.warn('⚠️ Error updating Prisma DB:', err?.message || err);
  }

  // 2. Push to database_store.json file
  const jsonPaths = [
    path.join(__dirname, '../database_store.json'),
    path.join(__dirname, '../../database_store.json'),
    'C:\\finalattempt_production_data\\database_store.json',
  ];

  for (const jsonPath of jsonPaths) {
    if (fs.existsSync(jsonPath)) {
      try {
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const dbData = JSON.parse(fileContent);

        // Ensure exams array has UPPSC
        if (!Array.isArray(dbData.exams)) {
          dbData.exams = [];
        }
        const uppscExists = dbData.exams.some((e: any) => e.code === 'UPPSC' || e.slug === 'uppsc');
        if (!uppscExists) {
          dbData.exams.push({
            id: 'uppsc',
            name: 'UPPSC (Uttar Pradesh PCS)',
            code: 'UPPSC',
            slug: 'uppsc',
            description: 'Uttar Pradesh Public Service Commission Combined State / Upper Subordinate Services Exam',
            hasStages: true,
            displayOrder: 2,
            isActive: true,
            stages: [
              { id: 'stage-uppsc-prelims', examId: 'uppsc', name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
              { id: 'stage-uppsc-mains', examId: 'uppsc', name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
            ]
          });
        }

        // Ensure strategyBlocks array has UPPSC Strategy
        if (!Array.isArray(dbData.strategyBlocks)) {
          dbData.strategyBlocks = [];
        }
        const strategyIdx = dbData.strategyBlocks.findIndex((s: any) => s.slug === 'uppsc-prelims-10yr-pyq-analysis');
        const newBlock = {
          id: 'uppsc-prelims-10yr-pyq-analysis',
          title: 'UPPSC Prelims 2026: Complete 10-Year PYQ Analysis & Strategy',
          slug: 'uppsc-prelims-10yr-pyq-analysis',
          category: 'UPPSC Strategy',
          content: 'Exhaustive 10-year subject weightages (2016–2025), Tier 1-3 priority matrix, Gold Standard booklist & study time allocation.',
          sortOrder: 1,
          isPublished: true,
          updatedAt: new Date().toISOString()
        };

        if (strategyIdx >= 0) {
          dbData.strategyBlocks[strategyIdx] = { ...dbData.strategyBlocks[strategyIdx], ...newBlock };
        } else {
          dbData.strategyBlocks.unshift(newBlock);
        }

        fs.writeFileSync(jsonPath, JSON.stringify(dbData, null, 2), 'utf-8');
        console.log('✅ Updated database_store.json at:', jsonPath);
      } catch (err: any) {
        console.warn('⚠️ Could not update JSON file at:', jsonPath, err?.message || err);
      }
    }
  }

  console.log('🚀 Finished UPPSC DB seed push.');
  process.exit(0);
}

seedUppscStrategyToDb();
