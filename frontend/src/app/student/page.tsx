'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  TrendingUp, 
  FileText, 
  HelpCircle, 
  Users, 
  Bell, 
  Award, 
  CheckCircle,
  Play,
  LogOut,
  ChevronRight,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';
import { db } from '@/services/db';

type StudentTab = 'Dashboard' | 'My Courses' | 'Performance' | 'Tests' | 'Notes' | 'Mentor Connect' | 'Certificates';

export default function StudentPortal() {
  const [activeTab, setActiveTab] = useState<StudentTab>('Dashboard');
  const [lessonCompleteStates, setLessonCompleteStates] = useState<Record<string, boolean>>({
    'les-bpsc-foundation-1-1': true,
    'les-bpsc-foundation-1-2': true,
  });
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  
  // Mentor Connect states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'mentor', text: 'Hi Ritik, I checked your last essay submission on Kunwar Singh. Excellent structure. Try to add more details about his coordination with Nana Sahib.', time: '10:30 AM' },
    { sender: 'student', text: 'Thank you Sir! Will integrate those points in the next answer.', time: '11:00 AM' }
  ]);

  const handleToggleLesson = (lessonId: string) => {
    setLessonCompleteStates(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatHistory(prev => [...prev, { sender: 'student', text: chatMessage, time: '12:30 PM' }]);
    setChatMessage('');
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'mentor', text: 'Got it. I will review your schedule draft and send edits by this evening.', time: '12:32 PM' }]);
    }, 2000);
  };

  const sidebarLinks: { name: StudentTab; icon: any }[] = [
    { name: 'Dashboard', icon: TrendingUp },
    { name: 'My Courses', icon: BookOpen },
    { name: 'Performance', icon: TrendingUp },
    { name: 'Tests', icon: HelpCircle },
    { name: 'Notes', icon: FileText },
    { name: 'Mentor Connect', icon: Users },
    { name: 'Certificates', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row antialiased font-sans relative overflow-hidden">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 pointer-events-none" />

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white/80 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 relative z-10">
        <div className="space-y-8">
          {/* Logo & Student Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-sm border border-blue-500 shadow-sm text-white">
              FA
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                Final Attempt
              </span>
              <span className="text-[9px] text-[#22C55E] font-bold tracking-wider uppercase">
                Student Account
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              RK
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Ritik Kumar</p>
              <p className="text-[9px] text-slate-550">Batch: 72nd BPSC</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => setActiveTab(link.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === link.name 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200/60 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-200 flex justify-between items-center mt-8">
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span>Portal Home</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT PANEL */}
      <main className="flex-grow p-6 sm:p-10 space-y-8 overflow-y-auto max-h-screen relative z-10">
        
        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Welcome Back</span>
            <h2 className="text-2xl font-heading font-extrabold text-slate-900 mt-1">Hello, Ritik Kumar</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors shadow-xs relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </div>

        {/* TAB VIEWS */}

        {/* 1. DASHBOARD */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Overall Completion', value: '72%', desc: '24/40 Tasks Done' },
                { label: 'Quiz Score Avg', value: '88%', desc: 'Ranked 12th in Batch' },
                { label: 'Study Streak', value: '14 Days', desc: 'Active Daily Check' },
                { label: 'Attendance', value: '95%', desc: '28/30 Live Sessions' }
              ].map((metric, idx) => (
                <div key={idx} className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 space-y-2 shadow-xs">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{metric.label}</span>
                  <p className="text-2xl font-extrabold text-slate-900">{metric.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{metric.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Weak Subjects / Performance diagnostics */}
              <div className="lg:col-span-7 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
                <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Subject Performance Diagnostic</span>
                </h3>
                <div className="space-y-4 pt-2">
                  {[
                    { subject: 'Indian Polity', score: 92, status: 'Strong', color: 'bg-emerald-500' },
                    { subject: 'History of Bihar', score: 85, status: 'Good', color: 'bg-blue-550' },
                    { subject: 'General Economy', score: 68, status: 'Needs Focus', color: 'bg-amber-500' },
                    { subject: 'Science & Technology', score: 54, status: 'Weak Area', color: 'bg-red-500' }
                  ].map((sub, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{sub.subject}</span>
                        <span className="text-slate-900">{sub.score}% ({sub.status})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${sub.color}`} style={{ width: `${sub.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              <div className="lg:col-span-5 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
                <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Upcoming milestones</span>
                </h3>
                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">Polity Sectional Mock Test</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Due: 26 June, 10:00 AM</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-650 border border-blue-100 font-bold text-[9px] uppercase">Test</span>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">Bihar Special Economy PDF</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Assigned by Siddharth Sir</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-650 border border-emerald-100 font-bold text-[9px] uppercase">Notes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MY COURSES */}
        {activeTab === 'My Courses' && (
          <div className="space-y-6">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Active Course Curriculum</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Syllabus Sections */}
              <div className="lg:col-span-8 space-y-4">
                {[
                  {
                    title: 'Section 1: Indian Polity Core Basics',
                    lessons: [
                      { id: 'les-bpsc-foundation-1-1', title: 'Introduction & Micro-Syllabus Analysis', duration: '45 mins', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
                      { id: 'les-bpsc-foundation-1-2', title: 'Strategic Reading of Newspapers & Current Affairs', duration: '60 mins', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }
                    ]
                  },
                  {
                    title: 'Section 2: Bihar Special History & Revolt 1857',
                    lessons: [
                      { id: 'les-bpsc-foundation-2-1', title: 'High-Yield Core Themes: High Weightage Chapters', duration: '90 mins', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
                      { id: 'les-bpsc-foundation-2-2', title: 'Bihar Budget & Special Economic Focus', duration: '75 mins', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }
                    ]
                  }
                ].map((sect, sIdx) => (
                  <div key={sIdx} className="bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="p-4 bg-slate-50 font-heading font-bold text-xs text-slate-900 border-b border-slate-200/80">
                      {sect.title}
                    </div>
                    <div className="divide-y divide-slate-200/80">
                      {sect.lessons.map((lesson) => (
                        <div key={lesson.id} className="p-4 flex justify-between items-center gap-4 text-xs">
                          <div className="flex gap-3 items-center">
                            <button 
                              onClick={() => handleToggleLesson(lesson.id)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                lessonCompleteStates[lesson.id] 
                                  ? 'bg-blue-600 border-blue-500 text-white' 
                                  : 'border-slate-300 hover:border-slate-400 text-transparent'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-slate-800">{lesson.title}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[10px] text-slate-500 font-semibold">{lesson.duration}</span>
                            <button
                              onClick={() => setActiveVideoUrl(lesson.videoUrl)}
                              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105"
                            >
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Video Player Side panel */}
              <div className="lg:col-span-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Lesson Player</span>
                {activeVideoUrl ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl overflow-hidden aspect-video bg-black relative">
                      <video src={activeVideoUrl} controls autoPlay className="w-full h-full" />
                    </div>
                    <button
                      onClick={() => setActiveVideoUrl(null)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700 transition-colors"
                    >
                      Close Player
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-250">
                    <Play className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-[10px] text-slate-500 font-medium">Select any lecture to begin learning inside our custom interface.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. PERFORMANCE DIAGNOSTIC */}
        {activeTab === 'Performance' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Full Analytics Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Weak concepts */}
              <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] text-red-650 font-bold uppercase tracking-wider">Weak Areas Diagnostic</span>
                <p className="text-xs text-slate-500 font-medium">Our evaluation AI detected these micro-topics as areas requiring extra revision:</p>
                
                <div className="space-y-3.5 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Centre-State Financial Relations</span>
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-150 font-bold text-[9px]">42% Accuracy</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Bihar Agriculture & Soil Patterns</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-150 font-bold text-[9px]">60% Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Leaderboard rank */}
              <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Batch Leaderboard Rank</span>
                  <p className="text-3xl font-extrabold text-slate-900 pt-2">#12 <span className="text-xs text-slate-400 font-bold">out of 420 students</span></p>
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-normal border-t border-slate-200/80 pt-3">
                  Maintain your daily streak and score above 85% in the upcoming Sunday mock test to break into the Top 10.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TESTS */}
        {activeTab === 'Tests' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Online Mock Exam Lounge</h3>
            
            <div className="divide-y divide-slate-200/80 space-y-4">
              {[
                { title: 'Polity Full Length Mock 04', date: '26 June, 10:00 AM', duration: '120 mins', qCount: 150, status: 'Locked' },
                { title: 'Bihar Budget & Survey sectional test', date: 'Completed on 22 June', duration: '60 mins', qCount: 50, score: '44/50', status: 'Completed' }
              ].map((test, idx) => (
                <div key={idx} className="flex justify-between items-center pt-4 first:pt-0">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-slate-900">{test.title}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Scheduled: {test.date} &bull; {test.duration} &bull; {test.qCount} Questions</p>
                  </div>

                  <div className="shrink-0">
                    {test.status === 'Locked' ? (
                      <span className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200">
                        Locked
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-650 text-xs font-bold rounded-xl border border-emerald-200/60">
                        Score: {test.score}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. NOTES */}
        {activeTab === 'Notes' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Personalized Study Folders</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Polity basic doctrine mindmaps', type: 'PDF', size: '1.2 MB' },
                { title: 'Kunwar Singh revolt mains synopsis', type: 'EPUB', size: '500 KB' }
              ].map((note, idx) => (
                <div key={idx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex justify-between items-center">
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-slate-900">{note.title}</h5>
                    <p className="text-[10px] text-slate-450 font-bold">Format: {note.type} &bull; Size: {note.size}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-650 flex items-center justify-center shadow-xs transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. MENTOR CONNECT CHAT ROOM */}
        {activeTab === 'Mentor Connect' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 flex flex-col h-[500px] shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-200/80 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  SS
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-slate-900">Siddharth Sir (Chief Mentor)</h4>
                  <p className="text-[9px] text-[#22C55E] font-bold">Online &bull; Ready to help</p>
                </div>
              </div>
            </div>

            {/* Chat message viewport */}
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
              {chatHistory.map((chat, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] ${chat.sender === 'student' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div 
                    className={`p-3 rounded-2xl text-xs leading-normal font-medium ${
                      chat.sender === 'student' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-xs' 
                        : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200 shadow-xs'
                    }`}
                  >
                    {chat.text}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">{chat.time}</span>
                </div>
              ))}
            </div>

            {/* Chat inputs */}
            <form onSubmit={handleSendChat} className="pt-4 border-t border-slate-200/80 shrink-0 flex gap-3">
              <input
                type="text"
                placeholder="Type your strategic doubt..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-blue-500 text-slate-900"
              />
              <button 
                type="submit" 
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-transform hover:scale-[1.01]"
              >
                <span>Send</span>
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* 7. CERTIFICATES */}
        {activeTab === 'Certificates' && (
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 space-y-6 shadow-xs">
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Course Completion Certificates</h3>
            
            <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-650 border border-blue-200/60 text-[9px] font-bold uppercase tracking-wider">
                  Moodle Sync Approved
                </span>
                <h4 className="font-heading font-extrabold text-base text-slate-900">BPSC 70th Foundational Completion Certificate</h4>
                <p className="text-xs text-slate-550 font-medium">Awarded on completing all sections and maintaining over 80% mock evaluations.</p>
              </div>

              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors shrink-0">
                <Award className="w-4 h-4 text-amber-450" />
                <span>Claim Certificate</span>
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
