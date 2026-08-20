import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Current Affairs for UPSC, BPSC & State PCS | Final Attempt",
  description: "Get daily current affairs for UPSC, BPSC, and State PCS exams in Hindi & English — news analysis, editorial breakdowns, and video lectures updated daily.",
  keywords: ["Daily current affairs UPSC BPSC", "UPSC current affairs Hindi", "BPSC current affairs", "State PCS current affairs", "Daily news analysis"],
  alternates: { canonical: "https://finalattemptias.com/current-affairs" },
  openGraph: {
    title: "Daily Current Affairs for UPSC & BPSC | Final Attempt",
    description: "Daily current affairs in Hindi & English for UPSC, BPSC, APPSC and State PCS aspirants from Final Attempt.",
    url: "https://finalattemptias.com/current-affairs",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function CurrentAffairsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
