import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Batches & Programs | Final Attempt IAS",
  description: "Browse BPSC Foundation, Target, Answer Writing, and Interview Guidance programs with expert mentorship.",
  keywords: ["BPSC batches", "BPSC foundation batch", "Patna BPSC classes", "BPSC civil services course"],
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
