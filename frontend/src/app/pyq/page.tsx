'use client';

import { useState } from 'react';
import { Search, ChevronDown, CheckCircle, HelpCircle } from 'lucide-react';
import { pyqs } from '@/services/db';

export default function PyqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [openExplanations, setOpenExplanations] = useState<Record<string, boolean>>({});

  const subjects = ['All', ...Array.from(new Set(pyqs.map(p => p.subject)))];

  const filteredPyqs = pyqs.filter(p => {
    const matchesSearch = p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || p.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const toggleExplanation = (id: string) => {
    setOpenExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 text-center">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">PYQ Database</span>
        <h1 className="text-4xl font-heading font-extrabold text-brand-primary tracking-tight">
          Previous Year Questions
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Explore and search through real civil services questions with detailed model answers and diagnostic explanations.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                selectedSubject === sub
                  ? 'bg-brand-primary text-white'
                  : 'text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredPyqs.length > 0 ? (
        <div className="space-y-6">
          {filteredPyqs.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="text-blue-650">{item.exam} ({item.year})</span>
                <span className="uppercase bg-slate-100 px-2 py-0.5 rounded-md">{item.subject}</span>
              </div>

              <h4 className="font-heading font-bold text-sm text-slate-900 leading-snug">
                {item.question}
              </h4>

              {/* Options */}
              {item.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {item.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs font-medium ${
                        openExplanations[item.id] && opt === item.answer
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-100 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation trigger */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-semibold">
                  Click check answer to review evaluation structure.
                </p>
                <button
                  onClick={() => toggleExplanation(item.id)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>{openExplanations[item.id] ? 'Hide Answer' : 'Check Answer'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openExplanations[item.id] ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {openExplanations[item.id] && (
                <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-xs space-y-2">
                  <div className="flex gap-2 items-center font-bold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Correct Answer: {item.answer}</span>
                  </div>
                  <p className="text-slate-650 leading-relaxed pl-6">
                    <span className="font-bold text-slate-800">Explanation: </span>
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-sm font-semibold">No questions found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
