"use client"

import Link from 'next/link'
import { Check, ChevronDown, MessageCircle, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TestimonialCarousel, type Testimonial } from '@/components/marketing/testimonial-carousel'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: dbPlans } = await supabase
        .from('saas_pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (dbPlans) {
        setPlans(dbPlans)
      }

      const { data: tData } = await supabase
        .from('saas_trusted_clients')
        .select('id, name, url, testimonial_text, author_name, author_role')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (tData) {
        const withTestimonials = tData
          .filter(c => c.testimonial_text)
          .map(c => ({
            ...c,
            testimonial_text: c.testimonial_text!
          }))
        setTestimonials(withTestimonials)
      }
    }
    fetchData()
  }, [])

  const faqs = [
    { q: "Are there any hidden charges?", a: "No. Unlike other platforms, we do not add any markup to your Meta WhatsApp API messaging costs. You pay exactly what Meta charges." },
    { q: "Can I upgrade or downgrade my plan?", a: "Yes, you can upgrade, downgrade, or cancel your plan at any time right from your billing dashboard." },
    { q: "Do you offer refunds?", a: "We offer a 14-day free trial so you can test the platform completely risk-free. After upgrading, you can cancel at any time but we do not offer refunds for partial months." },
    { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, UPI, net banking, and wallets through our secure Razorpay payment gateway." },
    { q: "Can I use my own WhatsApp number?", a: "Yes! You can connect your existing business phone number or get a new one through Meta's WhatsApp Business Platform." },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <section className="relative pt-24 pb-4 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/15 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              <span>Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-5 leading-tight">
              Plans that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-violet-500">
                scale with you
              </span>
            </h1>
            <p className="text-base text-muted-foreground/70">
              No hidden fees. No markup on WhatsApp API costs. Choose the plan that grows with your business.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex justify-center">
              <div className="relative inline-flex items-center rounded-full border border-border/40 bg-card/50 backdrop-blur-sm p-1">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    !isAnnual
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isAnnual
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Annually
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wide ${
                    isAnnual ? 'bg-white/20 text-primary-foreground' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>Save 20%</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Plans Grid ─── */}
      <section className="pb-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {plans.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/20 bg-card/40 p-8 animate-pulse h-96" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {plans.map((plan) => {
                const isPopular = plan.slug === 'pro'
                const originalPrice = isAnnual ? plan.annual_price : plan.monthly_price

                let isCustom = false
                let isFree = false

                if (originalPrice === 0 && plan.max_contacts === -1) {
                  isCustom = true
                } else if (originalPrice === 0) {
                  isFree = true
                }

                const discountMultiplier = plan.discount_percent > 0 ? (1 - (plan.discount_percent / 100)) : 1
                const discountedPrice = Math.round(originalPrice * discountMultiplier)

                let buttonText = 'Buy Now'
                let buttonLink = `/checkout?plan=${plan.slug}&billing=${isAnnual ? 'annual' : 'monthly'}`

                if (isCustom) {
                  buttonText = 'Contact via WhatsApp'
                  buttonLink = 'https://wa.me/918092225777?text=Hi%2C%20I%20am%20interested%20in%20the%20Enterprise%20plan%20for%20NGTech%20WCRM'
                } else if (isFree) {
                  buttonText = 'Start Free Trial'
                  buttonLink = '/free-trial'
                }

                const featuresList = [
                  `${plan.max_contacts === -1 ? 'Unlimited' : plan.max_contacts.toLocaleString()} Contacts`,
                  `${plan.max_messages_pm === -1 ? 'Unlimited' : plan.max_messages_pm.toLocaleString()} Messages / mo`,
                  ...(Array.isArray(plan.features) ? plan.features : [])
                ]

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl p-[1px] transition-all duration-300 hover:-translate-y-2 ${
                      isPopular
                        ? 'bg-gradient-to-b from-primary/60 via-primary/20 to-transparent shadow-2xl shadow-primary/15 hover:shadow-primary/25'
                        : 'bg-gradient-to-b from-border/30 to-transparent hover:from-primary/20 hover:shadow-xl hover:shadow-primary/5'
                    }`}
                  >
                    <div className="flex flex-col flex-1 rounded-[15px] bg-card/90 backdrop-blur-sm p-7">
                      {/* Popular badge */}
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30">
                          Most Popular
                        </div>
                      )}
                      {/* Discount badge */}
                      {plan.discount_percent > 0 && !isCustom && !isFree && (
                        <div className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg rotate-12">
                          {plan.discount_percent}% OFF
                        </div>
                      )}

                      {/* Plan name */}
                      <div className="mb-5">
                        <h3 className="text-lg font-bold text-foreground mb-1.5">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground/60 min-h-[32px] leading-relaxed">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-6 min-h-[48px]">
                        {isCustom ? (
                          <div className="text-3xl font-extrabold text-foreground">Custom</div>
                        ) : (
                          <div className="flex flex-col">
                            {plan.discount_percent > 0 && originalPrice > 0 && (
                              <div className="text-muted-foreground/50 text-xs line-through decoration-red-400/40 decoration-2 mb-0.5">
                                ₹{originalPrice.toLocaleString()}
                              </div>
                            )}
                            <div className="flex items-baseline text-foreground">
                              <span className="text-3xl font-extrabold">
                                {isFree ? 'Free' : `₹${discountedPrice.toLocaleString()}`}
                              </span>
                              {!isFree && <span className="text-muted-foreground/50 ml-1.5 text-xs font-medium">/{isAnnual ? 'year' : 'month'}</span>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={buttonLink}
                        target={isCustom ? "_blank" : "_self"}
                        className={`mb-7 w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                          isPopular
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]'
                            : isCustom
                              ? 'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/25 hover:scale-[1.02]'
                              : 'bg-muted/60 text-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02]'
                        }`}
                      >
                        {isCustom && <MessageCircle className="h-4 w-4 shrink-0" />}
                        {buttonText}
                      </Link>

                      {/* Features */}
                      <div className="space-y-3 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-3">What&apos;s included</p>
                        {featuresList.map((feature, i) => (
                          <div key={i} className="flex items-start group">
                            <div className="flex h-4.5 w-4.5 items-center justify-center mr-2.5 mt-0.5 shrink-0">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xs text-muted-foreground/70 leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── FAQ & Support ─── */}
      <section className="py-24 bg-card/30 border-t border-border/20 relative">
        {/* Ambient glow wrapper */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
        </div>
        
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left side: FAQs (Spans 7 cols) */}
            <div className="lg:col-span-7">
              <div className="mb-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">FAQ</p>
                <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
              </div>
    
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-primary/20"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <h4 className="text-sm font-semibold text-foreground pr-4">{faq.q}</h4>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                          openFaq === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="px-5 pb-5 text-sm text-muted-foreground/70 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Support Card (Spans 5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <div className="rounded-3xl p-[1px] bg-gradient-to-br from-primary/30 via-border/20 to-transparent shadow-2xl shadow-primary/5">
                <div className="rounded-3xl bg-card/80 backdrop-blur-xl p-8 lg:p-10 relative overflow-hidden h-full">
                  {/* Decorative corner glow */}
                  <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h3>
                    <p className="text-sm text-muted-foreground/80 mb-8 leading-relaxed">
                      Can't find the answer you're looking for? Our friendly team is here to help you choose the right plan.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <a 
                        href="https://wa.me/918092225777" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-5 py-3.5 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 font-semibold border border-[#25D366]/20 shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat on WhatsApp
                      </a>
                      <a 
                        href="mailto:info@nighwantech.com" 
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-muted/50 border border-border/40 px-5 py-3.5 text-foreground hover:bg-muted transition-all duration-300 font-semibold shadow-sm hover:border-primary/20"
                      >
                        Email Support
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-background border-t border-border/20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">Social Proof</p>
              <h2 className="text-3xl font-bold text-foreground">
                Trusted by high-growth companies
              </h2>
            </div>
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}
    </div>
  )
}
