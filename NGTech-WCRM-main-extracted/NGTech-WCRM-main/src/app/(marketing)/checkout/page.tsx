import { Suspense } from 'react'
import CheckoutClient from './checkout-client'

export const metadata = {
  title: 'Checkout | NGTech WCRM',
  description: 'Complete your purchase.',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-8">Secure Checkout</h1>
        
        {/* We use Suspense because the client component uses useSearchParams() */}
        <Suspense fallback={
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex items-center justify-center min-h-[300px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }>
          <CheckoutClient />
        </Suspense>
      </div>
    </div>
  )
}
