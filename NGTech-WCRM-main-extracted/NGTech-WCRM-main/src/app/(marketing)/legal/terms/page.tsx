import { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for NGTech WCRM - Read the rules and guidelines for using our platform.',
}

export default function TermsOfServicePage() {
  const lastUpdated = "July 4, 2026"

  return (
    <div className="min-h-screen bg-background pt-24 lg:pt-32 pb-24">
      {/* ─── Header Section ─── */}
      <section className="relative overflow-hidden mb-16">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-blue-500 mb-6">
            <FileText className="h-3.5 w-3.5 mr-2" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Effective Date: <span className="text-foreground font-medium">{lastUpdated}</span>
          </p>
        </div>
      </section>

      {/* ─── Content Section ─── */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm p-8 sm:p-12 shadow-2xl shadow-blue-500/5 prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground/90">
            Welcome to NGTech WCRM. These Terms of Service ("Terms") govern your access to and use of our WhatsApp CRM platform, websites, and associated services (collectively, the "Service") provided by NG Technology Pvt. Ltd.
          </p>
          <p className="text-muted-foreground">
            By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Account Registration</h2>
          <p className="text-muted-foreground">
            To use our Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. WhatsApp Business API Usage</h2>
          <p className="text-muted-foreground">
            Our Service integrates with the Meta WhatsApp Business API. By using our platform, you also agree to comply with:
          </p>
          <ul className="text-muted-foreground list-disc pl-6 space-y-2 mt-4">
            <li>The WhatsApp Business Terms of Service.</li>
            <li>The WhatsApp Commerce Policy.</li>
            <li>All applicable local laws and regulations regarding electronic communications and spam.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Violation of Meta's policies may result in the immediate suspension or termination of your WhatsApp Business Account and your access to our Service.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Subscription and Billing</h2>
          <p className="text-muted-foreground">
            Some parts of the Service are billed on a subscription basis ("Subscriptions"). You will be billed in advance on a recurring and periodic basis (such as monthly or annually), depending on the type of subscription plan you select.
          </p>
          <p className="text-muted-foreground mt-2">
            Your Subscription will automatically renew under the exact same conditions unless you cancel it or NG Technology Pvt. Ltd. cancels it.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Acceptable Use Policy</h2>
          <p className="text-muted-foreground">
            You agree not to use the Service to:
          </p>
          <ul className="text-muted-foreground list-disc pl-6 space-y-2 mt-4">
            <li>Send unsolicited commercial messages (spam).</li>
            <li>Transmit any material that is abusive, harassing, tortious, defamatory, vulgar, or invasive of another's privacy.</li>
            <li>Impersonate any person or entity or falsely state your affiliation with a person or entity.</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            In no event shall NG Technology Pvt. Ltd., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">6. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">7. Contact Information</h2>
          <div className="mt-6 p-6 rounded-2xl bg-muted/50 border border-border/50">
            <p className="font-semibold text-foreground mb-1">NG Technology Pvt. Ltd.</p>
            <p className="text-muted-foreground mb-1">Email: <a href="mailto:enquiry@nighwantech.com" className="text-primary hover:underline">enquiry@nighwantech.com</a></p>
            <p className="text-muted-foreground">Phone: <a href="https://wa.me/918092225777" className="text-primary hover:underline">+91 8092225777</a></p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </section>
    </div>
  )
}
