'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, ShieldAlert, Sparkles, Hash, Volume2, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getChatRooms, getChatMessages, getSupportRoom } from '@/services/auth';

interface MentorshipChatProps {
  courseId: string;
}

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience?: string;
  avatar?: string;
  bio?: string;
}

export default function MentorshipChat({ courseId }: MentorshipChatProps) {
  const { user, accessToken } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<FacultyMember[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // 1. Fetch Rooms List, Personal Admin Support Room, and Assigned Faculty Members
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [supportRes, roomsRes, facultyRes] = await Promise.all([
          accessToken ? getSupportRoom(accessToken).catch(() => null) : null,
          accessToken ? getChatRooms(courseId || 'bpsc-foundation', accessToken).catch(() => null) : null,
          fetch(`${BACKEND_URL}/api/faculty`).then(r => r.json()).catch(() => [])
        ]);

        if (Array.isArray(facultyRes)) {
          setFaculties(facultyRes);
        }

        const roomList: any[] = [];
        
        // 1. Direct Admin Support Room
        if (supportRes?.success && supportRes.data) {
          roomList.push({
            id: supportRes.data.id,
            title: 'Direct Chat with Admin & Mentors',
            type: 'admin_support',
            isDirect: true
          });
        } else {
          const fallbackSupportId = user?.id ? `support-${user.id}` : 'admin-support-general';
          roomList.push({
            id: fallbackSupportId,
            title: 'Direct Chat with Admin & Mentors',
            type: 'admin_support',
            isDirect: true
          });
        }

        // 2. Course Rooms
        if (roomsRes?.success && Array.isArray(roomsRes.data) && roomsRes.data.length > 0) {
          roomList.push(...roomsRes.data);
        } else {
          roomList.push({ id: `general-${courseId || 'general'}`, title: 'General Doubt Box', type: 'general' });
        }

        setRooms(roomList);
        setActiveRoom(roomList[0]); // Default to direct admin support
      } catch (err) {
        setError('Network error loading mentorship channels.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [courseId, accessToken, BACKEND_URL, user]);

  // 2. Fetch Chat History & Connect Socket when active room changes
  useEffect(() => {
    if (!activeRoom) return;
    const currentUserId = user?.id || 'guest-student-user';

    // Fetch Room History
    const loadHistory = async () => {
      try {
        const res = await getChatMessages(activeRoom.id, accessToken || 'guest-token');
        if (res?.success && res.data) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Failed loading history:', err);
      }
    };
    loadHistory();

    // Initialize Socket connection
    const socket = io(BACKEND_URL, {
      withCredentials: true
    });
    socketRef.current = socket;

    socket.emit('join_room', activeRoom.id);

    // Socket message listener
    socket.on('new_message', (msg: any) => {
      setMessages(prev => {
        // Prevent duplicate loads
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [activeRoom, accessToken, user]);

  // 3. Scroll to Bottom on New Messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !socketRef.current || !activeRoom) return;

    const senderId = user?.id || 'guest-student-user';
    const senderName = user?.fullName || user?.email || 'Student';
    const senderRole = user?.role || 'student';

    const payload = {
      roomId: activeRoom.id,
      senderId,
      senderName,
      senderRole,
      messageText: text
    };

    // Optimistically push to local state
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      roomId: activeRoom.id,
      senderId,
      fullName: senderName,
      role: senderRole,
      messageText: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    socketRef.current.emit('send_message', payload);
    setInputMessage('');
  };

  if (loading) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-pulse">
        <MessageSquare className="w-8 h-8 text-blue-400/50 animate-bounce mb-3" />
        <p className="text-slate-500 text-xs font-semibold">Connecting to mentorship portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-xs max-w-md mx-auto">
        <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
        <div>
          <p className="font-bold">Mentorship Portal Unavailable</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const primaryFaculty = faculties.length > 0 ? faculties[0] : null;

  return (
    <div className="space-y-6">
      {/* ── Assigned Mentor Profile Banner ── */}
      {primaryFaculty ? (
        <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/20 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {primaryFaculty.avatar ? (
                  <img
                    src={primaryFaculty.avatar}
                    alt={primaryFaculty.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                    {primaryFaculty.name.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Active Online" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                    Assigned Officer Mentor
                  </span>
                </div>
                <h3 className="text-white font-extrabold text-lg sm:text-xl mt-1">{primaryFaculty.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{primaryFaculty.role} {primaryFaculty.experience ? `• ${primaryFaculty.experience}` : ''}</p>
                {primaryFaculty.bio && (
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-1 italic max-w-xl">{primaryFaculty.bio}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Officer Online
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-center space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-[var(--text-color)] font-bold text-sm">No Dedicated Mentor Assigned Yet</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            You can still post your doubts in the General Doubts Box channel below. Our subject matter experts respond within 24 hours.
          </p>
        </div>
      )}

      {/* ── Real-Time Chat Component ── */}
      <div className="h-[550px] grid grid-cols-1 md:grid-cols-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl overflow-hidden">
        
        {/* ── Sidebar: Channels List ── */}
        <div className="border-r border-[var(--card-border)] bg-[var(--bg-color)] p-4 space-y-4 flex flex-col h-full md:col-span-1">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--card-border)]">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-[var(--text-color)] text-xs font-bold uppercase tracking-wider">Group Channels</span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {rooms.map((room) => {
              const isActive = activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-600 border border-blue-500/20'
                      : 'text-slate-500 hover:text-[var(--text-color)] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {room.type === 'announcement' ? (
                    <Volume2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">{room.title || (room.type === 'general' ? 'General Chat' : 'Doubts Box')}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Main Chat Area ── */}
        <div className="flex flex-col h-full md:col-span-3">
          {/* Header */}
          <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h4 className="text-[var(--text-color)] text-xs font-bold">{activeRoom?.title || 'Mentor Doubts Box'}</h4>
              <p className="text-slate-400 text-[10px] mt-0.5">Real-Time Mentor Doubts Box</p>
            </div>
          </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[var(--bg-color)] styled-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <p>No messages yet in this group channel.</p>
              <p className="text-[10px] text-slate-400 mt-1">Start the conversation by typing your doubts below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isSelf ? 'justify-end' : ''}`}>
                  {!isSelf && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {msg.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="max-w-[70%]">
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[var(--text-color)] text-[10px] font-bold">{msg.fullName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          msg.role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-500/25 dark:text-red-400' : msg.role === 'faculty' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400'
                        }`}>
                          {msg.role}
                        </span>
                      </div>
                    )}
                    <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                      isSelf
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-900/10'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.messageText}
                    </div>
                    <span className={`block text-[8px] text-slate-400 mt-1 ${isSelf ? 'text-right' : ''}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your doubts here..."
            className="flex-1 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-xs text-[var(--text-color)] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
);
}
