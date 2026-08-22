'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, FileText, Download, BookOpen, Eye, Home, ChevronRight, X } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl?: string | null;
  logo?: { storagePath: string } | null;
  isActive?: boolean;
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

  // Resolves logo from direct URL or DAM storagePath
  const getExamLogo = (exam: Exam): string | null => {
    if (exam.logoUrl) return exam.logoUrl;
    if (exam.logo?.storagePath) {
      const p = exam.logo.storagePath;
      if (p.startsWith('http://') || p.startsWith('https://')) return p;
      return `${BACKEND_URL}/${p.replace(/^\//, '')}`;
    }
    return null;
  };

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const activeExams = data.data.filter((e: Exam) => e.isActive);
        activeExams.sort((a: Exam, b: Exam) => {
          const isABpsc = a.name.toUpperCase().includes('BPSC') || (a.code || '').toUpperCase().includes('BPSC');
          const isBBpsc = b.name.toUpperCase().includes('BPSC') || (b.code || '').toUpperCase().includes('BPSC');
          if (isABpsc) return -1;
          if (isBBpsc) return 1;
          return a.name.localeCompare(b.name);
        });
        setExams(activeExams);
      }
    } catch (err) {
      console.error(err);
    }
  }, [BACKEND_URL]);

  const fetchPYQs = useCallback(async () => {
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
  }, [BACKEND_URL, selectedExamId, selectedYear, searchQuery]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    fetchPYQs();
  }, [fetchPYQs]);

  const getMediaUrl = (mediaObj?: any) => {
    if (!mediaObj) return '';
    const pathStr = mediaObj.storagePath || mediaObj.url || mediaObj.path || (typeof mediaObj === 'string' ? mediaObj : '');
    if (!pathStr) return '';
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
    if (pathStr.startsWith('/api/')) return `${BACKEND_URL}${pathStr}`;
    return `${BACKEND_URL}/${pathStr.replace(/^\//, '')}`;
  };

  // Group papers by Exam Category (BPSC ALWAYS AT TOP / FIRST)
  const examGroups = exams.map((ex) => {
    const papers = pyqList.filter((p) => p.examId === ex.id || p.exam?.id === ex.id);
    return {
      exam: ex,
      papers: papers.sort((a, b) => (b.year - a.year) || (a.sortOrder - b.sortOrder))
    };
  }).filter((group) => group.papers.length > 0 || selectedExamId === 'ALL')
    .sort((a, b) => {
      const isABpsc = a.exam.name.toUpperCase().includes('BPSC') || (a.exam.code || '').toUpperCase().includes('BPSC');
      const isBBpsc = b.exam.name.toUpperCase().includes('BPSC') || (b.exam.code || '').toUpperCase().includes('BPSC');
      if (isABpsc) return -1;
      if (isBBpsc) return 1;
      return b.papers.length - a.papers.length;
    });

  // Active modal filters
  const [modalStageFilter, setModalStageFilter] = useState<string>('ALL');
  const [modalYearFilter, setModalYearFilter] = useState<string>('ALL');
  const [modalEditionFilter, setModalEditionFilter] = useState<string>('ALL');
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

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
          
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Previous Year Papers
          </h1>
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
                setModalStageFilter('ALL');
                setModalYearFilter('ALL');
                setModalEditionFilter('ALL');
                setModalSearchQuery('');
              }}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] p-7 rounded-3xl space-y-6 shadow-sm hover:shadow-xl hover:border-amber-500/60 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white text-amber-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm shadow-xs overflow-hidden p-1.5 shrink-0 group-hover:scale-105 transition-transform">
                    {getExamLogo(exam) ? (
                      <img src={getExamLogo(exam)!} alt={exam.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-extrabold text-amber-600 text-xs">{exam.code || exam.name}</span>
                    )}
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

      {/* POPUP MODAL: ALL PAPERS LIST FOR SELECTED EXAM WITH COMPREHENSIVE FILTERS */}
      {activeExamModal && (() => {
        const modalPapers = pyqList.filter(p => p.examId === activeExamModal.id || p.exam?.id === activeExamModal.id);

        // Stages available in modal papers (e.g. PRELIMS, MAINS, INTERVIEW)
        const modalStages = Array.from(new Set(modalPapers.map(p => p.stage).filter(Boolean)));

        // Distinct years available in modal papers (e.g. 2024, 2020)
        const modalYears = Array.from(new Set(modalPapers.map(p => p.year))).sort((a, b) => b - a);

        // Dynamically extract exam edition tokens (e.g. "71st", "70th", "69th", "68th", "67th")
        const editionSet = new Set<string>();
        modalPapers.forEach(p => {
          const match = p.paperName.match(/\b(\d{2,3}(?:st|nd|rd|th))\b/i);
          if (match && match[1]) {
            editionSet.add(match[1].toUpperCase());
          }
        });
        const detectedEditions = Array.from(editionSet).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

        // Apply all filters: Stage, Year, Edition, Search
        const filteredModalPapers = modalPapers.filter(p => {
          if (modalStageFilter !== 'ALL' && p.stage !== modalStageFilter) return false;
          if (modalYearFilter !== 'ALL' && String(p.year) !== modalYearFilter) return false;
          if (modalEditionFilter !== 'ALL' && !p.paperName.toUpperCase().includes(modalEditionFilter)) return false;
          if (modalSearchQuery.trim()) {
            const q = modalSearchQuery.toLowerCase();
            const matchesName = p.paperName.toLowerCase().includes(q);
            const matchesDesc = (p.description || '').toLowerCase().includes(q);
            const matchesStage = p.stage.toLowerCase().includes(q);
            const matchesYear = String(p.year).includes(q);
            if (!matchesName && !matchesDesc && !matchesStage && !matchesYear) return false;
          }
          return true;
        });

        const isAnyFilterActive = modalStageFilter !== 'ALL' || modalYearFilter !== 'ALL' || modalEditionFilter !== 'ALL' || modalSearchQuery.trim() !== '';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentExamObj = exams.find(e => e.id === activeExamModal.id);
                    return (
                      <div className="w-12 h-12 rounded-xl bg-white text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden p-1">
                        {currentExamObj && getExamLogo(currentExamObj) ? (
                          <img src={getExamLogo(currentExamObj)!} alt={activeExamModal.name} className="w-full h-full object-contain" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                      {activeExamModal.name} Question Papers Vault
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Filter by Stage (Prelims/Mains), Academic Year, Edition Session or paper name.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveExamModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comprehensive Filter Controls Bar */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/[0.06] space-y-3 shrink-0">
                
                {/* Row 1: Stage Pills, Year Dropdown, Edition Dropdown */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Stage Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xs">
                    <button
                      onClick={() => setModalStageFilter('ALL')}
                      className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${modalStageFilter === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                    >
                      All Stages ({modalPapers.length})
                    </button>
                    {modalStages.map((stg) => {
                      const count = modalPapers.filter(p => p.stage === stg).length;
                      return (
                        <button
                          key={stg}
                          onClick={() => setModalStageFilter(stg)}
                          className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${modalStageFilter === stg ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                        >
                          {stg} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdowns & Reset */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    
                    {/* Year Filter Dropdown */}
                    {modalYears.length > 0 && (
                      <select
                        value={modalYearFilter}
                        onChange={(e) => setModalYearFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-250 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-extrabold cursor-pointer shadow-xs"
                      >
                        <option value="ALL">All Years ({modalYears.length})</option>
                        {modalYears.map((yr) => {
                          const count = modalPapers.filter(p => p.year === yr).length;
                          return (
                            <option key={yr} value={String(yr)}>
                              {yr} Academic Year ({count})
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {/* Ordinal Edition Filter Dropdown (if present) */}
                    {detectedEditions.length > 0 && (
                      <select
                        value={modalEditionFilter}
                        onChange={(e) => setModalEditionFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-250 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-extrabold cursor-pointer shadow-xs"
                      >
                        <option value="ALL">All Sessions ({modalPapers.length})</option>
                        {detectedEditions.map((ed) => {
                          const count = modalPapers.filter(p => p.paperName.toUpperCase().includes(ed)).length;
                          return (
                            <option key={ed} value={ed}>
                              {ed} Session ({count})
                            </option>
                          );
                        })}
                      </select>
                    )}

                    {/* Reset Filters Button */}
                    {isAnyFilterActive && (
                      <button
                        onClick={() => {
                          setModalStageFilter('ALL');
                          setModalYearFilter('ALL');
                          setModalEditionFilter('ALL');
                          setModalSearchQuery('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: In-Modal Search Input & Result Counter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter papers (e.g. CSAT, GS1, GS2, Essay)..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-medium shadow-xs"
                    />
                  </div>

                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl shrink-0">
                    Showing {filteredModalPapers.length} of {modalPapers.length} Papers
                  </span>
                </div>

              </div>

              {/* Modal Papers Grid Scrollable Content - 3 AT ONCE (COMPACT & RESPONSIVE) */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {filteredModalPapers.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-slate-400 text-xs font-semibold">
                      No question papers found matching your current filter selections.
                    </p>
                    {isAnyFilterActive && (
                      <button
                        onClick={() => {
                          setModalStageFilter('ALL');
                          setModalYearFilter('ALL');
                          setModalEditionFilter('ALL');
                          setModalSearchQuery('');
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredModalPapers.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl space-y-3 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              {item.year} Academic Year
                            </span>
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                              {item.stage}
                            </span>
                          </div>

                          <h4 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {item.paperName}
                          </h4>

                          {item.description && (
                            <div
                              className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed [&_*]:inline [&_*]:m-0"
                              dangerouslySetInnerHTML={{ __html: item.description }}
                            />
                          )}
                        </div>

                        {/* Direct PDF View & Download Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
                          {item.questionPaper && getMediaUrl(item.questionPaper) && (
                            <a
                              href={getMediaUrl(item.questionPaper)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black rounded-lg flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Paper</span>
                            </a>
                          )}

                          {item.questionPaper && getMediaUrl(item.questionPaper) && (
                            <a
                              href={getMediaUrl(item.questionPaper)}
                              download
                              className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          )}

                          {item.answerKey && getMediaUrl(item.answerKey) && (
                            <a
                              href={getMediaUrl(item.answerKey)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-0.5 border border-slate-200 dark:border-white/10"
                            >
                              <span>Key ↗</span>
                            </a>
                          )}

                          {item.solution && getMediaUrl(item.solution) && (
                            <a
                              href={getMediaUrl(item.solution)}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-0.5 border border-slate-200 dark:border-white/10"
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
