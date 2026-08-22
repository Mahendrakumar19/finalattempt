import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finalattemptias.com';
  const now = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,                              lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/about`,                        lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/courses`,                      lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/test-series`,                  lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/current-affairs`,              lastModified: now, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${baseUrl}/current-affairs/daily`,        lastModified: now, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${baseUrl}/current-affairs/weekly`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/current-affairs/monthly`,      lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/current-affairs/yearly`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${baseUrl}/current-affairs/videos`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/downloads`,                    lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/downloads/pyq`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${baseUrl}/downloads/ncert`,              lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/downloads/useful-documents`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${baseUrl}/downloads/value-added-mains`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${baseUrl}/downloads/toppers-copies`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/downloads/fa-publication`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/resources`,                    lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/blog`,                         lastModified: now, changeFrequency: 'daily',   priority: 0.85 },
    { url: `${baseUrl}/faculty`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${baseUrl}/pyq`,                          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/daily-quiz`,                   lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/syllabus-strategy`,            lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/privacy-policy`,               lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,                        lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/refund-policy`,                lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/disclaimer`,                   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];

  const dynamicPaths: MetadataRoute.Sitemap = [];

  // Use internal Next.js proxy (/api/*) instead of localhost — works on any server
  const apiBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://finalattemptias.com';

  try {
    // Dynamic blog posts
    const blogsRes = await fetch(`${apiBase}/api/blogs`, { next: { revalidate: 3600 } });
    if (blogsRes.ok) {
      const blogs = await blogsRes.json();
      if (Array.isArray(blogs)) {
        blogs.forEach((b: any) => {
          dynamicPaths.push({
            url: `${baseUrl}/blog/${b.slug || b.id}`,
            lastModified: new Date(b.publishDate || b.updatedAt || now),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        });
      }
    }
  } catch (_) {}

  try {
    // Dynamic current affairs articles
    const caRes = await fetch(`${apiBase}/api/dynamic-current-affairs/editions`, { next: { revalidate: 3600 } });
    if (caRes.ok) {
      const editions = await caRes.json();
      if (Array.isArray(editions)) {
        editions.forEach((ed: any) => {
          // Edition date page
          if (ed.publishDate) {
            dynamicPaths.push({
              url: `${baseUrl}/current-affairs/daily?date=${ed.publishDate}`,
              lastModified: new Date(ed.updatedAt || ed.publishDate || now),
              changeFrequency: 'daily',
              priority: 0.9,
            });
          }
          // Individual article pages
          if (Array.isArray(ed.articles)) {
            ed.articles.forEach((art: any) => {
              if (art.slug && ed.publishDate) {
                const category = (art.subjects?.[0] || 'general').toLowerCase().replace(/\s+/g, '-');
                dynamicPaths.push({
                  url: `${baseUrl}/current-affairs/daily/${ed.publishDate}/${category}/${art.slug}`,
                  lastModified: new Date(art.updatedAt || art.createdAt || now),
                  changeFrequency: 'monthly',
                  priority: 0.85,
                });
              }
            });
          }
        });
      }
    }
  } catch (_) {}

  return [...staticPaths, ...dynamicPaths];
}
