'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function FreeTrialPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      // Send to our Lead Ingestion API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          mobileNumber: formData.get('phone'),
          companyName: formData.get('company'),
          teamSize: formData.get('teamSize'),
          messageVolume: formData.get('messageVolume'),
          leadSource: 'Free Trial Form',
          landingPageUrl: window.location.href,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit. Please try again.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Welcome to NGTech WCRM!</h2>
          <p className="text-muted-foreground">
            We've received your request. Check your email for login credentials and onboarding instructions.
          </p>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-16 lg:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Left: Value Prop */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-6">Start your 14-day free trial</h1>
            <p className="text-lg text-muted-foreground mb-10">
              Join the smartest WhatsApp CRM built for growth. No credit card required. Cancel anytime.
            </p>
            
            <div className="space-y-6">
              {[
                "Unlimited team members during trial",
                "Full access to automated workflows",
                "Advanced CRM and pipeline management",
                "Free onboarding session with an expert"
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 mr-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-16 border-t border-border pt-10">
              <p className="text-sm text-muted-foreground mb-4">"NGTech WCRM completely transformed how we handle customer support. Our response time dropped by 80%."</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div>
                  <p className="text-sm font-bold text-foreground">Rahul Sharma</p>
                  <p className="text-xs text-muted-foreground">CEO, EduSmart India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-foreground mb-6">Create your account</h2>
              
              {error && (
                <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</label>
                    <input id="fullName" name="fullName" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">Mobile Number</label>
                    <input id="phone" name="phone" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="+91 9876543210" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Work Email</label>
                  <input id="email" name="email" type="email" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="john@company.com" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium text-foreground">Company Name</label>
                  <input id="company" name="company" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Acme Inc." />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="teamSize" className="text-sm font-medium text-foreground">Team Size</label>
                    <select id="teamSize" name="teamSize" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
                      <option value="1-5">1 - 5</option>
                      <option value="6-20">6 - 20</option>
                      <option value="21-50">21 - 50</option>
                      <option value="50+">50+</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="messageVolume" className="text-sm font-medium text-foreground">Messages / Month</label>
                    <select id="messageVolume" name="messageVolume" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
                      <option value="<10k">Less than 10k</option>
                      <option value="10k-50k">10k - 50k</option>
                      <option value="50k-100k">50k - 100k</option>
                      <option value=">100k">100k+</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-6 w-full flex h-12 items-center justify-center rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : (
                    <>Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
