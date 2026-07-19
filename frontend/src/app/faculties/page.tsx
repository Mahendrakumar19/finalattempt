'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Star, User, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { db, fallbackFaculty } from '@/services/db';

// Simple helper to match URL slugs to names
function getSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function FacultiesPage() {
  const [facultyList, setFacultyList] = useState<any[]>(fallbackFaculty);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFaculty = async () => {
      setLoading(true);
      try {
        const fac = await db.getFaculty();
        if (fac && fac.length > 0) {
          setFacultyList(fac);
        }
      } catch (err) {
        console.error('Failed loading faculty members:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFaculty();
  }, []);

  // Subject extraction for filters
  const subjects = ['All', ...Array.from(new Set(facultyList.map((member: any) => member.role.split('&')[0].trim())))];

  // Filtering logic
  const filteredFaculty = facultyList.filter((member: any) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (member.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || member.role.toLowerCase().includes(selectedSubject.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-[var(--bg-color)] min-h-screen">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest inline-block">
          Mentorship Team
        </span>
        <h1 className="text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
          Meet Our Expert Faculty Board
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Learn from BPSC policy advisors, civil services toppers, and specialized subject-matter experts dedicated to guiding your final attempt.
        </p>
      </div>

      {/* Controls: Search and Subject Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-5xl mx-auto">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-[var(--text-color)] shadow-3xs"
          />
        </div>

        {/* Subject Filters Tabs */}
        <div className="flex flex-wrap gap-2 items-center justify-center">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-[var(--card-bg)] border border-[var(--card-border)]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center max-w-md mx-auto shadow-3xs">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-[var(--text-color)]">No faculty profiles found</h3>
          <p className="text-xs text-slate-500 mt-1">Try expanding your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {filteredFaculty.map((member) => {
            const slug = getSlug(member.name);
            return (
              <div
                key={member.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-3xs flex flex-col sm:flex-row gap-6 hover-lift"
              >
                {/* Avatar Column */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-24 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-[var(--card-border)] relative">
                    <img src={member.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    Exp: {member.experience}
                  </span>
                </div>

                {/* Info and Navigation Column */}
                <div className="space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-[var(--text-color)] leading-tight">
                        {member.name}
                      </h3>
                      <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">
                        {member.role}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Selected Board Mentor
                    </span>
                    <Link
                      href={`/faculties/${slug}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-brand-secondary hover:text-amber-500 transition-colors uppercase tracking-wider"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
