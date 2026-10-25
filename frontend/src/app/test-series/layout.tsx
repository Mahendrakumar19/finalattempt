import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Prelims & Mains Mock Test Series | Final Attempt",
  description: "Enroll in high-quality BPSC mock tests with sectional checks, All India Ranks, and detailed video solutions.",
  keywords: ["BPSC test series", "BPSC prelims mock test", "Bihar PCS mains mock tests", "Final Attempt test series"],
  alternates: { canonical: "https://finalattemptias.com/test-series" },
  openGraph: {
    title: "BPSC Prelims & Mains Mock Test Series | Final Attempt",
    description: "Enroll in high-quality BPSC mock tests with sectional checks, All India Ranks, and detailed video solutions.",
    url: "https://finalattemptias.com/test-series",
    siteName: "Final Attempt",
    locale: "en_IN",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function TestSeriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
