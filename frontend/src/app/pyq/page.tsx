'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, Download, BookOpen, Eye, Home, ChevronRight, X } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  code: string;
  slug: string;
}

interface PYQItem {
  id: string;
  examId: string;
  exam: Exam;
  year: number;
  stage: 'PRELIMS' | 'MAINS' | 'INTERVIEW';
  paperName: string;
  questionPaper?: { storagePath: string } | null;
  answerKey?: { storagePath: string } | null;
  solution?: { storagePath: string } | null;
  description?: string | null;
  sortOrder: number;
}

export default function PyqPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [pyqList, setPyqList] = useState<PYQItem[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Active selected exam for paper modal viewer
  const [activeExamModal, setActiveExamModal] = useState<{ id: string; name: string } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchPYQs();
  }, [searchQuery, selectedExamId, selectedYear]);

  const fetchExams = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setExams(data.data.filter((e: any) => e.isActive));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/pyqs?limit=500`;
      if (selectedExamId !== 'ALL') url += `&examId=${selectedExamId}`;
      if (selectedYear !== 'ALL') url += `&year=${selectedYear}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPyqList(data.data);
        const yearsSet = new Set<number>(data.data.map((item: PYQItem) => item.year));
        setAllYears(Array.from(yearsSet).sort((a, b) => b - a));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getMediaUrl = (mediaObj?: any) => {
    if (!mediaObj) return '';
    const pathStr = mediaObj.storagePath || mediaObj.url || mediaObj.path || (typeof mediaObj === 'string' ? mediaObj : '');
    if (!pathStr) return '';
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
    if (pathStr.startsWith('/api/')) return `${BACKEND_URL}${pathStr}`;
    return `${BACKEND_URL}/${pathStr.replace(/^\//, '')}`;
  };

  // Group papers by Exam Category
  const examGroups = exams.map((ex) => {
    const papers = pyqList.filter((p) => p.examId === ex.id || p.exam?.id === ex.id);
    return {
      exam: ex,
      papers: papers.sort((a, b) => (b.year - a.year) || (a.sortOrder - b.sortOrder))
    };
  }).filter((group) => group.papers.length > 0 || selectedExamId === 'ALL');

  // Active edition/session filter inside modal popup (e.g. 'ALL', '71st', '70th', '69th')
  const [modalEditionFilter, setModalEditionFilter] = useState<string>('ALL');

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 min-h-screen">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-amber-500 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <span className="text-slate-800 dark:text-slate-200">Previous Year Questions (PYQs)</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-3 max-w-3xl">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest block w-fit">
            Official Question Bank
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Previous Year Papers Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Select an exam category to explore structured question booklets, verified answer keys, and direct downloadable solutions.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-5 py-3.5 rounded-2xl shrink-0">
          <BookOpen className="w-6 h-6 text-amber-500" />
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">{pyqList.length} Papers Uploaded</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{exams.length} Active Exam Vaults</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by paper name or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-2xl outline-none text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Exams ({exams.length})</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Years</option>
            {allYears.length > 0
              ? allYears.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))
              : ['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))
            }
          </select>
        </div>
      </div>

      {/* EXAM CARDS VAULT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : pyqList.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No Question Papers Found</h3>
          <p className="text-xs text-slate-500">Modify your search query filters or select another exam category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examGroups.map(({ exam, papers }) => (
            <div
              key={exam.id}
              onClick={() => {
                setActiveExamModal({ id: exam.id, name: exam.name });
                setModalEditionFilter('ALL');
              }}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-7 rounded-3xl space-y-6 shadow-sm hover:shadow-xl hover:border-amber-500/60 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                    {papers.length} Papers
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {exam.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    Click to view all {papers.length} question booklets, answer keys, and solutions for {exam.name}.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Latest: {papers[0]?.year || '2026'} Session
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Open Vault &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL: ALL PAPERS LIST FOR SELECTED EXAM WITH DYNAMIC EDITION FILTERS */}
      {activeExamModal && (() => {
        const modalPapers = pyqList.filter(p => p.examId === activeExamModal.id || p.exam?.id === activeExamModal.id);

        // Dynamically extract exam edition tokens (e.g. "71st", "70th", "69th", "68th", "67th") ONLY if papers contain ordinal edition matches
        const editionSet = new Set<string>();
        modalPapers.forEach(p => {
          const match = p.paperName.match(/\b(\d{2,3}(?:st|nd|rd|th))\b/i);
          if (match && match[1]) {
            editionSet.add(match[1].toUpperCase());
          }
        });
        const detectedEditions = Array.from(editionSet).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

        const filteredModalPapers = modalPapers.filter(p => {
          if (modalEditionFilter === 'ALL') return true;
          return p.paperName.toUpperCase().includes(modalEditionFilter);
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-6 sm:p-7 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-2xl text-slate-900 dark:text-white">
                      {activeExamModal.name} Papers Collection
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Filter by exam edition (71st, 70th, 69th...) or year to download question booklets & answer keys.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveExamModal(null)}
                  className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Exam Edition Filter Sub-Tabs Bar (71st, 70th, 69th, 68th...) */}
              {detectedEditions.length > 0 && (
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2 overflow-x-auto shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Select Edition:
                  </span>
                  <button
                    onClick={() => setModalEditionFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      modalEditionFilter === 'ALL'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    All Papers ({modalPapers.length})
                  </button>

                  {detectedEditions.map((ed) => {
                    const count = modalPapers.filter(p => p.paperName.toLowerCase().includes(ed.toLowerCase()) || String(p.year) === ed).length;
                    return (
                      <button
                        key={ed}
                        onClick={() => setModalEditionFilter(ed)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                          modalEditionFilter === ed
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {ed.toUpperCase()} Exam ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Modal Papers Grid Scrollable Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                {filteredModalPapers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No question papers found for edition filter "{modalEditionFilter}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredModalPapers.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl space-y-4 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                              {item.year} Academic Year
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                              {item.stage}
                            </span>
                          </div>

                          <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                            {item.paperName}
                          </h4>

                          {item.description && (
                            <div
                              className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed [&_*]:inline [&_*]:m-0"
                              dangerouslySetInnerHTML={{ __html: item.description }}
                            />
                          )}
                        </div>

                        {/* Direct PDF View & Download Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-white/[0.06]">
                          {item.questionPaper && getMediaUrl(item.questionPaper) && (
                            <a
                              href={getMediaUrl(item.questionPaper)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Paper</span>
                            </a>
                          )}

                          {item.questionPaper && getMediaUrl(item.questionPaper) && (
                            <a
                              href={getMediaUrl(item.questionPaper)}
                              download
                              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download PDF</span>
                            </a>
                          )}

                          {item.answerKey && getMediaUrl(item.answerKey) && (
                            <a
                              href={getMediaUrl(item.answerKey)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2.5 px-3 bg-white dark:bg-slate-700 hover:bg-slate-100 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-200 dark:border-white/10"
                            >
                              <span>Key ↗</span>
                            </a>
                          )}

                          {item.solution && getMediaUrl(item.solution) && (
                            <a
                              href={getMediaUrl(item.solution)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2.5 px-3 bg-white dark:bg-slate-700 hover:bg-slate-100 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1 border border-slate-200 dark:border-white/10"
                            >
                              <span>Solution ↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
