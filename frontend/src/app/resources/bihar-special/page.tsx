'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, FileText, ArrowLeft, CheckCircle, Search, Compass, ShieldAlert } from 'lucide-react';

export default function BiharSpecialResources() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const biharResources = [
    { id: 'bh-1', title: 'Bihar Economic Survey 2024-25 Digest', size: '4.8 MB', type: 'PDF', downloadCount: 1840 },
    { id: 'bh-2', title: 'Bihar Budget 2025 Highlights & Analysis', size: '2.5 MB', type: 'PDF', downloadCount: 1420 },
    { id: 'bh-3', title: 'Complete History of Modern Bihar (BPSC Special)', size: '8.1 MB', type: 'PDF', downloadCount: 2950 },
    { id: 'bh-4', title: 'Geography & River Systems of Bihar Map Pack', size: '12.4 MB', type: 'ZIP', downloadCount: 3100 },
    { id: 'bh-5', title: 'Kunwar Singh Revolt & Bihar 1857 Uprising Notes', size: '1.8 MB', type: 'PDF', downloadCount: 1980 }
  ];

  const handleDownload = (id: string) => {
    setDownloadStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [id]: false }));
    }, 2500);
  };

  const filtered = biharResources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-[#FFFBF2]">
      {/* Back button */}
      <div>
        <Link 
          href="/resources" 
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1E3A8A] hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resources</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Compass className="w-4 h-4" />
          <span>Bihar Special Material</span>
        </span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Bihar State Civil Services Portal
        </h1>
        <p className="text-slate-500 text-sm">
          Exclusive, high-yield study aids specifically structured for BPSC Prelims and Mains.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search Bihar-special resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-3xs"
        />
      </div>

      {/* Resource List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((res) => (
            <div key={res.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading font-extrabold text-sm text-slate-900 leading-tight">
                    {res.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Type: {res.type} &bull; Size: {res.size} &bull; {res.downloadCount + (downloadStates[res.id] ? 1 : 0)} downloads
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-4">
                {downloadStates[res.id] ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-4 h-4" />
                    <span>Downloading...</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleDownload(res.id)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Now</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs">
            No Bihar special items match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
