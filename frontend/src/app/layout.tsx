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
      "Final Attempt | Best Platform for UPSC & State PCS",
    template: "%s | Final Attempt",
  },

  description:
    "Final Attempt is the best platform for UPSC & State PCS prep. Get expert mentorship, daily Hindi/English current affairs, free test series & PYQ study notes.",

  applicationName: "Final Attempt",

  keywords: [
    "UPSC Preparation",
    "State PCS Preparation",
    "BPSC Preparation",
    "Best Platform for UPSC",
    "Best Platform for State PCS",
    "UPSC Mentorship",
    "State PCS Mentorship",
    "BPSC Coaching Patna",
    "Daily Current Affairs Hindi English",
    "UPSC State PCS Test Series",
    "Free PYQs Study Material",
    "Final Attempt",
  ],

  authors: [{ name: "Final Attempt", url: "https://finalattemptias.com" }],

  alternates: {
    canonical: "https://finalattemptias.com",
  },

  openGraph: {
    type: "website",
    siteName: "Final Attempt",
    title:
      "Final Attempt | Best Platform for UPSC & State PCS",
    description:
      "Final Attempt is the best platform for UPSC & State PCS prep. Get expert mentorship, daily Hindi/English current affairs, free test series & PYQ study notes.",
    url: "https://finalattemptias.com",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Final Attempt — Best Platform for UPSC & State PCS",
      },
    ],
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    site: "@FinalAttempt",
    title: "Final Attempt | Best Platform for UPSC & State PCS",
    description:
      "Final Attempt is the best platform for UPSC & State PCS prep. Get expert mentorship, daily Hindi/English current affairs, free test series & PYQ study notes.",
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
