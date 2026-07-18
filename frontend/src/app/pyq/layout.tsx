import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BPSC PYQ Archive & Model Answers | Final Attempt IAS",
  description: "Download and view BPSC Prelims and Mains Year-wise Past Years Question papers with comprehensive expert explanations.",
  keywords: ["BPSC PYQs", "BPSC past years papers", "Bihar civil services question papers", "Model answers BPSC"],
};

export default function PyqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
