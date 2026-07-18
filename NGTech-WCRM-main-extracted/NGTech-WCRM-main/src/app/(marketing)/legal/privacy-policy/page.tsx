import { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for NGTech WCRM - Learn how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  const lastUpdated = "July 4, 2026"

  return (
    <div className="min-h-screen bg-background pt-24 lg:pt-32 pb-24">
      {/* ─── Header Section ─── */}
      <section className="relative overflow-hidden mb-16">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Shield className="h-3.5 w-3.5 mr-2" />
            <span>Data Protection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Effective Date: <span className="text-foreground font-medium">{lastUpdated}</span>
          </p>
        </div>
      </section>

      {/* ─── Content Section ─── */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-sm p-8 sm:p-12 shadow-2xl shadow-primary/5 prose prose-slate dark:prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground/90">
            At NG Technology Pvt. Ltd. ("we," "us," or "our"), we respect your privacy and are committed to protecting the personal information you share with us through our WhatsApp CRM platform (the "Service").
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information that you provide directly to us when you register for an account, use our services, or communicate with our support team. This may include:
          </p>
          <ul className="text-muted-foreground list-disc pl-6 space-y-2 mt-4">
            <li><strong>Account Information:</strong> Name, email address, phone number, company name, and billing details.</li>
            <li><strong>Service Data:</strong> WhatsApp business account credentials, message templates, contact lists, and chat history processed through our API.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our platform, IP addresses, browser types, and device information.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use the collected information for the following purposes:
          </p>
          <ul className="text-muted-foreground list-disc pl-6 space-y-2 mt-4">
            <li>To provide, maintain, and improve our WhatsApp CRM services.</li>
            <li>To process payments and prevent fraudulent transactions.</li>
            <li>To communicate with you regarding updates, security alerts, and support messages.</li>
            <li>To comply with Meta's WhatsApp Business Solution Provider (BSP) guidelines and legal obligations.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">3. Data Sharing and Third Parties</h2>
          <p className="text-muted-foreground">
            We do not sell your personal data. We may share your information with trusted third parties only in the following circumstances:
          </p>
          <ul className="text-muted-foreground list-disc pl-6 space-y-2 mt-4">
            <li><strong>Meta Platforms, Inc:</strong> As a requirement to operate the WhatsApp Business API.</li>
            <li><strong>Service Providers:</strong> Cloud hosting (e.g., AWS, Supabase), payment processors (e.g., Razorpay), and email delivery services that help us operate our business.</li>
            <li><strong>Legal Requirements:</strong> If required by law or in response to valid requests by public authorities.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">4. Data Security</h2>
          <p className="text-muted-foreground">
            We implement robust, industry-standard security measures, including encryption in transit (HTTPS/TLS) and at rest, to protect your data from unauthorized access. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground">
            Depending on your jurisdiction, you may have the right to access, correct, delete, or restrict the processing of your personal data. You can manage most of this information directly from your account dashboard or by contacting our support team.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground">6. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
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
