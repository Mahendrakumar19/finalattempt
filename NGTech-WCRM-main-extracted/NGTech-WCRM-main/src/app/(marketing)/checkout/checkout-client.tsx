"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Building2, User, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function CheckoutClient() {
  const searchParams = useSearchParams()
  const planSlug = searchParams.get('plan') as Plan
  const billing = searchParams.get('billing') // 'monthly' | 'annual'

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [planData, setPlanData] = useState<any>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      if (!planSlug) {
        setLoadingPlan(false)
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('saas_pricing_plans')
        .select('*')
        .eq('slug', planSlug)
        .single()
        
      if (data) {
        setPlanData(data)
      }
      setLoadingPlan(false)
    }
    fetchPlan()
  }, [planSlug])
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: ''
  })

  if (loadingPlan) {
    return <div className="p-12 text-center text-muted-foreground">Loading plan details...</div>
  }
  
  // If invalid or no plan selected
  if (!planData) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <h2 className="text-2xl font-bold mb-4">No Plan Selected</h2>
        <p className="text-muted-foreground mb-8">Please go back and select a plan to continue with your purchase.</p>
        <Link href="/pricing" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          View Pricing
        </Link>
      </div>
    )
  }

  const isAnnual = billing === 'annual'
  
  const originalPrice = isAnnual ? planData.annual_price : planData.monthly_price
  const discountMultiplier = planData.discount_percent > 0 ? (1 - (planData.discount_percent / 100)) : 1
  const price = Math.round(originalPrice * discountMultiplier)

  const subtotal = price
  const tax = 0
  const total = subtotal + tax

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/checkout/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          plan: planSlug,
          billingCycle: billing || 'monthly',
          price: total
        })
      })
      
      if (!res.ok) throw new Error('Failed to submit order')
      
      setIsSuccess(true)
    } catch (error) {
      alert("Something went wrong while placing your order. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-primary/20 bg-card shadow-2xl overflow-hidden mb-8">
          <div className="bg-emerald-500/10 p-8 text-center border-b border-border">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-foreground mb-2">Order Pending</h2>
            <p className="text-muted-foreground text-lg">Thank you, {formData.fullName.split(' ')[0]}! Your order has been placed successfully.</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <p className="text-amber-700 font-medium text-sm">
                <strong>Next Step:</strong> To activate your {planData.name} plan, please complete the manual bank transfer using the details below. Our team will verify and activate your account within 24 hours.
              </p>
            </div>

            <div className="bg-muted rounded-xl p-6 border border-border space-y-4">
              <h3 className="font-bold text-lg mb-2 border-b border-border pb-2">Bank Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account Name</p>
                  <p className="font-semibold text-foreground">Nighwan Technology Private Limited</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bank Name</p>
                  <p className="font-semibold text-foreground">ICICI Chandanagar</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account Number</p>
                  <p className="font-semibold text-foreground tracking-wider">058805005248</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IFSC Code</p>
                  <p className="font-semibold text-foreground">ICIC0000588</p>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-border/50">
                  <p className="text-muted-foreground">GST Number</p>
                  <p className="font-semibold text-foreground tracking-widest">10AAHCN1854H1ZR</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link href="/login">
                <Button className="w-full text-lg h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold group">
                  Proceed to Login / Setup Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: Order Summary & Info */}
      <div className="lg:col-span-5 space-y-6 lg:order-2">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden sticky top-8">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">NGTech WCRM {planData.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{billing || 'monthly'} Subscription</p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• {planData.max_contacts === -1 ? 'Unlimited' : planData.max_contacts.toLocaleString()} Contacts</li>
                  <li>• {planData.max_messages_pm === -1 ? 'Unlimited' : planData.max_messages_pm.toLocaleString()} Messages / mo</li>
                </ul>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">₹{price.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax</span>
                <span>₹{tax.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-foreground">Total Due Today</span>
              <span className="text-2xl font-extrabold text-primary">₹{total.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 border-t border-border flex items-start gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>You have selected a <strong>{isAnnual ? 'yearly' : 'monthly'}</strong> plan. Secure bank transfer details will be provided upon confirmation.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Checkout Form (Order 1 on mobile) */}
      <div className="lg:col-span-7 space-y-6 lg:order-1">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Details</h2>
          
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" required placeholder="John Doe" className="pl-9 bg-muted" value={formData.fullName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" required placeholder="john@company.com" className="pl-9 bg-muted" value={formData.email} onChange={handleChange} />
                </div>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" required placeholder="+91 98765 43210" className="pl-9 bg-muted" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="companyName" required placeholder="Acme Corp" className="pl-9 bg-muted" value={formData.companyName} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full text-lg h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              {isSubmitting ? "Processing..." : "Confirm & Place Order"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              By clicking "Confirm & Place Order", you agree to our Terms of Service. You will receive bank details in the next step to complete your payment.
            </p>
          </div>
        </form>
      </div>
      
    </div>
  )
}
