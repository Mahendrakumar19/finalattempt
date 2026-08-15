/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download, ChevronRight, Home,
  BookOpen, Target, Layers, CheckCircle2,
  ArrowUpRight, Search, ListFilter
} from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  logo?: { storagePath: string } | null;
}

interface SyllabusItem {
  id: string;
  examId: string;
  exam: Exam;
  stage: 'PRELIMS' | 'MAINS' | 'INTERVIEW';
  version: string;
  lastUpdated: string;
  description?: string;
  fileMedia: { storagePath: string; originalName: string; size: number };
}

interface StrategyBlock {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  examId?: string;
  videoUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  featuredImage?: { storagePath: string } | null;
  attachment?: { storagePath: string; originalName: string } | null;
}

export default function SyllabusStrategyPage() {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'strategy'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#strategy') {
      return 'strategy';
    }
    return 'syllabus';
  });
  const [exams, setExams] = useState<Exam[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [strategyBlocks, setStrategyBlocks] = useState<StrategyBlock[]>([]);

  // Active selections
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      try {
        const examsRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
        const examsData = await examsRes.json();
        if (!ignore && examsData.success && Array.isArray(examsData.data)) {
          const activeExams = examsData.data.filter((e: Exam) => e.isActive);
          setExams(activeExams);
          if (activeExams.length > 0) {
            setSelectedExamId(activeExams[0].id);
          }
        }

        const syllabusRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/syllabus`);
        const syllabusData = await syllabusRes.json();
        if (!ignore && syllabusData.success && Array.isArray(syllabusData.data)) {
          setSyllabusList(syllabusData.data);
          if (syllabusData.data.length > 0) {
            setSelectedSyllabusId(syllabusData.data[0].id);
          }
        }

        const strategyRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/strategy`);
        const strategyData = await strategyRes.json();
        if (!ignore && strategyData.success && Array.isArray(strategyData.data)) {
          setStrategyBlocks(strategyData.data);
          if (strategyData.data.length > 0) {
            setSelectedStrategyId(strategyData.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    return () => { ignore = true; };
  }, [BACKEND_URL]);

  const handleTabChange = (tab: 'syllabus' | 'strategy') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  // Filtered syllabus items
  const filteredSyllabus = syllabusList.filter(s => {
    if (selectedExamId !== 'ALL' && s.examId !== selectedExamId) return false;
    if (selectedStage !== 'ALL' && s.stage !== selectedStage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (s.description || '').toLowerCase() + (s.fileMedia?.originalName || '').toLowerCase() + (s.exam?.name || '').toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Selected Exam Object
  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Filtered strategy items
  const filteredStrategy = strategyBlocks.filter((st: StrategyBlock) => {
    if (selectedExamId !== 'ALL') {
      if (st.examId) {
        if (st.examId !== selectedExamId) return false;
      } else if (selectedExam) {
        const exCode = (selectedExam.code || '').toLowerCase().trim();
        const exName = (selectedExam.name || '').toLowerCase().trim();
        const stText = (st.title + ' ' + st.category + ' ' + st.content).toLowerCase();
        
        // If the strategy guide mentions a specific exam and not the selected one, filter out
        if (exCode && !stText.includes(exCode) && exName && !stText.includes(exName)) {
          return false;
        }
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = st.title.toLowerCase() + st.category.toLowerCase() + st.content.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Currently active selected document/strategy (strictly bound to filtered results)
  const activeSyllabus = filteredSyllabus.find(s => s.id === selectedSyllabusId) || filteredSyllabus[0] || null;
  const activeStrategy = filteredStrategy.find(st => st.id === selectedStrategyId) || filteredStrategy[0] || null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">

      {/* ── DRISHTI IAS STYLE TOP NAVIGATION HEADER ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumbs & Title */}
          <div className="py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <span className="text-amber-600 dark:text-amber-400 font-bold">Civil Services Hub</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <span className="text-slate-900 dark:text-slate-200 capitalize font-medium">{activeTab} Roadmap</span>
            </div>

            {/* Tab Pills */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleTabChange('syllabus')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'syllabus'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Syllabus Papers</span>
              </button>
              <button
                onClick={() => handleTabChange('strategy')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'strategy'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Preparation Strategy</span>
              </button>
            </div>
          </div>

          {/* Exam Filter Tabs Bar (Drishti IAS Stage Bar) */}
          <div className="py-3 flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500" /> Exam:
              </span>

              <button
                onClick={() => {
                  setSelectedExamId('ALL');
                  const match = syllabusList.find(s => selectedStage === 'ALL' || s.stage === selectedStage);
                  if (match) setSelectedSyllabusId(match.id);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  selectedExamId === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                All Exams
              </button>

              {exams.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => {
                    setSelectedExamId(exam.id);
                    const match = syllabusList.find(s => s.examId === exam.id && (selectedStage === 'ALL' || s.stage === selectedStage));
                    if (match) setSelectedSyllabusId(match.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    selectedExamId === exam.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {exam.name}
                </button>
              ))}
            </div>

            {/* Stage Filter Buttons (PRELIMS, MAINS, INTERVIEW) */}
            {activeTab === 'syllabus' && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 sm:ml-auto border-l sm:border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-amber-500" /> Stage:
                </span>
                {[
                  { id: 'ALL', label: 'All Stages' },
                  { id: 'PRELIMS', label: 'Prelims' },
                  { id: 'MAINS', label: 'Mains' },
                  { id: 'INTERVIEW', label: 'Interview' }
                ].map(stg => (
                  <button
                    key={stg.id}
                    onClick={() => {
                      setSelectedStage(stg.id);
                      const match = syllabusList.find(s => 
                        (selectedExamId === 'ALL' || s.examId === selectedExamId) && 
                        (stg.id === 'ALL' || s.stage === stg.id)
                      );
                      if (match) setSelectedSyllabusId(match.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedStage === stg.id
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {stg.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (2-COLUMN DRISHTI LAYOUT) ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search syllabus or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT SIDEBAR: LIST OF PAPERS / TOPICS (4 cols) ────────────────────── */}
          <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-36 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
            <h3 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2 px-1">
              <ListFilter className="w-3.5 h-3.5" />
              <span>{activeTab === 'syllabus' ? 'Official Syllabus Papers' : 'Strategy Guides'}</span>
            </h3>

            {activeTab === 'syllabus' ? (
              filteredSyllabus.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  No syllabus documents match your filters.
                </p>
              ) : (
                filteredSyllabus.map(s => {
                  const isSelected = activeSyllabus?.id === s.id;
                  const name = s.fileMedia?.originalName || s.description || `${s.exam?.code || 'BPSC'} Syllabus`;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSyllabusId(s.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 space-y-2 relative overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-500/15 shadow-md scale-[1.01]'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-r-md" />
                      )}

                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {s.stage && (
                          <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                            {s.stage}
                          </span>
                        )}
                        {s.exam?.name && (
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase">
                            {s.exam.name}
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2">
                        {name}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                        <span>Updated: {s.lastUpdated}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5">
                          Read <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredStrategy.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  No strategy items found.
                </p>
              ) : (
                filteredStrategy.map(st => {
                  const isSelected = activeStrategy?.id === st.id;

                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStrategyId(st.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 space-y-2 relative overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-500/15 shadow-md scale-[1.01]'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-r-md" />
                      )}

                      <span className="text-[9px] font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                        {st.category}
                      </span>

                      <h4 className="font-heading font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2">
                        {st.title}
                      </h4>
                    </div>
                  );
                })
              )
            )}
          </div>

          {/* ── RIGHT MAIN DISPLAY: FULL READ ARTICLE (8 cols) ───────── */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg space-y-8 min-h-[650px]">

            {activeTab === 'syllabus' && activeSyllabus ? (
              <div className="space-y-8">

                {/* Header Banner inside Reading View */}
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                      Last Updated: {activeSyllabus.lastUpdated}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {activeSyllabus.fileMedia?.originalName || activeSyllabus.description || `${activeSyllabus.exam?.name} Official Syllabus`}
                  </h2>

                  {/* Drishti IAS Style Action Buttons Bar */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {/* Open in New Tab Button */}
                    <a
                      href={`${BACKEND_URL}/${activeSyllabus.fileMedia.storagePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Open PDF </span>
                    </a>

                    {/* Direct Download PDF Button */}
                    <a
                      href={`${BACKEND_URL}/${activeSyllabus.fileMedia.storagePath}`}
                      download
                      className="py-3 px-5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>

                {/* Structured Text Syllabus Content */}
                {activeSyllabus.description ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Detailed Topic Breakdown</span>
                    </h3>

                    <style>{`
                      /* Base Text Colors */
                      .syllabus-content-area h1,
                      .syllabus-content-area h2,
                      .syllabus-content-area h3,
                      .syllabus-content-area h4,
                      .syllabus-content-area strong,
                      .syllabus-content-area b {
                        color: #0f172a !important;
                      }
                      .dark .syllabus-content-area h1,
                      .dark .syllabus-content-area h2,
                      .dark .syllabus-content-area h3,
                      .dark .syllabus-content-area h4,
                      .dark .syllabus-content-area strong,
                      .dark .syllabus-content-area b {
                        color: #ffffff !important;
                      }

                      .syllabus-content-area p,
                      .syllabus-content-area li,
                      .syllabus-content-area span {
                        color: #1e293b !important;
                      }
                      .dark .syllabus-content-area p,
                      .dark .syllabus-content-area li,
                      .dark .syllabus-content-area span {
                        color: #cbd5e1 !important;
                      }

                      /* Table Layout & Container */
                      .syllabus-content-area table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin: 1.5rem 0 !important;
                        background-color: #ffffff !important;
                        border: 1px solid #cbd5e1 !important;
                        border-radius: 0.75rem !important;
                        overflow: hidden !important;
                      }

                      /* Light Mode Table Header */
                      .syllabus-content-area th {
                        background-color: #f1f5f9 !important;
                        background: #f1f5f9 !important;
                        color: #0f172a !important;
                        font-weight: 800 !important;
                        padding: 0.75rem 1rem !important;
                        border: 1px solid #cbd5e1 !important;
                        text-align: left !important;
                      }

                      .syllabus-content-area th * {
                        background: transparent !important;
                        color: #0f172a !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                      }

                      /* Light Mode Table Data Cells */
                      .syllabus-content-area td {
                        background-color: #ffffff !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        padding: 0.75rem 1rem !important;
                        border: 1px solid #e2e8f0 !important;
                      }

                      .syllabus-content-area td * {
                        background: transparent !important;
                        color: #0f172a !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                      }

                      .syllabus-content-area tr:nth-child(even) td {
                        background-color: #f8fafc !important;
                        background: #f8fafc !important;
                      }

                      /* Dark Mode Table Styling */
                      .dark .syllabus-content-area table {
                        background-color: #0f172a !important;
                        border-color: #334155 !important;
                      }

                      .dark .syllabus-content-area th {
                        background-color: #1e293b !important;
                        background: #1e293b !important;
                        color: #fbbf24 !important;
                        border-color: #334155 !important;
                      }

                      .dark .syllabus-content-area th * {
                        background: transparent !important;
                        color: #fbbf24 !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                      }

                      .dark .syllabus-content-area td {
                        background-color: #0f172a !important;
                        background: #0f172a !important;
                        color: #f1f5f9 !important;
                        border-color: #334155 !important;
                      }

                      .dark .syllabus-content-area td * {
                        background: transparent !important;
                        color: #f1f5f9 !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                      }

                      .dark .syllabus-content-area tr:nth-child(even) td {
                        background-color: #1e293b !important;
                        background: #1e293b !important;
                      }
                    `}</style>

                    <div
                      className="syllabus-content-area prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: activeSyllabus.description }}
                    />
                  </div>
                ) : null}

              </div>
            ) : activeTab === 'strategy' && activeStrategy ? (
              <div className="space-y-8">

                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-4">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl uppercase tracking-widest font-mono inline-block">
                    {activeStrategy.category}
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {activeStrategy.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {activeStrategy.attachment && (
                      <a
                        href={`${BACKEND_URL}/${activeStrategy.attachment.storagePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Open Attachment PDF in New Tab</span>
                      </a>
                    )}
                  </div>
                </div>

                {activeStrategy.featuredImage && (
                  <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                    <img
                      src={`${BACKEND_URL}/${activeStrategy.featuredImage.storagePath}`}
                      alt={activeStrategy.title}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}

                <div
                  className="syllabus-content-area prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: activeStrategy.content }}
                />

                {activeStrategy.videoUrl && (
                  <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase text-amber-500">📹 Strategy Video Guidance</h3>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                      <iframe
                        src={
                          activeStrategy.videoUrl.includes('watch?v=')
                            ? activeStrategy.videoUrl.replace('watch?v=', 'embed/')
                            : activeStrategy.videoUrl
                        }
                        title={activeStrategy.title}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">Select a document from the left list to read full details.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
