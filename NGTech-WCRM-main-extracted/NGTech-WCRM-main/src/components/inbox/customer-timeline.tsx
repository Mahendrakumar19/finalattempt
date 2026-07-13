"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, isToday, isYesterday, isThisWeek, subWeeks, isSameWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  DollarSign, LifeBuoy, 
  Calendar, CheckSquare, Settings,
  ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  category: string;
  activity_type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  is_milestone: boolean;
  created_at: string;
  actor?: {
    email: string;
    raw_user_meta_data?: { full_name?: string };
  };
}

interface CustomerTimelineProps {
  contactId: string;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "sales", label: "Sales", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "support", label: "Support", color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "meetings", label: "Meetings", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "tasks", label: "Tasks", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { id: "system", label: "System", color: "text-slate-500", bg: "bg-slate-500/10" },
];

function getCategoryConfig(category: string) {
  return CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1]; // fallback to system
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "sales": return <DollarSign className="h-4 w-4" />;
    case "support": return <LifeBuoy className="h-4 w-4" />;
    case "meetings": return <Calendar className="h-4 w-4" />;
    case "tasks": return <CheckSquare className="h-4 w-4" />;
    case "system": default: return <Settings className="h-4 w-4" />;
  }
}

const isLastWeek = (date: Date) => isSameWeek(date, subWeeks(new Date(), 1));

function groupActivitiesByDate(activities: Activity[]) {
  const groups: Record<string, Activity[]> = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.created_at);
    let groupKey = "";
    
    if (isToday(date)) groupKey = "Today";
    else if (isYesterday(date)) groupKey = "Yesterday";
    else if (isThisWeek(date)) groupKey = "This Week";
    else if (isLastWeek(date)) groupKey = "Last Week";
    else groupKey = format(date, "MMMM yyyy"); // e.g., "June 2026"
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(activity);
  });
  
  return groups;
}

export function CustomerTimeline({ contactId }: CustomerTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchActivities = async (currentPage: number, currentFilter: string, append: boolean = false) => {
    try {
      const res = await fetch(`/api/activities?contact_id=${contactId}&category=${currentFilter}&page=${currentPage}&limit=20`);
      const data = await res.json();
      
      if (res.ok) {
        if (append) {
          setActivities(prev => [...prev, ...data.activities]);
        } else {
          setActivities(data.activities);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchActivities(1, filter, false);
    // Note: To calculate accurate overall stats, you typically need an aggregate endpoint.
    // For now, we will aggregate based on loaded items, or omit until a dedicated endpoint is built.
  }, [contactId, filter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, filter, true);
  };

  const groupedActivities = useMemo(() => groupActivitiesByDate(activities), [activities]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* Filters (Horizontal Scroll) */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border p-3 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === cat.id 
                ? "bg-foreground text-background" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading && page === 1 ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            Loading timeline...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Settings className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No activities found</p>
            <p className="text-xs text-muted-foreground">No events recorded for this category yet.</p>
          </div>
        ) : (
          Object.entries(groupedActivities).map(([groupName, groupActivities]) => (
            <div key={groupName} className="relative">
              {/* Date Group Header */}
              <div className="sticky top-0 z-10 flex items-center gap-4 bg-card/95 py-2 backdrop-blur-sm">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {groupName}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Group Items */}
              <div className="mt-4 space-y-4">
                {groupActivities.map((activity, idx) => {
                  const config = getCategoryConfig(activity.category);
                  const isLast = idx === groupActivities.length - 1;
                  
                  return (
                    <ActivityCard 
                      key={activity.id} 
                      activity={activity} 
                      config={config} 
                      isLast={isLast} 
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}

        {hasMore && !loading && (
          <div className="pt-4 pb-8 flex justify-center">
            <Button variant="outline" size="sm" onClick={loadMore} className="w-full max-w-[200px]">
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ activity, config, isLast }: { activity: Activity, config: any, isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={cn("relative flex gap-4", activity.is_milestone && "bg-primary/5 -mx-4 px-4 py-2 rounded-lg")}>
      {/* Vertical line connector */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-[-16px] w-0.5 bg-border z-0" />
      )}
      
      {/* Icon */}
      <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm", config.bg, config.color, "border-background")}>
        {getCategoryIcon(activity.category)}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div 
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground truncate">
                {activity.title}
              </h4>
              {activity.is_milestone && (
                <span className="inline-flex items-center rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  MILESTONE
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 break-words">
              {activity.description}
            </p>
          </div>
          
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span>{format(new Date(activity.created_at), "h:mm a")}</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </div>
        </div>
        
        {/* Expanded Metadata */}
        {expanded && (
          <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs">
            <div className="grid grid-cols-2 gap-2 text-muted-foreground mb-3">
              <div>
                <span className="font-medium text-foreground">Actor: </span>
                {activity.actor?.raw_user_meta_data?.full_name || activity.actor?.email || "System"}
              </div>
              <div>
                <span className="font-medium text-foreground">Category: </span>
                <span className="capitalize">{activity.category}</span>
              </div>
            </div>
            
            {/* Deep Links based on metadata */}
            {activity.metadata?.deal_id && (
              <Button size="sm" variant="secondary" className="mt-3 h-7 text-xs w-full justify-between">
                View Deal Details <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            {activity.metadata?.ticket_id && (
              <Button size="sm" variant="secondary" className="mt-3 h-7 text-xs w-full justify-between">
                View Support Ticket <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
