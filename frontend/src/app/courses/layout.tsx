import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC Batches & Programs | Final Attempt IAS — Patna",
  description: "Browse BPSC Foundation, Target, Answer Writing, and Interview Guidance programs with expert mentorship at Final Attempt IAS, Patna Boring Road.",
  keywords: ["BPSC batches", "BPSC foundation batch", "Patna BPSC classes", "BPSC civil services course", "BPSC coaching fees"],
  alternates: { canonical: "https://finalattemptias.com/courses" },
  openGraph: {
    title: "BPSC Coaching Batches | Final Attempt IAS Patna",
    description: "Join Bihar's top BPSC coaching batches at Final Attempt IAS, Boring Road, Patna. Foundation, Prelims, Mains & Interview programs.",
    url: "https://finalattemptias.com/courses",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
