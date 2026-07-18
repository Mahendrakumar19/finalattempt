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

type PyqViewMode = 'pdfs' | 'mcqs';

export default function PyqPage() {
  const [viewMode, setViewMode] = useState<PyqViewMode>('pdfs');
  
  // PDF state variables
  const [exams, setExams] = useState<Exam[]>([]);
  const [pyqList, setPyqList] = useState<PYQItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (viewMode === 'pdfs') {
      fetchPYQs();
    }
  }, [viewMode, searchQuery, selectedExamId, selectedYear, selectedStage]);

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
      let url = `${BACKEND_URL}/api/pyqs?limit=100`;
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
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Group items by Exam Name -> Year -> Stage
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

  // MCQ parsing logic
  const mcqSubjects = ['All', ...Array.from(new Set(fallbackMcqs.map((p) => p.subject)))];
  const filteredMcqs = fallbackMcqs.filter((p) => {
    const matchesSearch =
      p.question.toLowerCase().includes(mcqSearchQuery.toLowerCase()) ||
      p.explanation.toLowerCase().includes(mcqSearchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || p.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const toggleExplanation = (id: string) => {
    setOpenExplanations((prev) => ({ ...prev, [id]: !prev[id] }));
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
          Access structured exam booklets, verify keys, and practice interactively using our customized PYQ syllabus vault.
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex bg-slate-50 dark:bg-slate-950/20 p-0.5 rounded-2xl w-fit">
        <button
          onClick={() => setViewMode('pdfs')}
          className={`px-8 py-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${viewMode === 'pdfs' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Year-Wise Question Booklets</span>
        </button>
        <button
          onClick={() => setViewMode('mcqs')}
          className={`px-8 py-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${viewMode === 'mcqs' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Interactive Model MCQs</span>
        </button>
      </div>

      {/* PDFs Directories View */}
      {viewMode === 'pdfs' && (
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
                {['2024', '2023', '2022', '2021', '2020', '2019'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/[0.06] rounded-xl outline-none text-slate-700 dark:text-white font-bold"
              >
                <option value="ALL">All Stages</option>
                <option value="PRELIMS">Prelims</option>
                <option value="MAINS">Mains</option>
                <option value="INTERVIEW">Interview</option>
              </select>
            </div>
          </div>

          {/* Grouped Folders list */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-white/[0.02] border rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/10 border border-slate-200 rounded-3xl max-w-md mx-auto space-y-4">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-heading font-black text-sm text-slate-950 dark:text-white">No Question Booklets Found</h3>
              <p className="text-xs text-slate-500">Modify your search query filters and try again.</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl">
              {Object.entries(groupedData).map(([examName, years]) => {
                const isExamExpanded = expandedExams[examName];
                return (
                  <div
                    key={examName}
                    className="bg-white dark:bg-slate-900/30 border border-slate-150 dark:border-white/[0.04] rounded-3xl overflow-hidden shadow-xs"
                  >
                    {/* Exam level trigger */}
                    <button
                      onClick={() => toggleExamAccordion(examName)}
                      className="w-full flex justify-between items-center p-6 bg-slate-50/50 dark:bg-slate-900/20 text-left font-heading font-black text-slate-900 dark:text-white text-base sm:text-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span>🏛️</span>
                        <span>{examName} Papers</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExamExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExamExpanded && (
                      <div className="p-6 space-y-6 border-t border-slate-100 dark:border-white/[0.04] bg-white dark:bg-transparent">
                        
                        {/* Grouped by Year */}
                        {Object.entries(years).map(([year, stages]) => {
                          const yearKey = `${examName}_${year}`;
                          const isYearExpanded = expandedYears[yearKey];

                          return (
                            <div key={year} className="border border-slate-100 dark:border-white/[0.04] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/10">
                              <button
                                onClick={() => toggleYearAccordion(yearKey)}
                                className="w-full flex justify-between items-center px-5 py-4 text-left font-heading font-extrabold text-sm text-slate-900 dark:text-white cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span>📅</span>
                                  <span>{year} Session</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isYearExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isYearExpanded && (
                                <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/[0.02] space-y-5 bg-white dark:bg-transparent">
                                  
                                  {/* Renders Stages inside this Year */}
                                  {Object.entries(stages).map(([stage, itemsList]) => (
                                    <div key={stage} className="space-y-3">
                                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
                                        {stage} Papers
                                      </span>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                                        {itemsList.map((item) => (
                                          <div
                                            key={item.id}
                                            className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-white/[0.04] rounded-2xl flex flex-col justify-between"
                                          >
                                            <div className="space-y-2">
                                              <h5 className="font-heading font-extrabold text-xs text-slate-900 dark:text-white">{item.paperName}</h5>
                                              {item.description && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                                              )}
                                            </div>

                                            {/* Action downloads */}
                                            <div className="flex gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-white/[0.02]">
                                              {item.questionPaper && (
                                                <button
                                                  onClick={() => {
                                                    setPreviewPdfUrl(`${BACKEND_URL}/${item.questionPaper!.storagePath}`);
                                                    setPreviewTitle(`${item.paperName} - Question Booklet`);
                                                  }}
                                                  className="btn-outline py-1.5 text-[9px] flex-grow text-center flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                  <Eye className="w-3 h-3" />
                                                  <span>Paper</span>
                                                </button>
                                              )}
                                              {item.answerKey && (
                                                <button
                                                  onClick={() => {
                                                    setPreviewPdfUrl(`${BACKEND_URL}/${item.answerKey!.storagePath}`);
                                                    setPreviewTitle(`${item.paperName} - Answer Key`);
                                                  }}
                                                  className="btn-outline py-1.5 text-[9px] flex-grow text-center flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                  <Eye className="w-3 h-3" />
                                                  <span>Key</span>
                                                </button>
                                              )}
                                              {item.questionPaper && (
                                                <a
                                                  href={`${BACKEND_URL}/${item.questionPaper!.storagePath}`}
                                                  download
                                                  className="btn-primary py-1.5 text-[9px] flex-grow text-center flex items-center justify-center gap-1"
                                                >
                                                  <Download className="w-3 h-3" />
                                                  <span>Download</span>
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
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Interactive MCQs View */}
      {viewMode === 'mcqs' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search model MCQs..."
                value={mcqSearchQuery}
                onChange={(e) => setMcqSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] text-slate-900 dark:text-white rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {mcqSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${selectedSubject === sub ? 'bg-amber-500 text-slate-950 border-amber-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {filteredMcqs.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900/30 p-6 rounded-3xl border border-slate-150 dark:border-white/[0.04] space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-455">
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">{item.exam} ({item.year})</span>
                  <span className="bg-slate-50 dark:bg-slate-950/20 px-2 py-0.5 rounded-md uppercase">{item.subject}</span>
                </div>
                <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{item.question}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {item.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs font-medium ${openExplanations[item.id] && opt === item.answer ? 'border-emerald-250 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold' : 'border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-350'}`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-white/[0.02] flex justify-between items-center">
                  <p className="text-[10px] text-slate-400">Click check answer to review evaluation strategy details.</p>
                  <button
                    onClick={() => toggleExplanation(item.id)}
                    className="text-xs font-bold text-blue-650 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{openExplanations[item.id] ? 'Hide Answer' : 'Check Answer'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openExplanations[item.id] ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {openExplanations[item.id] && (
                  <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/15 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-xs space-y-2">
                    <div className="flex gap-2 items-center font-bold text-emerald-800 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Correct Option: {item.answer}</span>
                    </div>
                    <p className="text-slate-650 dark:text-slate-400 pl-6 leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-white">Explanation: </span>
                      {item.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

            <div className="flex-grow bg-slate-950 relative overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0"
                title="Syllabus PDF Previewer"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
