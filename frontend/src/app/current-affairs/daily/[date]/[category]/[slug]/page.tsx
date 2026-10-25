import { Metadata } from 'next';
import ArticleDetailClient from './ArticleDetailClient';

interface Props {
  params: Promise<{
    date: string;
    category: string;
    slug: string;
  }>;
}

function formatSlugToTitle(slug: string): string {
  if (!slug) return 'Daily Current Affairs';
  // Strip date prefixes like "2026-08-26-bihar-" or similar if present
  const cleaned = slug.replace(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9]+-/, '').replace(/-/g, ' ');
  return cleaned
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date, category, slug } = await params;
  const readableTitle = formatSlugToTitle(slug);
  const formattedCategory = (category || 'General').toUpperCase();
  const title = `${readableTitle} | ${formattedCategory} — Final Attempt`;
  const description = `Read ${readableTitle} (${date}) under ${formattedCategory} current affairs for UPSC Civil Services, BPSC and State PCS preparation on Final Attempt.`;
  const url = `https://finalattemptias.com/current-affairs/daily/${date}/${category}/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Final Attempt',
      type: 'article',
      locale: 'en_IN',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: readableTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { date, category, slug } = await params;
  return <ArticleDetailClient slug={slug} dateStr={date} categoryStr={category} />;
}
