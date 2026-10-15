import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'दैनिक करेंट अफेयर्स (Daily Current Affairs in Hindi) — UPSC & State PCS',
  description: 'यूपीएससी एवं राज्य पीसीएस (BPSC, UPPSC) प्रारंभिक एवं मुख्य परीक्षा हेतु दैनिक, साप्ताहिक एवं मासिक करेंट अफेयर्स हिंदी में पढ़ें।',
  keywords: [
    'Daily Current Affairs in Hindi',
    'UPSC Current Affairs Hindi',
    'BPSC Current Affairs Hindi',
    'दैनिक करेंट अफेयर्स',
    'यूपीएससी समसामयिकी',
    'Final Attempt Hindi Current Affairs',
  ],
  alternates: {
    canonical: 'https://finalattemptias.com/current-affairs-hindi',
    languages: {
      'en': 'https://finalattemptias.com/current-affairs',
      'hi': 'https://finalattemptias.com/current-affairs-hindi',
    },
  },
  openGraph: {
    title: 'दैनिक करेंट अफेयर्स (Hindi) — Final Attempt',
    description: 'यूपीएससी एवं राज्य पीसीएस प्रारंभिक एवं मुख्य परीक्षा हेतु दैनिक समसामयिकी।',
    url: 'https://finalattemptias.com/current-affairs-hindi',
    siteName: 'Final Attempt',
    locale: 'hi_IN',
    images: [{ url: '/og-image.jpg', alt: 'Current Affairs Hindi' }],
    type: 'website',
  },
};

export default function CurrentAffairsHindiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
