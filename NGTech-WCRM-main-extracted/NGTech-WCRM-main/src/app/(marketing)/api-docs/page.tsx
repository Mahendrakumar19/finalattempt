import { Metadata } from 'next'
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Smartphone, Globe, CreditCard, Key, Settings, UserPlus, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Official Meta WhatsApp API Guide | NGTech WCRM',
  description: 'Requirements and steps to get the Official Meta Certified WhatsApp API for your business.',
}

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col py-16 md:py-24 bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 mr-2" /> Official Documentation
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Get your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Meta Certified</span> WhatsApp API
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete guide on the prerequisites and steps required to secure your official WhatsApp Business API integration.
          </p>
        </div>

        {/* Warning / Why Official API */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 md:p-8 mb-16 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32 text-amber-500" />
          </div>
          <div className="relative z-10">
            <h3 className="flex items-center text-amber-700 dark:text-amber-500 text-xl font-bold mb-3">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Why use the Official Meta API?
            </h3>
            <p className="text-amber-800 dark:text-amber-200/90 text-base leading-relaxed max-w-2xl">
              Unlike unofficial bulk senders, the official Meta API guarantees that your number <strong>will not be banned</strong> for standard usage. It also unlocks the "Green Tick" verification badge capability and enables highly interactive message types like action buttons and lists.
            </p>
          </div>
        </div>

        {/* Section 1: Prerequisites */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm mr-3">1</span>
            Prerequisites & Requirements
          </h2>
          <p className="text-muted-foreground text-lg mb-8">Before applying, ensure you have the following ready:</p>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <h4 className="font-bold text-lg text-foreground mb-2">Verified Business Manager</h4>
              <p className="text-sm text-muted-foreground">Your business must be verified in the Facebook Business Manager using official registration documents.</p>
            </div>
            
            <div className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-emerald-500" />
              </div>
              <h4 className="font-bold text-lg text-foreground mb-2">A Fresh Phone Number</h4>
              <p className="text-sm text-muted-foreground">The number cannot be currently active on the standard WhatsApp Consumer or WhatsApp Business mobile app.</p>
            </div>
            
            <div className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-purple-500" />
              </div>
              <h4 className="font-bold text-lg text-foreground mb-2">Business Website</h4>
              <p className="text-sm text-muted-foreground">A functional website representing your business, matching the details in your business registration documents.</p>
            </div>
            
            <div className="border border-border rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <h4 className="font-bold text-lg text-foreground mb-2">Credit Card</h4>
              <p className="text-sm text-muted-foreground">A valid payment method attached to your Meta Business Manager to pay Meta's conversation charges.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Application Steps */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-10 flex items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm mr-3">2</span>
            The Application Steps
          </h2>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            
            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted-foreground/10 group-hover:bg-primary/20 group-hover:text-primary text-muted-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-muted-foreground" /> Delete Existing App
                </h3>
                <p className="text-muted-foreground text-sm">If the number is already on the WhatsApp app, go to Settings &gt; Account &gt; Delete Account. Uninstalling is not enough.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted-foreground/10 group-hover:bg-primary/20 group-hover:text-primary text-muted-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" /> Embedded Signup
                </h3>
                <p className="text-muted-foreground text-sm">Through the NGTech WCRM dashboard, navigate to Settings &gt; WhatsApp and click "Connect WhatsApp" to open the Meta popup.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted-foreground/10 group-hover:bg-primary/20 group-hover:text-primary text-muted-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-muted-foreground" /> Create WABA
                </h3>
                <p className="text-muted-foreground text-sm">During the popup flow, create a new WhatsApp Business Account (WABA) and assign a display name related to your business.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted-foreground/10 group-hover:bg-primary/20 group-hover:text-primary text-muted-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                4
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                <h3 className="font-bold text-lg mb-2 text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" /> Meta Verification
                </h3>
                <p className="text-muted-foreground text-sm">Your number will be "Unverified" (250 msgs/day limit). Complete Meta Business Verification to remove this limit.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm mr-3">3</span>
            Conversation Pricing Model
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Meta charges per 24-hour conversation window, not per individual message. NGTech WCRM does <strong>not</strong> markup these prices.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0 mt-1">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Marketing</h4>
                <p className="text-sm text-muted-foreground mt-1">Promotional offers, announcements, and newsletters to drive sales.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0 mt-1">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Utility</h4>
                <p className="text-sm text-muted-foreground mt-1">Specific order updates, account alerts, and post-purchase notifications.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0 mt-1">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Authentication</h4>
                <p className="text-sm text-muted-foreground mt-1">One-Time Passwords (OTPs) and account recovery codes.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0 mt-1">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Service</h4>
                <p className="text-sm text-muted-foreground mt-1">User-initiated conversations, usually for customer support inquiries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted rounded-3xl p-8 md:p-12 text-center border border-border/50 shadow-sm">
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Need help getting verified?</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Our onboarding team has helped hundreds of businesses navigate the Meta verification process. We're here to guide you step-by-step.
            </p>
            <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-blue-500 px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:opacity-90">
              Contact Support <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
