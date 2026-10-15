import { Metadata } from 'next';
import DailyEditionViewerClient from './DailyEditionViewerClient';

interface Props {
  params: Promise<{
    date: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const formattedDate = date || 'Daily Edition';

  const title = `Daily Current Affairs (${formattedDate}) — UPSC & State PCS | Final Attempt`;
  const description = `Read daily exam-relevant current affairs for ${formattedDate} curated for UPSC Civil Services, BPSC, UPPSC and State PCS. In-depth analysis and editorial summaries.`;
  const url = `https://finalattemptias.com/current-affairs/daily/${date}`;

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
      images: [
        {
          url: '/og-image.jpg',
          alt: `Current Affairs ${formattedDate}`,
        },
      ],
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  };
}

export default async function DailyEditionViewer({ params }: Props) {
  const { date } = await params;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': `Daily Current Affairs (${date}) — UPSC & State PCS Analysis`,
    'datePublished': date,
    'dateModified': date,
    'author': {
      '@type': 'Organization',
      'name': 'Final Attempt Editorial Team',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Final Attempt',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://finalattemptias.com/darklogofull.png',
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://finalattemptias.com/current-affairs/daily/${date}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <DailyEditionViewerClient initialDate={date} />
    </>
  );
}
