'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, ShieldAlert, Sparkles, Hash, Volume2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getChatRooms, getChatMessages } from '@/services/auth';

interface MentorshipChatProps {
  courseId: string;
}

export default function MentorshipChat({ courseId }: MentorshipChatProps) {
  const { user, accessToken } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // 1. Fetch Rooms List on Mount
  useEffect(() => {
    if (!accessToken) return;

    const loadRooms = async () => {
      try {
        const res = await getChatRooms(courseId, accessToken);
        if (res.success && res.data) {
          setRooms(res.data);
          if (res.data.length > 0) {
            setActiveRoom(res.data[0]); // default to general
          }
        } else {
          setError('Failed to fetch group channels.');
        }
      } catch (err) {
        setError('Network error loading mentorship channels.');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [courseId, accessToken]);

  // 2. Fetch Chat History & Connect Socket when active room changes
  useEffect(() => {
    if (!activeRoom || !accessToken || !user) return;

    // Fetch Room History
    const loadHistory = async () => {
      try {
        const res = await getChatMessages(activeRoom.id, accessToken);
        if (res.success && res.data) {
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
    if (!text || !socketRef.current || !activeRoom || !user) return;

    socketRef.current.emit('send_message', {
      roomId: activeRoom.id,
      senderId: user.id,
      messageText: text
    });

    setInputMessage('');
  };

  if (loading) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center bg-slate-900/50 border border-white/10 rounded-2xl animate-pulse">
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

  return (
    <div className="h-[550px] grid grid-cols-1 md:grid-cols-4 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
      
      {/* ── Sidebar: Channels List ── */}
      <div className="border-r border-white/5 bg-slate-900/40 p-4 space-y-4 flex flex-col h-full md:col-span-1">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">Group Channels</span>
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
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {room.type === 'announcement' ? (
                  <Volume2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{room.type === 'general' ? 'General Chat' : 'Doubts Box'}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex flex-col h-full md:col-span-3">
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-slate-900/80 backdrop-blur flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white text-xs font-bold">{activeRoom?.title}</h4>
            <p className="text-slate-500 text-[10px] mt-0.5">Real-Time Mentor Doubts Box</p>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-950/20 styled-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
              <p>No messages yet in this group channel.</p>
              <p className="text-[10px] text-slate-600 mt-1">Start the conversation by typing your doubts below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isSelf ? 'justify-end' : ''}`}>
                  {!isSelf && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {msg.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="max-w-[70%]">
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-white text-[10px] font-bold">{msg.fullName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                          msg.role === 'admin' ? 'bg-red-500/25 text-red-400' : msg.role === 'faculty' ? 'bg-amber-500/25 text-amber-400' : 'bg-blue-500/25 text-blue-400'
                        }`}>
                          {msg.role}
                        </span>
                      </div>
                    )}
                    <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                      isSelf
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-900/10'
                        : 'bg-slate-800 border border-white/5 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.messageText}
                    </div>
                    <span className={`block text-[8px] text-slate-600 mt-1 ${isSelf ? 'text-right' : ''}`}>
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
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-slate-900/80 flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your doubts here..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
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
  );
}
