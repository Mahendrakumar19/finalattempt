import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'रणनीति ब्लॉग एवं संपादकीय लेख (Strategy Blogs in Hindi) | Final Attempt',
  description: 'यूपीएससी एवं राज्य पीसीएस (BPSC, UPPSC) की तैयारी के लिए सर्वश्रेष्ठ रणनीतिक लेख, टॉपर्स टिप्स और विषयवार मार्गदर्शन हिंदी में पढ़ें।',
  keywords: [
    'UPSC Strategy Hindi',
    'BPSC Strategy Blog Hindi',
    'सिविल सेवा तैयारी ब्लॉग',
    'Final Attempt Hindi Blogs'
  ],
  alternates: {
    canonical: 'https://finalattemptias.com/blog-hindi',
    languages: {
      'en': 'https://finalattemptias.com/blog',
      'hi': 'https://finalattemptias.com/blog-hindi',
    },
  },
  openGraph: {
    title: 'रणनीति ब्लॉग एवं संपादकीय लेख (Hindi) | Final Attempt',
    description: 'यूपीएससी एवं राज्य पीसीएस की तैयारी के लिए सर्वश्रेष्ठ रणनीतिक लेख हिंदी में पढ़ें।',
    url: 'https://finalattemptias.com/blog-hindi',
    siteName: 'Final Attempt',
    locale: 'hi_IN',
    images: [{ url: '/og-image.jpg', alt: 'Final Attempt Hindi Blog' }],
    type: 'website',
  },
};

export default function BlogHindiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
