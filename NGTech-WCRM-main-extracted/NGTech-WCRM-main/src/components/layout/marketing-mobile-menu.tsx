'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

export function MarketingMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 -mr-2 text-foreground hover:text-primary transition-colors focus:outline-none"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-[80px] sm:top-[96px] left-0 w-full bg-background border-b border-border/50 shadow-2xl flex flex-col p-6 gap-6 z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4">
            <Link href="/features" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors">Features</Link>
            <Link href="/solutions" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors">Solutions</Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link href="/blog" onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground hover:text-primary transition-colors">Blog</Link>
          </nav>
          
          <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
            <Link href="/free-trial" onClick={() => setIsOpen(false)} className="sm:hidden flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-bold text-primary-foreground shadow-md transition-all">
              Start Free Trial
            </Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-center rounded-lg border-2 border-border bg-card px-4 py-3 text-base font-bold text-foreground shadow-sm transition-all hover:bg-muted">
              Log in
            </Link>
            <a href="https://wa.me/918092225777" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white bg-[#25D366] hover:bg-[#128C7E] px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
