import { Metadata } from 'next'
import { DemoBookingForm } from '@/components/forms/demo-booking-form'
import { CheckCircle2, ShieldCheck, Zap, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Book a Demo | NGTech WCRM',
  description: 'Schedule a personalized demo of NGTech WCRM and see how we can automate your WhatsApp marketing and sales pipelines.',
}

export default function BookDemoPage() {
  return (
    <div className="min-h-screen bg-background py-16 lg:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          {/* Left Column - Copy & Value Prop */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-6">
              See NGTech WCRM in Action
            </h1>
            <p className="text-lg text-muted-foreground mb-10">
              Discover how India's leading WhatsApp CRM can help you automate support, launch broadcast campaigns, and close more deals directly on WhatsApp.
            </p>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 mr-4">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="font-medium text-foreground">Multi-Agent Shared Inbox</span>
              </div>
              
              <div className="flex items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 mr-4">
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="font-medium text-foreground">No-Code Automations & Chatbots</span>
              </div>
              
              <div className="flex items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 mr-4">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="font-medium text-foreground">Enterprise Security & RBAC</span>
              </div>
            </div>

            <div className="mt-16 border-t border-border pt-10">
              <p className="text-sm font-medium text-muted-foreground mb-4">TRUSTED BY INNOVATIVE TEAMS</p>
              <div className="flex flex-wrap gap-8 opacity-50 grayscale">
                <div className="text-xl font-bold font-serif">ACME Corp</div>
                <div className="text-xl font-bold font-sans">GlobalTech</div>
                <div className="text-xl font-bold font-mono">Stark Ind.</div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Form */}
          <div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Book Your Demo</h2>
                <p className="text-sm text-muted-foreground">
                  Fill out the form below and we'll be in touch shortly.
                </p>
              </div>
              
              <DemoBookingForm />
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
