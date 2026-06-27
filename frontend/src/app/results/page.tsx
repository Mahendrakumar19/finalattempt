'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, MapPin, Award } from 'lucide-react';
import { db, fallbackResults } from '@/services/db';

export default function Results() {
  const [resultsList, setResultsList] = useState<any[]>(fallbackResults);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  useEffect(() => {
    const loadResults = async () => {
      try {
        const r = await db.getResults();
        if (r && r.length > 0) {
          setResultsList(r);
        }
      } catch (err) {
        console.error('Failed loading results:', err);
      }
    };
    loadResults();
  }, []);

  // Extracts lists for filter selectors
  const years = ['All', ...Array.from(new Set(resultsList.map(r => (r.year || '').toString())))];
  const exams = ['All', ...Array.from(new Set(resultsList.map(r => r.exam || '')))];
  const districts = ['All', ...Array.from(new Set(resultsList.map(r => r.district || '')))];

  const filteredResults = resultsList.filter(topper => {
    const name = topper.name || '';
    const story = topper.story || '';
    const service = topper.service || '';
    const year = topper.year || '';
    const exam = topper.exam || '';
    const district = topper.district || '';

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          story.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'All' || year.toString() === selectedYear;
    const matchesExam = selectedExam === 'All' || exam === selectedExam;
    const matchesDistrict = selectedDistrict === 'All' || district === selectedDistrict;

    return matchesSearch && matchesYear && matchesExam && matchesDistrict;
  });

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Toppers</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Proud Moments & Results
        </h1>
        <p className="text-slate-500 text-sm">
          {/* FUTURE USE: Include UPSC back when active */}
          Real results, real ranks, and inspirational stories of BPSC aspirants who cleared in their final attempts with us.
        </p>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search topper name or story..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Year Filter */}
        <div className="space-y-1">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
          >
            <option value="All">All Years</option>
            {years.filter(y => y !== 'All').map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Exam Filter */}
        <div className="space-y-1">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
          >
            <option value="All">All Exams</option>
            {exams.filter(ex => ex !== 'All').map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div className="space-y-1">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700"
          >
            <option value="All">All Districts</option>
            {districts.filter(d => d !== 'All').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResults.map((topper) => (
            <div
              key={topper.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-grow space-y-5">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img src={topper.photo} alt={topper.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-tight">
                      {topper.name}
                    </h3>
                    <p className="text-[11px] text-blue-600 font-extrabold flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{topper.rank} &bull; {topper.exam}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {topper.service}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Preparation Journey</span>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    "{topper.story}"
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-500 px-6">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>District: {topper.district}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  <span>Batch: {topper.course}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-sm font-semibold">No toppers match your filters.</p>
        </div>
      )}
    </div>
  );
}
