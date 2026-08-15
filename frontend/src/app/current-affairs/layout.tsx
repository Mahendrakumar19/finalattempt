import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Current Affairs for BPSC in Hindi & English | Final Attempt",
  description: "Get daily BPSC current affairs in Hindi and English — news analysis, editorial breakdowns, weekly digests and video lectures. Updated every day for BPSC, UPSC & Bihar PCS aspirants.",
  keywords: ["Daily current affairs BPSC", "BPSC current affairs Hindi", "Bihar news analysis", "Current affairs for state PCS", "BPSC daily news"],
  alternates: { canonical: "https://finalattemptias.com/current-affairs" },
  openGraph: {
    title: "BPSC Daily Current Affairs | Final Attempt",
    description: "Daily current affairs in Hindi & English for BPSC, UPSC and Bihar PCS aspirants from Final Attempt.",
    url: "https://finalattemptias.com/current-affairs",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function CurrentAffairsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
