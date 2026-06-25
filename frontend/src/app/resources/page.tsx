'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, ArrowRight, CheckCircle, Search } from 'lucide-react';
import { db, fallbackResources } from '@/services/db';

export default function Resources() {
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesList, setResourcesList] = useState<any[]>(fallbackResources);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await db.getResources();
        if (res && res.length > 0) {
          setResourcesList(res);
        }
      } catch (err) {
        console.error('Failed loading resources:', err);
      }
    };
    loadResources();
  }, []);

  const handleDownload = (id: string) => {
    setDownloadStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const filteredResources = resourcesList.filter(res => {
    const title = res.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Free Downloads</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Aspirant Resources & Notes
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Access high-yield study notes, PDFs, mind maps, and BPSC/UPSC exam preparation templates absolutely free.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search study material name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Download List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100">
        {filteredResources.map((res) => (
          <div key={res.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-sm text-slate-900 leading-tight">
                  {res.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Type: {res.type} &bull; Size: {res.size} &bull; {res.downloadCount + (downloadStates[res.id] ? 1 : 0)} downloads
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-4">
              {downloadStates[res.id] ? (
                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4" />
                  <span>Downloading...</span>
                </span>
              ) : (
                <button
                  onClick={() => handleDownload(res.id)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Now</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
