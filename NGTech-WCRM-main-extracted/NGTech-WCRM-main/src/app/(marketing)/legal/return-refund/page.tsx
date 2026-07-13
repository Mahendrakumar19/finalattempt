import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Return & Refund Policy | NGTech WCRM',
  description: 'Return and Refund Policy for NGTech WCRM subscription services.',
}

export default function ReturnRefundPage() {
  return (
    <div className="flex flex-col py-16 md:py-24 bg-background">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
          Return & Refund Policy
        </h1>
        <p className="text-muted-foreground mb-10">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p>
            Thank you for choosing NGTech WCRM. We want to ensure that you have a rewarding experience while exploring, evaluating, and purchasing our platform.
          </p>
          <p>
            As with any online purchase experience, there are terms and conditions that apply to transactions at NGTech WCRM. By subscribing to our platform, you agree to our Return and Refund Policy.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Subscription Cancellations</h2>
          <p>
            NGTech WCRM is a Software as a Service (SaaS) platform. You may cancel your subscription at any time. When you cancel, your subscription will remain active until the end of your current billing cycle (monthly or annually). After that, your account will be downgraded to the free tier (if applicable) or suspended, and you will not be charged again.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Refund Policy</h2>
          <p>
            We offer a comprehensive 14-day free trial so that you can thoroughly evaluate our platform before making a commitment. Because of this:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Monthly Subscriptions:</strong> Payments for monthly subscriptions are non-refundable. If you cancel, you will retain access for the remainder of the paid month.</li>
            <li><strong>Annual Subscriptions:</strong> For annual commitments, we offer a partial refund if requested within the first 14 days of your purchase, minus a pro-rated amount for the days used. After 14 days, annual subscriptions are non-refundable.</li>
            <li><strong>Add-ons and WhatsApp Usage Fees:</strong> Any fees directly related to WhatsApp API usage (per-conversation charges) or specific add-ons are strictly non-refundable once consumed or activated.</li>
          </ul>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">3. Failed Payments & Account Suspension</h2>
          <p>
            If your payment method fails, we will attempt to retry the charge over a grace period of 7 days. During this time, your services may be temporarily paused. If payment cannot be secured, your account will be suspended. You will not be charged a penalty, but service will not be restored until outstanding balances are cleared.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">4. Exceptions</h2>
          <p>
            Exceptions to this policy will be considered on a case-by-case basis at the sole discretion of NGTech WCRM management. If you experience technical difficulties or prolonged downtime caused directly by our systems that severely impacts your business, please contact our support team.
          </p>

          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about our Returns and Refunds Policy, please contact us:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>By email: <a href="mailto:info@nighwantech.com" className="text-primary hover:underline">info@nighwantech.com</a></li>
            <li>By WhatsApp: <a href="https://wa.me/918092225777" className="text-primary hover:underline">+91 80922 25777</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
