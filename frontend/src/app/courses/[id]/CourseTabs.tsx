'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Check, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  BookOpen, 
  Video, 
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Course } from '@/services/db';

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  bio: string;
  demoLectures: { title: string; duration: string; url: string }[];
}

interface CourseTabsProps {
  course: Course;
  faculty: FacultyMember[];
  onRefresh?: () => void;
}

export default function CourseTabs({ course, faculty, onRefresh }: CourseTabsProps) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Syllabus' | 'Faculty' | 'Demo' | 'FAQ'>('Overview');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Moodle-style Edit Mode toggle inside detail page
  const [editMode, setEditMode] = useState(false);

  // Dynamic lists from backend
  const [sections, setSections] = useState<any[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const tabs: ('Overview' | 'Syllabus' | 'Faculty' | 'Demo' | 'FAQ')[] = [
    'Overview',
    'Syllabus',
    'Faculty',
    'Demo',
    'FAQ'
  ];

  // Fetch sections and lessons for this course
  const fetchCurriculum = async () => {
    setLoadingCurriculum(true);
    try {
      // Fetch public sections (fallback offline or direct)
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}/sections`, {
        headers: {
          // Send simulated auth token for editor validation
          'Authorization': 'Bearer finalattempt-admin-token-secure-hash'
        }
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
  };

  useEffect(() => {
    fetchCurriculum();
  }, [course.id]);

  const handleAddSection = async () => {
    const title = window.prompt('Enter Section/Chapter Title:');
    if (!title) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/courses/${course.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
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
    const videoUrl = window.prompt('Enter Video URL (e.g. Cloudinary/Vimeo link):', 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
    if (!title || !videoUrl) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/lms/sections/${sectionId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

        {/* Edit mode toggle */}
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
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              This course is crafted to align with the core requirements of BPSC and UPSC administrative services. You will receive customized notes, continuous performance tracking, and direct access to selected officials.
            </p>
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
          </div>
        )}

        {/* TAB 2: SYLLABUS */}
        {activeTab === 'Syllabus' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center max-w-3xl">
              <h3 className="font-heading font-extrabold text-lg text-brand-primary">Syllabus Breakdown</h3>
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

            <div className="space-y-6 max-w-3xl">
              {sections.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-xs text-slate-450 font-bold uppercase">No chapters added yet.</p>
                  {editMode && (
                    <button onClick={handleAddSection} className="text-xs text-blue-600 hover:underline font-bold mt-2">
                      Create First Section
                    </button>
                  )}
                </div>
              ) : (
                sections.map((section: any, sIdx: number) => (
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
                        section.lessons.map((lesson: any) => (
                          <div key={lesson.id} className="bg-white px-4 py-3 rounded-2xl border border-slate-150 flex justify-between items-center shadow-2xs">
                            <div className="flex items-center gap-2">
                              <Video className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[11px] font-bold text-slate-800">{lesson.title}</p>
                                  {editMode && (
                                    <button 
                                      onClick={() => handleEditLesson(lesson.id, lesson.title, lesson.videoUrl, lesson.duration)}
                                      className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 uppercase font-semibold">{lesson.duration || '10 mins'}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {lesson.videoUrl && (
                                <button
                                  onClick={() => setPlayingVideo(lesson.videoUrl)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                </button>
                              )}
                              {editMode && (
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="p-1 text-red-500 hover:bg-red-55/10 rounded"
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
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY */}
        {activeTab === 'Faculty' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Faculty & Mentorship Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {faculty.map((member) => (
                <div key={member.id} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-slate-900">{member.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role} &bull; {member.experience} exp</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DEMO CLASSES */}
        {activeTab === 'Demo' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Free Demo Lectures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              {(faculty || []).flatMap((f) => Array.isArray(f.demoLectures) ? f.demoLectures.map((lec) => ({ ...lec, teacher: f.name })) : []).map((lec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center hover:bg-white hover:border-blue-100 transition-all">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-slate-900">{lec.title}</h5>
                    <p className="text-[10px] text-slate-400">By {lec.teacher} &bull; {lec.duration}</p>
                  </div>
                  <button
                    onClick={() => setPlayingVideo(lec.url)}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                  >
                    <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Video Player Modal */}
            {playingVideo && (
              <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-heading font-extrabold text-sm text-slate-950">Demo Lecture Player</h4>
                    <button onClick={() => setPlayingVideo(null)} className="text-slate-400 hover:text-slate-950 text-xs font-bold">
                      Close
                    </button>
                  </div>
                  <video controls className="w-full rounded-2xl aspect-video bg-black" src={playingVideo} autoPlay />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FAQ */}
        {activeTab === 'FAQ' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-brand-primary">Frequently Asked Questions</h3>
            <div className="space-y-3.5 max-w-3xl">
              {course.faq.map((item, idx) => (
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
