'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  ClipboardList
} from 'lucide-react';

type FacultyTab = 'Classes' | 'Attendance' | 'Evaluation' | 'Queries' | 'Student Tracking';

export default function FacultyPortal() {
  const [activeTab, setActiveTab] = useState<FacultyTab>('Classes');
  
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
    <div className="min-h-screen bg-[#070A13] text-[#F8FAFC] flex flex-col md:flex-row antialiased font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-extrabold text-sm border border-amber-400 shadow-sm text-slate-950">
              FA
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white uppercase">
                Final Attempt
              </span>
              <span className="text-[9px] text-[#F59E0B] font-bold tracking-wider uppercase">
                Faculty Account
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              SS
            </div>
            <div>
              <p className="text-xs font-bold text-white">Siddharth Sir</p>
              <p className="text-[9px] text-slate-500">Chief Polity Mentor</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => setActiveTab(link.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === link.name 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 flex justify-between items-center mt-8">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Portal Home</span>
          </Link>
        </div>
      </aside>

      {/* MAIN MAIN PANEL */}
      <main className="flex-grow p-6 sm:p-10 space-y-8 overflow-y-auto max-h-screen">
        
        {/* TOP STATUS */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Faculty Portal</span>
            <h2 className="text-2xl font-heading font-extrabold text-white mt-1">Hello, Siddharth Sir</h2>
          </div>
        </div>

        {/* TAB VIEWS */}

        {/* TAB 1: CLASSES */}
        {activeTab === 'Classes' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Your Scheduled Lectures</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Centre-State legislative Relations', time: 'Today, 03:00 PM', batch: 'UPSC Mentorship', status: 'Live Soon' },
                { title: 'Bihar Land Revenue Acts & GK', time: 'Tomorrow, 10:00 AM', batch: 'BPSC Foundation', status: 'Scheduled' }
              ].map((cls, idx) => (
                <div key={idx} className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 font-bold text-[9px] uppercase tracking-wider rounded">
                      {cls.batch}
                    </span>
                    <span className="text-[9px] text-[#22C55E] font-bold">{cls.status}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-white">{cls.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{cls.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'Attendance' && (
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Daily Session Attendance Log</h3>
            <p className="text-xs text-slate-500">Check class presence for: GS II Basics (June 24 Batch)</p>
            
            <div className="bg-slate-850 rounded-2xl border border-slate-800 divide-y divide-slate-800">
              {attendanceList.map((student) => (
                <div key={student.id} className="p-4 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{student.name}</span>
                  <button
                    onClick={() => handleToggleAttendance(student.id)}
                    className={`px-4 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase border ${
                      student.present 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
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
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Student Essay Evaluations</h3>
            
            <div className="space-y-4">
              {evaluationList.map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-850/50 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-slate-200">{sub.studentName}</span>
                      <span className="text-[10px] text-slate-500">({sub.course})</span>
                    </div>
                    <p className="text-slate-400 font-medium">Task: {sub.task}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {sub.status === 'Graded' ? (
                      <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold rounded-xl text-[10px] uppercase">
                        Graded: {sub.score}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Grade e.g. 8.5"
                          value={inputScores[sub.id] || ''}
                          onChange={(e) => setInputScores(prev => ({ ...prev, [sub.id]: e.target.value }))}
                          className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-850 text-white rounded-lg focus:outline-none"
                        />
                        <button
                          onClick={() => handleGradeSubmission(sub.id)}
                          className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-600 transition-colors"
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
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Student Query Helpdesk</h3>
            
            <div className="space-y-4">
              {queriesList.map((query) => (
                <div key={query.id} className="p-4 bg-slate-850/50 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">{query.studentName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      query.status === 'Replied' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {query.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-white">{query.subject}</p>
                    <p className="text-slate-400 italic">"{query.text}"</p>
                  </div>

                  {query.status === 'Unread' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <input
                        type="text"
                        placeholder="Type answer reply..."
                        value={replyInput[query.id] || ''}
                        onChange={(e) => setReplyInput(prev => ({ ...prev, [query.id]: e.target.value }))}
                        className="flex-grow px-3 py-1.5 bg-slate-900 border border-slate-850 text-white rounded-lg focus:outline-none"
                      />
                      <button
                        onClick={() => handleReplyQuery(query.id)}
                        className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-600 transition-colors"
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
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-white">Student Progress Tracking</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'Ritik Kumar', completed: '72%', score: '88/100', status: 'Consistent' },
                { name: 'Aman Singh', completed: '65%', score: '78/100', status: 'Consistent' }
              ].map((stud, idx) => (
                <div key={idx} className="p-4 bg-slate-850/50 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{stud.name}</span>
                    <span className="text-[10px] text-blue-400 font-bold">{stud.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <div>
                      <p className="uppercase leading-none">Curriculum Done</p>
                      <p className="text-white font-bold mt-1 text-sm">{stud.completed}</p>
                    </div>
                    <div>
                      <p className="uppercase leading-none">Mock Average</p>
                      <p className="text-white font-bold mt-1 text-sm">{stud.score}</p>
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
