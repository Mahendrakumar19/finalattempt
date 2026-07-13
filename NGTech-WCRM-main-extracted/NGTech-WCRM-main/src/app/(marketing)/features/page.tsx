import Link from 'next/link'
import { ArrowRight, MessageSquare, Bot, Zap, Users, ShieldCheck, Target, KanbanSquare, PieChart, Smartphone, Lock, Tags, Clock, Webhook, CheckCircle2, LayoutDashboard, Network } from 'lucide-react'
import { FeatureImage } from '@/components/ui/feature-image'

export const metadata = {
  title: "All Features | NGTech WCRM",
  description: "Explore the comprehensive suite of features in NGTech WCRM. Shared Inbox, AI Chatbots, Automation, Analytics, and Sales Pipelines.",
}

const coreFeatures = [
  {
    icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    title: "Centralized Overview Dashboard",
    description: "Get a bird's-eye view of your entire WhatsApp operation. Monitor active conversations, track agent performance, and view real-time revenue metrics from a single, unified command center.",
    image: "dashboard-mockup",
    slug: "dashboard"
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Shared Team Inbox",
    description: "Connect multiple agents to a single WhatsApp Business Number. Assign conversations, collaborate with internal notes, and never miss a customer query. Say goodbye to dropped chats and shared phones.",
    image: "inbox-mockup",
    slug: "shared-team-inbox"
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "Multilingual AI Chatbots",
    description: "Train our advanced AI on your company data to instantly answer FAQs in any language, qualify leads 24/7, and book meetings on autopilot. The AI detects the customer's language and replies natively.",
    image: "ai-mockup",
    slug: "chatbot-builder"
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "No-Code Workflow Automations",
    description: "Trigger automated replies, assign tags, route chats to specific departments, and update lead status automatically based on keywords or user behavior without writing a single line of code.",
    image: "automation-mockup",
    slug: "workflow-automation"
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Lead Management CRM",
    description: "A built-in CRM that automatically captures leads from WhatsApp. Track contact details, conversation history, internal notes, and custom fields in one unified dashboard.",
    image: "crm-mockup",
    slug: "lead-management"
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "High-Volume Broadcast Campaigns",
    description: "Send highly targeted, personalized WhatsApp broadcasts with rich media and interactive buttons. Enjoy up to 98% open rates and track delivered, read, and replied metrics in real-time.",
    image: "broadcast-mockup",
    slug: "broadcast-campaigns"
  },
  {
    icon: <KanbanSquare className="h-8 w-8 text-primary" />,
    title: "Visual Sales Pipelines",
    description: "Manage your entire sales process directly within WhatsApp. Drag and drop deals across customizable pipeline stages, track deal values, and forecast revenue effortlessly.",
    image: "pipeline-mockup",
    slug: "sales-pipelines"
  },
  {
    icon: <Network className="h-8 w-8 text-primary" />,
    title: "Visual Flow Builder",
    description: "Design complex conversation paths using our intuitive drag-and-drop canvas. Guide customers through multi-step onboarding, collect inputs, and route them to the right agent based on their choices.",
    image: "flow-mockup",
    slug: "visual-flow-builder"
  }
]

const advancedFeatures = [
  {
    icon: <PieChart className="h-6 w-6 text-emerald-500" />,
    title: "Agent Scorecards & Analytics",
    description: "Track team performance with detailed metrics on response times, resolution rates, and customer sentiment scores."
  },
  {
    icon: <Smartphone className="h-6 w-6 text-blue-500" />,
    title: "Official Meta Integration",
    description: "Powered by the official WhatsApp Cloud API. No risk of number bans, and full support for interactive message templates."
  },
  {
    icon: <Tags className="h-6 w-6 text-pink-500" />,
    title: "Custom Fields & Segmentation",
    description: "Tag customers and create custom data fields to hyper-segment your audience for targeted marketing campaigns."
  },
  {
    icon: <Clock className="h-6 w-6 text-orange-500" />,
    title: "SLA & Follow-up Reminders",
    description: "Set Service Level Agreements (SLAs) for response times and automatically escalate chats if an agent takes too long."
  },
  {
    icon: <Webhook className="h-6 w-6 text-purple-500" />,
    title: "API Webhooks & Integrations",
    description: "Connect NGTech WCRM to your existing tech stack (Shopify, Zapier, Hubspot) using our developer-friendly webhooks."
  },
  {
    icon: <Lock className="h-6 w-6 text-slate-500" />,
    title: "Enterprise Security & RBAC",
    description: "Granular Role-Based Access Control. Ensure agents only see the chats and data they are explicitly assigned to."
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

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 lg:pt-32">
      {/* Hero Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-24">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
          Everything You Need to Scale
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
          The Ultimate WhatsApp CRM <br className="hidden md:block"/> built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">growing teams</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          NGTech WCRM replaces your scattered tools with one powerful, unified platform. Discover all the features that will help you convert more leads and support customers faster.
        </p>
      </div>

      {/* Core Features - Alternating Layout */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-32">
        <div className="space-y-32">
          {coreFeatures.map((feature, idx) => (
            <div key={idx} className={`flex flex-col md:flex-row items-center gap-12 lg:gap-24 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1 text-left">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  {feature.icon}
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">{gradientText(feature.title)}</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{feature.description}</p>
                <Link href={`/features/${feature.slug}`} className="group inline-flex items-center text-primary font-semibold hover:text-primary-hover transition-colors">
                  Learn more about {feature.title} 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              
              <div className="flex-1 w-full">
                <div className="aspect-video rounded-3xl bg-gradient-to-tr from-muted to-card border border-border shadow-2xl overflow-hidden flex items-center justify-center relative group">
                  {/* If you place an image in the public/ folder with this name, it will show up here */}
                  <FeatureImage 
                    src={`/${feature.image}.png`} 
                    alt={feature.title} 
                  />
                  
                  {/* Fallback Placeholder (shows if image is missing) */}
                  <div className="absolute inset-0 bg-primary/5 transition-opacity group-hover:bg-primary/10 -z-10" />
                  <div className="text-muted-foreground/40 font-medium text-lg border-2 border-dashed border-muted-foreground/20 rounded-2xl p-12 backdrop-blur-sm -z-10">
                    {feature.image}.png
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Features Grid */}
      <div className="bg-muted/30 py-24 border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">But wait, there's more.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've packed NGTech WCRM with advanced capabilities to ensure you never outgrow the platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feat, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-primary rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl" />
          
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6 relative z-10">
            Ready to transform your customer communications?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto relative z-10">
            Join thousands of modern businesses using NGTech WCRM to scale their sales and support on WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link href="/free-trial" className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground transition-all hover:scale-105 shadow-xl">
              Start Your 14-Day Free Trial
            </Link>
            <Link href="/book-demo" className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-8 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/20 backdrop-blur-sm">
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
