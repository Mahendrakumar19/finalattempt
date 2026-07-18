import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Current Affairs for BPSC & UPSC | Final Attempt IAS",
  description: "Get daily news analysis, editorial breakdowns, weekly digests, and current affairs video lectures tailored for BPSC.",
  keywords: ["Daily current affairs", "BPSC current affairs", "Bihar news analysis", "Current affairs for state PCS"],
};

export default function CurrentAffairsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
