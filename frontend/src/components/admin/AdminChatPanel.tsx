'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Send, MessageSquare, ShieldAlert, User, RefreshCw,
  Search, Trash2, Edit2, Ban, Check, X
} from 'lucide-react';
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
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
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

  // Fetch Rooms & Blocked Users
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

      const blockedRes = await fetch(`${BACKEND_URL}/api/chats/blocked-users`).then(r => r.json()).catch(() => null);
      if (blockedRes && blockedRes.success && Array.isArray(blockedRes.data)) {
        setBlockedUsers(blockedRes.data);
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

  // Socket Connection & Real-Time Event Handlers
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.emit('admin_join_all');

    socket.on('new_message', (msg: any) => {
      if (activeRoom && activeRoom.id === msg.roomId) {
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
      }

      setRooms(prevRooms => {
        const roomExists = prevRooms.some(r => r.id === msg.roomId);
        if (!roomExists) {
          const newRoom = {
            id: msg.roomId,
            title: `Direct Chat: ${msg.fullName || 'Student'}`,
            type: 'admin_support',
            lastMessageText: msg.messageText,
            lastMessageTime: msg.createdAt,
            studentName: msg.fullName || 'Student'
          };
          if (!activeRoom) {
            setActiveRoom(newRoom);
          }
          return [newRoom, ...prevRooms];
        }

        return prevRooms.map(r => {
          if (r.id === msg.roomId) {
            return {
              ...r,
              lastMessageText: msg.messageText,
              lastMessageTime: msg.createdAt,
              studentName: msg.role === 'student' ? (msg.fullName || r.studentName) : r.studentName
            };
          }
          return r;
        });
      });
    });

    socket.on('message_edited', (data: { messageId: string; newMessageText: string }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, messageText: data.newMessageText, isEdited: true } : m));
    });

    socket.on('message_deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    socket.on('user_blocked_status', (data: { userId: string; isBlocked: boolean }) => {
      setBlockedUsers(prev => data.isBlocked ? Array.from(new Set([...prev, data.userId])) : prev.filter(id => id !== data.userId));
    });

    return () => {
      socket.disconnect();
    };
  }, [BACKEND_URL, activeRoom]);

  // Load Active Room History
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Reply
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

  // Edit Message
  const handleSaveEdit = async () => {
    if (!editingMsg || !editingMsg.text.trim()) return;
    const { id, text } = editingMsg;

    setMessages(prev => prev.map(m => m.id === id ? { ...m, messageText: text.trim(), isEdited: true } : m));
    setEditingMsg(null);

    await fetch(`${BACKEND_URL}/api/chats/messages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ messageText: text.trim() })
    }).catch(() => null);

    if (socketRef.current && activeRoom) {
      socketRef.current.emit('edit_message', {
        messageId: id,
        roomId: activeRoom.id,
        newMessageText: text.trim(),
        isAdmin: true
      });
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message permanently?')) return;

    setMessages(prev => prev.filter(m => m.id !== msgId));

    await fetch(`${BACKEND_URL}/api/chats/messages/${msgId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).catch(() => null);

    if (socketRef.current && activeRoom) {
      socketRef.current.emit('delete_message', {
        messageId: msgId,
        roomId: activeRoom.id,
        isAdmin: true
      });
    }
  };

  // Delete Room
  const handleDeleteRoom = async () => {
    if (!activeRoom || !confirm(`Delete entire chat thread for ${activeRoom.studentName || activeRoom.title}?`)) return;

    const targetRoomId = activeRoom.id;
    setRooms(prev => prev.filter(r => r.id !== targetRoomId));
    setActiveRoom(null);
    setMessages([]);

    await fetch(`${BACKEND_URL}/api/chats/rooms/${targetRoomId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).catch(() => null);
  };

  // Extract Student ID
  const currentStudentId = activeRoom?.id?.startsWith('support-')
    ? activeRoom.id.replace('support-', '')
    : activeRoom?.studentId || activeRoom?.id;

  const isStudentBlocked = blockedUsers.includes(currentStudentId);

  // Toggle Block
  const handleToggleBlock = async () => {
    if (!currentStudentId) return;
    const targetState = !isStudentBlocked;

    if (targetState) {
      setBlockedUsers(prev => Array.from(new Set([...prev, currentStudentId])));
    } else {
      setBlockedUsers(prev => prev.filter(id => id !== currentStudentId));
    }

    await fetch(`${BACKEND_URL}/api/chats/block-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ userId: currentStudentId, isBlocked: targetState })
    }).catch(() => null);

    if (socketRef.current) {
      socketRef.current.emit('block_user', { userId: currentStudentId, isBlocked: targetState });
    }
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
    <div className="space-y-4 h-[calc(100vh-140px)] max-h-[820px] flex flex-col">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-2xl shadow-sm shrink-0">
        <div>
          <h3 className="text-lg font-heading font-black text-[var(--text-color)] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <span>Student Mentor &amp; Support Console</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time chat moderation, student doubt resolution, editing, deleting &amp; security controls.
          </p>
        </div>

        <button
          onClick={loadRooms}
          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 dark:border-white/10 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Main Responsive Chat Layout Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl overflow-hidden min-h-0">

        {/* Left Inbox Sidebar */}
        <div className="lg:col-span-4 border-r border-[var(--card-border)] bg-[var(--bg-color)] p-3 flex flex-col h-full overflow-hidden">
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-color)] placeholder:text-slate-400 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Student Conversations List with Visible Custom Scrollbar */}
          <div className="flex-1 overflow-y-auto space-y-2 styled-scrollbar pr-1">
            {filteredRooms.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                No active student chat threads found.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                const rStudentId = room.id?.startsWith('support-') ? room.id.replace('support-', '') : room.studentId || room.id;
                const isBlocked = blockedUsers.includes(rStudentId);

                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full p-3 rounded-xl text-left transition-all border flex flex-col gap-1 cursor-pointer relative ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-[var(--text-color)] shadow-sm'
                        : 'bg-[var(--card-bg)] border-[var(--card-border)] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-xs truncate text-[var(--text-color)]">
                          {room.studentName || room.title || 'Student'}
                        </span>
                        {isBlocked && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 text-[9px] font-black uppercase shrink-0">
                            Blocked
                          </span>
                        )}
                      </div>

                      {room.lastMessageTime && (
                        <span className="text-[9px] text-slate-400 font-mono shrink-0">
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

        {/* Right Active Conversation Panel */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[var(--bg-color)] overflow-hidden">
          {activeRoom ? (
            <>
              {/* Header Controls Bar */}
              <div className="p-3.5 bg-[var(--card-bg)] border-b border-[var(--card-border)] flex items-center justify-between flex-wrap gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-color)] text-xs font-black">{activeRoom.studentName || activeRoom.title}</h4>
                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                      {/* <span className="text-amber-500 font-bold uppercase text-[9px] tracking-wide">Direct Line</span> */}
                      {/* <span>•</span> */}
                      {/* <span className="font-mono text-[9.5px] opacity-75">{activeRoom.id?.replace('support-', 'User ID: ')}</span> */}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleBlock}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isStudentBlocked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isStudentBlocked ? 'Unblock Student' : 'Block Student'}</span>
                  </button>

                  <button
                    onClick={handleDeleteRoom}
                    className="p-1.5 rounded-xl text-red-400 hover:text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                    title="Delete entire chat thread"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body with Custom Scrollbar */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto styled-scrollbar bg-[var(--bg-color)]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-400 mb-2" />
                    <p>No chat history available for this thread.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.role === 'admin';
                    const isEditingThis = editingMsg?.id === msg.id;

                    return (
                      <div key={msg.id || Math.random()} className={`group relative flex items-start gap-2 ${isAdmin ? 'justify-end' : ''}`}>
                        {!isAdmin && (
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">
                            {msg.fullName ? msg.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                        )}

                        <div className="max-w-[80%] space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[var(--text-color)] text-[10px] font-bold">
                              {msg.fullName || (isAdmin ? 'Admin Support' : 'Student')}
                            </span>
                            {msg.isEdited && (
                              <span className="text-[9px] text-slate-400 italic">(edited)</span>
                            )}
                          </div>

                          {/* Message Content or Edit Box */}
                          {isEditingThis ? (
                            <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-amber-500/50 p-2 rounded-xl shadow-lg">
                              <input
                                type="text"
                                value={editingMsg?.text || ''}
                                onChange={(e) => setEditingMsg(prev => prev ? { ...prev, text: e.target.value } : null)}
                                className="flex-1 text-xs text-[var(--text-color)] bg-transparent outline-none"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingMsg(null)}
                                className="p-1 text-slate-400 hover:bg-slate-500/10 rounded cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative group/bubble">
                              <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed break-words whitespace-pre-wrap ${
                                isAdmin
                                  ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-none shadow-sm'
                                  : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] rounded-tl-none shadow-xs'
                              }`}>
                                {msg.messageText}
                              </div>

                              {/* Hover Edit/Delete Action Controls */}
                              <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--card-border)] p-1 rounded-xl shadow-lg ${isAdmin ? '-left-16' : '-right-16'}`}>
                                <button
                                  onClick={() => setEditingMsg({ id: msg.id, text: msg.messageText })}
                                  className="p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                                  title="Edit message"
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
                            </div>
                          )}

                          <span className={`block text-[8px] text-slate-400 ${isAdmin ? 'text-right' : ''}`}>
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
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex gap-2 shrink-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Reply to ${activeRoom.studentName || 'student'}...`}
                  className="flex-1 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-color)] placeholder:text-slate-400 outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 text-slate-500 mb-2" />
              <p>Select a student conversation from the left to view messages &amp; moderate.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
