'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Send, MessageSquare, ShieldAlert, Sparkles, Hash, Volume2,
  ShieldCheck, UserCheck, Edit2, Trash2, Ban, Check, X, AlertTriangle
} from 'lucide-react';
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [editingMsg, setEditingMsg] = useState<{ id: string; text: string } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getBackendUrl = () => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
    return 'http://localhost:5000';
  };
  const BACKEND_URL = getBackendUrl();

  // 1. Fetch Initial Data & Block Status
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const supportRes = accessToken ? await getSupportRoom(accessToken).catch(() => null) : null;
        const facultyRes = await fetch(`${BACKEND_URL}/api/faculty`).then(r => r.json()).catch(() => []);

        if (Array.isArray(facultyRes)) {
          setFaculties(facultyRes);
        }

        const supportRoomId = supportRes?.success && supportRes?.data?.id 
          ? supportRes.data.id 
          : (user?.id ? `support-${user.id}` : 'admin-support-general');

        const mainRoom = {
          id: supportRoomId,
          title: 'Direct Chat with Admin & Mentors',
          type: 'admin_support',
          isDirect: true
        };

        setRooms([mainRoom]);
        setActiveRoom(mainRoom);

        // Check if current user is blocked
        if (user?.id) {
          const blockRes = await fetch(`${BACKEND_URL}/api/chats/blocked-users/check/${user.id}`).then(r => r.json()).catch(() => null);
          if (blockRes && blockRes.isBlocked) {
            setIsBlocked(true);
          }
        }
      } catch (err) {
        setError('Network error loading mentorship channels.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [courseId, accessToken, user]);

  // 2. Fetch Chat History & Connect Socket
  useEffect(() => {
    if (!activeRoom) return;

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

    const socket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect_error', (err) => {
      console.warn('[Mentorship Socket] Transport connection retry:', err.message);
    });

    socket.emit('join_room', activeRoom.id);

    socket.on('new_message', (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;

        const tempIdx = prev.findIndex(m =>
          (m.id?.toString().startsWith('temp-') || m.id?.toString().startsWith('admin-temp-')) &&
          m.messageText === msg.messageText
        );

        if (tempIdx !== -1) {
          const updated = [...prev];
          updated[tempIdx] = msg;
          return updated;
        }

        return [...prev, msg];
      });
    });

    socket.on('message_edited', (data: { messageId: string; newMessageText: string }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, messageText: data.newMessageText, isEdited: true } : m));
    });

    socket.on('message_deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    socket.on('user_blocked_status', (data: { userId: string; isBlocked: boolean }) => {
      if (user?.id === data.userId) {
        setIsBlocked(data.isBlocked);
      }
    });

    socket.on('user_blocked_error', (data: { message: string }) => {
      setIsBlocked(true);
      alert(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeRoom, accessToken, user]);

  // Scroll to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;
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

  // Student Edit Own Message
  const handleSaveEdit = async () => {
    if (!editingMsg || !editingMsg.text.trim()) return;
    const { id, text } = editingMsg;

    setMessages(prev => prev.map(m => m.id === id ? { ...m, messageText: text.trim(), isEdited: true } : m));
    setEditingMsg(null);

    await fetch(`${BACKEND_URL}/api/chats/messages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ messageText: text.trim(), senderId: user?.id })
    }).catch(() => null);

    if (socketRef.current && activeRoom) {
      socketRef.current.emit('edit_message', {
        messageId: id,
        roomId: activeRoom.id,
        newMessageText: text.trim(),
        senderId: user?.id
      });
    }
  };

  // Student Delete Own Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    setMessages(prev => prev.filter(m => m.id !== msgId));

    await fetch(`${BACKEND_URL}/api/chats/messages/${msgId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ senderId: user?.id })
    }).catch(() => null);

    if (socketRef.current && activeRoom) {
      socketRef.current.emit('delete_message', {
        messageId: msgId,
        roomId: activeRoom.id,
        senderId: user?.id
      });
    }
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
      {/* Assigned Mentor Profile Banner */}
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

      {/* Blocked Warning Banner */}
      {isBlocked && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce text-red-500" />
          <span>You are currently blocked from sending messages by Admin support. Contact support for assistance.</span>
        </div>
      )}

      {/* Real-Time Direct Admin Chat Box */}
      <div className="h-[550px] flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[var(--text-color)] text-xs font-bold">Direct Support &amp; Mentorship Line</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">Send doubts directly to Admin &amp; Officer Mentors</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Direct Admin Line Active
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-[var(--bg-color)] styled-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-400 mb-2" />
              <p>No messages in your direct admin chat yet.</p>
              <p className="text-[10px] text-slate-400 mt-1">Send a message directly to the Admin below. Our officers &amp; mentors reply promptly.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === (user?.id || 'guest-student-user');
              const isEditingThis = editingMsg?.id === msg.id;

              return (
                <div key={msg.id || Math.random()} className={`group relative flex items-start gap-2.5 ${isSelf ? 'justify-end' : ''}`}>
                  {!isSelf && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {msg.fullName?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="max-w-[70%] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      {!isSelf && (
                        <span className="text-[var(--text-color)] text-[10px] font-bold">{msg.fullName || 'Admin Support'}</span>
                      )}
                      {msg.isEdited && (
                        <span className="text-[9px] text-slate-400 italic ml-auto">(edited)</span>
                      )}
                    </div>

                    {/* Content or Edit Form */}
                    {isEditingThis ? (
                      <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-blue-500/50 p-2 rounded-xl shadow-lg">
                        <input
                          type="text"
                          value={editingMsg?.text || ''}
                          onChange={(e) => setEditingMsg(prev => prev ? { ...prev, text: e.target.value } : null)}
                          className="flex-1 text-xs text-[var(--text-color)] bg-transparent outline-none"
                          autoFocus
                        />
                        <button onClick={handleSaveEdit} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingMsg(null)} className="p-1 text-slate-400 hover:bg-slate-500/10 rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative group/bubble">
                        <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap ${
                          isSelf
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-900/10'
                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] rounded-tl-none'
                        }`}>
                          {msg.messageText}
                        </div>

                        {/* Hover Actions for Student's Own Messages */}
                        {isSelf && (
                          <div className="absolute top-1/2 -translate-y-1/2 -left-16 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--card-border)] p-1 rounded-xl shadow-lg">
                            <button
                              onClick={() => setEditingMsg({ id: msg.id, text: msg.messageText })}
                              className="p-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                              title="Edit your message"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <span className={`block text-[8px] text-slate-400 ${isSelf ? 'text-right' : ''}`}>
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
            disabled={isBlocked}
            placeholder={isBlocked ? "You are blocked from sending messages..." : "Type your doubts here..."}
            className="flex-1 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-xs text-[var(--text-color)] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isBlocked}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
