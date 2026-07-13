"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { maskPhone } from "@/lib/masking";
import type { Conversation, ConversationStatus } from "@/types";
import { Search, ChevronDown, Flame, Smile, Frown, Meh } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationListProps {
  activeConversationId: string | null;
  onSelect: (conversation: Conversation) => void;
  conversations: Conversation[];
  onConversationsLoaded: (conversations: Conversation[]) => void;
  /**
   * Increment to force the fetch effect below to refire. The parent
   * bumps this on realtime reconnect / tab visibility → visible so the
   * list catches up on any events sent while the WS was disconnected
   * or the tab was throttled. Optional so existing callers keep working.
   */
  resyncToken?: number;
}

const STATUS_COLORS: Record<ConversationStatus, string> = {
  open: "bg-primary",
  pending: "bg-amber-500",
  closed: "bg-muted-foreground",
};

type InboxFilter = "all" | "incoming" | "my_queue" | "department_queue" | "assigned" | "pending" | "closed";

const FILTER_OPTIONS: { label: string; value: InboxFilter }[] = [
  { label: "All", value: "all" },
  { label: "Incoming", value: "incoming" },
  { label: "My Queue", value: "my_queue" },
  { label: "Department Queue", value: "department_queue" },
  { label: "Assigned", value: "assigned" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
];

export function ConversationList({
  activeConversationId,
  onSelect,
  conversations,
  onConversationsLoaded,
  resyncToken = 0,
}: ConversationListProps) {
  const { account, user, isAgent } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [loading, setLoading] = useState(true);

  // Keep the latest callback in a ref so the fetch effect below can
  // have a stable, empty-dep identity. Previously the fetch useCallback
  // depended on `onConversationsLoaded`, which depends on the parent's
  // `deepLinkConvId` — so every URL change (including one the parent
  // triggered via router.replace after a click) caused a fresh
  // conversations fetch. That extra refetch was the trigger for the
  // deep-link auto-select running a second time and wiping the active
  // thread's messages.
  // Mutation lives in an effect (not render) per React 19's refs rule;
  // the fetch runs once on mount so it's fine to read the slightly
  // older value — the very next render updates the ref for any
  // subsequent async completion.
  const onConversationsLoadedRef = useRef(onConversationsLoaded);
  useEffect(() => {
    onConversationsLoadedRef.current = onConversationsLoaded;
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, contact:contacts(*), conversation_metrics(message_count_agent)")
        .order("last_message_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        // Supabase errors have non-enumerable properties — log fields explicitly
        console.error("Failed to fetch conversations:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setLoading(false);
        return;
      }

      onConversationsLoadedRef.current(data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resyncToken]);

  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.from('departments').select('id, name').order('name');
      if (data) setDepartments(data);
    })();
  }, []);

  const [slaConfig, setSlaConfig] = useState<{
    sla_enabled: boolean;
    sla_first_reply_min: number;
    sla_subsequent_reply_min: number;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("user_id", user.id)
        .single();
      if (!profile?.account_id) return;
      const { data: cfg } = await supabase
        .from("whatsapp_config")
        .select("sla_enabled, sla_first_reply_min, sla_subsequent_reply_min")
        .eq("account_id", profile.account_id)
        .maybeSingle();
      if (cfg) {
        setSlaConfig(cfg);
      }
    })();
  }, [resyncToken]);

  const filtered = useMemo(() => {
    let result = conversations;

    if (filter === "incoming") {
      result = result.filter((c: any) => c.routing_status === "unassigned" || c.routing_status === "needs_manual_review");
    } else if (filter === "my_queue") {
      result = result.filter((c) => c.assigned_agent_id === user?.id);
    } else if (filter === "department_queue") {
      result = result.filter((c: any) => c.routing_status === "department_queue");
    } else if (filter === "assigned") {
      result = result.filter((c) => c.assigned_agent_id !== null);
    } else if (filter === "pending" || filter === "closed") {
      result = result.filter((c) => c.status === filter);
    }

    if (selectedDept !== "all") {
      result = result.filter((c: any) => c.department_id === selectedDept);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const name = c.contact?.name?.toLowerCase() ?? "";
        const phone = c.contact?.phone?.toLowerCase() ?? "";
        const lastMsg = c.last_message_text?.toLowerCase() ?? "";
        return name.includes(q) || phone.includes(q) || lastMsg.includes(q);
      });
    }

    return result;
  }, [conversations, filter, search, selectedDept]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

  const handleSelect = useCallback(
    (conv: Conversation) => {
      onSelect(conv);
    },
    [onSelect]
  );

  const activeFilter = FILTER_OPTIONS.find((o) => o.value === filter);

  return (
    // w-full on mobile so the list occupies the whole viewport when it's
    // the single pane showing; on desktop, ThreePanel handles its exact width.
    <div className="flex h-full w-full flex-col bg-card">
      {/* Search + Filter */}
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search conversations..."
            className="border-border bg-muted pl-9 text-sm text-foreground placeholder-muted-foreground focus:border-primary/50"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
              {activeFilter?.label ?? "All"}
              <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="border-border bg-popover"
          >
            {FILTER_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "text-sm",
                  filter === opt.value
                    ? "text-primary"
                    : "text-popover-foreground"
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {departments.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted ml-2">
                {selectedDept === 'all' ? "All Teams" : departments.find(d => d.id === selectedDept)?.name ?? "Team"}
                <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border bg-popover"
            >
              <DropdownMenuItem
                onClick={() => setSelectedDept('all')}
                className={cn("text-sm", selectedDept === 'all' ? "text-primary" : "text-popover-foreground")}
              >
                All Teams
              </DropdownMenuItem>
              {departments.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setSelectedDept(opt.id)}
                  className={cn(
                    "text-sm",
                    selectedDept === opt.id
                      ? "text-primary"
                      : "text-popover-foreground"
                  )}
                >
                  {opt.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Conversation Items.
          `min-h-0` is load-bearing: a flex child defaults to
          min-height:auto, so without it this ScrollArea grows to fit
          every conversation instead of shrinking to the remaining
          space — the list then overflows and gets clipped by the
          parent's overflow-hidden with no scrollbar (issue #229). */}
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={handleSelect}
                slaConfig={slaConfig}
                isAgent={isAgent}
                maskingEnabled={account?.mask_agent_phones ?? false}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
  slaConfig: {
    sla_enabled: boolean;
    sla_first_reply_min: number;
    sla_subsequent_reply_min: number;
  } | null;
  isAgent: boolean;
  maskingEnabled: boolean;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  slaConfig,
  isAgent,
  maskingEnabled,
}: ConversationItemProps) {
  const contact = conversation.contact;
  const maskedPhone = maskPhone(contact?.phone, isAgent, maskingEnabled);
  const displayName = contact?.name || maskedPhone || "Unknown";
  const initials = displayName.charAt(0).toUpperCase();

  const handleClick = useCallback(() => {
    onSelect(conversation);
  }, [onSelect, conversation]);

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
      })
    : "";

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!slaConfig?.sla_enabled || conversation.status === 'closed' || conversation.last_message_sender_type !== 'customer') {
      return;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [slaConfig, conversation]);

  const slaBadge = useMemo(() => {
    if (!slaConfig?.sla_enabled || conversation.status === 'closed' || conversation.last_message_sender_type !== 'customer' || !conversation.last_message_at) {
      return null;
    }

    const metrics = (conversation as any).conversation_metrics;
    const msgCountAgent = metrics?.message_count_agent ?? 0;
    const thresholdMin = msgCountAgent === 0 
      ? (slaConfig.sla_first_reply_min ?? 5)
      : (slaConfig.sla_subsequent_reply_min ?? 15);

    const limitMs = thresholdMin * 60 * 1000;
    const elapsedMs = now - new Date(conversation.last_message_at).getTime();
    const remainingMs = limitMs - elapsedMs;

    if (remainingMs <= 0) {
      return {
        type: 'breached' as const,
        text: formatSlaTimer(remainingMs)
      };
    } else if (elapsedMs >= 0.7 * limitMs) {
      return {
        type: 'warning' as const,
        text: formatSlaTimer(remainingMs)
      };
    }
    return null;
  }, [slaConfig, conversation, now]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer border-l-2",
        isActive 
          ? "border-primary bg-muted/70"
          : slaBadge?.type === 'breached'
            ? "border-red-500/50 bg-red-950/10 hover:bg-red-950/20"
            : slaBadge?.type === 'warning'
              ? "border-amber-500/50 bg-amber-950/10 hover:bg-amber-950/20"
              : "border-transparent"
      )}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
        {contact?.avatar_url ? (
          <img
            src={contact.avatar_url}
            alt={displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 grid grid-cols-1 gap-0.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {conversation.last_message_text || "No messages yet"}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {conversation.unread_count > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {conversation.unread_count}
              </span>
            )}
            
            {slaBadge && (
              <span 
                title={slaBadge.type === 'breached' ? "SLA Breached" : "SLA Warning"}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold tabular-nums border",
                  slaBadge.type === 'breached' 
                    ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" 
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}
              >
                {slaBadge.text}
              </span>
            )}
            
            {/* AI Badges */}
            {(conversation as any).ai_lead_score === 'hot' && <span title="Hot Lead"><Flame className="h-3 w-3 text-red-500" /></span>}
            {(conversation as any).ai_lead_score === 'warm' && <span title="Warm Lead"><Flame className="h-3 w-3 text-orange-400" /></span>}
            
            {(conversation as any).ai_sentiment === 'positive' && <span title="Positive Sentiment"><Smile className="h-3 w-3 text-emerald-500" /></span>}
            {(conversation as any).ai_sentiment === 'negative' && <span title="Negative Sentiment"><Frown className="h-3 w-3 text-red-500" /></span>}
            {(conversation as any).ai_sentiment === 'neutral' && <span title="Neutral Sentiment"><Meh className="h-3 w-3 text-muted-foreground" /></span>}

            <span
              className={cn(
                "h-2 w-2 rounded-full",
                STATUS_COLORS[conversation.status]
              )}
              title={conversation.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatSlaTimer(ms: number): string {
  const absoluteMs = Math.abs(ms);
  const totalSeconds = Math.floor(absoluteMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const prefix = ms < 0 ? "-" : "";
  return `${prefix}${minutes}:${seconds.toString().padStart(2, '0')}`;
}
