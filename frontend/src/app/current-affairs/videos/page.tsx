'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Video, ArrowRight, Play, ChevronLeft, ChevronRight, Home, Clock } from 'lucide-react';
import { db } from '@/services/db';

export default function YouTubeVideosPortal() {
  const [videos, setVideos] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 9;

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const res = await db.getYoutubeVideos(limit, page, search);
        if (res) {
          setVideos(res.videos || []);
          setTotal(res.total || 0);
        }
      } catch (err) {
        console.error('Failed fetching YouTube videos:', err);
      }
      setLoading(false);
    };

    // Debounce search input
    const delayDebounce = setTimeout(() => {
      fetchVideos();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 min-h-screen">
      
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <Link href="/" className="hover:text-amber-500 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/current-affairs" className="hover:text-amber-500">
            Current Affairs
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 dark:text-slate-200">YouTube Videos</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
              Video Lectures
            </span>
            <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
              YouTube Video Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
              Access BPSC strategies, daily analysis, test evaluations, and expert-led mentorship archives synchronized directly from our official channel.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page
              }}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-video w-full rounded-3xl bg-slate-100 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] animate-pulse h-64"
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/20 rounded-3xl border border-slate-100 dark:border-white/[0.06] max-w-md mx-auto space-y-4">
          <Video className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-extrabold text-sm text-slate-950 dark:text-white">No Videos Found</h3>
          <p className="text-xs text-slate-550 dark:text-slate-450">Try broadening your keywords or check back later.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <div
                key={video.youtubeVideoId}
                className="course-card-premium rounded-3xl overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Embedded Player */}
                  <div className="relative aspect-video w-full bg-slate-950">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=0&rel=0`}
                      title={video.title}
                      loading="lazy"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{video.duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Published · {new Date(video.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-50 dark:border-white/[0.04] mt-auto">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full text-center text-xs flex justify-center items-center gap-1.5"
                  >
                    <span>Watch on YouTube</span>
                    <Video className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-50 dark:border-white/[0.04]">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
