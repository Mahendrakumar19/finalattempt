import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Exam Syllabus & Strategy Breakdown | Final Attempt",
  description: "Detailed syllabus breakdown, marking schemes, and preparation roadmap for BPSC Prelims, Mains, and Essay papers.",
  keywords: ["BPSC syllabus breakdown", "BPSC mains marking scheme", "BPSC essay strategy", "Bihar civil services syllabus"],
  alternates: { canonical: "https://finalattemptias.com/syllabus-strategy" },
  openGraph: {
    title: "BPSC Exam Syllabus & Strategy Breakdown | Final Attempt",
    description: "Detailed syllabus breakdown, marking schemes, and preparation roadmap for BPSC Prelims, Mains, and Essay papers.",
    url: "https://finalattemptias.com/syllabus-strategy",
    siteName: "Final Attempt",
    locale: "en_IN",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function SyllabusStrategyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
