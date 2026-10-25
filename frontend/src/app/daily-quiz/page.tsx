import DailyQuizPortal from '@/components/DailyQuizPortal';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Practice Quiz — BPSC & State PCS | Final Attempt',
  description: 'Practice daily high-yield multiple-choice questions for BPSC, APPSC, and State Civil Services exams. Track speed, accuracy, and state leaderboard ranks.',
  alternates: { canonical: 'https://finalattemptias.com/daily-quiz' },
  openGraph: {
    title: 'Daily Practice Quiz — BPSC & State PCS | Final Attempt',
    description: 'Practice daily high-yield multiple-choice questions for BPSC, APPSC, and State Civil Services exams.',
    url: 'https://finalattemptias.com/daily-quiz',
    siteName: 'Final Attempt',
    locale: 'en_IN',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function DailyQuizPage() {
  return <DailyQuizPortal />;
}
