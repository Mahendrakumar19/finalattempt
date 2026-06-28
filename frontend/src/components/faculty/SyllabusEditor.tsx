'use client';

import { useState } from 'react';
import { Plus, Check, ShieldAlert, Sparkles, BookOpen, Film } from 'lucide-react';

interface SyllabusEditorProps {
  courseId: string;
  initialSyllabus?: any[];
  accessToken: string;
}

export default function SyllabusEditor({ courseId, initialSyllabus = [], accessToken }: SyllabusEditorProps) {
  const [syllabus, setSyllabus] = useState<any[]>(initialSyllabus);
  const [newChapter, setNewChapter] = useState('');
  const [newTopic, setNewTopic] = useState<Record<number, string>>({});
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const handleAddChapter = () => {
    const title = newChapter.trim();
    if (!title) return;
    setSyllabus(prev => [...prev, { chapter: title, topics: [] }]);
    setNewChapter('');
  };

  const handleAddTopic = (chapterIdx: number) => {
    const text = newTopic[chapterIdx]?.trim();
    if (!text) return;
    
    setSyllabus(prev => {
      const copy = [...prev];
      copy[chapterIdx].topics = [...copy[chapterIdx].topics, text];
      return copy;
    });

    setNewTopic(prev => ({ ...prev, [chapterIdx]: '' }));
  };

  const handleSaveSyllabus = async () => {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/faculty/courses/${courseId}/syllabus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ syllabus })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Syllabus structure persisted successfully!');
      } else {
        setError(data.error || 'Failed to persist syllabus.');
      }
    } catch (err) {
      setError('Connection error. Failed to save syllabus changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div>
        <h3 className="font-heading font-extrabold text-lg text-white">Course Syllabus Editor</h3>
        <p className="text-slate-400 text-xs mt-1">Design chapters and curriculum sections dynamically for this BPSC batch.</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Chapters list */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 styled-scrollbar">
        {syllabus.map((ch, chIdx) => (
          <div key={chIdx} className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white text-xs font-bold font-mono text-blue-400">Chapter {chIdx + 1}: {ch.chapter}</span>
            </div>

            <ul className="space-y-1.5 pl-4 text-xs text-slate-400 font-medium">
              {ch.topics.map((t: string, tIdx: number) => (
                <li key={tIdx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            {/* Add Topic Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add sub-topic..."
                value={newTopic[chIdx] || ''}
                onChange={e => setNewTopic(prev => ({ ...prev, [chIdx]: e.target.value }))}
                className="flex-grow px-3 py-1.5 bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              />
              <button
                onClick={() => handleAddTopic(chIdx)}
                className="p-2 bg-blue-600/15 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Chapter Form */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Create New Chapter</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Chapter 4: Bihar Freedom Struggles"
            value={newChapter}
            onChange={e => setNewChapter(e.target.value)}
            className="flex-grow px-4 py-2 bg-slate-950 border border-slate-850 text-white placeholder:text-slate-650 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          />
          <button
            onClick={handleAddChapter}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      <button
        onClick={handleSaveSyllabus}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/30"
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <BookOpen className="w-4 h-4" />
            <span>Save & Publish Syllabus Structure</span>
          </>
        )}
      </button>
    </div>
  );
}
