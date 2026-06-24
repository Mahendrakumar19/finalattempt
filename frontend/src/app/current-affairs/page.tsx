'use client';

import { useState } from 'react';
import { Search, Calendar, ChevronRight, FileText, Share2, Printer } from 'lucide-react';
import { currentAffairs } from '@/services/db';

type CategoryType = 'All' | 'National' | 'International' | 'Economy' | 'Environment' | 'Science' | 'Bihar Special';

export default function CurrentAffairs() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const categories: CategoryType[] = ['All', 'National', 'International', 'Economy', 'Environment', 'Science', 'Bihar Special'];

  const filteredArticles = currentAffairs.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedArticle = currentAffairs.find(a => a.id === selectedArticleId) || filteredArticles[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Magazine Ecosystem</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Current Affairs Editorial
        </h1>
        <p className="text-slate-500 text-sm max-w-xl">
          Daily analytical insights on high-yield exam themes. Restrained, authoritative articles curated for BPSC and UPSC Mains.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedArticleId(null); // Reset detail choice on tab shift
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-primary text-white'
                  : 'text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Magazine Layout */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Article List Left (5 columns) */}
          <div className="lg:col-span-5 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                  selectedArticle?.id === article.id
                    ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="text-blue-600">{article.category}</span>
                  <span>{article.publishDate}</span>
                </div>
                <h4 className="font-heading font-extrabold text-xs text-brand-primary leading-snug">
                  {article.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
              </button>
            ))}
          </div>

          {/* Article Detail Right (7 columns) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            {selectedArticle ? (
              <>
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      {selectedArticle.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Published: {selectedArticle.publishDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="font-heading font-extrabold text-xl text-brand-primary leading-tight">
                  {selectedArticle.title}
                </h2>

                <p className="text-xs text-slate-500 leading-relaxed font-bold border-l-4 border-blue-600 pl-4 py-1">
                  {selectedArticle.summary}
                </p>

                <div className="text-xs text-slate-650 leading-relaxed space-y-4 pt-4 border-t border-slate-100">
                  <p>{selectedArticle.content}</p>
                  <p>In examination questions, aspirants are advised to analyze these Constitutional implications from both center-state balance viewpoints and state administrative autonomy lenses. Integrate relevant judicial precedents like the S.R. Bommai case and Nabam Rebia judgement to structure top-scoring answers.</p>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm">Select an article to begin reading.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-sm font-semibold">No current affairs articles found.</p>
        </div>
      )}
    </div>
  );
}
