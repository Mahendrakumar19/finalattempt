import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight, CheckCircle2, MessageSquare, Zap, Target, TrendingUp, ShieldCheck, Users } from 'lucide-react'

// Define the content for all 6 industries
const industriesData: Record<string, any> = {
  'real-estate': {
    name: 'Real Estate',
    seoTitle: 'WhatsApp CRM for Real Estate | NGTech WCRM',
    seoDescription: 'Close property deals faster. Automate property inquiries, send virtual tour links, and manage leads directly on WhatsApp with NGTech WCRM.',
    heroTitle: 'Sell Properties Faster with WhatsApp CRM',
    heroDescription: 'Transform your real estate agency. Automate lead capture from property portals, schedule site visits instantly, and follow up with buyers automatically on WhatsApp.',
    benefits: [
      {
        title: 'Instant Lead Response',
        description: 'Respond to MagicBricks or 99acres leads within seconds via automated WhatsApp greetings.',
        icon: Zap
      },
      {
        title: 'Virtual Tours on WhatsApp',
        description: 'Share property brochures, images, and video tour links directly to the buyer\'s inbox.',
        icon: Target
      },
      {
        title: 'Higher Conversion Rates',
        description: 'Keep buyers engaged with automated follow-up sequences until they are ready to book a site visit.',
        icon: TrendingUp
      }
    ],
    features: [
      'Automated Lead Qualification via Chatbots',
      'Bulk Broadcasts for New Property Launches',
      'Shared Inbox for your entire sales team',
      'Integration with Facebook Lead Ads'
    ]
  },
  'ecommerce': {
    name: 'E-commerce & Retail',
    seoTitle: 'WhatsApp Marketing for E-commerce | NGTech WCRM',
    seoDescription: 'Recover abandoned carts, send automated order updates, and provide 24/7 customer support on WhatsApp for your E-commerce brand.',
    heroTitle: 'Drive More E-commerce Sales on WhatsApp',
    heroDescription: 'Turn WhatsApp into your most profitable sales channel. Recover abandoned carts, send personalized offers, and automate order tracking updates.',
    benefits: [
      {
        title: 'Abandoned Cart Recovery',
        description: 'Automatically send a WhatsApp message with a discount code when a customer leaves items in their cart.',
        icon: TrendingUp
      },
      {
        title: 'Automated Order Updates',
        description: 'Keep customers happy by automatically sending order confirmation and shipping updates.',
        icon: Zap
      },
      {
        title: '24/7 Customer Support',
        description: 'Resolve common queries like "Where is my order?" instantly using AI-powered chatbots.',
        icon: MessageSquare
      }
    ],
    features: [
      'Shopify & WooCommerce Integrations',
      'Click-to-WhatsApp Ads tracking',
      'Rich Media Product Catalogs',
      'Automated Feedback Collection'
    ]
  },
  'education': {
    name: 'Education & EdTech',
    seoTitle: 'WhatsApp CRM for Education & EdTech | NGTech WCRM',
    seoDescription: 'Engage students, automate admission queries, send fee reminders, and share course materials instantly on WhatsApp.',
    heroTitle: 'Streamline Admissions & Student Engagement',
    heroDescription: 'The perfect WhatsApp CRM for schools, colleges, and EdTech platforms. Automate student counseling, send fee reminders, and boost enrollment rates.',
    benefits: [
      {
        title: 'Automated Admission Counseling',
        description: 'Use chatbots to answer syllabus queries, share fee structures, and capture student details 24/7.',
        icon: MessageSquare
      },
      {
        title: 'Instant Fee Reminders',
        description: 'Send automated payment links and fee reminders directly to parents or students on WhatsApp.',
        icon: Zap
      },
      {
        title: 'Course Material Distribution',
        description: 'Instantly share PDFs, video links, and assignment notifications securely via WhatsApp.',
        icon: Target
      }
    ],
    features: [
      'Lead capture from Facebook/Instagram Ads',
      'Bulk Notifications for Exam Results',
      'Shared Inbox for Counseling Teams',
      'Automated Webinar Reminders'
    ]
  },
  'healthcare': {
    name: 'Healthcare & Clinics',
    seoTitle: 'WhatsApp for Healthcare & Clinics | NGTech WCRM',
    seoDescription: 'Automate appointment bookings, send medical reports securely, and provide instant post-consultation support via WhatsApp.',
    heroTitle: 'Deliver Better Patient Care on WhatsApp',
    heroDescription: 'Modernize your clinic or hospital. Allow patients to book appointments, receive test reports, and get post-consultation care seamlessly on WhatsApp.',
    benefits: [
      {
        title: 'Easy Appointment Booking',
        description: 'Let patients schedule, reschedule, or cancel appointments through an automated WhatsApp flow.',
        icon: Zap
      },
      {
        title: 'Secure Report Delivery',
        description: 'Send lab results, prescriptions, and medical reports securely as PDF attachments.',
        icon: ShieldCheck
      },
      {
        title: 'Post-Consultation Follow-ups',
        description: 'Automatically check in on patients a few days after their visit to ensure a high standard of care.',
        icon: TrendingUp
      }
    ],
    features: [
      'Automated Appointment Reminders',
      'No-Code Healthcare Chatbots',
      'Doctor-Patient Shared Inbox routing',
      'Feedback & Review Collection'
    ]
  },
  'finance': {
    name: 'BFSI & Finance',
    seoTitle: 'WhatsApp CRM for Finance & BFSI | NGTech WCRM',
    seoDescription: 'Send secure payment links, automate KYC document collection, and provide secure account updates on WhatsApp.',
    heroTitle: 'Secure Financial Services on WhatsApp',
    heroDescription: 'Accelerate loan approvals, automate KYC collection, and provide secure account alerts for your banking, insurance, or finance business.',
    benefits: [
      {
        title: 'Automated KYC Collection',
        description: 'Allow customers to easily upload their PAN, Aadhar, and other documents directly via a secure WhatsApp chat.',
        icon: ShieldCheck
      },
      {
        title: 'Instant Payment Links',
        description: 'Send premium payment reminders or EMI links that customers can pay with a single tap.',
        icon: Zap
      },
      {
        title: 'Secure Account Alerts',
        description: 'Deliver real-time transaction alerts, policy renewals, and account statements reliably.',
        icon: Target
      }
    ],
    features: [
      'End-to-End Encryption Compliance',
      'Automated Lead Qualification for Loans',
      'Multi-agent Support Inbox',
      'Template Messages for Policy Updates'
    ]
  },
  'b2b': {
    name: 'B2B & Agencies',
    seoTitle: 'WhatsApp CRM for B2B & Agencies | NGTech WCRM',
    seoDescription: 'Manage VIP clients with a shared team inbox, qualify B2B leads via chatbots, and shorten sales cycles on WhatsApp.',
    heroTitle: 'Close High-Ticket B2B Deals Faster',
    heroDescription: 'Move B2B conversations out of cluttered email inboxes and onto WhatsApp. Build stronger relationships, qualify leads, and close deals in record time.',
    benefits: [
      {
        title: 'Faster Sales Cycles',
        description: 'Communicate directly with decision-makers. B2B WhatsApp messages have a 98% open rate compared to 20% for email.',
        icon: TrendingUp
      },
      {
        title: 'Shared Team Inbox',
        description: 'Let multiple sales reps and account managers collaborate on the same VIP client number.',
        icon: MessageSquare
      },
      {
        title: 'Automated Meeting Booking',
        description: 'Send Calendly links and automated meeting reminders to dramatically reduce no-shows.',
        icon: Zap
      }
    ],
    features: [
      'CRM Integrations (HubSpot, Salesforce)',
      'Lead Routing to Specific Sales Reps',
      'Drip Campaigns for B2B Nurturing',
      'Comprehensive Chat Analytics'
    ]
  },
  'manufacturing': {
    name: 'Manufacturing',
    seoTitle: 'WhatsApp CRM for Manufacturing | NGTech WCRM',
    seoDescription: 'Streamline supply chain communication, automate dealer updates, and manage B2B manufacturing orders via WhatsApp.',
    heroTitle: 'Modernize Your Manufacturing Supply Chain',
    heroDescription: 'Connect your factory floor with your distributors. Automate order updates, inventory alerts, and dealer communication instantly on WhatsApp.',
    icon: Target,
    benefits: [
      {
        title: 'Dealer Communication',
        description: 'Send automated catalog updates and pricing sheets to your entire distributor network in one click.',
        icon: Target
      },
      {
        title: 'Order Tracking',
        description: 'Automatically notify clients when their batch is manufactured, dispatched, and delivered.',
        icon: TrendingUp
      },
      {
        title: 'Procurement Automation',
        description: 'Use WhatsApp bots to collect quotes from vendors and manage raw material inquiries.',
        icon: MessageSquare
      }
    ],
    features: [
      'ERP Integrations (SAP, Tally)',
      'Automated Inventory Alerts',
      'Dealer Support Inbox',
      'Bulk PO Approvals'
    ]
  },
  'hospitality': {
    name: 'Hospitality & Hotels',
    seoTitle: 'WhatsApp CRM for Hotels & Hospitality | NGTech WCRM',
    seoDescription: 'Automate hotel bookings, manage room service requests, and send personalized offers via WhatsApp.',
    heroTitle: '5-Star Guest Experiences on WhatsApp',
    heroDescription: 'Delight your guests before they even arrive. Automate booking confirmations, handle room service, and collect reviews effortlessly.',
    icon: ShieldCheck,
    benefits: [
      {
        title: 'Booking Confirmations',
        description: 'Automatically send booking details, check-in times, and digital menus directly to the guest\'s WhatsApp.',
        icon: Zap
      },
      {
        title: 'Digital Concierge',
        description: 'Let guests order room service, request fresh towels, or book spa appointments via a WhatsApp chatbot.',
        icon: MessageSquare
      },
      {
        title: 'Review Collection',
        description: 'Automatically trigger a WhatsApp message asking for a TripAdvisor or Google review right after checkout.',
        icon: TrendingUp
      }
    ],
    features: [
      'PMS Integration',
      'Pre-arrival Upselling',
      'Multi-property Inbox',
      'Automated Feedback Loops'
    ]
  },
  'travel': {
    name: 'Travel & Tourism',
    seoTitle: 'WhatsApp CRM for Travel Agencies | NGTech WCRM',
    seoDescription: 'Share itineraries, automate visa updates, and provide 24/7 travel support on WhatsApp.',
    heroTitle: 'The Ultimate CRM for Travel Agencies',
    heroDescription: 'Keep your travelers informed and engaged. Share beautiful itineraries, send flight updates, and provide global support on WhatsApp.',
    icon: Zap,
    benefits: [
      {
        title: 'Instant Itineraries',
        description: 'Share rich media PDFs, flight tickets, and hotel vouchers instantly via WhatsApp.',
        icon: Target
      },
      {
        title: 'Automated Updates',
        description: 'Send automated alerts for flight delays, gate changes, or visa approvals.',
        icon: Zap
      },
      {
        title: '24/7 Global Support',
        description: 'Provide immediate assistance to travelers stuck abroad using an AI chatbot and shared inbox.',
        icon: ShieldCheck
      }
    ],
    features: [
      'Lead Capture for Tour Packages',
      'Automated Payment Reminders',
      'Multi-agent Travel Desk',
      'Broadcast Holiday Offers'
    ]
  },
  'ngo': {
    name: 'NGOs & Non-Profits',
    seoTitle: 'WhatsApp for NGOs & Non-Profits | NGTech WCRM',
    seoDescription: 'Automate donor communication, run fundraising campaigns, and manage volunteer coordination on WhatsApp.',
    heroTitle: 'Amplify Your Non-Profit Impact',
    heroDescription: 'Connect with donors, manage volunteers, and run massive fundraising campaigns at scale using WhatsApp automation.',
    icon: Users,
    benefits: [
      {
        title: 'Donor Engagement',
        description: 'Send personalized impact reports and donation receipts automatically to keep donors engaged.',
        icon: Target
      },
      {
        title: 'Fundraising Campaigns',
        description: 'Run WhatsApp broadcast campaigns to raise funds quickly during emergencies or end-of-year drives.',
        icon: TrendingUp
      },
      {
        title: 'Volunteer Coordination',
        description: 'Use the shared inbox to manage volunteer applications, assign shifts, and answer queries.',
        icon: Users
      }
    ],
    features: [
      'Discounted NGO Pricing',
      'Automated Donation Links',
      'Impact Video Broadcasts',
      'Volunteer Chatbots'
    ]
  },
  'government': {
    name: 'Government & Public Sector',
    seoTitle: 'WhatsApp CRM for Government Services | NGTech WCRM',
    seoDescription: 'Digitize citizen services, automate grievance redressal, and broadcast public alerts via WhatsApp.',
    heroTitle: 'Digitize Citizen Services on WhatsApp',
    heroDescription: 'Provide fast, accessible, and secure public services. Automate grievance redressal, issue digital certificates, and broadcast civic alerts.',
    icon: Target,
    benefits: [
      {
        title: 'Grievance Redressal',
        description: 'Allow citizens to report issues (like potholes or water supply) via a WhatsApp bot with image uploads.',
        icon: MessageSquare
      },
      {
        title: 'Document Delivery',
        description: 'Securely issue digital certificates, tax receipts, and utility bills directly to the citizen\'s phone.',
        icon: ShieldCheck
      },
      {
        title: 'Civic Alerts',
        description: 'Instantly broadcast emergency alerts, vaccination drives, or election information to millions of citizens.',
        icon: Zap
      }
    ],
    features: [
      'Data Localization Compliance',
      'Multi-language Support',
      'High-Volume Broadcasting',
      'Automated Ticket Routing'
    ]
  },
  'service-business': {
    name: 'Service Businesses',
    seoTitle: 'WhatsApp CRM for Service Businesses | NGTech WCRM',
    seoDescription: 'Automate appointment scheduling, send quotes, and collect payments for your service business on WhatsApp.',
    heroTitle: 'Scale Your Service Business',
    heroDescription: 'The perfect tool for salons, repair shops, and home services. Automate scheduling, send instant quotes, and collect payments via WhatsApp.',
    icon: MessageSquare,
    benefits: [
      {
        title: 'Automated Scheduling',
        description: 'Let customers book, reschedule, or cancel appointments through an automated WhatsApp flow.',
        icon: Zap
      },
      {
        title: 'Instant Quotes',
        description: 'Send professional quotes and invoices directly in chat and get paid faster.',
        icon: Target
      },
      {
        title: 'Service Reminders',
        description: 'Automatically remind customers when their next service or maintenance is due.',
        icon: TrendingUp
      }
    ],
    features: [
      'Google Calendar Integration',
      'Payment Link Generation',
      'Customer Feedback Bots',
      'Team Dispatch Routing'
    ]
  }
}

// Generate static routes for all 6 industries at build time
export function generateStaticParams() {
  return Object.keys(industriesData).map((slug) => ({
    industry: slug,
  }))
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const data = industriesData[resolvedParams.industry]
  if (!data) return { title: 'Industry Not Found' }
  
  return {
    title: data.seoTitle,
    description: data.seoDescription,
  }
}

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

export default async function IndustrySolutionPage({ params }: { params: Promise<{ industry: string }> }) {
  const resolvedParams = await params
  const data = industriesData[resolvedParams.industry]
  
  if (!data) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-primary/10 blur-[100px] rounded-[100%] pointer-events-none -z-10" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            NGTech WCRM for {data.name}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto">
            {gradientText(data.heroTitle)}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {data.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/free-trial" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Start Your Free Trial
            </Link>
            <Link href="/book-demo" className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-8 font-semibold text-foreground transition-all hover:bg-muted">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose NGTech for {data.name}?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We understand the unique communication challenges in your industry. Here is how we solve them.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {data.benefits.map((benefit: any, index: number) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="flex flex-col rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground flex-1">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features List Section */}
      <section className="py-24 bg-background border-t border-border/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12 shadow-xl shadow-primary/5">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Purpose-Built Features for {data.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {data.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">{feature}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center pt-8 border-t border-border">
              <p className="text-muted-foreground mb-6">
                Ready to transform your {data.name.toLowerCase()} business?
              </p>
              <Link href="/free-trial" className="inline-flex items-center font-bold text-primary hover:underline">
                Get started today <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
