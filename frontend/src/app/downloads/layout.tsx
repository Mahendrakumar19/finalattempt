import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Study Materials & Notes Downloads — UPSC, BPSC, State PCS',
  description: 'Download standard NCERT notes, Previous Year Questions (PYQ) with model solutions, topper copies, and value-added mains notes for UPSC, BPSC, and UPPSC.',
  keywords: [
    'UPSC Free Downloads',
    'BPSC PYQ Download PDF',
    'NCERT Summary Notes',
    'Topper Answer Copies',
    'UPSC Mains Value Added Notes',
    'Final Attempt Study Material'
  ],
  alternates: {
    canonical: 'https://finalattemptias.com/downloads',
  },
  openGraph: {
    title: 'Free Study Materials & Notes Downloads — UPSC, BPSC, State PCS',
    description: 'Download standard NCERT notes, Previous Year Questions (PYQ) with model solutions, topper copies, and value-added mains notes.',
    url: 'https://finalattemptias.com/downloads',
    siteName: 'Final Attempt',
    images: [{ url: '/og-image.jpg', alt: 'Final Attempt Downloads' }],
    type: 'website',
  },
};

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
