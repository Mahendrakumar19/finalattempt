import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finalattemptias.com';
  
  const staticPaths = [
    '',
    '/about',
    '/courses',
    '/test-series',
    '/current-affairs',
    '/pyq',
    '/resources',
    '/blog',
    '/faculties',
    '/privacy-policy',
    '/terms',
    '/refund-policy',
    '/disclaimer'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date()
  }));

  // Fetch dynamic blog posts or current affairs from backend if active
  try {
    const res = await fetch('http://localhost:5000/api/blogs');
    if (res.ok) {
      const blogs = await res.json();
      const blogPaths = blogs.map((b: any) => ({
        url: `${baseUrl}/blog/${b.id}`,
        lastModified: new Date(b.publishDate || Date.now())
      }));
      return [...staticPaths, ...blogPaths];
    }
  } catch (_) {}

  return staticPaths;
}
