import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { MarketingMobileMenu } from '@/components/layout/marketing-mobile-menu'
import { AiChatbot } from '@/components/marketing/ai-chatbot'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-primary/30 text-foreground overflow-x-clip">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 sm:gap-10">
            <Link href="/" className="flex items-center shrink-0 group">
              <img src="/logo.svg" alt="NGTech Logo" className="w-28 xs:w-36 sm:w-52 h-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: '/features', label: 'Features' },
                { href: '/solutions', label: 'Solutions' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/api-docs', label: 'Developers API' },
                { href: '/blog', label: 'Blog' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative group px-3.5 py-2 text-[13px] font-semibold tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <span>{item.label}</span>
                  <span className="absolute inset-x-3.5 -bottom-px h-[2px] bg-gradient-to-r from-primary to-primary/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="https://wa.me/918092225777"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white px-4 py-2 rounded-full border border-[#25D366]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/20 hover:scale-[1.03]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp
            </a>
            <Link href="/login" className="hidden md:inline-flex h-8 items-center justify-center rounded-full border border-border/60 bg-transparent px-5 text-xs font-semibold text-foreground/80 transition-all duration-200 hover:bg-card hover:border-primary/30 hover:text-foreground">
              Log in
            </Link>
            <Link href="/free-trial" className="inline-flex h-8 sm:h-9 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 sm:px-5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 border-0 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.03] whitespace-nowrap">
              Start Free Trial
            </Link>
            <MarketingMobileMenu />
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Decorative Background Vectors */}
        <div className="absolute inset-0 pointer-events-none flex justify-between items-center opacity-[0.03] dark:opacity-[0.02]">
          {/* Giant Chat Bubble Left */}
          <svg className="w-[400px] h-[400px] -ml-32 mt-32 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>

          {/* Giant WhatsApp Icon Right */}
          <svg className="w-[500px] h-[500px] -mr-40 -mt-20 text-[#25D366]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>

        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-6">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-2 pr-8">
              <Link href="/" className="flex items-center mb-5 group">
                <img src="/logo.svg" alt="NGTech Logo" className="w-48 sm:w-56 h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground/80">
                India&apos;s leading WhatsApp CRM platform for ambitious sales and support teams. Convert more leads and manage customer relationships on WhatsApp.
              </p>
              {/* Social row placeholder */}
              <div className="mt-6 flex items-center gap-3">
                <a href="https://wa.me/918092225777" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 border border-[#25D366]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
                <a href="mailto:enquiry@nighwantech.com" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 border border-border/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/features" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Pricing</Link></li>
                <li><Link href="/#testimonials" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Testimonials</Link></li>
                <li><Link href="/api-docs" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">API Docs</Link></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">Solutions</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/solutions/education" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Education CRM</Link></li>
                <li><Link href="/solutions/real-estate" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Real Estate</Link></li>
                <li><Link href="/solutions/ecommerce" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">E-commerce</Link></li>
                <li><Link href="/solutions/healthcare" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Healthcare</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">About Us</Link></li>
                <li><Link href="/blog" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Blog</Link></li>
                <li><Link href="/contact" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Contact</Link></li>
                <li><Link href="/legal/privacy-policy" className="text-muted-foreground/80 hover:text-primary transition-colors duration-200">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">Support</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="https://wa.me/918092225777" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground/80 hover:text-[#25D366] transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Chat on WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:enquiry@nighwantech.com" className="inline-flex items-center gap-2 text-muted-foreground/80 hover:text-primary transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    enquiry@nighwantech.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between border-t border-border/30 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} NGTech WCRM. All rights reserved.</p>
            <div className="mt-4 flex gap-6 sm:mt-0">
              <Link href="/legal/terms" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors duration-200">Terms</Link>
              <Link href="/legal/privacy-policy" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors duration-200">Privacy</Link>
              <Link href="/legal/return-refund" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors duration-200">Return & Refund</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Global AI Chatbot Widget ─── */}
      <AiChatbot />
    </div>
  )
}
