import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us & Contact Info | Final Attempt",
  description: "Learn about Final Attempt, our mission, vision, Patna Boring Road crossing center, and contact options for BPSC batches.",
  keywords: ["About Final Attempt", "Boring Road Coaching BPSC", "Patna BPSC coaching contact", "Siddharth Kumar Sinha"],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
