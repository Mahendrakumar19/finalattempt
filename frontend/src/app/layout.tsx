import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { LocaleProvider } from "@/context/LocaleContext";
import LanguageSelectionModal from "@/components/LanguageSelectionModal";

export const metadata: Metadata = {
  metadataBase: new URL("https://finalattemptias.com"),

  title: {
    default:
      "Final Attempt IAS | #1 BPSC & UPSC Coaching in Patna — Mentorship, Current Affairs & Mock Tests",
    template: "%s | Final Attempt IAS",
  },

  description:
    "Final Attempt IAS is Bihar's #1 BPSC & UPSC coaching institute in Patna. Expert mentorship, daily current affairs in Hindi & English, free mock tests, PYQs, study material and proven results.",

  applicationName: "Final Attempt IAS",

  keywords: [
    "BPSC Preparation",
    "BPSC Coaching Patna",
    "Bihar PCS",
    "UPSC Coaching Bihar",
    "APPSC",
    "Patna BPSC Coaching",
    "BPSC Answer Writing",
    "BPSC Current Affairs",
    "BPSC Mock Test",
    "Bihar BPSC Free Material",
    "Final Attempt IAS",
    "Final Attempt",
    "BPSC 70th Notification",
    "BPSC Prelims Test Series",
  ],

  authors: [{ name: "Final Attempt IAS", url: "https://finalattemptias.com" }],

  alternates: {
    canonical: "https://finalattemptias.com",
  },

  openGraph: {
    type: "website",
    siteName: "Final Attempt IAS",
    title:
      "Final Attempt IAS | #1 BPSC & UPSC Coaching in Patna — Mentorship, Current Affairs & Mock Tests",
    description:
      "Final Attempt IAS is Bihar's #1 BPSC & UPSC coaching institute in Patna. Expert mentorship, daily current affairs in Hindi & English, free mock tests, PYQs, study material and proven results.",
    url: "https://finalattemptias.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Final Attempt IAS — BPSC & UPSC Coaching in Patna",
      },
    ],
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    site: "@FinalAttemptIAS",
    title: "Final Attempt IAS | #1 BPSC & UPSC Coaching in Patna",
    description:
      "Bihar's #1 BPSC & UPSC coaching in Patna. Daily current affairs, free mock tests, mentorship & study material.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-body bg-brand-neutral text-brand-primary">
        <LocaleProvider>
          <ThemeProvider>
            <LanguageSelectionModal />
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
