import DailyQuizPortal from '@/components/DailyQuizPortal';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Practice Quiz — BPSC & State PCS | Final Attempt IAS',
  description: 'Practice daily high-yield multiple-choice questions for BPSC, APPSC, and State Civil Services exams. Track speed, accuracy, and state leaderboard ranks.',
};

export default function DailyQuizPage() {
  return <DailyQuizPortal />;
}
