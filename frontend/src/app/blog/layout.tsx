import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Civil Services Strategy Blogs & Insights | Final Attempt IAS",
  description: "Read preparation strategies, study tips, and toppers' insights for BPSC and UPSC exams from selected mentors.",
  keywords: ["BPSC strategy blog", "UPSC study tips", "Civil Services preparation guides", "Topper copy analysis"],
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
