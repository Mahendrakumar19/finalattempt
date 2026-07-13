'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the popup in this session
    const dismissed = sessionStorage.getItem('promo-dismissed')
    if (dismissed) {
      setHasDismissed(true)
      return
    }

    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 5000)

    // Optional: Show on exit intent
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasDismissed) {
        setIsOpen(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasDismissed])

  const handleClose = () => {
    setIsOpen(false)
    setHasDismissed(true)
    sessionStorage.setItem('promo-dismissed', 'true')
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />
      <div className="fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl rounded-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:zoom-in-90 overflow-hidden ring-1 ring-primary/20">
        
        {/* Background glow */}
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 pt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white shadow-lg shadow-primary/30">
            <Zap className="h-8 w-8" fill="currentColor" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
              Before You Go: <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Unlock Bulk WhatsApp</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Pay just <strong className="text-foreground">₹999</strong> to send 500 targeted messages.<br/>
              No monthly / annual commitments!
            </p>
          </div>

          <ul className="text-sm text-muted-foreground text-left space-y-2 w-full px-4">
             <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Instant delivery & high open rates</span>
             </li>
             <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Detailed campaign analytics</span>
             </li>
          </ul>

          <div className="w-full pt-2">
            <Link 
              href="https://wa.me/918092225777"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-95"
            >
              Get Started Now <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">Limited time offer for new accounts.</p>
          </div>
        </div>
      </div>
    </>
  )
}
