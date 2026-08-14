import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Cinzel } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { LocaleProvider } from "@/context/LocaleContext";
import LanguageSelectionModal from "@/components/LanguageSelectionModal";

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

const cinzel = Cinzel({
  variable: "--font-inlander",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://finalattemptias.com"),

  title: {
    default:
      "Final Attempt | Next-Generation Mentorship & Learning Platform for UPSC & State PCS",
    template: "%s | Final Attempt",
  },

  description:
    "Bihar's most trusted premium mentorship platform for BPSC aspirants. Personalized preparation, real results, current affairs, and mock test tracking.",

  applicationName: "Final Attempt",

  keywords: [
    "BPSC Preparation",
    "Bihar PCS",
    "APPSC",
    "Patna BPSC Coaching",
    "BPSC Answer Writing",
    "Final Attempt",
  ],

  authors: [{ name: "Final Attempt" }],

  openGraph: {
    type: "website",
    siteName: "Final Attempt",
    title:
      "Final Attempt | Next-Generation Mentorship & Learning Platform for UPSC & State PCS",
    description:
      "Bihar's most trusted premium mentorship platform for BPSC aspirants. Personalized preparation, real results, current affairs, and mock test tracking.",
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
      className={`${plusJakartaSans.variable} ${inter.variable} ${cinzel.variable} h-full antialiased`}
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
