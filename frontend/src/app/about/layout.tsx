import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Final Attempt — Coaching Patna",
  description: "Learn about Final Attempt, our mission, vision, Patna Boring Road crossing center, and contact options for BPSC batches. Led by expert mentors with proven BPSC results.",
  keywords: ["About Final Attempt", "Boring Road Coaching BPSC", "Patna BPSC coaching contact", "Siddharth Kumar Sinha"],
  alternates: { canonical: "https://finalattemptias.com/about" },
  openGraph: {
    title: "About Final Attempt | Coaching Patna",
    description: "About Final Attempt — Bihar's top mentorship institute for BPSC & UPSC preparation at Boring Road, Patna.",
    url: "https://finalattemptias.com/about",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
