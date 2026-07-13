import { Metadata } from 'next'
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | NGTech WCRM',
  description: 'Get in touch with the NGTech WCRM team. We are here to help you scale your business on WhatsApp.',
}

export default function ContactPage() {
  return (
    <div className="flex flex-col py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Have questions about our CRM? Need help setting up your team? Our support and sales teams are ready to assist you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Contact Information */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            
            <div className="space-y-6 text-muted-foreground">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="mt-1">For general inquiries and support.</p>
                  <a href="mailto:info@nighwantech.com" className="text-primary hover:underline mt-2 inline-block font-medium">info@nighwantech.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">WhatsApp Chat</h3>
                  <p className="mt-1">Fastest way to get support from our team.</p>
                  <a href="https://wa.me/918092225777" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-block font-medium">+91 80922 25777</a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ or CTA */}
          <div className="bg-muted/30 border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Ready to scale?</h2>
            <p className="text-muted-foreground mb-6">
              You don't need to wait for sales to get started. You can launch your free trial immediately and explore the full capabilities of NGTech WCRM.
            </p>
            <a href="/free-trial" className="flex w-full h-12 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 px-8 text-base font-semibold text-primary-foreground transition-all shadow-md mb-4">
              Start Free Trial
            </a>
            <p className="text-xs text-center text-muted-foreground">
              No credit card required. 14-day full access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
