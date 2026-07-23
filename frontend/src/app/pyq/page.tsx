'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, CheckCircle, FileText, Download, BookOpen, Eye, Home, ChevronRight, X } from 'lucide-react';
import { pyqs as fallbackMcqs } from '@/services/db';

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
  // PDF state variables
  const [exams, setExams] = useState<Exam[]>([]);
  const [pyqList, setPyqList] = useState<PYQItem[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Grouping expanded accordions state
  const [expandedExams, setExpandedExams] = useState<Record<string, boolean>>({});
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

  // Preview overlay state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Interactive MCQs state variables
  const [mcqSearchQuery, setMcqSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [openExplanations, setOpenExplanations] = useState<Record<string, boolean>>({});

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchExams();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedExamId, selectedYear, selectedStage]);

  useEffect(() => {
    fetchPYQs();
  }, [searchQuery, selectedExamId, selectedYear, selectedStage, currentPage]);

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
      // Fetch all without pagination for grouping — filters applied client-side for year/stage
      let url = `${BACKEND_URL}/api/pyqs?page=${currentPage}&limit=200`;
      if (selectedExamId !== 'ALL') {
        url += `&examId=${selectedExamId}`;
      }
      if (selectedYear !== 'ALL') {
        url += `&year=${selectedYear}`;
      }
      if (selectedStage !== 'ALL') {
        url += `&stage=${selectedStage}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPyqList(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
        // Extract unique years from data for dynamic year filter dropdown
        const yearsSet = new Set<number>(data.data.map((item: PYQItem) => item.year));
        setAllYears(Array.from(yearsSet).sort((a, b) => b - a)); // descending
        // Auto-expand all exams if results found
        if (data.data.length > 0) {
          const examNames: Record<string, boolean> = {};
          data.data.forEach((item: PYQItem) => {
            examNames[item.exam.name] = true;
          });
          setExpandedExams(examNames);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Safely extract media URL whether media has storagePath, url, or path
  const getMediaUrl = (mediaObj?: any) => {
    if (!mediaObj) return '';
    const pathStr = mediaObj.storagePath || mediaObj.url || mediaObj.path || (typeof mediaObj === 'string' ? mediaObj : '');
    if (!pathStr) return '';
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
    if (pathStr.startsWith('/api/')) return `${BACKEND_URL}${pathStr}`;
    return `${BACKEND_URL}/${pathStr.replace(/^\//, '')}`;
  };

  // Group items by Exam Name -> Year (desc) -> Stage
  const getGroupedPYQs = () => {
    const grouped: Record<string, Record<number, Record<string, PYQItem[]>>> = {};

    pyqList.forEach((item) => {
      const examName = item.exam.name;
      const year = item.year;
      const stage = item.stage;

      if (!grouped[examName]) {
        grouped[examName] = {};
      }
      if (!grouped[examName][year]) {
        grouped[examName][year] = {};
      }
      if (!grouped[examName][year][stage]) {
        grouped[examName][year][stage] = [];
      }
      grouped[examName][year][stage].push(item);
    });

    return grouped;
  };

  const toggleExamAccordion = (examName: string) => {
    setExpandedExams((prev) => ({ ...prev, [examName]: !prev[examName] }));
  };

  const toggleYearAccordion = (yearKey: string) => {
    setExpandedYears((prev) => ({ ...prev, [yearKey]: !prev[yearKey] }));
  };

  const groupedData = getGroupedPYQs();

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 min-h-screen">
      
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
      <div className="space-y-4 max-w-3xl">
        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest block w-fit">
          Question Bank
        </span>
        <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Previous Year Papers Library
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Access structured question booklets, verified answer keys, and solutions from our dynamic exam vault.
        </p>
      </div>

      {/* PDFs Directories View */}
      <div className="space-y-8">
          
          {/* Filters Bar */}
          <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search PYQ booklets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-white/[0.06] rounded-xl outline-none text-slate-700 dark:text-white font-bold"
              >
                <option value="ALL">All Exams</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/[0.06] rounded-xl outline-none text-slate-700 dark:text-white font-bold"
              >
                <option value="ALL">All Years</option>
                {allYears.length > 0
                  ? allYears.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))
                  : ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))
                }
              </select>

            </div>
          </div>

          {/* Vibrant Color Year Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-white/[0.02] border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/10 border border-slate-200 rounded-3xl max-w-md mx-auto space-y-4">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white">No Question Booklets Found</h3>
              <p className="text-xs text-slate-500">Modify your search query filters and try again.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedData).map(([examName, years]) => {
                const colorsList = [
                  'bg-amber-500 text-white',
                  'bg-emerald-500 text-white',
                  'bg-rose-400 text-white',
                  'bg-cyan-400 text-white',
                  'bg-pink-500 text-white',
                  'bg-indigo-500 text-white'
                ];

                return (
                  <div key={examName} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <span className="text-lg">🏛️</span>
                      <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">{examName} Papers</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                      {Object.entries(years).sort(([a], [b]) => Number(b) - Number(a)).map(([year, stages], idx) => {
                        const yearKey = `${examName}_${year}`;
                        const isExpanded = expandedYears[yearKey];
                        const cardBg = colorsList[idx % colorsList.length];

                        // Count total papers in this year
                        let totalPdfs = 0;
                        Object.values(stages).forEach(items => { totalPdfs += items.length; });

                        return (
                          <div key={year} className="space-y-3">
                            <button
                              onClick={() => toggleYearAccordion(yearKey)}
                              className={`w-full p-6 rounded-2xl ${cardBg} shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden text-left`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-heading font-black text-3xl tracking-tight">{year}</span>
                                <BookOpen className="w-8 h-8 opacity-40 shrink-0" />
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90 block">TOTAL PDFS : {totalPdfs}</span>
                              </div>
                            </button>

                            {/* Year Drawer File Items Grid */}
                            {isExpanded && (
                              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-2xl space-y-4 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                                {Object.entries(stages).map(([stage, itemsList]) => (
                                  <div key={stage} className="space-y-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block w-fit">
                                      {stage}
                                    </span>
                                    <div className="space-y-2">
                                      {itemsList.map(item => (
                                        <div key={item.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 space-y-2">
                                          <h5 className="font-bold text-xs text-slate-800 dark:text-white leading-snug">{item.paperName}</h5>
                                          <div className="flex flex-wrap gap-1.5 pt-1">
                                            {item.questionPaper && getMediaUrl(item.questionPaper) && (
                                              <a
                                                href={getMediaUrl(item.questionPaper)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[9px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                                              >
                                                <Eye className="w-2.5 h-2.5 text-amber-500" />
                                                <span>Paper</span>
                                              </a>
                                            )}
                                            {item.answerKey && getMediaUrl(item.answerKey) && (
                                              <a
                                                href={getMediaUrl(item.answerKey)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[9px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                                              >
                                                <Eye className="w-2.5 h-2.5 text-blue-500" />
                                                <span>Key</span>
                                              </a>
                                            )}
                                            {item.solution && getMediaUrl(item.solution) && (
                                              <a
                                                href={getMediaUrl(item.solution)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[9px] font-bold rounded-lg flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                                              >
                                                <Eye className="w-2.5 h-2.5 text-emerald-500" />
                                                <span>Solution</span>
                                              </a>
                                            )}
                                            {item.questionPaper && getMediaUrl(item.questionPaper) && (
                                              <a
                                                href={getMediaUrl(item.questionPaper)}
                                                target="_blank" rel="noreferrer" download
                                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[9px] font-extrabold rounded-lg flex items-center gap-1"
                                              >
                                                <Download className="w-2.5 h-2.5" />
                                                <span>PDF</span>
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-650 dark:text-slate-400 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

        </div>

      {/* PDF.js Viewer Overlay Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col h-[80vh] border border-slate-200">
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-sm">{previewTitle}</h3>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-white/[0.04] px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
              <a
                href={previewPdfUrl || ''}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Open in New Tab ↗
              </a>
              <span className="text-slate-300">|</span>
              <a
                href={previewPdfUrl || ''}
                download
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
              >
                Download
              </a>
            </div>
            <div className="flex-grow bg-slate-950 relative overflow-hidden">
              <iframe
                src={previewPdfUrl || ''}
                className="w-full h-full border-0"
                title="PYQ PDF Preview"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
