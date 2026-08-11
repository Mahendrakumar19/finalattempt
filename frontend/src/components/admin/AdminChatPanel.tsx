'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, ShieldAlert, Sparkles, User, RefreshCw, Clock, Search } from 'lucide-react';
import { getAdminChatRooms, getChatMessages } from '@/services/auth';

interface AdminChatPanelProps {
  adminToken: string;
}

export default function AdminChatPanel({ adminToken }: AdminChatPanelProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // 1. Fetch All Student Chat Rooms
  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await getAdminChatRooms(adminToken);
      if (res.success && res.data) {
        setRooms(res.data);
        if (res.data.length > 0 && !activeRoom) {
          setActiveRoom(res.data[0]);
        }
      }
    } catch (err) {
      setError('Failed to fetch student chat channels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [adminToken]);

  // 2. Connect Socket.io for Admin Real-Time Listener
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      withCredentials: true
    });
    socketRef.current = socket;

    socket.emit('admin_join_all');

    socket.on('new_message', (msg: any) => {
      // Update message thread if active room matches
      if (activeRoom && activeRoom.id === msg.roomId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Update room list preview
      setRooms(prevRooms => {
        return prevRooms.map(r => {
          if (r.id === msg.roomId) {
            return {
              ...r,
              lastMessageText: msg.messageText,
              lastMessageTime: msg.createdAt,
              studentName: msg.role === 'student' ? msg.fullName : r.studentName
            };
          }
          return r;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [BACKEND_URL, activeRoom]);

  // 3. Load Active Room Messages History & Join Socket Room
  useEffect(() => {
    if (!activeRoom || !adminToken) return;

    const loadHistory = async () => {
      try {
        const res = await getChatMessages(activeRoom.id, adminToken);
        if (res.success && res.data) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Failed loading room history:', err);
      }
    };

    loadHistory();

    if (socketRef.current) {
      socketRef.current.emit('join_room', activeRoom.id);
    }
  }, [activeRoom, adminToken]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Admin Reply
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !socketRef.current || !activeRoom) return;

    const payload = {
      roomId: activeRoom.id,
      senderId: 'admin-master-user',
      senderName: 'Admin Support',
      senderRole: 'admin',
      messageText: text
    };

    const optimisticMsg = {
      id: `admin-temp-${Date.now()}`,
      roomId: activeRoom.id,
      senderId: 'admin-master-user',
      fullName: 'Admin Support',
      role: 'admin',
      messageText: text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    socketRef.current.emit('send_message', payload);
    setInputMessage('');
  };

  const filteredRooms = rooms.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.lastMessageText && r.lastMessageText.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-xl">
        <div>
          <h3 className="text-xl font-heading font-black text-[var(--text-color)] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <span>Student Mentor &amp; Support Chats</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time student doubts, direct queries, and mentorship interactions.
          </p>
        </div>

        <button
          onClick={loadRooms}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="h-[600px] grid grid-cols-1 lg:grid-cols-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left Sidebar: Conversations Inbox */}
        <div className="lg:col-span-4 border-r border-[var(--card-border)] bg-[var(--bg-color)] p-4 flex flex-col h-full space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-color)] placeholder:text-slate-400 outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 styled-scrollbar">
            {filteredRooms.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No chat conversations found.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex flex-col gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-[var(--text-color)] shadow-md'
                        : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs truncate text-[var(--text-color)]">
                        {room.studentName || room.title || 'Student'}
                      </span>
                      {room.lastMessageTime && (
                        <span className="text-[9px] text-slate-500 font-mono shrink-0">
                          {new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic font-normal">
                      {room.lastMessageText || 'No messages yet...'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Conversation Messages & Reply Input */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[var(--bg-color)]">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="p-4 bg-[var(--card-bg)] border-b border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-color)] text-xs font-black">{activeRoom.studentName || activeRoom.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Room ID: {activeRoom.id}</p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Live Socket Active
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto styled-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                    <p>No chat history available for this thread.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.role === 'admin';
                    return (
                      <div key={msg.id || Math.random()} className={`flex items-start gap-2.5 ${isAdmin ? 'justify-end' : ''}`}>
                        {!isAdmin && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {msg.fullName ? msg.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                        )}
                        <div className="max-w-[75%]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[var(--text-color)] text-[10px] font-bold">{msg.fullName || (isAdmin ? 'Admin Support' : 'Student')}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                              isAdmin ? 'bg-amber-500 text-slate-950 font-black' : 'bg-blue-500/20 text-blue-500 dark:text-blue-400'
                            }`}>
                              {isAdmin ? 'ADMIN' : 'STUDENT'}
                            </span>
                          </div>

                          <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed ${
                            isAdmin
                              ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-200 rounded-tl-none'
                          }`}>
                            {msg.messageText}
                          </div>

                          <span className={`block text-[8px] text-slate-500 mt-1 ${isAdmin ? 'text-right' : ''}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Reply to ${activeRoom.studentName || 'student'}...`}
                  className="flex-1 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-xs text-[var(--text-color)] placeholder:text-slate-400 outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
              <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
              <p>Select a student conversation from the left to start replying.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
