import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight, CheckCircle2, Zap, MessageSquare, ShieldCheck, Target, Bot, Users, LayoutDashboard, KanbanSquare, Network } from 'lucide-react'
import { FeatureImage } from '@/components/ui/feature-image'

const featuresData: Record<string, any> = {
  'dashboard': {
    name: 'Centralized Overview Dashboard',
    seoTitle: 'WhatsApp CRM Dashboard | NGTech WCRM',
    seoDescription: 'Get a bird\'s-eye view of your entire WhatsApp operation with a unified command center.',
    heroTitle: 'Your Entire Operation at a Glance',
    heroDescription: 'Monitor active conversations, track agent performance, and view real-time revenue metrics from a single, unified command center.',
    icon: LayoutDashboard,
    image: 'dashboard-mockup',
    benefits: [
      {
        title: 'Real-Time Metrics',
        description: 'See live stats on open chats, resolution times, and team performance instantly.',
      },
      {
        title: 'Revenue Tracking',
        description: 'Connect your sales data to see exactly how much revenue WhatsApp is driving.',
      },
      {
        title: 'Agent Productivity',
        description: 'Monitor individual agent workloads and reassign chats to balance the queue.',
      }
    ],
    featuresList: [
      'Customizable Widgets',
      'Real-time Data Refresh',
      'Exportable Reports',
      'Goal Tracking',
      'Agent Leaderboards',
      'Revenue Attribution',
      'Conversation Heatmaps',
      'SLA Breach Alerts'
    ]
  },
  'shared-team-inbox': {
    name: 'Shared Team Inbox',
    seoTitle: 'WhatsApp Shared Team Inbox | NGTech WCRM',
    seoDescription: 'Connect multiple agents to a single WhatsApp Business Number. Assign conversations, collaborate with internal notes, and never miss a customer query.',
    heroTitle: 'Manage WhatsApp Together',
    heroDescription: 'Stop fighting over a single WhatsApp phone. Equip your sales and support teams with a unified, multiplayer shared inbox built for scale.',
    icon: MessageSquare,
    image: 'inbox-mockup',
    benefits: [
      {
        title: 'Multi-Agent Collaboration',
        description: 'Assign chats to specific agents or departments. Use private internal notes to discuss queries before replying to the customer.',
      },
      {
        title: 'Collision Detection',
        description: 'See when another agent is typing so you never send duplicate replies to the same customer.',
      },
      {
        title: 'Universal Inbox',
        description: 'Manage WhatsApp, Instagram, and Facebook Messenger conversations from a single, unified interface.',
      }
    ],
    featuresList: [
      'Private Internal Notes',
      'Agent Analytics & Load Balancing',
      'Custom SLA Rules & Alerts',
      'Chat Tagging & Categorization',
      'Collision Detection',
      'Saved Quick Replies (Canned Responses)',
      'Auto-Assignment Routing Rules',
      'Multi-Device Support'
    ]
  },
  'chatbot-builder': {
    name: 'No-Code Chatbot Builder',
    seoTitle: 'WhatsApp Chatbot Builder | NGTech WCRM',
    seoDescription: 'Build AI-powered WhatsApp chatbots in minutes without coding. Automate lead qualification, FAQs, and support.',
    heroTitle: 'Automate 80% of Customer Queries',
    heroDescription: 'Deploy intelligent chatbots that work 24/7. Answer common questions, qualify leads, and route complex issues to human agents automatically.',
    icon: Bot,
    image: 'ai-mockup',
    benefits: [
      {
        title: 'Drag & Drop Builder',
        description: 'Create complex conversational flows without writing a single line of code.',
      },
      {
        title: 'AI Intent Recognition',
        description: 'Train your bot with your FAQs so it can understand natural language questions from customers.',
      },
      {
        title: 'Seamless Human Handoff',
        description: 'When the bot gets stuck or a VIP client messages, the chat is instantly routed to the right human agent.',
      }
    ],
    featuresList: [
      'Visual Flow Builder',
      'Multi-Language Support',
      'Data Collection Forms',
      'Webhook Integrations',
      'AI Intent Recognition',
      'Fallback to Human Agent',
      'Pre-built Industry Templates',
      'Rich Media Responses (Cards, PDFs)'
    ]
  },
  'workflow-automation': {
    name: 'Workflow Automation',
    seoTitle: 'WhatsApp Workflow Automation | NGTech WCRM',
    seoDescription: 'Trigger automated WhatsApp messages based on user behavior, CRM updates, and time delays.',
    heroTitle: 'Put Your WhatsApp Growth on Autopilot',
    heroDescription: 'Build automated Drip Campaigns, abandoned cart reminders, and meeting follow-ups that run while you sleep.',
    icon: Zap,
    image: 'automation-mockup',
    benefits: [
      {
        title: 'Drip Campaigns',
        description: 'Send a sequenced series of WhatsApp messages over several days to nurture leads into paying customers.',
      },
      {
        title: 'Event-Based Triggers',
        description: 'Automatically trigger messages when a lead changes status in your CRM or when they view your pricing page.',
      },
      {
        title: 'Dynamic Personalization',
        description: 'Use variables to dynamically insert the customer\'s name, company, or order details into every automated message.',
      }
    ],
    featuresList: [
      'Abandoned Cart Recovery',
      'Automated Meeting Reminders',
      'Integration with Zapier',
      'A/B Testing for Workflows',
      'Time-based Delays',
      'Condition-based Branching',
      'CRM Event Triggers',
      'Dynamic Variable Injection'
    ]
  },
  'lead-management': {
    name: 'Lead Management CRM',
    seoTitle: 'WhatsApp CRM & Lead Management | NGTech WCRM',
    seoDescription: 'Capture leads directly from WhatsApp. Manage sales pipelines, track history, and close deals faster.',
    heroTitle: 'A CRM Built for WhatsApp First',
    heroDescription: 'Turn every WhatsApp conversation into a structured lead. Track sales pipelines, manage contacts, and boost your conversion rates.',
    icon: Users,
    image: 'crm-mockup',
    benefits: [
      {
        title: 'Automatic Lead Capture',
        description: 'Every new WhatsApp conversation automatically creates a rich lead profile in your CRM database.',
      },
      {
        title: 'Visual Sales Pipeline',
        description: 'Drag and drop leads across custom pipeline stages (e.g., Prospecting, Qualified, Won).',
      },
      {
        title: 'Comprehensive History',
        description: 'View every WhatsApp message, internal note, and automated event on a unified timeline for each lead.',
      }
    ],
    featuresList: [
      'Custom Contact Fields',
      'Bulk Import/Export',
      'Lead Scoring System',
      'Activity Timelines',
      'Duplicate Detection',
      'Contact Tagging',
      'Notes & Reminders',
      'One-Click Filtering'
    ]
  },
  'broadcast-campaigns': {
    name: 'Broadcast Campaigns',
    seoTitle: 'WhatsApp Marketing & Broadcasts | NGTech WCRM',
    seoDescription: 'Send bulk WhatsApp marketing campaigns with up to 98% open rates without getting blocked.',
    heroTitle: 'Marketing Campaigns People Actually Read',
    heroDescription: 'Ditch email marketing. Send highly targeted, personalized WhatsApp broadcasts with rich media and interactive buttons.',
    icon: Target,
    image: 'broadcast-mockup',
    benefits: [
      {
        title: 'High Deliverability',
        description: 'Use the official WhatsApp API to send thousands of messages instantly without risking phone number bans.',
      },
      {
        title: 'Interactive Templates',
        description: 'Increase engagement by using Quick Reply buttons and Call-To-Action (CTA) links directly in the message.',
      },
      {
        title: 'Real-Time Analytics',
        description: 'Track exactly who received, opened, and clicked your broadcast messages in real-time.',
      }
    ],
    featuresList: [
      'Pre-approved WhatsApp Templates',
      'Audience Segmentation',
      'Campaign Scheduling',
      'Rich Media (Images/Videos/PDFs)',
      'Interactive Buttons (URL & Quick Reply)',
      'Opt-out Management',
      'Delivery & Read Receipts',
      'A/B Testing Content'
    ]
  },
  'sales-pipelines': {
    name: 'Visual Sales Pipelines',
    seoTitle: 'Visual Sales Pipelines | NGTech WCRM',
    seoDescription: 'Manage your entire sales process directly within WhatsApp. Drag and drop deals across customizable stages.',
    heroTitle: 'Visualize Your Sales Flow',
    heroDescription: 'Manage your entire sales process directly within WhatsApp. Drag and drop deals across customizable pipeline stages, track deal values, and forecast revenue effortlessly.',
    icon: KanbanSquare,
    image: 'pipeline-mockup',
    benefits: [
      {
        title: 'Drag & Drop Management',
        description: 'Easily move leads from one stage to the next with an intuitive Kanban board interface.',
      },
      {
        title: 'Revenue Forecasting',
        description: 'See the total value of deals in every stage to accurately forecast your monthly revenue.',
      },
      {
        title: 'Automated Stage Triggers',
        description: 'Automatically trigger messages or assign tasks when a deal is moved to a new stage.',
      }
    ],
    featuresList: [
      'Multiple Custom Pipelines',
      'Deal Value Tracking',
      'Win/Loss Reason Analysis',
      'Stage Automation Rules',
      'Drag & Drop Kanban Board',
      'Revenue Forecasting',
      'Deal Rotting Alerts',
      'Required Fields by Stage'
    ]
  },
  'visual-flow-builder': {
    name: 'Visual Flow Builder',
    seoTitle: 'Visual Flow Builder | NGTech WCRM',
    seoDescription: 'Design complex conversation paths using our intuitive drag-and-drop canvas.',
    heroTitle: 'Design Complex Flows Visually',
    heroDescription: 'Guide customers through multi-step onboarding, collect inputs, and route them to the right agent based on their choices using our drag-and-drop canvas.',
    icon: Network,
    image: 'flow-mockup',
    benefits: [
      {
        title: 'Intuitive Canvas',
        description: 'Map out the entire customer journey visually, ensuring a flawless customer experience.',
      },
      {
        title: 'Smart Routing',
        description: 'Route users to specific human agents based on the options they select during the flow.',
      },
      {
        title: 'Multi-Step Onboarding',
        description: 'Collect documents, qualify criteria, and onboard users step-by-step automatically.',
      }
    ],
    featuresList: [
      'Drag-and-Drop Canvas',
      'Conditional Logic Branches',
      'Variable Storage',
      'Rich Media Nodes',
      'API Request Blocks',
      'Date & Time Routing',
      'Jump-to-Node Actions',
      'Flow Version History'
    ]
  },
  'security-compliance': {
    name: 'Security & Compliance',
    seoTitle: 'Enterprise Security for WhatsApp | NGTech WCRM',
    seoDescription: 'Bank-grade security, end-to-end encryption, and role-based access control for your business communications.',
    heroTitle: 'Bank-Grade Security for Your Data',
    heroDescription: 'Protect your customer data with enterprise-grade security infrastructure. We comply with GDPR, SOC2, and data localization laws.',
    icon: ShieldCheck,
    image: 'security-mockup',
    benefits: [
      {
        title: 'End-to-End Encryption',
        description: 'All messages are encrypted in transit. We ensure your business communications remain strictly confidential.',
      },
      {
        title: 'Role-Based Access (RBAC)',
        description: 'Control exactly what your agents can see and do. Restrict access to downloading data or deleting chats.',
      },
      {
        title: 'Audit Logs',
        description: 'Maintain a comprehensive trail of every action taken by every user in your organization for compliance purposes.',
      }
    ],
    featuresList: [
      'GDPR & CCPA Compliant',
      'Data Masking for PII',
      'SSO & 2FA Authentication',
      'Regular Penetration Testing',
      'End-to-End Encryption',
      'Role-Based Access Control (RBAC)',
      'Comprehensive Audit Logs',
      'Data Localization Options'
    ]
  }
}

export function generateStaticParams() {
  return Object.keys(featuresData).map((slug) => ({
    feature: slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const data = featuresData[resolvedParams.feature]
  if (!data) return { title: 'Feature Not Found' }
  
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

export default async function FeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const resolvedParams = await params
  const data = featuresData[resolvedParams.feature]
  
  if (!data) {
    notFound()
  }

  const Icon = data.icon

  // Select 3 other features deterministically based on the current feature
  const featureKeys = Object.keys(featuresData)
  const currentIndex = featureKeys.indexOf(resolvedParams.feature)
  const otherFeatures = [
    featureKeys[(currentIndex + 1) % featureKeys.length],
    featureKeys[(currentIndex + 2) % featureKeys.length],
    featureKeys[(currentIndex + 3) % featureKeys.length],
  ].map(key => ({ slug: key, ...featuresData[key] }))

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                <Icon className="h-4 w-4" /> Feature: {data.name}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                {gradientText(data.heroTitle)}
              </h1>
              <p className="text-xl text-muted-foreground mb-10">
                {data.heroDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/free-trial" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Try it for free
                </Link>
              </div>
            </div>
            
            <div className="relative aspect-video lg:aspect-[1500/850] w-full rounded-2xl bg-gradient-to-tr from-muted to-card border border-border shadow-2xl overflow-hidden flex items-center justify-center group">
              <FeatureImage src={`/${data.image}.png`} alt={data.name} />
              <div className="absolute inset-0 bg-primary/5 transition-opacity group-hover:bg-primary/10 -z-10" />
              <div className="text-muted-foreground/40 font-medium text-lg border-2 border-dashed border-muted-foreground/20 rounded-2xl p-12 backdrop-blur-sm -z-10">
                {data.image}.png
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-card">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why you need {data.name}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Supercharge your team's productivity and scale your business faster.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {data.benefits.map((benefit: any, index: number) => (
              <div key={index} className="flex flex-col rounded-2xl border border-border bg-background p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground flex-1">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24 bg-background border-t border-border/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Core Capabilities
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {data.featuresList.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <p className="font-medium">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Other Features */}
      <section className="py-24 bg-card border-t border-border/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Explore More Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover other powerful tools in the NGTech WCRM suite to grow your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {otherFeatures.map((feat, index) => {
              const FeatIcon = feat.icon
              return (
                <Link href={`/features/${feat.slug}`} key={index} className="group flex flex-col rounded-2xl border border-border bg-background p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <FeatIcon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feat.name}</h3>
                  <p className="text-muted-foreground flex-1 mb-8">{feat.heroDescription.substring(0, 110)}...</p>
                  <div className="flex items-center text-primary font-semibold group-hover:underline mt-auto">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
