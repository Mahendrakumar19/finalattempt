"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { maskPhone } from "@/lib/masking";
import { uploadAccountMedia } from "@/lib/storage/upload-media";
import type { Contact, Deal, ContactNote, Tag, Conversation } from "@/types";
import {
  MoreVertical,
  Pencil,
  Trash,
  Info,
  Calendar,
  Phone,
  Mail,
  Video,
  Settings,
  X,
  Plus,
  RefreshCcw,
  Bot,
  User as UserIcon,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  User,
  Tag as TagIcon,
  DollarSign,
  StickyNote,
  CheckSquare,
  Receipt,
  FileText,
  MessageCircle,
  Clock,
  ChevronDown,
  Paperclip,
  Loader2,
  FileIcon,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerTimeline } from "./customer-timeline";
import { format } from "date-fns";
import { toast } from "sonner";

interface ContactSidebarProps {
  contact: Contact | null;
  conversation?: Conversation | null;
  onClose?: () => void;
}

export interface Meeting {
  id: string;
  title: string;
  meeting_link?: string;
  scheduled_at?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface Quote {
  id: string;
  description: string;
  amount: number;
  currency: string;
  valid_until?: string;
  status: string;
  created_at: string;
}

export function ContactSidebar({
  contact,
  conversation,
  onClose,
}: ContactSidebarProps) {
  const { account, accountId, profile, isAgent } = useAuth();
  const agentName = profile?.full_name || "Your Agent";
  const [copied, setCopied] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [notes, setNotes] = useState<(ContactNote & { is_internal_message?: boolean })[]>([]);
  const [tags, setTags] = useState<(Tag & { contact_tag_id: string })[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [summary, setSummary] = useState(conversation?.ai_summary || "");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<{ [key: string]: string }>({});
  const [savingMeetingNote, setSavingMeetingNote] = useState<{ [key: string]: boolean }>({});
  const [generatingFollowup, setGeneratingFollowup] = useState<{ [key: string]: boolean }>({});
  
  const [msgStats, setMsgStats] = useState({ bot: 0, agent: 0, customer: 0 });
  const [expandedSections, setExpandedSections] = useState<string[]>(["ai-insights", "deals"]);
  
  // Track loaded sections per contact to avoid re-fetching on toggle
  const loadedSectionsRef = useRef<{ [key: string]: boolean }>({});

  const handleAccordionChange = (value: string[]) => {
    setExpandedSections(value);
  };

  const handleGenerateFollowup = async (meeting: Meeting) => {
    const notesToUse = meetingNotes[meeting.id] ?? meeting.notes;
    if (!notesToUse) return;

    setGeneratingFollowup(prev => ({ ...prev, [meeting.id]: true }));
    try {
      const res = await fetch("/api/ai/meeting-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notesToUse,
          contactName: contact?.name,
          meetingTitle: meeting.title,
          agentName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        await navigator.clipboard.writeText(data.message);
        toast.success("Follow-up drafted and copied to clipboard!");
      } else {
        toast.error(data.error || "Failed to generate follow-up");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate follow-up");
    } finally {
      setGeneratingFollowup(prev => ({ ...prev, [meeting.id]: false }));
    }
  };

  const handleSaveMeetingNote = async (meetingId: string) => {
    const note = meetingNotes[meetingId];
    if (note === undefined) return;
    
    setSavingMeetingNote(prev => ({ ...prev, [meetingId]: true }));
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      const data = await res.json();
      if (res.ok && data.meeting) {
        setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, notes: note } : m));
        toast.success("Meeting notes saved");
      } else {
        toast.error(data.error || "Failed to save meeting notes");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save meeting notes");
    } finally {
      setSavingMeetingNote(prev => ({ ...prev, [meetingId]: false }));
    }
  };

  const parsedSummary = useMemo(() => {
    if (!summary) return null;
    
    try {
      const data = JSON.parse(summary);
      if (data.summary || data.points) {
        return {
          summaryText: data.summary || '',
          points: data.points || [],
          lastObjection: data.last_objection || null,
          actionText: data.action || null
        };
      }
    } catch (e) {
      // Fallback for old format
    }

    const parts = summary.split('ACTION:');
    if (parts.length > 1) {
      return {
        summaryText: parts[0].replace('SUMMARY:', '').trim(),
        actionText: parts[1].trim(),
        points: [],
        lastObjection: null
      };
    }
    return { summaryText: summary, actionText: null, points: [], lastObjection: null };
  }, [summary]);

  useEffect(() => {
    setSummary(conversation?.ai_summary || "");
  }, [conversation?.id, conversation?.ai_summary]);

  const handleGenerateSummary = useCallback(async () => {
    if (!conversation) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversation.id }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
      } else {
        toast.error(data.error || "Failed to generate summary");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate summary");
    } finally {
      setGeneratingSummary(false);
    }
  }, [conversation]);

  const handleCreateTask = useCallback(async (actionText: string) => {
    if (!contact) return;
    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Follow up",
          description: actionText,
          contact_id: contact.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setTaskCreated(true);
        toast.success("Task created!");
      } else {
        toast.error(data.error || "Failed to create task");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  }, [contact]);

  const handleUpdateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      } else {
        toast.error(data.error || "Failed to update task");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update task");
    }
  }, []);

  useEffect(() => {
    if (!contact) return;
    const cid = contact.id;
    const supabase = createClient();

    // AI Insights (Tags & Stats)
    if (expandedSections.includes("ai-insights") && !loadedSectionsRef.current[`${cid}_ai-insights`]) {
      loadedSectionsRef.current[`${cid}_ai-insights`] = true;
      
      // Fetch Tags
      supabase.from("contact_tags").select("id, tag_id, tags(*)").eq("contact_id", cid).then(({ data }) => {
        if (data) {
          const mapped = data
            .filter((ct: Record<string, unknown>) => ct.tags)
            .map((ct: Record<string, unknown>) => ({
              ...(ct.tags as Tag),
              contact_tag_id: ct.id as string,
            }));
          setTags(mapped);
        }
      });

      // Fetch Stats
      if (conversation?.id) {
        Promise.all([
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversation.id).eq("sender_type", "bot"),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversation.id).eq("sender_type", "agent"),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversation.id).eq("sender_type", "customer"),
        ]).then(([botRes, agentRes, custRes]) => {
          setMsgStats({
            bot: botRes.count || 0,
            agent: agentRes.count || 0,
            customer: custRes.count || 0,
          });
        });
      }
    }

    // Deals & Quotes
    if (expandedSections.includes("deals") && !loadedSectionsRef.current[`${cid}_deals`]) {
      loadedSectionsRef.current[`${cid}_deals`] = true;
      supabase.from("deals").select("*, stage:pipeline_stages(*)").eq("contact_id", cid).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setDeals(data);
      });
      supabase.from("quotes").select("*").eq("contact_id", cid).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setQuotes(data);
      });
    }

    // Meetings
    if (expandedSections.includes("meetings") && !loadedSectionsRef.current[`${cid}_meetings`]) {
      loadedSectionsRef.current[`${cid}_meetings`] = true;
      supabase.from("meetings").select("*").eq("contact_id", cid).order("scheduled_at", { ascending: true }).then(({ data }) => {
        if (data) setMeetings(data);
      });
    }

    // Tasks
    if (expandedSections.includes("tasks") && !loadedSectionsRef.current[`${cid}_tasks`]) {
      loadedSectionsRef.current[`${cid}_tasks`] = true;
      fetch(`/api/tasks?contact_id=${cid}`).then(res => res.json()).then(data => {
        if (data?.tasks) setTasks(data.tasks);
      }).catch(() => {});
    }

    // Notes & Files
    if (expandedSections.includes("notes") && !loadedSectionsRef.current[`${cid}_notes`]) {
      loadedSectionsRef.current[`${cid}_notes`] = true;
      
      Promise.all([
        supabase.from("contact_notes").select("*").eq("contact_id", cid),
        conversation?.id 
          ? supabase.from("messages").select("*").eq("conversation_id", conversation.id).eq("is_internal", true) 
          : Promise.resolve({ data: [] })
      ]).then(([notesRes, messagesRes]) => {
        const standardNotes = (notesRes.data || []) as ContactNote[];
        const internalNotes = (messagesRes.data || []).map((m: any) => ({
          id: m.id,
          contact_id: cid,
          user_id: m.sender_id || '',
          note_text: m.content_text,
          media_url: m.media_url,
          created_at: m.created_at,
          is_internal_message: true
        }));
        
        const merged = [...standardNotes, ...internalNotes].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setNotes(merged);
      });
    }
  }, [expandedSections, contact, conversation?.id]);

  const handleCopyPhone = useCallback(async () => {
    if (!contact?.phone) return;
    await navigator.clipboard.writeText(contact.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [contact]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contact || !accountId) return;

    setIsUploading(true);
    try {
      const { publicUrl } = await uploadAccountMedia("chat-media", file);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from("contact_notes")
        .insert({
          contact_id: contact.id,
          account_id: accountId,
          user_id: session?.user?.id,
          media_url: publicUrl,
          media_name: file.name,
          media_type: file.type,
          note_text: null,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setNotes((prev) => [data, ...prev]);
      
      toast.success("File uploaded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddNote = useCallback(async () => {
    if (!contact || !newNote.trim()) return;
    if (!accountId) return;
    setAddingNote(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    const { data, error } = await supabase
      .from("contact_notes")
      .insert({
        contact_id: contact.id,
        account_id: accountId,
        user_id: user?.id,
        note_text: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    }
    setAddingNote(false);
  }, [contact, newNote, accountId]);

  if (!contact) {
    return (
      <div className="flex h-full w-full items-center justify-center border-l border-border bg-card">
        <p className="text-sm text-muted-foreground">Select a conversation</p>
      </div>
    );
  }

  const maskedPhone = maskPhone(contact.phone, isAgent, account?.mask_agent_phones ?? false);
  const displayName = contact.name || maskedPhone;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card relative">
      {/* Mobile close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 lg:hidden z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}

      <div className="p-4 pt-6 shrink-0">
        {/* Contact Info (Always Visible) */}
        <div className="flex flex-col items-center text-center pb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              {contact.avatar_url ? (
                <img
                  src={contact.avatar_url}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">
              {displayName}
            </h3>
            {contact.company && (
              <p className="text-sm font-medium text-muted-foreground mt-0.5">{contact.company}</p>
            )}

            <div className="mt-4 w-full grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyPhone}
                className="flex items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-2 text-xs font-medium transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="truncate">{maskedPhone}</span>
              </button>
              {contact.email && (
                <div className="flex items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground px-3 py-2 text-xs font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* ── Tabs (Overview vs Timeline) ───────────────────────── */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pb-2 border-b border-border shrink-0">
          <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1 rounded-lg h-9">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md">
              Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-y-auto no-scrollbar m-0 outline-none px-4">
          <Accordion 
                multiple
                value={expandedSections}
                onValueChange={handleAccordionChange as any}
                className="w-full border-t-0"
              >
            
            {/* AI Insights & Analytics */}
            {conversation && (
              <AccordionItem value="ai-insights" className="border-b-0">
                <AccordionTrigger className="hover:no-underline py-3 px-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    AI Insights & Analytics
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-3">
                  <div className="space-y-3">
                    {/* Summary */}
                    {summary ? (
                      <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 px-3 py-2.5">
                        {parsedSummary?.actionText || parsedSummary?.points?.length ? (
                          <>
                            <p className="text-xs text-muted-foreground leading-relaxed"><strong className="text-foreground">Summary:</strong><br />{parsedSummary.summaryText}</p>
                            
                            {parsedSummary.points && parsedSummary.points.length > 0 && (
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {parsedSummary.points.map((pt: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1.5"><span className="text-purple-500">•</span> {pt}</li>
                                ))}
                              </ul>
                            )}
                            
                            {parsedSummary.lastObjection && (
                              <div className="mt-2 pt-2 border-t border-purple-500/10">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Last Objection:</p>
                                <p className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded inline-block">{parsedSummary.lastObjection}</p>
                              </div>
                            )}

                            {parsedSummary.actionText && (
                              <div className="border-t border-purple-500/10 pt-2 mt-2">
                                <p className="text-xs text-muted-foreground leading-relaxed"><strong className="text-foreground">Action:</strong><br />{parsedSummary.actionText}</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={cn(
                                    "mt-2 w-full text-xs h-7",
                                    taskCreated 
                                      ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 cursor-default" 
                                      : "border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                                  )}
                                  onClick={() => !taskCreated && handleCreateTask(parsedSummary.actionText!)}
                                  disabled={creatingTask || taskCreated}
                                >
                                  <CheckSquare className="w-3 h-3 mr-2" />
                                  {creatingTask ? "Creating..." : taskCreated ? "Task Created ✓" : "Convert to Task"}
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
                        )}
                      </div>
                    ) : null}

                    {/* Generate / Regenerate Button — always visible */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full text-xs h-7",
                        summary 
                          ? "text-muted-foreground hover:text-purple-600 hover:border-purple-500/30" 
                          : "text-muted-foreground border-dashed"
                      )}
                      onClick={() => {
                        setTaskCreated(false);
                        handleGenerateSummary();
                      }}
                      disabled={generatingSummary}
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      {generatingSummary ? "Analyzing..." : summary ? "Regenerate AI Summary" : "Generate AI Summary"}
                    </Button>

                    {/* Tags */}
                    {((tags && tags.length > 0) || ((conversation as any).ai_auto_tags && (conversation as any).ai_auto_tags.length > 0)) && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5 block">Conversation Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                          <span
                            key={tag.contact_tag_id}
                            className="rounded-md px-2 py-1 text-[10px] font-bold tracking-wide uppercase"
                            style={{
                              backgroundColor: `${tag.color}15`,
                              color: tag.color,
                              border: `1px solid ${tag.color}30`
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {(conversation as any).ai_auto_tags?.map((tagStr: string, idx: number) => (
                          <span
                            key={`ai-tag-${idx}`}
                            className="rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 px-2 py-1 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> {tagStr}
                          </span>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Analytics */}
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5 block">Message Volume</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center justify-center rounded-md bg-muted/50 border border-border/50 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Bot</span>
                        <span className="text-sm font-black text-foreground mt-0.5">{msgStats.bot}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-md bg-muted/50 border border-border/50 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Agent</span>
                        <span className="text-sm font-black text-foreground mt-0.5">{msgStats.agent}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-md bg-muted/50 border border-border/50 py-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Customer</span>
                        <span className="text-sm font-black text-foreground mt-0.5">{msgStats.customer}</span>
                      </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Deals & Quotes */}
            <AccordionItem value="deals" className="border-b-0">
              <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    Deals & Quotes
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-3">
                <div className="space-y-4">
                  {/* Deals */}
                  <div className="space-y-2">
                    {deals.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No active deals</p>
                    ) : (
                      deals.map((deal) => (
                        <div key={deal.id} className="rounded-lg border border-border bg-card p-2.5 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{deal.title}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {deal.currency ?? "$"}{deal.value.toLocaleString()}
                            </span>
                            {deal.stage && (
                              <span
                                className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: `${deal.stage.color}15`, color: deal.stage.color }}
                              >
                                {deal.stage.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Quotes */}
                  {quotes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Quotes Sent</p>
                      {quotes.map((quote) => (
                        <div key={quote.id} className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
                          <p className="text-xs font-medium text-foreground line-clamp-1">{quote.description}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{quote.currency} {quote.amount.toLocaleString()}</span>
                            <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", 
                              quote.status === 'accepted' ? "bg-green-500/15 text-green-600" :
                              quote.status === 'rejected' ? "bg-red-500/15 text-red-600" :
                              "bg-yellow-500/15 text-yellow-600"
                            )}>
                              {quote.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Meetings & Appointments */}
            <AccordionItem value="meetings" className="border-b-0">
              <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Meetings
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-3">
                <div className="space-y-3">
                  {meetings.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No meetings scheduled</p>
                  ) : (
                    meetings.map((meeting) => {
                      const isPast = meeting.scheduled_at ? new Date(meeting.scheduled_at) < new Date() : false;
                      const hasNotes = !!(meetingNotes[meeting.id] ?? meeting.notes);
                      return (
                        <div key={meeting.id} className={cn("rounded-lg border p-2.5 shadow-sm", isPast ? 'bg-muted/30 border-border/50' : 'bg-card border-border')}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-sm font-semibold line-clamp-1", isPast ? "text-muted-foreground" : "text-foreground")}>{meeting.title}</p>
                              <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5",
                                meeting.status === 'completed' ? 'bg-green-500/15 text-green-600' :
                                meeting.status === 'cancelled' ? 'bg-red-500/15 text-red-600' :
                                isPast ? 'bg-orange-500/15 text-orange-600' :
                                'bg-primary/15 text-primary'
                              )}>
                                {meeting.status === 'completed' ? 'Done' : meeting.status === 'cancelled' ? 'Cancelled' : isPast ? 'Past' : 'Upcoming'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {meeting.scheduled_at ? format(new Date(meeting.scheduled_at), "MMM d, yyyy · h:mm a") : "TBD"}
                            </span>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-border/50">
                            <textarea
                              value={meetingNotes[meeting.id] ?? meeting.notes ?? ""}
                              onChange={(e) => setMeetingNotes(prev => ({ ...prev, [meeting.id]: e.target.value }))}
                              placeholder="Take notes..."
                              rows={2}
                              className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
                            />
                            <div className="mt-1.5 flex gap-1.5">
                              <Button size="sm" variant="secondary" className="h-6 flex-1 text-[10px] font-semibold" onClick={() => handleSaveMeetingNote(meeting.id)} disabled={savingMeetingNote[meeting.id]}>
                                {savingMeetingNote[meeting.id] ? "Saving..." : "Save Notes"}
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 flex-1 text-[10px] font-semibold text-primary border-primary/20 hover:bg-primary/10" onClick={() => handleGenerateFollowup(meeting)} disabled={generatingFollowup[meeting.id] || !hasNotes}>
                                <Sparkles className="h-3 w-3 mr-1" /> Follow-up
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Tasks & Tickets */}
            <AccordionItem value="tasks" className="border-b-0">
              <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <CheckSquare className="h-3.5 w-3.5" />
                    Tasks & Tickets
                  </div>
                  {tasks.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                      {tasks.filter(t => t.status !== 'completed').length}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-3">
                <div className="space-y-1.5">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 text-center">No tasks yet</p>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateTaskStatus(task.id, isCompleted ? 'pending' : 'completed');
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
              </AccordionContent>
            </AccordionItem>

            {/* Notes & Files */}
            <AccordionItem value="notes" className="border-b-0">
              <AccordionTrigger className="hover:no-underline py-3 px-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes & Files
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-3">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 bg-muted/30 p-2 rounded-xl border border-border/50 focus-within:bg-muted/50 focus-within:border-primary/30 transition-colors">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type an internal note..."
                      rows={2}
                      className="resize-none bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none px-1"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button size="sm" className="h-7 rounded-md text-[10px] px-3 font-semibold" onClick={handleAddNote} disabled={!newNote.trim() || addingNote}>
                        {addingNote ? "Adding..." : "Add Note"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="group relative rounded-xl bg-card border border-border/50 p-3 shadow-sm transition-all hover:border-border">
                        {note.is_internal_message && (
                          <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-500/80">
                            <Lock className="h-3 w-3" />
                            Internal Message
                          </div>
                        )}
                        {note.media_url && (
                          <a href={note.media_url} target="_blank" rel="noopener noreferrer" className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            {note.media_type?.startsWith('image/') ? (
                              <div className="h-8 w-8 rounded bg-border overflow-hidden shrink-0">
                                <img src={note.media_url} alt="Attachment" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate text-foreground">{note.media_name || 'Attachment'}</p>
                              <p className="text-[10px] text-muted-foreground truncate">Click to view</p>
                            </div>
                          </a>
                        )}
                        {note.note_text && (
                          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                            {note.note_text}
                          </p>
                        )}
                        <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {format(new Date(note.created_at), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            </Accordion>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 m-0 outline-none h-full overflow-hidden">
              <CustomerTimeline contactId={contact.id} />
            </TabsContent>
          </Tabs>
    </div>
  );
}
