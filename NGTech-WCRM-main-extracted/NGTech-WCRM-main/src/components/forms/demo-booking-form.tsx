"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"

export function DemoBookingForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // UTMs
  const [utms, setUtms] = useState<Record<string, string>>({})

  useEffect(() => {
    // Capture UTM parameters from the URL when the component mounts
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const capturedUtms: Record<string, string> = {}
      
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      utmKeys.forEach(key => {
        if (searchParams.has(key)) {
          capturedUtms[key] = searchParams.get(key)!
        }
      })
      
      setUtms(capturedUtms)
    }
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      industry: formData.get("industry"),
      volume: formData.get("volume"),
      leadSource: "Demo Booking Page",
      landingPageUrl: typeof window !== 'undefined' ? window.location.href : '',
      ...utms
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsSuccess(true)
        // Optionally redirect to a thank you page or scheduler
        // router.push("/book-demo/success")
      } else {
        alert("Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error(error)
      alert("Failed to submit form.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-xl border border-border bg-card">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-foreground">Request Received!</h3>
        <p className="text-muted-foreground max-w-sm">
          Thank you for your interest in NGTech WCRM. One of our WhatsApp automation experts will contact you shortly to schedule your personalized demo.
        </p>
        <button className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors" onClick={() => router.push('/')}>
          Return to Homepage
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name *</label>
          <input id="name" name="name" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="John Doe" />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Work Email *</label>
          <input id="email" name="email" type="email" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="john@company.com" />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">WhatsApp Number *</label>
          <input id="phone" name="phone" type="tel" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="+91 98765 43210" />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium text-foreground">Company Name *</label>
          <input id="company" name="company" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Acme Corp" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label htmlFor="industry" className="text-sm font-medium text-foreground">Industry</label>
          <select id="industry" name="industry" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
            <option value="ecommerce">E-commerce & Retail</option>
            <option value="real-estate">Real Estate</option>
            <option value="education">Education & EdTech</option>
            <option value="healthcare">Healthcare</option>
            <option value="b2b">B2B & Agencies</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="volume" className="text-sm font-medium text-foreground">Monthly WhatsApp Messages</label>
          <select id="volume" name="volume" className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
            <option value="<1000">Less than 1,000</option>
            <option value="1000-10000">1,000 - 10,000</option>
            <option value="10000-50000">10,000 - 50,000</option>
            <option value="50000+">50,000+</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-6 w-full flex h-12 items-center justify-center rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...
          </>
        ) : (
          <>Book My Free Demo <ArrowRight className="ml-2 h-4 w-4" /></>
        )}
      </button>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        By submitting this form, you agree to our Privacy Policy. No credit card required.
      </p>
    </form>
  )
}
