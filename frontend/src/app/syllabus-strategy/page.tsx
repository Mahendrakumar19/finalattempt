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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Exams list Accordions */}
          <div className="lg:col-span-8 space-y-6">
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
                    className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-[#1E293B] rounded-3xl overflow-hidden shadow-xs hover:shadow-sm transition-all"
                  >
                    {/* Accordion Trigger */}
                    <button
                      onClick={() => {
                        setExpandedExamId(isExpanded ? null : exam.id);
                        setSelectedExamId(exam.id);
                        setSelectedStage('ALL'); // Reset stage filter
                      }}
                      className="w-full flex justify-between items-center p-6 bg-slate-50/30 dark:bg-[#131B2E] text-left cursor-pointer border-b border-transparent"
                    >
                      <div className="flex items-center gap-4">
                        {exam.logo ? (
                          <img
                            src={`${BACKEND_URL}/${exam.logo.storagePath}`}
                            alt={exam.name}
                            className="w-10 h-10 object-contain rounded-xl"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-amber-100 flex items-center justify-center text-amber-600 rounded-xl font-black text-sm">
                            {exam.code}
                          </div>
                        )}
                        <div>
                          <h3 className="font-heading font-black text-slate-900 dark:text-white text-base sm:text-lg">{exam.name}</h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{exam.description || 'Official exam roadmap'}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-6 space-y-6 border-t border-slate-100 dark:border-[#1E293B]/60 bg-white dark:bg-[#0F172A]">
                        
                        {/* Dynamic Stage Filters */}
                        <div className="flex bg-slate-100/80 dark:bg-[#131B2E] p-1 rounded-xl w-fit text-xs font-bold text-slate-500 border border-slate-200/60 dark:border-[#1E293B]">
                          {['ALL', 'PRELIMS', 'MAINS', ...(hasInterview ? ['INTERVIEW'] : [])].map((stage) => (
                            <button
                              key={stage}
                              onClick={() => setSelectedStage(stage)}
                              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${selectedStage === stage ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-slate-800 dark:hover:text-white'}`}
                            >
                              {stage}
                            </button>
                          ))}
                        </div>

                        {/* Syllabus Cards List */}
                        {filteredSyllabus.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No syllabus documents matching the active filter.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredSyllabus.map((syll) => {
                              const fileUrl = `${BACKEND_URL}/${syll.fileMedia.storagePath}`;
                              return (
                                <div
                                  key={syll.id}
                                  className="p-5 bg-slate-50/30 dark:bg-[#131B2E]/40 border border-slate-200/60 dark:border-[#1E293B] rounded-2xl flex flex-col justify-between"
                                >
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        {syll.stage}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold">
                                        v{syll.version}
                                      </span>
                                    </div>
                                    <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">{syll.description || `${exam.code} ${syll.stage} Syllabus`}</h4>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Last Updated: {syll.lastUpdated}</p>
                                  </div>

                                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/[0.02] flex gap-2">
                                    <button
                                      onClick={() => {
                                        setPreviewPdfUrl(fileUrl);
                                        setPreviewTitle(`${exam.code} ${syll.stage} Syllabus`);
                                      }}
                                      className="btn-outline py-2 text-[10px] flex-grow text-center flex items-center justify-center gap-1"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Preview</span>
                                    </button>
                                    <a
                                      href={fileUrl}
                                      download
                                      className="btn-primary py-2 text-[10px] flex-grow text-center flex items-center justify-center gap-1"
                                    >
                                      <Download className="w-3.5 h-3.5" />
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

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-[#1E293B] space-y-6 shadow-xs">
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">Old Website Hallmarks</h3>
              
              {companyValues.map((val) => (
                <div key={val.id} className="space-y-2">
                  <h4 className="font-heading font-extrabold text-xs text-amber-500 uppercase tracking-widest">{val.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    {val.content}
                  </p>
                </div>
              ))}
            </div>
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
