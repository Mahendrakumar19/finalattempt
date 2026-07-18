import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Results & Topper Reviews | Final Attempt IAS",
  description: "Explore reviews, success stories, and strategies of achievers who cleared BPSC using Final Attempt mentorship.",
  keywords: ["BPSC toppers Patna", "Final Attempt results", "BPSC topper success stories", "BPSC ranks"],
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
