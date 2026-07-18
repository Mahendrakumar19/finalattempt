import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Prelims & Mains Mock Test Series | Final Attempt IAS",
  description: "Enroll in high-quality BPSC mock tests with sectional checks, All India Ranks, and detailed video solutions.",
  keywords: ["BPSC test series", "BPSC prelims mock test", "Bihar PCS mains mock tests", "Final Attempt test series"],
};

export default function TestSeriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
