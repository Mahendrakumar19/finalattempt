import Link from 'next/link'
import { ArrowRight, Building2, ShoppingCart, GraduationCap, Stethoscope, Briefcase, Landmark, Target, ShieldCheck, Zap, Users, MessageSquare } from 'lucide-react'

export const metadata = {
  title: "Industry Solutions | NGTech WCRM",
  description: "Discover how NGTech WCRM solves communication and sales challenges across different industries.",
}

const industries = [
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Automate property inquiries, send virtual tour links via WhatsApp, and close deals faster with automated follow-ups.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    icon: <ShoppingCart className="h-8 w-8" />,
    description: 'Recover abandoned carts, send automated order updates, and provide 24/7 customer support on WhatsApp.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'education',
    name: 'Education & EdTech',
    icon: <GraduationCap className="h-8 w-8" />,
    description: 'Engage students, automate admission queries, send fee reminders, and share course materials instantly.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Clinics',
    icon: <Stethoscope className="h-8 w-8" />,
    description: 'Automate appointment bookings, send medical reports securely, and provide instant post-consultation support.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'finance',
    name: 'BFSI & Finance',
    icon: <Landmark className="h-8 w-8" />,
    description: 'Send secure payment links, automate KYC document collection, and provide secure account updates.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'b2b',
    name: 'B2B & Agencies',
    icon: <Briefcase className="h-8 w-8" />,
    description: 'Manage VIP clients with a shared team inbox, qualify B2B leads via chatbots, and shorten sales cycles.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: <Target className="h-8 w-8" />,
    description: 'Automate dealer updates, streamline supply chain communication, and manage B2B orders via WhatsApp.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    id: 'hospitality',
    name: 'Hospitality & Hotels',
    icon: <ShieldCheck className="h-8 w-8" />,
    description: 'Automate booking confirmations, handle room service requests, and collect reviews effortlessly.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    id: 'travel',
    name: 'Travel & Tourism',
    icon: <Zap className="h-8 w-8" />,
    description: 'Share beautiful itineraries, send flight updates, and provide 24/7 global support on WhatsApp.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    id: 'ngo',
    name: 'NGOs & Non-Profits',
    icon: <Users className="h-8 w-8" />,
    description: 'Connect with donors, manage volunteers, and run massive fundraising campaigns at scale.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    id: 'government',
    name: 'Government & Public Sector',
    icon: <Building2 className="h-8 w-8" />,
    description: 'Automate grievance redressal, issue digital certificates, and broadcast civic alerts securely.',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
  },
  {
    id: 'service-business',
    name: 'Service Businesses',
    icon: <MessageSquare className="h-8 w-8" />,
    description: 'Automate appointment scheduling, send instant quotes, and collect payments via WhatsApp.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
  }
]

const gradientText = (text: string) => {
  const words = text.split(' ');
  if (words.length <= 1) return text;
  const lastWord = words.pop();
  return (
    <>
      {words.join(' ')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">{lastWord}</span>
    </>
  );
}

export default function SolutionsIndexPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-background">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-primary/10 blur-[100px] rounded-[100%] pointer-events-none -z-10" />
        
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Tailored for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Industry</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Whether you are selling homes, courses, or software, NGTech WCRM provides the exact workflows you need to scale on WhatsApp.
          </p>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry) => (
              <div key={industry.id} className="group relative flex flex-col rounded-2xl border border-border bg-background p-8 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${industry.bg} ${industry.color} transition-transform group-hover:scale-110`}>
                  {industry.icon}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{gradientText(industry.name)}</h3>
                <p className="text-muted-foreground mb-8 flex-1">{industry.description}</p>
                <Link href={`/solutions/${industry.id}`} className={`inline-flex items-center font-semibold ${industry.color} hover:underline mt-auto`}>
                  View {industry.name} Solution <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-Industry Use Cases */}
      <section className="py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-12">Universal Use Cases</h2>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div>
              <div className="text-4xl mb-4">📢</div>
              <h4 className="text-xl font-bold mb-2">Marketing Broadcasts</h4>
              <p className="text-muted-foreground">Send bulk promotional messages with up to 98% open rates without risking number blocks.</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🤝</div>
              <h4 className="text-xl font-bold mb-2">Sales CRM</h4>
              <p className="text-muted-foreground">Track leads through pipeline stages directly inside the WhatsApp shared inbox.</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🎧</div>
              <h4 className="text-xl font-bold mb-2">Customer Support</h4>
              <p className="text-muted-foreground">Use AI chatbots for tier-1 support and automatically route complex queries to human agents.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-4xl px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">Don't see your industry?</h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
            Our platform is highly customizable. Build your own workflows, custom fields, and API integrations to fit your exact business model.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/book-demo" className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 font-semibold text-foreground transition-all hover:scale-105 shadow-xl">
              Talk to an Expert
            </Link>
            <Link href="/free-trial" className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-foreground/30 px-8 font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/10">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
