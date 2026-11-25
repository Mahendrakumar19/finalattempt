'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Play, 
  Check, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Video, 
  FileText,
  Download,
  ExternalLink,
  Upload,
  User
} from 'lucide-react';
import { Course } from '@/services/db';

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  avatarUrl?: string;
  bio: string;
  demoLectures: { title: string; duration: string; url: string }[];
}

interface Section {
  id: string;
  title: string;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'live';
  videoUrl: string;
  duration: string;
  liveStatus?: string;
  liveScheduledAt?: string;
}

interface CourseExtended extends Omit<Course, 'syllabus' | 'faculty' | 'demoLectures'> {
  syllabus?: (string | { subject?: string; topics?: string[] })[] | string[];
  syllabusPdfUrl?: string;
  faculty?: FacultyMember[];
  demoLectures?: { title: string; duration: string; url: string; teacher?: string }[];
}

interface CourseTabsProps {
  course: Course;
  faculty: FacultyMember[];
  onRefresh?: () => void;
}

import { useAuth } from '@/hooks/useAuth';

export default function CourseTabs({ course, faculty, onRefresh }: CourseTabsProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Syllabus' | 'Faculty' | 'Demo' | 'FAQ'>('Overview');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Moodle-style Edit Mode toggle inside detail page
  const [editMode, setEditMode] = useState(false);
  const canEdit = isAuthenticated && (user?.role === 'admin' || user?.role === 'faculty');


  // Dynamic lists from backend
  const [sections, setSections] = useState<Section[]>([]);
  const [, setLoadingCurriculum] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const tabs: ('Overview' | 'Syllabus' | 'Faculty' | 'Demo' | 'FAQ')[] = [
    'Overview',
    'Syllabus',
    'Faculty',
    'Demo',
    'FAQ'
  ];

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    return null;
  };

  const getAuthHeader = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const tok = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('admin_token') || localStorage.getItem('finalattempt_admin_token');
    return tok ? { 'Authorization': `Bearer ${tok}` } : {};
  };

  // Fetch sections and lessons for this course
  const fetchCurriculum = useCallback(async () => {
    setLoadingCurriculum(true);
    try {
      // Fetch sections (sends student/admin token if authenticated)
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}/sections`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setSections(payload.data.sections || payload.data || []);
        }
      }
    } catch (err) {
      console.error('Failed fetching dynamic course sections:', err);
    } finally {
      setLoadingCurriculum(false);
    }
  }, [BACKEND_URL, course.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCurriculum();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCurriculum]);

  const handleAddSection = async () => {
    const title = window.prompt('Enter Section/Chapter Title:');
    if (!title) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        fetchCurriculum();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Delete this chapter? All lessons inside will be unlinked.')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLesson = async (sectionId: string) => {
    const title = window.prompt('Enter Lesson Title:');
    const videoUrl = window.prompt('Enter Video URL (e.g. Media/YouTube link):', '');
    if (!title || !videoUrl) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          courseId: course.id,
          title,
          type: 'video',
          videoUrl,
          duration: '15 mins'
        })
      });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Remove this lecture video?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSection = async (sectionId: string, currentTitle: string) => {
    const title = window.prompt('Modify Chapter/Section Title:', currentTitle);
    if (!title || title === currentTitle) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditLesson = async (lessonId: string, currentTitle: string, currentUrl: string, currentDuration: string) => {
    const title = window.prompt('Modify Lesson Title:', currentTitle);
    const videoUrl = window.prompt('Modify Video URL:', currentUrl);
    const duration = window.prompt('Modify Duration (e.g. 15 mins):', currentDuration);
    if (!title || !videoUrl) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ title, videoUrl, duration })
      });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner and Edit Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course Dashboard</span>
          <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Curriculum & Study Guides</h3>
        </div>

        {/* Edit mode toggle - only shown to admin/faculty */}
        {canEdit && (
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Edit Mode</span>
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${
                editMode ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                  editMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-100 overflow-x-auto gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
              activeTab === tab
                ? 'border-brand-secondary text-brand-secondary font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs min-h-[300px]">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Program Overview</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl whitespace-pre-line">
              {course.overview || course.description || 'This program is meticulously designed by selected officers and subject matter experts to cover the entire syllabus with micro-scheduled classes, practice papers, and 1-on-1 mentorship.'}
            </p>
            {course.features && course.features.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl pt-2">
                {course.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-xs text-slate-600 font-semibold">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SYLLABUS */}
        {activeTab === 'Syllabus' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-brand-primary">Course Syllabus & Curriculum</h3>
                <p className="text-xs text-slate-500">Official micro-scheduled syllabus and detailed topic breakdown.</p>
              </div>
              <div className="flex items-center gap-2">
                {(course as CourseExtended).syllabusPdfUrl && (
                  <a
                    href={(course as CourseExtended).syllabusPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Syllabus PDF</span>
                  </a>
                )}
                {editMode && (
                  <button
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Chapter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Official Syllabus PDF Document Viewer Card */}
            {(course as CourseExtended).syllabusPdfUrl && (
              <div className="space-y-4">
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white">
                          Official Curriculum
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Verified Document
                        </span>
                      </div>
                      <h4 className="font-heading font-extrabold text-sm text-slate-900 mt-1">
                        {course.title} — Official Detailed Syllabus PDF
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Download or view the complete official topic-wise micro-schedule syllabus below.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <a
                      href={(course as CourseExtended).syllabusPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Open in New Tab</span>
                    </a>
                    <a
                      href={(course as CourseExtended).syllabusPdfUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>

                {/* Embedded Responsive PDF Viewer */}
                <div className="w-full h-[650px] sm:h-[800px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 relative">
                  <iframe
                    src={`${(course as CourseExtended).syllabusPdfUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0"
                    title="Course Syllabus PDF"
                  />
                </div>
              </div>
            )}

            {/* Chapters and Modules Section */}
            <div className="space-y-6 max-w-3xl">
              {sections.length > 0 ? (
                <div className="space-y-4">
                  {(course as CourseExtended).syllabusPdfUrl && (
                    <h4 className="font-heading font-extrabold text-sm text-slate-900 pt-2">
                      Lecture Modules &amp; Chapters Breakdown
                    </h4>
                  )}
                  {sections.map((section: Section, sIdx: number) => (
                    <div key={section.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-center">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {sIdx + 1}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{section.title}</h4>
                          {editMode && (
                            <button 
                              onClick={() => handleEditSection(section.id, section.title)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {editMode && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddLesson(section.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold"
                            >
                              <Plus className="w-3 h-3" /> Add Lesson
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 border border-red-100 hover:bg-red-50 text-red-500 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lessons inside Section */}
                      <div className="space-y-2.5 pt-2">
                        {(!section.lessons || section.lessons.length === 0) ? (
                          <p className="text-[10px] text-slate-400 italic">No lectures inside this chapter yet.</p>
                        ) : (
                          section.lessons.map((lesson: Lesson) => (
                            <div key={lesson.id} className="bg-white px-4 py-3 rounded-2xl border border-slate-150 flex justify-between items-center shadow-2xs">
                              <div className="flex items-center gap-2">
                                {lesson.type === 'live' ? (
                                  <span className="text-xs">🔴</span>
                                ) : (
                                  <Video className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[11px] font-bold text-slate-800">{lesson.title}</p>
                                    {lesson.type === 'live' && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                                        {lesson.liveStatus === 'live' ? 'LIVE NOW' : 'LIVE'}
                                      </span>
                                    )}
                                    {editMode && (
                                      <button 
                                        onClick={() => handleEditLesson(lesson.id, lesson.title, lesson.videoUrl, lesson.duration)}
                                        className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                                      >
                                        <Edit3 className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                    {lesson.duration || '10 mins'}
                                    {lesson.liveScheduledAt && ` • 🗓 ${lesson.liveScheduledAt}`}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {lesson.videoUrl && (
                                  <button
                                    onClick={() => setPlayingVideo(lesson.videoUrl)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                  >
                                    <Play className="w-4 h-4 fill-current" />
                                  </button>
                                )}
                                {editMode && (
                                  <button
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray((course as CourseExtended).syllabus) && ((course as CourseExtended).syllabus?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {((course as CourseExtended).syllabus || []).map((subj, idx: number) => (
                    <div key={idx} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{typeof subj === 'string' ? subj : subj.subject || `Module ${idx + 1}`}</h4>
                      </div>
                      {typeof subj === 'object' && Array.isArray(subj.topics) && (
                        <ul className="text-xs text-slate-600 space-y-1 pl-8 list-disc">
                          {subj.topics.map((top: string, tIdx: number) => (
                            <li key={tIdx}>{top}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : !((course as CourseExtended).syllabusPdfUrl) ? (
                <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-extrabold text-base text-slate-900">Official Syllabus &amp; Schedule</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    The comprehensive topic-wise micro-schedule and official syllabus PDF for this course are currently being finalized by the faculty board.
                  </p>
                  {canEdit && (
                    <div className="pt-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Syllabus PDF in Course Editor</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY */}
        {activeTab === 'Faculty' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Faculty &amp; Mentorship Board</h3>
            {((((course as CourseExtended).faculty && ((course as CourseExtended).faculty?.length ?? 0) > 0) ? (course as CourseExtended).faculty : faculty) || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {((((course as CourseExtended).faculty && ((course as CourseExtended).faculty?.length ?? 0) > 0) ? (course as CourseExtended).faculty : faculty) || [])?.map((member, idx: number) => (
                  <div key={member.id || idx} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100 shadow-2xs bg-white">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative flex items-center justify-center">
                      {(member.avatar || member.avatarUrl) ? (
                        <Image src={member.avatar || member.avatarUrl || ''} alt={member.name} fill unoptimized className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <h4 className="font-heading font-extrabold text-sm text-slate-900">{member.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role} {member.experience ? `• ${member.experience} exp` : ''}</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Faculty and mentorship board for this batch is being assigned.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DEMO CLASSES */}
        {activeTab === 'Demo' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Free Demo Lectures</h3>
            {((course as CourseExtended).demoLectures && ((course as CourseExtended).demoLectures?.length ?? 0) > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                {((course as CourseExtended).demoLectures || []).map((lec, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white hover:border-blue-100 transition-all">
                    <div className="space-y-1">
                      <h5 className="font-bold text-xs text-slate-900">{lec.title}</h5>
                      <p className="text-[10px] text-slate-400">{lec.teacher ? `By ${lec.teacher} • ` : ''}{lec.duration || '15 mins'}</p>
                    </div>
                    <button
                      onClick={() => setPlayingVideo(lec.url)}
                      className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">No demo lectures currently published for this course. Free demo classes are announced on our official YouTube and Telegram channels.</p>
              </div>
            )}

            {/* Video Player Modal */}
            {playingVideo && (() => {
              const youtubeEmbed = getYoutubeEmbedUrl(playingVideo);
              return (
                <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full p-4 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="font-heading font-extrabold text-sm text-slate-950">Video Lecture Player</h4>
                      <button onClick={() => setPlayingVideo(null)} className="text-slate-400 hover:text-slate-950 text-xs font-bold cursor-pointer">
                        Close
                      </button>
                    </div>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                      {youtubeEmbed ? (
                        <iframe
                          src={youtubeEmbed}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <video controls className="w-full h-full" src={playingVideo} autoPlay />
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === 'FAQ' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Frequently Asked Questions</h3>
            <div className="space-y-3.5 max-w-3xl">
              {course.faq && course.faq.length > 0 ? (
                course.faq.map((item, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="font-bold text-xs text-brand-primary">{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <div className="p-4 border-t border-slate-100 bg-white">
                        <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No FAQs available for this course yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
