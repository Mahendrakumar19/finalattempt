import { Metadata } from 'next';
import CustomPageClient from './CustomPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPageData(slug: string) {
  const apiBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://finalattemptias.com';
  try {
    const res = await fetch(`${apiBase}/api/custom-pages/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      return data?.data || null;
    }
  } catch (_) {}
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageData(slug);

  if (!page) {
    return {
      title: 'Page Not Found | Final Attempt IAS',
      description: 'The requested page could not be found on Final Attempt IAS.',
    };
  }

  const cleanSlug = slug.replace(/^downloads\//, '').replace(/^p\//, '');
  const title = page.metaTitle || `${page.title} | Final Attempt IAS`;
  const description = page.metaDescription || `Explore ${page.title} on Final Attempt IAS - Premier State PCS & BPSC Mentorship Platform.`;
  const keywords = page.metaKeywords || `${page.title}, BPSC institute, BPSC coaching, civil services, state pcs`;
  const canonicalUrl = `https://finalattemptias.com/p/${cleanSlug}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Final Attempt IAS',
      locale: 'en_IN',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CustomDynamicPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageData(slug);

  const cleanSlug = slug.replace(/^downloads\//, '').replace(/^p\//, '');
  const canonicalUrl = `https://finalattemptias.com/p/${cleanSlug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    'name': page?.title || 'Final Attempt IAS',
    'url': canonicalUrl,
    'description': page?.metaDescription || 'Premier BPSC & State PCS Mentorship Institute',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Patna',
      'addressRegion': 'Bihar',
      'addressCountry': 'IN'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CustomPageClient initialPage={page} slug={slug} />
    </>
  );
}
