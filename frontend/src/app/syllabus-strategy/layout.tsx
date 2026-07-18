import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Exam Syllabus & Strategy Breakdown | Final Attempt IAS",
  description: "Detailed syllabus breakdown, marking schemes, and preparation roadmap for BPSC Prelims, Mains, and Essay papers.",
  keywords: ["BPSC syllabus breakdown", "BPSC mains marking scheme", "BPSC essay strategy", "Bihar civil services syllabus"],
};

export default function SyllabusStrategyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
