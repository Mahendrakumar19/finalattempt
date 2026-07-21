'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SyllabusEditor from '@/components/faculty/SyllabusEditor';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Award, 
  ChevronRight, 
  Sparkles,
  LogOut,
  TrendingUp,
  Search,
  Check,
  ClipboardList,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

type FacultyTab = 'Classes' | 'Attendance' | 'Evaluation' | 'Queries' | 'Student Tracking';

export default function FacultyPortal() {
  const { logout, user, isLoading, requireAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<FacultyTab>('Classes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Authentication guard
  useEffect(() => {
    requireAuth('/auth/login/faculty');
  }, [requireAuth, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }
  
  // Attendance tracking state
  const [attendanceList, setAttendanceList] = useState([
    { id: '1', name: 'Ritik Kumar', present: true },
    { id: '2', name: 'Aman Singh', present: true },
    { id: '3', name: 'Priya Kumari', present: false },
    { id: '4', name: 'Rohan Gupta', present: true }
  ]);

  // Evaluation submissions state
  const [evaluationList, setEvaluationList] = useState([
    { id: 'sub-1', studentName: 'Ritik Kumar', course: 'BPSC Foundation', task: 'Kunwar Singh 1857 Revolt Essay', status: 'Pending', score: '' },
    { id: 'sub-2', studentName: 'Aman Singh', course: 'Mains Answer Writing', task: 'Bihar Budget Financial Highlights', status: 'Graded', score: '8.5/10' }
  ]);
  const [inputScores, setInputScores] = useState<Record<string, string>>({});

  // Query state
  const [queriesList, setQueriesList] = useState([
    { id: 'q-1', studentName: 'Ritik Kumar', subject: 'Polity Centre-State relations doubt', text: 'Should we quote case laws in Article 356 explanations?', status: 'Unread' },
    { id: 'q-2', studentName: 'Priya Kumari', subject: 'Syllabus doubt', text: 'Is the new Bihar industrial policy included in Prelims?', status: 'Replied' }
  ]);
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  const handleToggleAttendance = (id: string) => {
    setAttendanceList(prev => prev.map(student => 
      student.id === id ? { ...student, present: !student.present } : student
    ));
  };

  const handleGradeSubmission = (subId: string) => {
    const score = inputScores[subId];
    if (!score) return;
    setEvaluationList(prev => prev.map(sub => 
      sub.id === subId ? { ...sub, status: 'Graded', score: `${score}/10` } : sub
    ));
  };

  const handleReplyQuery = (qId: string) => {
    const reply = replyInput[qId];
    if (!reply) return;
    setQueriesList(prev => prev.map(q => 
      q.id === qId ? { ...q, status: 'Replied' } : q
    ));
  };

  const sidebarLinks: { name: FacultyTab; icon: any }[] = [
    { name: 'Classes', icon: Calendar },
    { name: 'Attendance', icon: ClipboardList },
    { name: 'Evaluation', icon: Award },
    { name: 'Queries', icon: MessageSquare },
    { name: 'Student Tracking', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased font-sans relative overflow-hidden transition-colors duration-200">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 pointer-events-none" />

      {/* SIDEBAR */}
      <aside className={`w-full md:w-64 md:h-screen md:sticky md:top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-white/[0.06] p-5 flex flex-col justify-between shrink-0 z-30 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden md:flex'}`}>
        <div className="space-y-6 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex flex-col gap-1">
              <div className="relative w-40 h-10 shrink-0">
                <img
                  src="/darklogofull.png"
                  alt="Final Attempt"
                  className="w-full h-full object-contain logo-light"
                />
                <img
                  src="/lightlogofull.png"
                  alt="Final Attempt"
                  className="w-full h-full object-contain logo-dark"
                />
              </div>
              <span className="text-[9px] text-[#F59E0B] font-bold tracking-wider uppercase pl-0.5">Faculty Account</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
              {user?.fullName?.charAt(0) || 'F'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Faculty Member'}</p>
              <p className="text-[9px] text-[#F59E0B] font-bold">Chief Mentor</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => setActiveTab(link.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === link.name 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col gap-2 mt-8">
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2">
            <span>Portal Home</span>
          </Link>
          <button 
            onClick={logout} 
            className="text-xs font-bold text-slate-500 hover:text-red-650 flex items-center gap-2 text-left"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN MAIN PANEL */}
      <main className="flex-grow p-6 sm:p-10 space-y-8 overflow-y-auto max-h-screen relative z-10">
        
        {/* TOP STATUS */}
        <div className="flex justify-between items-center bg-white/40 dark:bg-transparent p-4 rounded-2xl border border-slate-200/40 dark:border-transparent">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Faculty Portal</span>
              <h2 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white mt-0.5">Hello, {user?.fullName || 'Faculty Member'}</h2>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-455 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* TAB VIEWS */}

        {/* TAB 1: CLASSES */}
        {activeTab === 'Classes' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Your Scheduled Lectures</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Centre-State legislative Relations', time: 'Today, 03:00 PM', batch: 'BPSC Mentorship', status: 'Live Soon' },
                { title: 'Bihar Land Revenue Acts & GK', time: 'Tomorrow, 10:00 AM', batch: 'BPSC Foundation', status: 'Scheduled' }
              ].map((cls, idx) => (
                <div key={idx} className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-650 border border-blue-150 font-bold text-[9px] uppercase tracking-wider rounded">
                      {cls.batch}
                    </span>
                    <span className="text-[9px] text-[#22C55E] font-bold">{cls.status}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-slate-900">{cls.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <Calendar className="w-4 h-4" />
                    <span>{cls.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <SyllabusEditor
                courseId="bpsc-foundation"
                accessToken=""
                initialSyllabus={[
                  {
                    chapter: 'Chapter 1: Foundational Concepts & Strategy',
                    topics: [
                      'Micro-Syllabus Analysis & Strategy Planning',
                      'Strategic Reading of Bihar Newspapers',
                      'NCERT Integration Workflow'
                    ]
                  },
                  {
                    chapter: 'Chapter 2: Bihar Freedom Struggles',
                    topics: [
                      'Revolt of 1857 in Bihar (Kunwar Singh role)',
                      'Santhal rebellion of 1855',
                      'Champaran Satyagraha details'
                    ]
                  }
                ]}
              />
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'Attendance' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Daily Session Attendance Log</h3>
            <p className="text-xs text-slate-500 font-semibold">Check class presence for: GS II Basics (June 24 Batch)</p>
            
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 divide-y divide-slate-200/80">
              {attendanceList.map((student) => (
                <div key={student.id} className="p-4 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{student.name}</span>
                  <button
                    onClick={() => handleToggleAttendance(student.id)}
                    className={`px-4 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase border ${
                      student.present 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-600 shadow-xs' 
                        : 'bg-red-50 border-red-250 text-red-600 shadow-xs'
                    }`}
                  >
                    {student.present ? 'Present' : 'Absent'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EVALUATION */}
        {activeTab === 'Evaluation' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Student Essay Evaluations</h3>
            
            <div className="space-y-4">
              {evaluationList.map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-slate-800">{sub.studentName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">({sub.course})</span>
                    </div>
                    <p className="text-slate-600 font-medium">Task: {sub.task}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {sub.status === 'Graded' ? (
                      <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 font-extrabold rounded-xl text-[10px] uppercase shadow-xs">
                        Graded: {sub.score}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Grade e.g. 8.5"
                          value={inputScores[sub.id] || ''}
                          onChange={(e) => setInputScores(prev => ({ ...prev, [sub.id]: e.target.value }))}
                          className="w-24 px-3 py-1.5 bg-white border border-slate-250 text-slate-900 rounded-lg focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => handleGradeSubmission(sub.id)}
                          className="px-4 py-1.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-xs"
                        >
                          Grade
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QUERIES */}
        {activeTab === 'Queries' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Student Query Helpdesk</h3>
            
            <div className="space-y-4">
              {queriesList.map((query) => (
                <div key={query.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{query.studentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      query.status === 'Replied' 
                        ? 'bg-emerald-50 text-emerald-650 border-emerald-150' 
                        : 'bg-amber-50 text-amber-650 border-amber-150'
                    }`}>
                      {query.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{query.subject}</p>
                    <p className="text-slate-550 italic font-medium">"{query.text}"</p>
                  </div>

                  {query.status === 'Unread' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200/80">
                      <input
                        type="text"
                        placeholder="Type answer reply..."
                        value={replyInput[query.id] || ''}
                        onChange={(e) => setReplyInput(prev => ({ ...prev, [query.id]: e.target.value }))}
                        className="flex-grow px-3 py-1.5 bg-white border border-slate-250 text-slate-900 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleReplyQuery(query.id)}
                        className="px-4 py-1.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-xs"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT TRACKING */}
        {activeTab === 'Student Tracking' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Student Progress Tracking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Ritik Kumar', completed: '72%', score: '88/100', status: 'Consistent' },
                { name: 'Aman Singh', completed: '65%', score: '78/100', status: 'Consistent' }
              ].map((stud, idx) => (
                <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{stud.name}</span>
                    <span className="text-[10px] text-blue-600 font-bold">{stud.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/80 font-bold">
                    <div>
                      <p className="uppercase leading-none">Curriculum Done</p>
                      <p className="text-slate-900 font-extrabold mt-1 text-sm">{stud.completed}</p>
                    </div>
                    <div>
                      <p className="uppercase leading-none">Mock Average</p>
                      <p className="text-slate-900 font-extrabold mt-1 text-sm">{stud.score}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
