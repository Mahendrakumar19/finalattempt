import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Final Attempt IAS | One Mentor. One Strategy. One Final Attempt.",
  description: "Bihar's most trusted premium mentorship platform for BPSC & UPSC aspirants. Personalized preparation, real results, current affairs, and mock test tracking.",
  keywords: ["BPSC Preparation", "UPSC Preparation", "Bihar PCS", "Patna IAS Coaching", "BPSC Answer Writing", "Final Attempt IAS"],
  authors: [{ name: "Final Attempt IAS" }],
  openGraph: {
    title: "Final Attempt IAS | One Mentor. One Strategy. One Final Attempt.",
    description: "Bihar's premium technology-driven learning platform for UPSC & BPSC aspirants.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-brand-neutral text-brand-primary">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
