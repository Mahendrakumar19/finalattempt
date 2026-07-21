'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, Eye, Calendar, BookOpen, Layers, CheckCircle, ChevronRight, Home, ChevronDown, Compass, Award, ExternalLink, X } from 'lucide-react';

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
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    // Deep linking check
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#strategy') {
        setActiveTab('strategy');
      } else {
        setActiveTab('syllabus');
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
          Resources Portal
        </span>
        <h1 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Syllabus & Strategic Roadmap
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
          Get official civil service schemas, PDF preview kits, and targeted strategy blueprints to help map out your exam execution.
        </p>
      </div>

      {/* Tabs Controller */}
      <div className="flex border border-slate-200/80 dark:border-[#1E293B] p-1 rounded-2xl bg-white dark:bg-[#0B0F19] w-fit shadow-xs">
        <button
          onClick={() => handleTabChange('syllabus')}
          className={`px-8 py-3 rounded-xl font-heading font-black text-sm transition-all cursor-pointer ${activeTab === 'syllabus' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          📚 Official Syllabus
        </button>
        <button
          onClick={() => handleTabChange('strategy')}
          className={`px-8 py-3 rounded-xl font-heading font-black text-sm transition-all cursor-pointer ${activeTab === 'strategy' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          🎯 Preparation Strategies
        </button>
      </div>

      {/* Syllabus Tab View */}
      {activeTab === 'syllabus' && (
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
                    <button
                      onClick={() => {
                        setExpandedExamId(isExpanded ? null : exam.id);
                        setSelectedExamId(exam.id);
                        setSelectedStage('ALL'); // Reset stage filter
                      }}
                      className="w-full flex justify-between items-center p-6 bg-slate-50/60 dark:bg-slate-800/40 text-left cursor-pointer border-b border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {exam.logo ? (
                          <img
                            src={`${BACKEND_URL}/${exam.logo.storagePath}`}
                            alt={exam.name}
                            className="w-12 h-12 object-contain rounded-2xl bg-amber-500/10 p-1 border border-amber-500/20"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 rounded-2xl font-black text-sm">
                            {exam.code}
                          </div>
                        )}
                        <div>
                          <h3 className="font-heading font-black text-slate-900 dark:text-white text-lg sm:text-xl">{exam.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{exam.description || 'Official civil services examination roadmap'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl hidden sm:inline-block border border-amber-500/20">
                          {filteredSyllabus.length} Documents
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`} />
                      </div>
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-6 sm:p-8 space-y-6 border-t border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900">
                        
                        {/* Syllabus Cards List - Premium 3-column Responsive Grid */}
                        {filteredSyllabus.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                            <p className="text-xs text-slate-400 font-semibold">No syllabus documents uploaded yet for this exam.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSyllabus.map((syll) => {
                              const fileUrl = `${BACKEND_URL}/${syll.fileMedia.storagePath}`;
                              const displayName = syll.fileMedia?.originalName || syll.description || `${exam.code} Syllabus`;
                              return (
                                <div
                                  key={syll.id}
                                  className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/[0.08] rounded-3xl flex flex-col justify-between hover:border-amber-500/50 hover:shadow-lg transition-all group"
                                >
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl uppercase tracking-wider">
                                        OFFICIAL SYLLABUS
                                      </span>
                                    </div>

                                    <div className="space-y-1.5">
                                      <h4 className="font-heading font-black text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-2">
                                        {displayName}
                                      </h4>
                                      {syll.description && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                                          {syll.description}
                                        </p>
                                      )}
                                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                        Last Updated: <span className="font-bold text-slate-700 dark:text-slate-300">{syll.lastUpdated}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
                                    {/* Primary Preview Button */}
                                    <button
                                      onClick={() => {
                                        setPreviewPdfUrl(fileUrl);
                                        setPreviewTitle(`${exam.code} ${syll.stage} Syllabus`);
                                      }}
                                      className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold rounded-xl text-xs border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                    >
                                      <Eye className="w-4 h-4 text-amber-500" />
                                      <span>Preview</span>
                                    </button>

                                    {/* Download Button */}
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
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* Strategy Tab View */}
      {activeTab === 'strategy' && (
        <div className="space-y-12 max-w-5xl">
          {strategyBlocks.length === 0 ? (
            <p className="text-sm text-slate-400">Loading strategy blocks...</p>
          ) : (
            strategyBlocks.map((block) => (
              <div
                key={block.id}
                className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#1E293B] rounded-3xl p-6 sm:p-10 space-y-6 shadow-xs flex flex-col md:flex-row gap-8 items-start hover:shadow-sm transition-all"
              >
                {/* Optional Image */}
                {block.featuredImage && (
                  <div className="w-full md:w-1/3 aspect-video md:aspect-square bg-slate-50 dark:bg-[#131B2E] rounded-2xl overflow-hidden shrink-0">
                    <img
                      src={`${BACKEND_URL}/${block.featuredImage.storagePath}`}
                      alt={block.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4 flex-grow">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
                    {block.category}
                  </span>
                  <h3 className="font-heading font-black text-slate-900 dark:text-white text-lg sm:text-xl">{block.title}</h3>
                  
                  {/* Rich Text render */}
                  <div
                    className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 leading-relaxed space-y-3 prose dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />

                  {/* Attachment Download & video player & CTA triggers */}
                  <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50 dark:border-white/[0.02]">
                    {block.attachment && (
                      <a
                        href={`${BACKEND_URL}/${block.attachment.storagePath}`}
                        download
                        className="btn-outline py-2.5 px-4 text-xs flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
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

                    {block.videoUrl && (
                      <a
                        href={block.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline py-2.5 px-4 text-xs flex items-center gap-1.5 border-amber-500/30 hover:bg-amber-50"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Watch Guidance Video</span>
                      </a>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
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
