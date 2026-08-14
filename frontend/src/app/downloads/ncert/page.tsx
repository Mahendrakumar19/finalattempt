'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Download, BookOpen, Eye, Home, ChevronRight, X, Layers } from 'lucide-react';

interface NCERTBookItem {
  id: string;
  subject: string;
  classLevel: number;
  bookName: string;
  title: string;
  language: string;
  fileMedia?: { storagePath?: string; url?: string; path?: string } | string | null;
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

export default function NcertPage() {
  const [booksList, setBooksList] = useState<NCERTBookItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Active Subject Modal popup (like PYQ Exam Vault)
  const [activeSubjectModal, setActiveSubjectModal] = useState<string | null>(null);
  const [modalClassFilter, setModalClassFilter] = useState<string>('ALL');
  const [modalLanguageFilter, setModalLanguageFilter] = useState<string>('ALL');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    let ignore = false;
    const fetchBooks = async () => {
      setLoading(true);
      try {
        let url = `${BACKEND_URL}/api/ncert-books?limit=500`;
        if (selectedSubject !== 'ALL') url += `&subject=${encodeURIComponent(selectedSubject)}`;
        if (selectedClassLevel !== 'ALL') url += `&classLevel=${selectedClassLevel}`;
        if (selectedLanguage !== 'ALL') url += `&language=${encodeURIComponent(selectedLanguage)}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setBooksList(data.data);
        }
      } catch (err) {
        console.error('Error fetching NCERT books:', err);
      }
      if (!ignore) setLoading(false);
    };
    fetchBooks();
    return () => { ignore = true; };
  }, [BACKEND_URL, selectedSubject, selectedClassLevel, selectedLanguage, searchQuery]);

  const getMediaUrl = (mediaObj?: { storagePath?: string; url?: string; path?: string } | string | null) => {
    if (!mediaObj) return '';
    const pathStr = typeof mediaObj === 'string' ? mediaObj : (mediaObj.storagePath || mediaObj.url || mediaObj.path || '');
    if (!pathStr) return '';
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
    if (pathStr.startsWith('/api/')) return `${BACKEND_URL}${pathStr}`;
    return `${BACKEND_URL}/${pathStr.replace(/^\//, '')}`;
  };

  // Extract all unique subjects dynamically
  const dynamicSubjectsSet = new Set<string>(SUBJECTS);
  booksList.forEach(b => { if (b.subject) dynamicSubjectsSet.add(b.subject); });
  const allSubjects = Array.from(dynamicSubjectsSet);

  // Group books by Subject (like Exam Vaults in PYQ)
  const subjectGroups = allSubjects.map((sub) => {
    const books = booksList.filter((b) => b.subject?.toLowerCase() === sub.toLowerCase());
    return {
      subject: sub,
      books: books.sort((a, b) => (a.classLevel - b.classLevel) || (a.sortOrder - b.sortOrder))
    };
  }).filter((group) => group.books.length > 0 || selectedSubject === 'ALL');

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 min-h-screen font-body">

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <Link href="/" className="hover:text-amber-500 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <Link href="/resources" className="hover:text-amber-500">
          <span>Resources</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
        <span className="text-slate-800 dark:text-slate-200 font-bold">NCERT Textbooks</span>
      </div>

      {/* Page Header (PYQ Style) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-3 max-w-3xl">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest block w-fit">
            Class 6 to 12 Textbooks
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tight leading-none">
            NCERT Books Repository
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Subject-wise NCERT Textbooks for Civil Services preparation (Class 6th to 12th).
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3.5 rounded-2xl shrink-0">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">{booksList.length} Books Available</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{allSubjects.length} Subject Vaults</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar (Subject & Class Level 6 to 12 Dropdowns) */}
      <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by book name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-2xl outline-none text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Language Pill Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {[{ val: 'ALL', label: '🌐 All' }, { val: 'Hindi', label: 'Hindi' }, { val: 'English', label: 'English' }].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setSelectedLanguage(val)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${selectedLanguage === val
                    ? val === 'Hindi'
                      ? 'bg-orange-500 text-white shadow-md'
                      : val === 'English'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Subjects ({allSubjects.length})</option>
            {allSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Class 6 to 12 Filter */}
          <select
            value={selectedClassLevel}
            onChange={(e) => setSelectedClassLevel(e.target.value)}
            className="px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-white/[0.06] rounded-2xl outline-none text-slate-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="ALL">All Classes (6th - 12th)</option>
            {CLASS_LEVELS.map((cls) => (
              <option key={cls} value={String(cls)}>Class {cls}th</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUBJECT CARDS VAULT GRID (DRISHTI IAS INSPIRED COLORFUL BOXES) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : booksList.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-4 shadow-sm">
          <Layers className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-heading font-black text-base text-slate-950 dark:text-white">No NCERT Books Uploaded Yet</h3>
          <p className="text-xs text-slate-500">Modify your search query filters or upload NCERT books from the Admin Panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subjectGroups.map(({ subject, books }, idx) => {
            // Color palettes for Drishti IAS style colorful boxes
            const COLOR_SCHEMES = [
              { bg: 'from-amber-500/15 via-amber-500/5 to-transparent', border: 'border-amber-500/30 hover:border-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', iconBg: 'bg-amber-500 text-slate-950' },
              { bg: 'from-blue-500/15 via-blue-500/5 to-transparent', border: 'border-blue-500/30 hover:border-blue-500', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30', iconBg: 'bg-blue-500 text-white' },
              { bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent', border: 'border-emerald-500/30 hover:border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', iconBg: 'bg-emerald-500 text-slate-950' },
              { bg: 'from-rose-500/15 via-rose-500/5 to-transparent', border: 'border-rose-500/30 hover:border-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30', iconBg: 'bg-rose-500 text-white' },
              { bg: 'from-purple-500/15 via-purple-500/5 to-transparent', border: 'border-purple-500/30 hover:border-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30', iconBg: 'bg-purple-500 text-white' },
              { bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent', border: 'border-cyan-500/30 hover:border-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30', iconBg: 'bg-cyan-500 text-slate-950' },
              { bg: 'from-orange-500/15 via-orange-500/5 to-transparent', border: 'border-orange-500/30 hover:border-orange-500', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30', iconBg: 'bg-orange-500 text-slate-950' },
              { bg: 'from-indigo-500/15 via-indigo-500/5 to-transparent', border: 'border-indigo-500/30 hover:border-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30', iconBg: 'bg-indigo-500 text-white' }
            ];

            const theme = COLOR_SCHEMES[idx % COLOR_SCHEMES.length];

            return (
              <div
                key={subject}
                onClick={() => {
                  setActiveSubjectModal(subject);
                  setModalClassFilter('ALL');
                  setModalLanguageFilter('ALL');
                }}
                className={`group bg-gradient-to-br ${theme.bg} bg-white dark:bg-slate-900 border ${theme.border} p-6 rounded-3xl space-y-5 shadow-xs hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group-hover:-translate-y-1`}
              >
                <div className="space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center font-black text-sm shadow-md group-hover:scale-110 transition-transform`}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${theme.badge} border px-3 py-1 rounded-xl`}>
                      {books.length} {books.length === 1 ? 'PDF' : 'PDFs'}
                    </span>
                  </div>

                  <div>
                    <h3 className={`font-heading font-black text-xl text-slate-900 dark:text-white ${theme.text} transition-colors`}>
                      {subject}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      Class 6th to 12th {subject} NCERT Textbooks &amp; PDF Booklets.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Class 6th - 12th
                  </span>
                  <span className={`text-xs font-black ${theme.text} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                    View Books &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP MODAL: ALL BOOKS FOR SELECTED SUBJECT WITH CLASS 6-12 FILTERS */}
      {activeSubjectModal && (() => {
        const subjectBooks = booksList.filter(b => b.subject?.toLowerCase() === activeSubjectModal.toLowerCase());

        const filteredModalBooks = subjectBooks.filter(b => {
          if (modalClassFilter !== 'ALL' && String(b.classLevel) !== modalClassFilter) return false;
          if (modalLanguageFilter !== 'ALL' && b.language !== modalLanguageFilter) return false;
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                      {activeSubjectModal} NCERT Books Collection
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Select Class level (6th to 12th) to view and download textbook PDFs.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubjectModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Class Filter Dropdown Bar */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Language Pill Toggle inside modal */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl">
                    {[{ val: 'ALL', label: '🌐 All' }, { val: 'Hindi', label: 'Hindi' }, { val: 'English', label: 'English' }].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => setModalLanguageFilter(val)}
                        className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${modalLanguageFilter === val
                            ? val === 'Hindi'
                              ? 'bg-orange-500 text-white shadow'
                              : val === 'English'
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Class:</span>
                    <select
                      value={modalClassFilter}
                      onChange={(e) => setModalClassFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-250 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white font-extrabold cursor-pointer shadow-xs"
                    >
                      <option value="ALL">All Classes (6th - 12th)</option>
                      {CLASS_LEVELS.map((cls) => (
                        <option key={cls} value={String(cls)}>Class {cls}th</option>
                      ))}
                    </select>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  Showing {filteredModalBooks.length} of {subjectBooks.length} Books
                </span>
              </div>

              {/* Books Grid Scrollable Content */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {filteredModalBooks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No books uploaded for Class {modalClassFilter}th in {activeSubjectModal}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredModalBooks.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl space-y-3 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              Class {item.classLevel}th NCERT
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.language === 'English'
                                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40'
                                  : item.language === 'Bilingual'
                                    ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/40'
                                    : 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40'
                                }`}>
                                {item.language === 'Hindi' ? 'Hindi' : item.language === 'English' ? 'English' : '🔄 Bilingual'}
                              </span>
                              <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                                {item.subject}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-heading font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {item.title || item.bookName}
                          </h4>

                          {item.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* View & Download Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-white/[0.06]">
                          {item.fileMedia && getMediaUrl(item.fileMedia) && (
                            <a
                              href={getMediaUrl(item.fileMedia)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              <span>View</span>
                            </a>
                          )}

                          {item.fileMedia && getMediaUrl(item.fileMedia) && (
                            <a
                              href={getMediaUrl(item.fileMedia)}
                              download
                              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
