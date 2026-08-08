'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, Eye, ChevronRight, Home, ChevronDown, X } from 'lucide-react';

interface Exam {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
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
  videoUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  featuredImage?: { storagePath: string } | null;
  attachment?: { storagePath: string; originalName: string } | null;
}

interface CompanyValue {
  id: string;
  type: 'MISSION' | 'VISION' | 'CORE_VALUES';
  title: string;
  content: string;
}

export default function SyllabusStrategyPage() {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'strategy'>('syllabus');
  const [exams, setExams] = useState<Exam[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [strategyBlocks, setStrategyBlocks] = useState<StrategyBlock[]>([]);
  const [companyValues, setCompanyValues] = useState<CompanyValue[]>([]);

  // Filters for syllabus
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [siteSettings, setSiteSettings] = useState<any>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/settings`)
      .then(res => res.json())
      .then(data => setSiteSettings(data || {}))
      .catch(() => {});
  }, []);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    // Deep linking check
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#strategy') {
        setActiveTab('strategy');
      }
    }

    const fetchData = async () => {
      try {
        const examsRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
        const examsData = await examsRes.json();
        if (examsData.success && Array.isArray(examsData.data)) {
          setExams(examsData.data.filter((e: any) => e.isActive));
          if (examsData.data.length > 0) {
            setSelectedExamId(examsData.data[0].id);
            setExpandedExamId(examsData.data[0].id);
          }
        }

        const syllabusRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/syllabus`);
        const syllabusData = await syllabusRes.json();
        if (syllabusData.success && Array.isArray(syllabusData.data)) {
          setSyllabusList(syllabusData.data);
        }

        const strategyRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/strategy`);
        const strategyData = await strategyRes.json();
        if (strategyData.success && Array.isArray(strategyData.data)) {
          setStrategyBlocks(strategyData.data);
        }

        const valuesRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/company-values`);
        const valuesData = await valuesRes.json();
        if (valuesData.success && Array.isArray(valuesData.data)) {
          setCompanyValues(valuesData.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (tab: 'syllabus' | 'strategy') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  // Stage filters helper: verify if interview details exist for the active exam
  const hasInterviewContent = (examId: string) => {
    return syllabusList.some(s => s.examId === examId && s.stage === 'INTERVIEW');
  };

  const getFilteredSyllabus = (examId: string) => {
    return syllabusList.filter(s => {
      if (s.examId !== examId) return false;
      if (selectedStage !== 'ALL' && s.stage !== selectedStage) return false;
      return true;
    });
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen space-y-12">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-amber-500 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <span className="text-slate-800 dark:text-slate-200">Syllabus & Strategy</span>
      </div>

      {/* Header Banner */}
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest block w-fit">
          Syllabus & Strategy Roadmap
        </span>
        <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Syllabus & Preparation Strategy
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl">
          Download official exam syllabus PDFs, DOCX documents, and explore comprehensive preparation strategy planning.
        </p>
      </div>

      {/* Official Syllabus Documents Section */}
      <div className="w-full space-y-8">
        
        {/* Main Panel: Full width 12 columns */}
        <div className="w-full space-y-6">
            {exams.length === 0 ? (
              <p className="text-sm text-slate-400">Loading exam definitions...</p>
            ) : (
              exams.map((exam) => {
                const isExpanded = expandedExamId === exam.id;
                const filteredSyllabus = getFilteredSyllabus(exam.id);
                const hasInterview = hasInterviewContent(exam.id);

                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Accordion Trigger Header */}
                    <div
                      onClick={() => {
                        setExpandedExamId(isExpanded ? null : exam.id);
                        setSelectedExamId(exam.id);
                        setSelectedStage('ALL'); // Reset stage filter
                      }}
                      className="w-full flex justify-between items-center p-6 bg-slate-50/60 dark:bg-slate-800/40 text-left cursor-pointer border-b border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {exam.logo ? (
                          <img
                            src={`${BACKEND_URL}/${exam.logo.storagePath}`}
                            alt={exam.name}
                            className="w-12 h-12 object-contain rounded-2xl bg-amber-500/10 p-1 border border-amber-500/20 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 rounded-2xl font-black text-sm shrink-0">
                            {exam.code}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading font-black text-slate-900 dark:text-white text-lg sm:text-xl truncate">{exam.name}</h3>
                          {exam.description ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                              {exam.description.replace(/<[^>]*>?/gm, '')}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              Official civil services examination roadmap
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl hidden sm:inline-block border border-amber-500/20">
                          {filteredSyllabus.length} Documents
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`} />
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-6 sm:p-8 space-y-8 border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900">
                        
                        {/* 1. Official Syllabus Documents Section */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
                            <span>📄 Official Exam Syllabus Files (PDF / DOCX)</span>
                          </h4>

                          {filteredSyllabus.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                              <p className="text-xs text-slate-400 font-semibold">No official syllabus files uploaded yet for this exam.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredSyllabus.map((syll) => {
                                const fileUrl = `${BACKEND_URL}/${syll.fileMedia.storagePath}`;
                                const displayName = syll.fileMedia?.originalName || syll.description || `${exam.code} Official Syllabus`;
                                return (
                                  <div
                                    key={syll.id}
                                    className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all group"
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-xl uppercase tracking-wider">
                                          Official File
                                        </span>
                                      </div>
                                      <div className="space-y-1.5">
                                        <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2">
                                          {displayName}
                                        </h4>
                                        {syll.description && (
                                          <div
                                            className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed space-y-2 [&_table]:max-w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold [&_th]:whitespace-nowrap [&_td]:p-2 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-white/10 [&_td]:whitespace-nowrap overflow-x-auto"
                                            dangerouslySetInnerHTML={{ __html: syll.description }}
                                          />
                                        )}
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">
                                          Last Updated: <span className="font-bold text-slate-700 dark:text-slate-300">{syll.lastUpdated}</span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
                                      <button
                                        onClick={() => {
                                          if (siteSettings?.featureFlags?.pdfPreviewer === false) {
                                            window.open(fileUrl, '_blank');
                                          } else {
                                            setPreviewPdfUrl(fileUrl);
                                            setPreviewTitle(`${exam.code} ${syll.stage} Syllabus`);
                                          }
                                        }}
                                        className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold rounded-xl text-xs border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4 text-amber-500" />
                                        <span>Preview File</span>
                                      </button>
                                      <a
                                        href={fileUrl}
                                        download
                                        className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span>Download</span>
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* 2. Preparation Strategy Planning Section (Collapsible Accordion Rows) */}
      <div className="space-y-6 border-t border-slate-200/80 dark:border-[#1E293B] pt-12">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl uppercase tracking-widest block w-fit">
            Strategy Planning & Roadmap
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
            Preparation Strategy & Guidance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Click any strategy topic to expand detailed planning guides, booklists, and video roadmaps.
          </p>
        </div>

        <div className="space-y-4 w-full">
          {strategyBlocks.length === 0 ? (
            <p className="text-sm text-slate-400">Loading strategy planning blocks...</p>
          ) : (
            strategyBlocks.map((block) => {
              const isStratExpanded = expandedStrategyId === block.id;

              let embedVideoUrl = block.videoUrl || '';
              if (embedVideoUrl.includes('youtube.com/watch?v=')) {
                embedVideoUrl = embedVideoUrl.replace('watch?v=', 'embed/');
              } else if (embedVideoUrl.includes('youtu.be/')) {
                const id = embedVideoUrl.split('youtu.be/')[1]?.split('?')[0];
                if (id) embedVideoUrl = `https://www.youtube.com/embed/${id}`;
              }

              return (
                <div
                  key={block.id}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#1E293B] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Strategy Accordion Trigger Header */}
                  <div
                    onClick={() => setExpandedStrategyId(isStratExpanded ? null : block.id)}
                    className="w-full flex justify-between items-center p-6 bg-slate-50/60 dark:bg-slate-800/40 text-left cursor-pointer border-b border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors select-none"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-4">
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider inline-block">
                        {block.category}
                      </span>
                      <h3 className="font-heading font-black text-slate-900 dark:text-white text-lg sm:text-xl truncate">
                        {block.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl hidden sm:inline-block border border-amber-500/20">
                        {isStratExpanded ? 'Hide Details' : 'View Strategy'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isStratExpanded ? 'rotate-180 text-amber-500' : ''}`} />
                    </div>
                  </div>

                  {/* Collapsible Strategy Content Body */}
                  {isStratExpanded && (
                    <div className="p-6 sm:p-10 space-y-8 border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900">
                      {block.featuredImage && (
                        <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-md bg-slate-950/5 dark:bg-slate-950/40 p-2">
                          <img
                            src={`${BACKEND_URL}/${block.featuredImage.storagePath}`}
                            alt={block.title}
                            className="w-full h-auto object-contain mx-auto rounded-2xl"
                          />
                        </div>
                      )}

                      <div className="w-full space-y-4">
                        <div
                          className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 prose dark:prose-invert max-w-none [&_table]:max-w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:mx-auto [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:whitespace-nowrap [&_td]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-white/10 [&_td]:whitespace-nowrap [&_tr:nth-child(even)]:bg-slate-50/50 [&_tr:nth-child(even)]:dark:bg-slate-800/30 overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: block.content }}
                        />
                      </div>

                      {embedVideoUrl && (
                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span>📹 Strategy Guidance Video</span>
                          </h4>
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 shadow-md">
                            {embedVideoUrl.includes('embed') || embedVideoUrl.includes('youtube') || embedVideoUrl.includes('vimeo') ? (
                              <iframe
                                src={embedVideoUrl}
                                title={block.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video src={embedVideoUrl} controls className="w-full h-full object-contain" />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                        {block.attachment && (
                          <a
                            href={`${BACKEND_URL}/${block.attachment.storagePath}`}
                            download
                            className="btn-outline py-2.5 px-4 text-xs flex items-center gap-1.5"
                          >
                            <FileText className="w-4 h-4 text-amber-500" />
                            <span>Booklist PDF / Details</span>
                          </a>
                        )}

                        {block.ctaText && block.ctaUrl && (
                          <Link
                            href={block.ctaUrl}
                            className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5"
                          >
                            <span>{block.ctaText}</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
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
