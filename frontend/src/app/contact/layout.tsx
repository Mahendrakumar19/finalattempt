import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Final Attempt — Coaching Patna Helpline",
  description: "Contact Final Attempt  at Boring Road Crossing, Patna. Call +91 97099 92093 for BPSC batch admissions, counseling, and study material inquiries.",
  keywords: ["Contact Final Attempt", "BPSC Coaching Patna contact", "Boring Road Crossing coaching", "BPSC admission helpline"],
  alternates: { canonical: "https://finalattemptias.com/contact" },
  openGraph: {
    title: "Contact Final Attempt | Patna BPSC Coaching",
    description: "Reach us at Boring Road Crossing, Patna for BPSC admissions, batch counseling and study material queries.",
    url: "https://finalattemptias.com/contact",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
