import DailyQuizPortal from '@/components/DailyQuizPortal';
import { Metadata } from 'next';
import { db } from '@/services/db';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const quiz = await db.getDailyQuizByIdOrSlug(slug);
    if (quiz) {
      const title = `${quiz.title} — Daily Quiz | Final Attempt`;
      const description = quiz.description || 'Test your BPSC & State PCS preparation with our daily high-yield practice quiz. Compete on the leaderboard and improve accuracy.';
      const url = `https://finalattempt.in/daily-quiz/${quiz.slug || quiz.id}`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url,
          siteName: 'Final Attempt IAS Academy',
          type: 'article',
          locale: 'en_IN',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
        },
      };
    }
  } catch (err) {
    console.error('Failed generating metadata for quiz slug:', slug, err);
  }

  return {
    title: 'Daily Practice Quiz — BPSC & State PCS | Final Attempt',
    description: 'Practice daily high-yield multiple-choice questions for BPSC, APPSC, and State Civil Services exams.',
  };
}

export default async function DailyQuizSlugPage({ params }: Props) {
  const { slug } = await params;
  return <DailyQuizPortal initialSlug={slug} />;
}
