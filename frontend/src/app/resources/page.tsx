'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, BookOpen, Layers, Sparkles, Folder, Download, Eye, ChevronRight, Search, CheckCircle, ArrowRight
} from 'lucide-react';
import { db, CustomPage } from '@/services/db';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const MAIN_RESOURCE_BOXES = [
  {
    id: 'pyq',
    title: 'PYQs',
    subtitle: 'BPSC & Arunachal PCS Previous Year Question Papers',
    slug: 'downloads/pyq',
    href: '/downloads/pyq',
    icon: Layers,
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    iconBg: 'bg-amber-500 text-slate-950',
    countText: 'PYQs Vault'
  },
  {
    id: 'ncert',
    title: 'NCERT Books',
    subtitle: 'History, Geography, Polity, Economics (Class 6th–12th)',
    slug: 'downloads/ncert',
    href: '/downloads/ncert',
    icon: BookOpen,
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    iconBg: 'bg-emerald-500 text-slate-950',
    countText: 'Class 6–12 Vault'
  },

  {
    id: 'rapid-revision',
    title: 'Rapid Revision Materials',
    subtitle: 'BPSC Prelims 100 Quick Revision Formula & Tables',
    slug: 'downloads/rapid-revision',
    href: '/downloads/rapid-revision',
    icon: Sparkles,
    bg: 'from-rose-500/15 via-rose-500/5 to-transparent',
    border: 'border-rose-500/30 hover:border-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    iconBg: 'bg-rose-500 text-white',
    countText: 'Revision Notes'
  },
  {
    id: 'value-added-mains',
    title: 'Value Added Materials — Mains',
    subtitle: 'Mains Data, Quotes, SC Judgments & Bihar Schemes',
    slug: 'downloads/value-added-mains',
    href: '/downloads/value-added-mains',
    icon: FileText,
    bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    iconBg: 'bg-cyan-500 text-slate-950',
    countText: 'Mains Vault'
  },
  {
    id: 'toppers-copies',
    title: "Toppers' Copies",
    subtitle: 'Evaluated Mains Answer Copies of BPSC Toppers',
    slug: 'downloads/toppers-copies',
    href: '/downloads/toppers-copies',
    icon: Folder,
    bg: 'from-blue-500/15 via-blue-500/5 to-transparent',
    border: 'border-blue-500/30 hover:border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    iconBg: 'bg-blue-500 text-white',
    countText: 'Toppers Vault'
  }
];

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customDownloadPages, setCustomDownloadPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomPages = async () => {
      setLoading(true);
      try {
        const pages = await db.getCustomPages(true);
        if (pages && Array.isArray(pages)) {
          const downloadPages = pages.filter(p => p.slug.startsWith('downloads/') || (p.downloadItems && p.downloadItems.length > 0));
          setCustomDownloadPages(downloadPages);
        }
      } catch (err) {
        console.error('Failed fetching custom pages:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomPages();
  }, []);

  const filteredBoxes = MAIN_RESOURCE_BOXES.filter(box => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return box.title.toLowerCase().includes(q) || box.subtitle.toLowerCase().includes(q);
  });

  const filteredCustomPages = customDownloadPages.filter(pg => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return pg.title.toLowerCase().includes(q) || pg.slug.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      {/* Hero Header Banner */}
      <div className="border-b border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="space-y-2 max-w-3xl">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest inline-block">
              Official Study Resource Library
            </span>
            <h1 className="text-3xl sm:text-5xl font-heading font-black text-[var(--text-color)] tracking-tight">
              Resources &amp; Study Material Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              5 Core Resource Vaults: PYQs, NCERT Books, Rapid Revision Materials, Value Added Mains Materials &amp; Toppers Copies.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books, notes, PYQs, toppers copies…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 text-xs bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl outline-none text-[var(--text-color)] font-medium shadow-xs"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* 6 MAIN RESOURCE FOLDER BOXES GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest block">
              Core Study Resource Folders (5 Vaults)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {filteredBoxes.map((box) => {
              const Icon = box.icon;
              return (
                <Link
                  key={box.id}
                  href={box.href}
                  className={`group bg-gradient-to-br ${box.bg} bg-[var(--card-bg)] border ${box.border} p-7 rounded-3xl space-y-6 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group-hover:-translate-y-1`}
                >
                  <div className="space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${box.iconBg} flex items-center justify-center font-black text-sm shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${box.badge} border px-3 py-1 rounded-xl`}>
                        {box.countText}
                      </span>
                    </div>

                    <div>
                      <h3 className={`font-heading font-black text-xl text-[var(--text-color)] group-hover:text-amber-500 transition-colors`}>
                        {box.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {box.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Explore Vault
                    </span>
                    <span className={`text-xs font-black ${box.text} group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1`}>
                      Open Directory &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CUSTOM CREATED DOWNLOAD PAGES FROM ADMIN CMS */}
        {filteredCustomPages.length > 0 && (
          <div className="space-y-4 pt-8 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest block">
                Additional CMS Download Portals ({filteredCustomPages.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredCustomPages.map((pg: any) => {
                const cleanSlug = pg.slug.startsWith('downloads/') ? pg.slug : `downloads/${pg.slug}`;
                return (
                  <Link
                    key={pg.id}
                    href={`/${cleanSlug}`}
                    className="group p-6 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/50 rounded-3xl transition-all shadow-xs flex items-center gap-4 hover:shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-500 group-hover:scale-105 transition-transform">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider block">Custom Portal</span>
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] group-hover:text-amber-500 transition-colors truncate">
                        {pg.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">{pg.downloadItems?.length || 0} Files Package</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
