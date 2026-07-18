import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free BPSC Study Materials & Bihar Special PDFs | Final Attempt IAS",
  description: "Download high-yield BPSC mind maps, Bihar Special GK summaries, BPSC syllabus briefs, and Mains model answers.",
  keywords: ["Free BPSC PDF downloads", "Bihar special GK summary", "BPSC mind maps download", "BPSC notes"],
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
