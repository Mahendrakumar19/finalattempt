'use client';

import { useState } from 'react';
import { Search, ChevronDown, CheckCircle, FileText, Download, BookOpen } from 'lucide-react';
import { pyqs } from '@/services/db';

type PyqViewMode = 'pdfs' | 'mcqs';

const bpscYearlyPapers = [
  { id: '1', year: '2023', exam: '69th BPSC Prelims', subject: 'General Studies (GS)', type: 'Prelims', size: '2.4 MB' },
  { id: '2', year: '2023', exam: '69th BPSC Mains', subject: 'GS Paper I, II & Essay', type: 'Mains', size: '4.8 MB' },
  { id: '3', year: '2022', exam: '68th BPSC Prelims', subject: 'General Studies (GS)', type: 'Prelims', size: '2.1 MB' },
  { id: '4', year: '2022', exam: '68th BPSC Mains', subject: 'GS Paper I, II & Essay', type: 'Mains', size: '3.9 MB' },
  { id: '5', year: '2021', exam: '67th BPSC Prelims', subject: 'General Studies (GS)', type: 'Prelims', size: '2.8 MB' },
  { id: '6', year: '2021', exam: '67th BPSC Mains', subject: 'GS Paper I & II', type: 'Mains', size: '3.2 MB' },
  { id: '7', year: '2020', exam: '66th BPSC Prelims', subject: 'General Studies (GS)', type: 'Prelims', size: '1.9 MB' },
  { id: '8', year: '2019', exam: '65th BPSC Prelims', subject: 'General Studies (GS)', type: 'Prelims', size: '2.3 MB' }
];

export default function PyqPage() {
  const [viewMode, setViewMode] = useState<PyqViewMode>('pdfs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [openExplanations, setOpenExplanations] = useState<Record<string, boolean>>({});

  const subjects = ['All', ...Array.from(new Set(pyqs.map(p => p.subject)))];

  const filteredPyqs = pyqs.filter(p => {
    const matchesSearch = p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || p.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const toggleExplanation = (id: string) => {
    setOpenExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Page Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest">
          Preparation Library
        </span>
        <h1 className="text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
          BPSC Previous Year Papers
        </h1>
        <p className="text-slate-500 text-sm">
          Access year-wise full question papers in PDF format or practice interactively with model subject explanations to refine your BPSC strategy.
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex justify-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 max-w-sm mx-auto">
        <button
          onClick={() => setViewMode('pdfs')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === 'pdfs'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Year-Wise PDFs</span>
        </button>
        <button
          onClick={() => setViewMode('mcqs')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === 'mcqs'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Interactive MCQs</span>
        </button>
      </div>

      {/* PDF Download Section */}
      {viewMode === 'pdfs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {bpscYearlyPapers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase">{paper.type}</span>
                  <span>{paper.year} Paper</span>
                </div>
                <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  {paper.exam}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                  Subject: {paper.subject}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-50 dark:border-white/[0.04]">
                <span className="text-[10px] font-bold text-slate-400">{paper.size} PDF</span>
                <a
                  href={`/resources/${paper.exam.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                  download
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive MCQs Section */}
      {viewMode === 'mcqs' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                    selectedSubject === sub
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-150 dark:border-white/[0.06]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {filteredPyqs.length > 0 ? (
            <div className="space-y-6">
              {filteredPyqs.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-xs space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="text-blue-650 dark:text-blue-400 font-extrabold">{item.exam} ({item.year})</span>
                    <span className="uppercase bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-md">{item.subject}</span>
                  </div>

                  <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {item.question}
                  </h4>

                  {/* Options */}
                  {item.options && item.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {item.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-xs font-medium ${
                            openExplanations[item.id] && opt === item.answer
                              ? 'border-emerald-250 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold'
                              : 'border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation trigger */}
                  <div className="pt-4 border-t border-slate-50 dark:border-white/[0.04] flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Click check answer to review evaluation structure.
                    </p>
                    <button
                      onClick={() => toggleExplanation(item.id)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span>{openExplanations[item.id] ? 'Hide Answer' : 'Check Answer'}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openExplanations[item.id] ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {openExplanations[item.id] && (
                    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/15 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-xs space-y-2">
                      <div className="flex gap-2 items-center font-bold text-emerald-800 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                        <span>Correct Answer: {item.answer}</span>
                      </div>
                      <p className="text-slate-650 dark:text-slate-400 leading-relaxed pl-6">
                        <span className="font-bold text-slate-800 dark:text-white">Explanation: </span>
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-white/[0.01] rounded-3xl border border-slate-100 dark:border-white/[0.04]">
              <p className="text-slate-500 text-sm font-semibold">No questions found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
