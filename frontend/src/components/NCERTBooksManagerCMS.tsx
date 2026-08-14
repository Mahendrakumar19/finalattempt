'use client';

import { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import MediaPicker from './MediaPicker';
import RichTextEditor from './RichTextEditor';

interface NCERTBookItem {
  id: string;
  subject: string;
  classLevel: number;
  bookName: string;
  title: string;
  language: string;
  fileMediaId?: string | null;
  fileMedia?: { originalName: string; storagePath: string } | null;
  description?: string | null;
  sortOrder: number;
}

const SUBJECTS = [
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Science',
  // 'Environment',
  'Sociology'
];

const CLASS_LEVELS = [6, 7, 8, 9, 10, 11, 12];

export default function NCERTBooksManagerCMS() {
  const [books, setBooks] = useState<NCERTBookItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterLanguage, setFilterLanguage] = useState('ALL');

  const [form, setForm] = useState({
    id: '',
    subject: 'History',
    classLevel: 6,
    bookName: '',
    title: '',
    language: 'Hindi',
    fileMediaId: '',
    description: '',
    sortOrder: 0
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ncert-books?limit=500`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBooks(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.classLevel || !form.bookName) {
      alert('Subject, Class Level, and Book Name are required.');
      return;
    }

    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `${BACKEND_URL}/api/ncert-books/${form.id}` : `${BACKEND_URL}/api/ncert-books`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setForm({
          id: '',
          subject: 'History',
          classLevel: 6,
          bookName: '',
          title: '',
          language: 'Hindi',
          fileMediaId: '',
          description: '',
          sortOrder: 0
        });
        fetchBooks();
        alert('NCERT Book saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this NCERT book?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/ncert-books/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectMedia = (_url: string, item: any) => {
    setForm(prev => ({ ...prev, fileMediaId: item.id }));
    setShowPicker(false);
  };

  const filteredBooks = books.filter(b => {
    if (filterSubject !== 'ALL' && b.subject !== filterSubject) return false;
    if (filterClass !== 'ALL' && String(b.classLevel) !== filterClass) return false;
    if (filterLanguage !== 'ALL' && b.language !== filterLanguage) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">NCERT Management Console</span>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">Class 6th to 12th Textbooks Vault</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload NCERT books by subject and class level (6th to 12th) with PDF attachments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Form panel */}
        <form onSubmit={handleSave} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-xs">
          <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
            {form.id ? 'Edit NCERT Book' : 'Add New NCERT Book'}
          </h4>

          {/* Subject (Allow Free Typing with Comma & Space) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">
              Subject Name (Type custom subject or pick suggestion)
            </label>
            <input
              type="text"
              list="ncert-subject-suggestions"
              placeholder="e.g. History, Geography, Polity, Art & Culture..."
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              required
            />
            <datalist id="ncert-subject-suggestions">
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          {/* Class Level Dropdown (6th to 12th) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Class Level (6th - 12th)</label>
            <select
              value={form.classLevel}
              onChange={(e) => setForm({ ...form, classLevel: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              required
            >
              {CLASS_LEVELS.map((cls) => (
                <option key={cls} value={cls}>Class {cls}th</option>
              ))}
            </select>
          </div>

          {/* Book Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Official Book Name</label>
            <input
              type="text"
              placeholder="e.g. Fundamentals of Physical Geography"
              value={form.bookName}
              onChange={(e) => setForm({ ...form, bookName: e.target.value, title: form.title || e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Custom Display Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Display Title (Frontend)</label>
            <input
              type="text"
              placeholder="e.g. Class 11 Physical Geography Book"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Language Version */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Language Version</label>
            <div className="flex gap-2">
              {['Hindi', 'English'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setForm({ ...form, language: lang })}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${form.language === lang
                      ? lang === 'Hindi'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                    }`}
                >
                  {lang === 'Hindi' ? '🇮🇳 हिंदी' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* PDF File Picker (DAM) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">PDF Textbook File (Media DAM)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="File Media ID"
                value={form.fileMediaId || ''}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
                readOnly
              />
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-xl shrink-0 cursor-pointer shadow-xs"
              >
                Pick PDF
              </button>
            </div>
          </div>

          {/* Description / Summary */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Overview Notes</label>
            <RichTextEditor
              label="NCERT Book Notes"
              value={form.description || ''}
              onChange={(html) => setForm({ ...form, description: html })}
            />
          </div>

          <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer">
            {form.id ? '💾 Save Changes' : '🚀 Upload NCERT Book'}
          </button>
        </form>

        {/* List & Filter panel */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs">

          {/* Table Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
            <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
              NCERT Books Vault ({filteredBooks.length})
            </h4>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ALL">🌐 All Languages</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
              </select>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ALL">All Subjects</option>
                {SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ALL">All Classes (6-12)</option>
                {CLASS_LEVELS.map((cls) => (
                  <option key={cls} value={String(cls)}>Class {cls}th</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Subject</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">Book Name</th>
                  <th className="p-3">PDF Attachment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      No NCERT books matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((bk) => (
                    <tr key={bk.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-emerald-500/5 transition-colors">
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {bk.subject}
                        </span>
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-900 dark:text-white">Class {bk.classLevel}th</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${bk.language === 'English'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-orange-50 text-orange-600 border-orange-200'
                          }`}>
                          {bk.language === 'Hindi' ? 'Hindi' : 'English'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{bk.title || bk.bookName}</td>
                      <td className="p-3 text-slate-500 font-mono text-[10px]">
                        {bk.fileMedia ? '📄 PDF Attached' : '❌ No File'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setForm({
                              id: bk.id,
                              subject: bk.subject,
                              classLevel: bk.classLevel,
                              bookName: bk.bookName,
                              title: bk.title,
                              language: bk.language || 'Hindi',
                              fileMediaId: bk.fileMediaId || '',
                              description: bk.description || '',
                              sortOrder: bk.sortOrder
                            })}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(bk.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Media Picker Overlay */}
      {showPicker && (
        <MediaPicker
          onSelect={selectMedia}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
