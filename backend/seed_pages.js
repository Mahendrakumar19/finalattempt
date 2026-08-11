const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pages = [
    {
      title: 'Final Attempt Publication',
      slug: 'downloads/fa-publication',
      content: '<h3>Final Attempt Special Books & Handbooks</h3><p>Official publication compiling Bihar Special GK, Mains Model Answers, and Annual Yearbooks.</p>',
      showLocation: 'DOWNLOADS_HUB',
      downloadItems: [
        {
          id: 'fa-1',
          title: 'BPSC 71st Prelims & Mains General Studies Master Guide',
          examCategory: 'BPSC',
          type: 'BPSC',
          language: 'English',
          editionYear: '2025-26 Edition',
          price: 450,
          discountedPrice: 299,
          samplePdfUrl: '/uploads/documents/fa_bihar_gk.pdf',
          url: '/uploads/documents/fa_bihar_gk.pdf',
          thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
          description: 'Comprehensive 1200+ page master textbook covering GS Paper 1 & 2, Bihar History, Polity, Geography & Economy for 71st BPSC.'
        },
        {
          id: 'fa-2',
          title: 'Bihar Special GK & General Knowledge Handbook',
          examCategory: 'Bihar Special',
          type: 'Bihar Special',
          language: 'Hindi',
          editionYear: '2025 Edition',
          price: 320,
          discountedPrice: 210,
          samplePdfUrl: '/uploads/documents/fa_yearbook_2024.pdf',
          url: '/uploads/documents/fa_yearbook_2024.pdf',
          thumbnailUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
          description: 'Special Bihar GK guide in Hindi covering Bihar ancient history, freedom movement, art & culture, agriculture, and government schemes.'
        },
        {
          id: 'fa-3',
          title: 'State PCS Prelims Solved Papers & Practice Manual',
          examCategory: 'State PCS',
          type: 'State PCS',
          language: 'English',
          editionYear: '2025-26 Edition',
          price: 550,
          discountedPrice: 380,
          samplePdfUrl: '/uploads/documents/fa_mains_answers.pdf',
          url: '/uploads/documents/fa_mains_answers.pdf',
          thumbnailUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
          description: 'English question bank featuring 10 years topic-wise solved papers with detailed explanations for BPSC and APPSC.'
        },
        {
          id: 'fa-4',
          title: 'Final Attempt Free Bihar Economic Survey & Budget Notes',
          examCategory: 'General Studies',
          type: 'General Studies',
          language: 'English',
          editionYear: '2025-26 Edition',
          samplePdfUrl: '/uploads/documents/bihar_budget_summary.pdf',
          url: '/uploads/documents/bihar_budget_summary.pdf',
          thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400',
          description: 'Official free summary of Bihar Economic Survey and State Budget key highlights for BPSC Prelims & Mains.'
        }
      ]
    },
    {
      title: 'Rapid Revision Materials',
      slug: 'downloads/rapid-revision',
      content: '<h3>BPSC Rapid Revision & Quick Tables</h3><p>Fast-track revision materials for BPSC Prelims including Bihar Budget summary & key formulas.</p>',
      showLocation: 'DOWNLOADS_HUB',
      downloadItems: [
        { id: 'rr-1', title: 'BPSC Prelims 100 Quick Revision Formula & Tables', type: 'PDF', size: '4.8 MB', url: '/uploads/documents/rapid_revision_tables.pdf' },
        { id: 'rr-2', title: 'Bihar Budget & Economic Survey 2024-25 At A Glance', type: 'PDF', size: '3.9 MB', url: '/uploads/documents/bihar_budget_summary.pdf' }
      ]
    },
    {
      title: 'Value Added Materials — Mains',
      slug: 'downloads/value-added-mains',
      content: '<h3>Mains Value Addition Booklets</h3><p>Data, quotes, Supreme Court judgments and state schemes tailored for Mains high scoring answers.</p>',
      showLocation: 'DOWNLOADS_HUB',
      downloadItems: [
        { id: 'va-1', title: 'Mains Data, Quotes & Supreme Court Judgments Booklet', type: 'PDF', size: '5.6 MB', url: '/uploads/documents/mains_value_addition.pdf' },
        { id: 'va-2', title: 'Bihar Specific Schemes & Government Initiatives (2024)', type: 'PDF', size: '4.1 MB', url: '/uploads/documents/bihar_schemes_mains.pdf' }
      ]
    },
    {
      title: 'Toppers Copies',
      slug: 'downloads/toppers-copies',
      content: '<h3>BPSC Rankers Evaluated Answer Copies</h3><p>Evaluated Mains answer sheets and essay copies of top rankers from 68th and 69th BPSC.</p>',
      showLocation: 'DOWNLOADS_HUB',
      downloadItems: [
        { id: 'tc-1', title: '69th BPSC Rank 1 Topper Answer Copy (GS Paper 1 & 2)', type: 'PDF', size: '15.4 MB', url: '/uploads/documents/topper_copy_rank1.pdf' },
        { id: 'tc-2', title: '68th BPSC Topper Essay Evaluation Copy', type: 'PDF', size: '9.2 MB', url: '/uploads/documents/topper_copy_essay.pdf' }
      ]
    }
  ];

  for (const page of pages) {
    const existing = await prisma.customPage.findFirst({
      where: { OR: [{ slug: page.slug }, { slug: page.slug.replace('downloads/', '') }] }
    });
    if (existing) {
      await prisma.customPage.update({
        where: { id: existing.id },
        data: {
          title: page.title,
          content: page.content,
          downloadItems: JSON.stringify(page.downloadItems),
          isPublished: true
        }
      });
      console.log('Updated:', page.slug);
    } else {
      await prisma.customPage.create({
        data: {
          title: page.title,
          slug: page.slug,
          content: page.content,
          showLocation: page.showLocation,
          downloadItems: JSON.stringify(page.downloadItems),
          isPublished: true
        }
      });
      console.log('Created:', page.slug);
    }
  }
}

main()
  .then(() => console.log('Seeding finished successfully!'))
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
