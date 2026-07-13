'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { maskPhone } from '@/lib/masking';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { CustomerTimeline } from '@/components/inbox/customer-timeline';
import { MeetingModal } from '@/components/inbox/meeting-modal';
import { QuoteModal } from '@/components/inbox/quote-modal';
import { DealForm } from '@/components/pipelines/deal-form';
import { TaskModal } from '@/components/contacts/task-modal';
import { TicketModal } from '@/components/contacts/ticket-modal';
import type { Contact, Tag, Deal } from '@/types';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Copy,
  Check,
  Loader2,
  CalendarDays,
  Sparkles,
  MessageCircle,
  Video,
  DollarSign,
  FileText,
  Ticket,
  CheckSquare,
  Activity,
  BrainCircuit,
  TrendingUp,
  AlertCircle,
  Clock,
  HeartPulse,
  Plus,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ContactForm } from '@/components/contacts/contact-form';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const LIFECYCLE_STAGES = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Customer',
  'VIP',
];

export default function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { account, defaultCurrency, isAgent } = useAuth();
  const unwrappedParams = use(params);
  const contactId = unwrappedParams.id;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);

  // Modals state
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);

  const handleOpenDealForm = async () => {
    if (pipelines.length === 0) {
      const { data: pData } = await supabase.from('pipelines').select('*').order('created_at').limit(1).maybeSingle();
      if (pData) {
        setPipelines([pData]);
        const { data: sData } = await supabase.from('pipeline_stages').select('*').eq('pipeline_id', pData.id).order('position');
        if (sData) setPipelineStages(sData);
      }
    }
    setDealFormOpen(true);
  };

  // Additional Data
  const [tags, setTags] = useState<Tag[]>([]);
  const [customFields, setCustomFields] = useState<Array<{ field_name: string; value: string }>>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showAllDeals, setShowAllDeals] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Health / AI Data
  const [latestConversation, setLatestConversation] = useState<any>(null);
  
  // Mock active lifecycle stage (can be dynamically mapped to deals later)
  const [activeStage, setActiveStage] = useState('Lead');

  const fetchContactData = useCallback(async () => {
    setLoading(true);
    // Fetch base contact
    const { data: contactData, error: contactErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactErr || !contactData) {
      console.error('Contact fetch error:', contactErr, 'ID:', contactId);
      toast.error('Contact not found');
      router.push('/contacts');
      return;
    }
    setContact(contactData);

    // Fetch latest conversation for AI health data
    const { data: convData } = await supabase
      .from('conversations')
      .select('id, ai_sentiment, ai_lead_score, ai_summary, priority, updated_at, ai_confidence, status')
      .eq('contact_id', contactId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestConversation(convData);

    // Fetch Tags
    const { data: contactTags } = await supabase
      .from('contact_tags')
      .select('tag_id, tags(*)')
      .eq('contact_id', contactId);
    
    if (contactTags) {
      setTags(contactTags.map(ct => ct.tags as unknown as Tag).filter(Boolean));
    }

    // Fetch Custom Fields
    const { data: customValues } = await supabase
      .from('contact_custom_values')
      .select('value, custom_fields(field_name)')
      .eq('contact_id', contactId);
      
    if (customValues) {
      setCustomFields(
        customValues.map(cv => ({
          field_name: (cv.custom_fields as any).field_name,
          value: cv.value || '',
        }))
      );
    }

    // Fetch Deals
    const { data: dealsData } = await supabase
      .from('deals')
      .select('*, stage:pipeline_stages(*)')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
      
    if (dealsData) {
      setDeals(dealsData as Deal[]);
      // Dynamic lifecycle mock logic based on deal stage
      if (dealsData.length > 0) {
        if (dealsData.some(d => d.status === 'won')) setActiveStage('Customer');
        else if (dealsData.some(d => d.stage?.name?.toLowerCase().includes('negotiat'))) setActiveStage('Negotiation');
        else if (dealsData.some(d => d.stage?.name?.toLowerCase().includes('propos'))) setActiveStage('Proposal');
        else setActiveStage('Qualified');
      }
    }

    // Fetch Tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    if (tasksData) {
      setTasks(tasksData);
    }

    setLoading(false);
  }, [contactId, supabase, router]);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  async function copyPhone() {
    if (!contact) return;
    await navigator.clipboard.writeText(contact.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  function getInitials(name?: string | null) {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }
  
  // Health metrics processing
  const getLeadScoreNumber = () => {
    const score = latestConversation?.ai_lead_score;
    if (score === 'hot') return 92;
    if (score === 'warm') return 68;
    if (score === 'cold') return 35;
    return '--'; // Default empty state
  };

  const getHealthColor = (type: string, val: string) => {
    if (!val) return 'bg-muted text-muted-foreground';
    if (val === 'hot' || val === 'positive' || val === 'high') return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20';
    if (val === 'warm' || val === 'neutral' || val === 'medium') return 'bg-amber-500/15 text-amber-600 border-amber-500/20';
    if (val === 'cold' || val === 'negative' || val === 'low') return 'bg-rose-500/15 text-rose-600 border-rose-500/20';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-8 bg-muted/20">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/contacts')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Contacts
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditFormOpen(true)} className="bg-background">
            Edit Contact
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* ============================================================ */}
          {/* HEADER SECTION (Avatar, Lifecycle, Actions)                  */}
          {/* ============================================================ */}
          <Card className="border-border shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary"></div>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                
                {/* Profile Info */}
                <div className="flex items-center gap-5">
                  <Avatar className="size-20 border-2 border-background shadow-md">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-foreground">{contact.name || 'Unnamed Contact'}</h1>
                      {latestConversation?.ai_lead_score === 'hot' && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-2 py-0.5">
                          🔥 Hot Lead
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1.5">
                      <button onClick={copyPhone} className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group">
                        <Phone className="size-3.5 group-hover:scale-110 transition-transform" />
                        {maskPhone(contact.phone, isAgent, account?.mask_agent_phones ?? false)}
                        {copiedPhone ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 opacity-50 group-hover:opacity-100" />}
                      </button>
                      
                      {contact.email && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-border"></div>
                          <Mail className="size-3.5" />
                          {contact.email}
                        </div>
                      )}
                      
                      {contact.company && (
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <div className="w-1 h-1 rounded-full bg-border"></div>
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {contact.company}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lifecycle Pipeline */}
                <div className="hidden md:flex flex-col items-center gap-2 lg:w-[500px]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground w-full text-left ml-2">Customer Lifecycle</span>
                  <div className="flex w-full overflow-hidden rounded-md border border-border shadow-sm">
                    {LIFECYCLE_STAGES.map((stage, idx) => {
                      const isActive = stage === activeStage;
                      const isPast = LIFECYCLE_STAGES.indexOf(stage) < LIFECYCLE_STAGES.indexOf(activeStage);
                      
                      return (
                        <div 
                          key={stage} 
                          className={cn(
                            "flex-1 py-1.5 px-2 text-center text-xs font-semibold relative transition-colors border-r border-background/20 last:border-0",
                            isActive ? "bg-primary text-primary-foreground" : 
                            isPast ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {stage}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-border/50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-background rounded-full hover:border-primary/50 hover:bg-primary/5 shadow-sm"
                  onClick={() => {
                    if (contact.phone) window.location.href = `tel:${contact.phone}`;
                    else toast.error("No phone number available");
                  }}
                >
                  <Phone className="size-3.5 mr-1.5 text-blue-500" /> Call
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-background rounded-full hover:border-emerald-500/50 hover:bg-emerald-500/5 shadow-sm"
                  onClick={async () => {
                    if (!contact) return;
                    try {
                      const { data: openConv } = await supabase
                        .from('conversations')
                        .select('id')
                        .eq('contact_id', contact.id)
                        .eq('status', 'open')
                        .single();
                      
                      if (openConv) {
                        router.push(`/inbox?c=${openConv.id}`);
                        return;
                      }
                      
                      const { data: user } = await supabase.auth.getUser();
                      if (!user.user) throw new Error("Not authenticated");
                      
                      const { data: newConv, error } = await supabase
                        .from('conversations')
                        .insert({
                          contact_id: contact.id,
                          user_id: user.user.id,
                          status: 'open'
                        })
                        .select('id')
                        .single();
                        
                      if (error) throw error;
                      router.push(`/inbox?c=${newConv.id}`);
                    } catch (e: any) {
                      toast.error('Could not open WhatsApp: ' + e.message);
                    }
                  }}
                >
                  <MessageCircle className="size-3.5 mr-1.5 text-emerald-500" /> WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-background rounded-full hover:border-primary/50 hover:bg-primary/5 shadow-sm"
                  onClick={() => {
                    if (contact.email) window.location.href = `mailto:${contact.email}`;
                    else toast.error("No email address available");
                  }}
                >
                  <Mail className="size-3.5 mr-1.5 text-primary" /> Email
                </Button>
                <Button variant="outline" size="sm" className="bg-background rounded-full shadow-sm" onClick={() => setMeetingModalOpen(true)}>
                  <Video className="size-3.5 mr-1.5 text-indigo-500" /> Meeting
                </Button>
                <div className="w-px h-6 bg-border mx-2"></div>
                <Button variant="outline" size="sm" className="bg-background rounded-full shadow-sm" onClick={handleOpenDealForm}>
                  <DollarSign className="size-3.5 mr-1.5 text-amber-500" /> New Deal
                </Button>
                <Button variant="outline" size="sm" className="bg-background rounded-full shadow-sm" onClick={() => setQuoteModalOpen(true)}>
                  <FileText className="size-3.5 mr-1.5 text-slate-500" /> Quote
                </Button>
                <Button variant="outline" size="sm" className="bg-background rounded-full shadow-sm" onClick={() => setTicketModalOpen(true)}>
                  <Ticket className="size-3.5 mr-1.5 text-rose-500" /> Ticket
                </Button>
                <Button variant="outline" size="sm" className="bg-background rounded-full shadow-sm" onClick={() => setTaskModalOpen(true)}>
                  <CheckSquare className="size-3.5 mr-1.5 text-cyan-500" /> Task
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================ */}
          {/* MAIN GRID (35% Left / 65% Right)                             */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ------------------------------------------------------------ */}
            {/* LEFT COLUMN (35% - col-span-4)                               */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Customer Health Card */}
              <Card className="border-border shadow-sm border-t-4 border-t-emerald-500">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HeartPulse className="size-4 text-emerald-500" />
                    Customer Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/50">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Lead Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">{getLeadScoreNumber()}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">AI Confidence</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          {latestConversation?.ai_confidence || '--'}
                        </span>
                        {latestConversation?.ai_confidence && <span className="text-xs text-muted-foreground">%</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className={cn("capitalize border px-2 py-0.5", latestConversation?.ai_lead_score ? getHealthColor('score', latestConversation.ai_lead_score) : 'bg-muted text-muted-foreground')}>
                        {latestConversation?.ai_lead_score ? `${latestConversation.ai_lead_score} Lead` : 'Unscored'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sentiment</span>
                      <Badge variant="outline" className={cn("capitalize border px-2 py-0.5", latestConversation?.ai_sentiment ? getHealthColor('sentiment', latestConversation.ai_sentiment) : 'bg-muted text-muted-foreground')}>
                        {latestConversation?.ai_sentiment || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Priority</span>
                      <Badge variant="outline" className={cn("capitalize border px-2 py-0.5", latestConversation?.priority ? getHealthColor('priority', latestConversation.priority) : 'bg-muted text-muted-foreground')}>
                        {latestConversation?.priority || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span className="font-medium text-foreground flex items-center gap-1.5 text-xs">
                        <Clock className="size-3 text-muted-foreground" />
                        {latestConversation?.updated_at ? formatDistanceToNow(new Date(latestConversation.updated_at), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="size-4" /> Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground">Added On</span>
                      <span className="text-foreground">{new Date(contact.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="pt-3 border-t border-border/50">
                      <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border"
                            style={{
                              backgroundColor: tag.color + '15',
                              borderColor: tag.color + '30',
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {customFields.length > 0 && (
                    <div className="pt-3 border-t border-border/50 space-y-2">
                      <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Attributes</h4>
                      {customFields.map((cf, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{cf.field_name}</span>
                          <span className="font-medium text-foreground truncate max-w-[150px]">{cf.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deal Summary */}
              {deals.length > 0 && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="size-4 text-primary" /> Deal Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(showAllDeals ? deals : deals.slice(0, 5)).map((deal) => (
                      <div 
                        key={deal.id} 
                        className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/60 transition-colors cursor-pointer"
                        onClick={() => {
                          setEditingDeal(deal);
                          setDealFormOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-foreground truncate max-w-[140px]" title={deal.title}>{deal.title}</span>
                          {deal.stage && (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                              style={{ backgroundColor: `${deal.stage.color}15`, borderColor: `${deal.stage.color}30`, color: deal.stage.color }}
                            >
                              {deal.stage.name}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(deal.value ?? 0, deal.currency || defaultCurrency)}
                        </span>
                      </div>
                    ))}
                    {!showAllDeals && deals.length > 5 && (
                      <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary mt-2" onClick={() => setShowAllDeals(true)}>
                        View all deals
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Open Activities (Tasks) */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="size-4 text-amber-500" /> Open Activities {tasks.length > 0 && `(${tasks.length})`}
                  </CardTitle>
                  <Button variant="ghost" size="icon-sm" className="size-6" onClick={() => setTaskModalOpen(true)}>
                    <Plus className="size-3" />
                  </Button>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="space-y-1.5">
                    {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2">
                          <CheckSquare className="size-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No tasks.</p>
                      </div>
                    ) : (
                      tasks.map((task) => {
                        const isCompleted = task.status === 'completed';
                        const isExpanded = expandedTaskId === task.id;
                        return (
                          <div 
                            key={task.id} 
                            className={cn(
                              "rounded-md transition-colors",
                              isCompleted ? "opacity-60" : "",
                              isExpanded ? "bg-muted/50 ring-1 ring-border" : ""
                            )}
                          >
                            <div 
                              className={cn(
                                "flex items-start gap-2.5 px-2.5 py-2 group cursor-pointer rounded-md",
                                !isExpanded && !isCompleted && "hover:bg-muted/50"
                              )}
                            >
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newStatus = isCompleted ? 'pending' : 'completed';
                                  const res = await fetch("/api/tasks", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ task_id: task.id, status: newStatus }),
                                  });
                                  if (res.ok) {
                                    fetchContactData();
                                  } else {
                                    toast.error("Failed to update task");
                                  }
                                }} 
                                className="mt-0.5 shrink-0 transition-colors"
                              >
                                {isCompleted ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <div className="h-4 w-4 rounded border-2 border-muted-foreground/30 group-hover:border-primary/60 transition-colors" />
                                )}
                              </button>
                              <div 
                                className="flex-1 min-w-0"
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className={cn(
                                    "text-xs font-medium leading-tight",
                                    isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                                  )}>
                                    {task.title}
                                  </p>
                                  <ChevronDown className={cn(
                                    "h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform",
                                    isExpanded && "rotate-180"
                                  )} />
                                </div>
                                {!isExpanded && task.description && (
                                  <p className="text-[11px] text-muted-foreground/70 line-clamp-1 mt-0.5">{task.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                              <div className="px-3 pb-2.5 pt-0 space-y-2">
                                {task.description && (
                                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-6.5 whitespace-pre-wrap">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/80 pl-6.5 pt-1 border-t border-border/40">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Created {new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  {task.due_date && task.status !== 'completed' && (
                                    <span className={cn(
                                      "flex items-center gap-1 font-medium",
                                      new Date(task.due_date) < new Date()
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                    )}>
                                      <Calendar className="h-3 w-3" />
                                      Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                  {isCompleted && task.updated_at && (
                                    <span className="flex items-center gap-1 font-medium text-emerald-600/80">
                                      <CheckSquare className="h-3 w-3" />
                                      Completed {new Date(task.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold uppercase",
                                    isCompleted 
                                      ? "bg-emerald-500/10 text-emerald-600" 
                                      : "bg-amber-500/10 text-amber-600"
                                  )}>
                                    {isCompleted ? "Done" : "Pending"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT COLUMN (65% - col-span-8)                              */}
            {/* ------------------------------------------------------------ */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* AI Summary Card (Premium Look) */}
              <Card className="border border-indigo-500/20 shadow-sm bg-gradient-to-br from-indigo-500/5 via-background to-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                      <BrainCircuit className="size-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-foreground">AI Intelligence Summary</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-semibold">
                    <Sparkles className="size-3 mr-1 fill-primary" /> Auto-Generated
                  </Badge>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-sm text-foreground/80 leading-relaxed space-y-4">
                    {(() => {
                      if (!latestConversation?.id) {
                        return (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <BrainCircuit className="size-8 text-indigo-500/50 mb-3" />
                            <p className="text-muted-foreground mb-4">
                              Start a WhatsApp conversation with this contact first to generate an AI intelligence summary.
                            </p>
                          </div>
                        );
                      }

                      if (!latestConversation?.ai_summary) {
                        return (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <BrainCircuit className="size-8 text-indigo-500/50 mb-3" />
                            <p className="text-muted-foreground mb-4">No AI summary generated for this contact yet.</p>
                            <Button 
                              variant="outline" 
                              className="border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/ai/summarize', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ conversation_id: latestConversation.id })
                                  });
                                  const data = await res.json();
                                  if (res.ok) {
                                    setLatestConversation({ 
                                      ...latestConversation, 
                                      ai_summary: data.summary,
                                      ai_lead_score: data.lead_score,
                                      ai_sentiment: data.sentiment,
                                      priority: data.priority,
                                      ai_confidence: data.confidence
                                    });
                                    toast.success("AI Analysis Complete!");
                                  } else {
                                    toast.error(data.error || "Failed to generate AI analysis");
                                  }
                                } catch (e: any) {
                                  toast.error("Failed to generate AI analysis");
                                }
                              }}
                            >
                              <Sparkles className="size-4 mr-2" />
                              Generate Summary
                            </Button>
                          </div>
                        );
                      }

                      let summaryObj = null;
                      try {
                        summaryObj = JSON.parse(latestConversation.ai_summary);
                      } catch(e) {}

                      if (summaryObj?.points) {
                        return (
                          <>
                            <p className="font-medium mb-3">{summaryObj.summary}</p>
                            <ul className="space-y-2 font-medium">
                              {summaryObj.points.map((pt: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-indigo-500 mt-0.5">•</span> {pt}
                                </li>
                              ))}
                            </ul>
                            {summaryObj.last_objection && (
                              <div className="mt-4 pt-3 border-t border-indigo-500/10">
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Last Objection Detected:</p>
                                <p className="text-sm font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded border border-amber-500/20 inline-block">
                                  {summaryObj.last_objection}
                                </p>
                              </div>
                            )}
                          </>
                        );
                      }

                      // Fallback for old plain text format
                      return <p className="whitespace-pre-wrap">{latestConversation.ai_summary}</p>;
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Customer 360 Timeline */}
              <Card className="border-border shadow-sm flex flex-col min-h-[600px] h-[calc(100vh-28rem)]">
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Activity Timeline
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Complete history of all interactions and events</p>
                  </div>
                  {/* Timeline Filters could go here */}
                </div>
                <div className="flex-1 overflow-hidden relative bg-card">
                  <CustomerTimeline contactId={contact.id} />
                </div>
              </Card>

            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editFormOpen && (
        <ContactForm
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          contact={contact}
          contactTags={tags.map(t => ({ contact_id: contact.id, tag_id: t.id }) as any)}
          onSaved={() => {
            fetchContactData();
            setEditFormOpen(false);
          }}
        />
      )}

      {/* Feature Modals */}
      <MeetingModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
        contactId={contactId}
        onMeetingGenerated={() => {
          toast.success("Meeting generated! Head to Inbox to send it.");
        }}
      />
      <QuoteModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        contactId={contactId}
        onQuoteGenerated={() => {
          toast.success("Quote generated! Head to Inbox to send it.");
        }}
      />
      <DealForm
        open={dealFormOpen}
        onOpenChange={(open) => {
          setDealFormOpen(open);
          if (!open) setEditingDeal(null);
        }}
        deal={editingDeal}
        pipelineId={pipelines[0]?.id || editingDeal?.pipeline_id || ""}
        stages={pipelineStages}
        onSaved={fetchContactData}
      />
      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        contactId={contactId}
        onSaved={fetchContactData}
      />
      <TicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        contactId={contactId}
      />
    </div>
  );
}
