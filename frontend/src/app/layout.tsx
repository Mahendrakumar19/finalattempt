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

  applicationName: "Final Attempt",

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

  authors: [{ name: "Final Attempt" }],

  openGraph: {
    type: "website",
    siteName: "Final Attempt",
    title:
      "Final Attempt IAS | #1 BPSC & UPSC Coaching in Patna — Mentorship, Current Affairs & Mock Tests",
    description:
      "Final Attempt IAS is Bihar's #1 BPSC & UPSC coaching institute in Patna. Expert mentorship, daily current affairs in Hindi & English, free mock tests, PYQs, study material and proven results.",
    url: "https://finalattemptias.com",
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
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
