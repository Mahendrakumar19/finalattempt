"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, X, MessageSquare, Briefcase, Tag, Target, Search, FileText, Calendar, Link2, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface AICopilotWidgetProps {
  conversationId: string;
  contactId: string;
  onApplyDraft?: (text: string) => void;
}

export function AICopilotWidget({ conversationId, contactId, onApplyDraft }: AICopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"actions" | "chat">("actions");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        // Keep it open if they just clicked to copy or something inside, but close if they click far away
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runCopilotAction = async (action: string, query?: string) => {
    if (!session) return;
    setIsLoading(true);
    setActionType(action);
    setResult(null);
    setIsOpen(true);

    try {
      const res = await fetch('/api/workspace/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationId,
          query
        })
      });

      if (!res.ok) throw new Error("Failed to run copilot action");
      
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      toast.error("Copilot encountered an error. Please try again.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (typeof result === 'string') {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  const handleApplyDraft = () => {
    if (onApplyDraft && typeof result === 'string') {
      onApplyDraft(result);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex shrink-0 items-center justify-end px-3 pb-1">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold">AI Copilot</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className="mx-3 mb-2 shrink-0 bg-card border border-border shadow-lg rounded-xl overflow-hidden flex flex-col max-h-[420px] transition-all duration-300"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 p-4 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold text-lg">AI Copilot</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-blue-500 animate-pulse" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
              Analyzing context...
            </p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {typeof result === 'string' ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 border border-blue-100 dark:border-blue-800">
                <p className="whitespace-pre-wrap leading-relaxed">{result}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Object rendering for intent/recommendations */}
                {Object.entries(result).map(([key, value]) => (
                  <div key={key} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      {key.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions for result */}
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setResult(null)} 
                className="flex-1 px-3 py-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium"
              >
                Back
              </button>
              {typeof result === 'string' && actionType === 'draft_reply' && (
                <button 
                  onClick={handleApplyDraft}
                  className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm"
                >
                  Insert Draft
                </button>
              )}
              {typeof result === 'string' && (
                <button 
                  onClick={copyToClipboard}
                  className="px-3 py-2 text-sm text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <CopilotActionCard 
              icon={<MessageSquare className="h-5 w-5" />} 
              label="Draft Reply" 
              onClick={() => runCopilotAction('draft_reply')}
              color="text-blue-500"
              bg="bg-blue-50 dark:bg-blue-500/10"
            />
            <CopilotActionCard 
              icon={<FileText className="h-5 w-5" />} 
              label="Summarize" 
              onClick={() => runCopilotAction('summarize')}
              color="text-emerald-500"
              bg="bg-emerald-50 dark:bg-emerald-500/10"
            />
            <CopilotActionCard 
              icon={<Target className="h-5 w-5" />} 
              label="Extract Intent" 
              onClick={() => runCopilotAction('extract_intent')}
              color="text-purple-500"
              bg="bg-purple-50 dark:bg-purple-500/10"
            />
            <CopilotActionCard 
              icon={<Briefcase className="h-5 w-5" />} 
              label="Next Best Action" 
              onClick={() => runCopilotAction('recommend_action')}
              color="text-amber-500"
              bg="bg-amber-50 dark:bg-amber-500/10"
            />
          </div>
        )}
      </div>

      {/* Footer / Input area */}
      {!isLoading && !result && (
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask Copilot a question..." 
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm placeholder:text-zinc-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  runCopilotAction('draft_reply', e.currentTarget.value);
                }
              }}
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
          </div>
        </div>
      )}
    </div>
  );
}

function CopilotActionCard({ icon, label, onClick, color, bg }: { icon: React.ReactNode, label: string, onClick: () => void, color: string, bg: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group"
    >
      <div className={`p-3 rounded-full mb-3 group-hover:scale-110 transition-transform ${bg} ${color}`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
    </button>
  );
}
