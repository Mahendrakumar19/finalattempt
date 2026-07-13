import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client' // Use server client if possible, but for build time, might need direct fetch or just static. We will use static + dynamic.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ngtech-wcrm.com'

const staticRoutes = [
  '',
  '/features',
  '/pricing',
  '/free-trial',
  '/book-demo',
  '/about',
  '/contact',
  '/blog',
  '/solutions',
]

const features = [
  'shared-team-inbox',
  'chatbot-builder',
  'workflow-automation',
  'lead-management',
  'broadcast-campaigns',
  'security-compliance',
]

const industries = [
  'real-estate',
  'ecommerce',
  'education',
  'healthcare',
  'finance',
  'b2b',
  'manufacturing',
  'hospitality',
  'travel',
  'ngo',
  'government',
  'service-business',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // We can fetch dynamic blog posts from Supabase for the sitemap here.
  // For now, we'll map the static ones.
  
  const routes = [
    ...staticRoutes,
    ...features.map(f => `/features/${f}`),
    ...industries.map(i => `/solutions/${i}`),
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
