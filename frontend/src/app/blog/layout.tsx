import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Strategy Blogs & Civil Services Insights | Final Attempt IAS",
  description: "Read BPSC preparation strategies, study tips, editorial analysis, and topper insights from Final Attempt IAS expert mentors in Patna.",
  keywords: ["BPSC strategy blog", "Civil Services preparation guides", "Topper copy analysis", "BPSC current affairs analysis"],
  alternates: { canonical: "https://finalattemptias.com/blog" },
  openGraph: {
    title: "BPSC Strategy Blogs | Final Attempt IAS",
    description: "Expert BPSC preparation blogs, study strategies and topper insights from Final Attempt IAS mentors.",
    url: "https://finalattemptias.com/blog",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
