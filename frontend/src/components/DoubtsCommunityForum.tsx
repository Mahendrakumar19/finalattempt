'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  User,
  Plus
} from 'lucide-react';
import {
  getCourseDoubts,
  getDoubtDetail,
  askCourseDoubt,
  replyToDoubt,
  upvoteCourseDoubt,
  resolveCourseDoubt
} from '@/services/auth';

interface DoubtReply {
  id: string;
  doubtId: string;
  userId: string;
  userName: string;
  userRole?: string;
  replyText: string;
  isFaculty?: boolean | number;
  upvotes: number;
  createdAt: string;
}

interface DoubtItem {
  id: string;
  courseId: string;
  lessonId?: string;
  userId: string;
  userName: string;
  userRole?: string;
  title: string;
  description: string;
  timestampSec?: number;
  upvotes: number;
  isResolved: boolean | number;
  resolvedAt?: string | null;
  createdAt: string;
  replyCount?: number;
  replies?: DoubtReply[];
}

interface DoubtsCommunityForumProps {
  courseId: string;
  lessonId?: string;
  currentUser?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  accessToken?: string | null;
}

export default function DoubtsCommunityForum({
  courseId,
  lessonId,
  currentUser,
  accessToken
}: DoubtsCommunityForumProps) {
  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);
  const [activeDoubtReplies, setActiveDoubtReplies] = useState<Record<string, DoubtReply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  // Ask Question Form Modal / Box
  const [isAsking, setIsAsking] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply text per doubt
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  // Filter
  const [filterMode, setFilterMode] = useState<'all' | 'resolved' | 'unresolved'>('all');

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const res = await getCourseDoubts(courseId, lessonId);
      if (res && res.success && Array.isArray(res.data)) {
        setDoubts(res.data);
      }
    } catch (err) {
      console.error('Failed loading doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoubts();
  }, [courseId, lessonId]);

  const toggleExpand = async (doubtId: string) => {
    if (expandedDoubtId === doubtId) {
      setExpandedDoubtId(null);
      return;
    }
    setExpandedDoubtId(doubtId);

    // Fetch replies if not already cached
    if (!activeDoubtReplies[doubtId]) {
      setLoadingReplies(prev => ({ ...prev, [doubtId]: true }));
      try {
        const res = await getDoubtDetail(doubtId);
        if (res && res.success && res.data) {
          setActiveDoubtReplies(prev => ({
            ...prev,
            [doubtId]: res.data.replies || []
          }));
        }
      } catch (err) {
        console.error('Failed fetching replies:', err);
      } finally {
        setLoadingReplies(prev => ({ ...prev, [doubtId]: false }));
      }
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    if (!accessToken) {
      alert('Please login to ask doubts in the community forum.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await askCourseDoubt(
        courseId,
        {
          title: newTitle.trim(),
          description: newDesc.trim(),
          lessonId,
          userName: currentUser?.fullName,
        },
        accessToken
      );
      if (res && res.success) {
        setNewTitle('');
        setNewDesc('');
        setIsAsking(false);
        loadDoubts();
      } else {
        alert(res.error || 'Failed submitting doubt.');
      }
    } catch (err: any) {
      alert('Connection error submitting doubt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (doubtId: string) => {
    const text = (replyInput[doubtId] || '').trim();
    if (!text) return;
    if (!accessToken) {
      alert('Please login to reply.');
      return;
    }

    try {
      const res = await replyToDoubt(
        doubtId,
        {
          replyText: text,
          userName: currentUser?.fullName,
        },
        accessToken
      );
      if (res && res.success && res.data) {
        setActiveDoubtReplies(prev => ({
          ...prev,
          [doubtId]: [...(prev[doubtId] || []), res.data]
        }));
        setReplyInput(prev => ({ ...prev, [doubtId]: '' }));
        // increment local count
        setDoubts(prev =>
          prev.map(d => (d.id === doubtId ? { ...d, replyCount: (d.replyCount || 0) + 1 } : d))
        );
      }
    } catch (err) {
      console.error('Failed posting reply:', err);
    }
  };

  const handleUpvote = async (e: React.MouseEvent, doubtId: string) => {
    e.stopPropagation();
    try {
      const res = await upvoteCourseDoubt(doubtId);
      if (res && res.success) {
        setDoubts(prev =>
          prev.map(d => (d.id === doubtId ? { ...d, upvotes: (d.upvotes || 0) + 1 } : d))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleResolve = async (e: React.MouseEvent, doubtId: string, currentStatus: boolean | number) => {
    e.stopPropagation();
    if (!accessToken) return;
    const nextStatus = !currentStatus;
    try {
      const res = await resolveCourseDoubt(doubtId, nextStatus, accessToken);
      if (res && res.success) {
        setDoubts(prev =>
          prev.map(d => (d.id === doubtId ? { ...d, isResolved: nextStatus } : d))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDoubts = doubts.filter(d => {
    if (filterMode === 'resolved') return Boolean(d.isResolved);
    if (filterMode === 'unresolved') return !d.isResolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Forum Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/60 border border-blue-500/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            24/7 Aspirant & Mentor Community
          </div>
          <h3 className="text-white font-extrabold text-lg sm:text-xl">
            {lessonId ? 'Lecture Doubts & Q&A' : 'Course Discussion & Doubt Resolution Forum'}
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Ask conceptual questions, get instant peer clarity, and receive verified answers from faculty mentors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAsking(!isAsking)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-900/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{isAsking ? 'Close Question Form' : 'Ask a Doubt'}</span>
        </button>
      </div>

      {/* Ask Question Box */}
      {isAsking && (
        <form
          onSubmit={handleAskDoubt}
          className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h4 className="text-white font-bold text-sm">Post a New Doubt to Faculty & Peers</h4>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Doubt Title / Subject Question
            </label>
            <input
              type="text"
              required
              placeholder="e.g. In Article 356, can Governor recommend dissolution without floor test?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Detailed Context / What you didn&apos;t understand
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain the background or cite the specific timestamp from the video or page in the class notes..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAsking(false)}
              className="px-4 py-2 border border-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Post Question'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['all', 'unresolved', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterMode(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterMode === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {tab === 'all' ? `All (${doubts.length})` : tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Showing {filteredDoubts.length} discussions
        </span>
      </div>

      {/* Doubts List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading community discussions...</div>
      ) : filteredDoubts.length === 0 ? (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
          <p className="font-bold text-slate-300">No Doubts Found Under This Filter</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Have a question on this topic? Click &quot;Ask a Doubt&quot; to begin a discussion!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map(doubt => {
            const isExpanded = expandedDoubtId === doubt.id;
            const replies = activeDoubtReplies[doubt.id] || [];
            const isResolved = Boolean(doubt.isResolved);

            return (
              <div
                key={doubt.id}
                className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all shadow-md"
              >
                {/* Doubt Card Header */}
                <div
                  onClick={() => toggleExpand(doubt.id)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        {doubt.userName}
                      </span>
                      {doubt.userRole === 'faculty' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
                          Faculty Mentor
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        • {new Date(doubt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      {isResolved ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Open
                        </span>
                      )}
                    </div>

                    <h4 className="text-white font-bold text-sm sm:text-base leading-snug">{doubt.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{doubt.description}</p>
                  </div>

                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                    {/* Upvote Pill */}
                    <button
                      type="button"
                      onClick={e => handleUpvote(e, doubt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-blue-600/20 text-slate-300 hover:text-blue-400 border border-white/[0.08] text-xs font-bold transition-all cursor-pointer"
                      title="Upvote this question"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{doubt.upvotes || 0}</span>
                    </button>

                    {/* Replies count */}
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {doubt.replyCount || 0} replies
                    </span>

                    {/* Resolved Toggle Button (Faculty / Admin / Question Author) */}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'faculty' || currentUser?.id === doubt.userId) && (
                      <button
                        type="button"
                        onClick={e => handleToggleResolve(e, doubt.id, isResolved)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          isResolved
                            ? 'text-slate-400 border-white/10 hover:text-amber-400'
                            : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                        }`}
                      >
                        {isResolved ? 'Re-open Doubt' : 'Mark Resolved ✓'}
                      </button>
                    )}

                    <div className="hidden sm:block text-slate-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Thread Replies */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] bg-slate-950/60 p-5 sm:p-6 space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Discussion Thread ({replies.length})
                    </h5>

                    {loadingReplies[doubt.id] ? (
                      <p className="text-xs text-slate-500">Loading replies...</p>
                    ) : replies.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No replies yet. Be the first to answer!</p>
                    ) : (
                      <div className="space-y-3">
                        {replies.map(reply => {
                          const isFac = Boolean(reply.isFaculty);
                          return (
                            <div
                              key={reply.id}
                              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                                isFac
                                  ? 'bg-blue-950/40 border-blue-500/40 shadow-xs'
                                  : 'bg-white/[0.02] border-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isFac ? 'text-blue-300' : 'text-slate-200'}`}>
                                    {reply.userName}
                                  </span>
                                  {isFac && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-black uppercase flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                                      Verified Faculty
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(reply.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{reply.replyText}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Post Reply Input */}
                    <div className="pt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a clear, helpful response or solution..."
                        value={replyInput[doubt.id] || ''}
                        onChange={e => setReplyInput(prev => ({ ...prev, [doubt.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handlePostReply(doubt.id);
                        }}
                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handlePostReply(doubt.id)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
