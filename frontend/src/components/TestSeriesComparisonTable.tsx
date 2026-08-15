'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, ChevronDown, Check, Filter, Sparkles, HelpCircle, Shield } from 'lucide-react';
import { TestSeriesItem } from '@/services/db';

interface TestSeriesComparisonTableProps {
  programs: TestSeriesItem[];
  title?: string;
  subtitle?: string;
}

export default function TestSeriesComparisonTable({
  programs = [],
  title = 'Choose the Right Prelims Mock Test Series for You',
  subtitle = 'Compare the benefits of each series and choose the best fit for your UPSC & State PCS preparation goals. Select a structured program or a personalized approach to enhance your readiness for the Examination.'
}: TestSeriesComparisonTableProps) {
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [selectedMedium, setSelectedMedium] = useState<string>('ALL');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isMediumDropdownOpen, setIsMediumDropdownOpen] = useState(false);

  // Extract unique Exam Categories (e.g. BPSC, APPCS, APSSB, etc.)
  const availableExams = useMemo(() => {
    const exams = new Set<string>(['BPSC', 'APPCS', 'APSSB']);
    programs.forEach(p => {
      const raw = (p.exam || p.examId || p.title || '').toUpperCase();
      if (raw.includes('BPSC')) exams.add('BPSC');
      else if (raw.includes('APPCS') || raw.includes('APPSC')) exams.add('APPCS');
      else if (raw.includes('APSSB')) exams.add('APSSB');
      else if (raw.includes('UPSC')) exams.add('UPSC');
      else if (p.exam) {
        exams.add(p.exam.split(' ')[0].toUpperCase());
      }
    });
    return Array.from(exams);
  }, [programs]);

  // Extract unique batch dates from programs
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    programs.forEach(p => {
      if (p.batchStartDate) dates.add(p.batchStartDate);
    });
    return Array.from(dates);
  }, [programs]);

  // Filter programs based on exam, medium, and start dates
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      // Exam Category Filter
      if (selectedExam !== 'ALL') {
        const progExam = (p.exam || p.examId || p.title || '').toLowerCase();
        const searchKey = selectedExam.toLowerCase();
        if (searchKey === 'appcs' || searchKey === 'appsc') {
          if (!progExam.includes('appcs') && !progExam.includes('appsc')) return false;
        } else if (!progExam.includes(searchKey)) {
          return false;
        }
      }

      // Medium Filter
      if (selectedMedium !== 'ALL') {
        const progMedium = (p.medium || p.language || '').toLowerCase();
        const searchKey = selectedMedium.toLowerCase();
        if (searchKey === 'bilingual') {
          if (!progMedium.includes('bilingual') && (!progMedium.includes('hindi') || !progMedium.includes('english'))) return false;
        } else if (!progMedium.includes(searchKey)) {
          return false;
        }
      }

      // Date Filter
      if (selectedDates.length > 0) {
        if (!p.batchStartDate || !selectedDates.includes(p.batchStartDate)) return false;
      }

      return true;
    });
  }, [programs, selectedExam, selectedMedium, selectedDates]);

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  return (
    <div className="w-full space-y-6 font-body">
      
      {/* ── HEADER BANNER & FILTERS ROW ────────────────────────────────────── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-[var(--text-color)] leading-tight">
            {title.split('Test Series')[0]}
            <span className="text-amber-600 dark:text-amber-400 font-extrabold">Test Series</span>
            {title.split('Test Series')[1] || ''}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-4xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          
          {/* 1. Exam Category Dropdown Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsExamDropdownOpen(!isExamDropdownOpen);
                setIsDateDropdownOpen(false);
                setIsMediumDropdownOpen(false);
              }}
              className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs font-bold text-[var(--text-color)] hover:border-amber-500 transition-colors flex items-center gap-6 shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {selectedExam === 'ALL' ? 'Select Exam (All)' : `${selectedExam} Exam`}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isExamDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-30 p-2 space-y-1">
                <div className="px-3 py-1.5 border-b border-[var(--card-border)]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Filter by Target Exam</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExam('ALL');
                    setIsExamDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    selectedExam === 'ALL'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold'
                      : 'text-[var(--text-color)] hover:bg-amber-500/10'
                  }`}
                >
                  <span>All Exams</span>
                  {selectedExam === 'ALL' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                {availableExams.map(ex => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      setSelectedExam(ex);
                      setIsExamDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                      selectedExam === ex
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold'
                        : 'text-[var(--text-color)] hover:bg-amber-500/10'
                    }`}
                  >
                    <span>{ex} Programs</span>
                    {selectedExam === ex && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Multi-Date Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen);
                setIsExamDropdownOpen(false);
                setIsMediumDropdownOpen(false);
              }}
              className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs font-semibold text-[var(--text-color)] hover:border-amber-500 transition-colors flex items-center gap-6 shadow-2xs cursor-pointer"
            >
              <span>
                {selectedDates.length === 0
                  ? 'All Dates Selected'
                  : `${selectedDates.length} Date${selectedDates.length > 1 ? 's' : ''} Selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-30 p-2 space-y-1">
                <div className="px-3 py-1.5 border-b border-[var(--card-border)] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Filter by Start Date</span>
                  {selectedDates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDates([])}
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {availableDates.length === 0 ? (
                  <div className="p-3 text-[11px] text-slate-400 text-center">No batch dates found</div>
                ) : (
                  availableDates.map(date => {
                    const isChecked = selectedDates.includes(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleDateSelection(date)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--text-color)] hover:bg-amber-500/10 rounded-xl cursor-pointer"
                      >
                        <span>{date}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold' : 'border-[var(--card-border)]'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 3. Select Medium Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsMediumDropdownOpen(!isMediumDropdownOpen);
                setIsExamDropdownOpen(false);
                setIsDateDropdownOpen(false);
              }}
              className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs font-semibold text-[var(--text-color)] hover:border-amber-500 transition-colors flex items-center gap-8 shadow-2xs cursor-pointer"
            >
              <span>
                {selectedMedium === 'ALL'
                  ? 'Select Medium'
                  : selectedMedium === 'English'
                  ? 'English Medium'
                  : selectedMedium === 'Hindi'
                  ? 'Hindi Medium'
                  : 'Bilingual'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isMediumDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl z-30 p-2 space-y-1">
                <div className="px-3 py-1.5 border-b border-[var(--card-border)]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Filter by Medium</span>
                </div>
                {[
                  { id: 'ALL', label: 'All Mediums' },
                  { id: 'English', label: 'English Medium' },
                  { id: 'Hindi', label: 'Hindi Medium' },
                  { id: 'Bilingual', label: 'Bilingual (Hindi & English)' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedMedium(item.id);
                      setIsMediumDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                      selectedMedium === item.id
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold'
                        : 'text-[var(--text-color)] hover:bg-amber-500/10'
                    }`}
                  >
                    <span>{item.label}</span>
                    {selectedMedium === item.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── COMPARISON TABLE ───────────────────────────────────────────────── */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[var(--card-bg)] border-b border-[var(--card-border)] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Target Exam</th>
                <th className="py-4 px-6">Program Name</th>
                <th className="py-4 px-4">Medium</th>
                <th className="py-4 px-6">Program Details</th>
                <th className="py-4 px-6">Start Date</th>
                <th className="py-4 px-6">Fee (Inclusive of Taxes)</th>
                <th className="py-4 px-6 text-center">Register</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)] text-xs font-semibold text-[var(--text-color)]">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No test series programs match your selected exam, date & medium filters.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program) => {
                  const displayFee = program.discountedPrice || program.price;
                  const mediumLabel = program.medium || program.language || 'English';

                  // Map clean Exam Badge (BPSC, APPCS, APSSB, UPSC, etc.)
                  let examBadge = 'BPSC';
                  const rawExam = (program.exam || program.examId || program.title || '').toLowerCase();
                  if (rawExam.includes('bpsc')) examBadge = 'BPSC';
                  else if (rawExam.includes('appcs') || rawExam.includes('appsc')) examBadge = 'APPCS';
                  else if (rawExam.includes('apssb')) examBadge = 'APSSB';
                  else if (rawExam.includes('upsc')) examBadge = 'UPSC';
                  else if (program.exam) examBadge = program.exam.split(' ')[0].toUpperCase();

                  return (
                    <tr
                      key={program.id}
                      className="hover:bg-amber-500/5 transition-colors group"
                    >
                      {/* 1. Target Exam Badge Column (Left Side) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider inline-block">
                          {examBadge}
                        </span>
                      </td>

                      {/* 2. Program Name & Module Code */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <Link
                            href={`/test-series/program/${program.slug}`}
                            className="font-extrabold text-[var(--text-color)] group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors text-sm leading-snug block"
                          >
                            {program.title}
                          </Link>
                          {program.moduleCode && (
                            <span className="text-[10px] font-mono font-bold text-slate-400 block">
                              Module Code - {program.moduleCode.replace(/^Module Code\s*-\s*/i, '')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Medium */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-[var(--text-color)]">
                          {mediumLabel}
                        </span>
                      </td>

                      {/* 4. Program Details */}
                      <td className="py-4 px-6 max-w-xs">
                        <span className="text-xs font-semibold text-[var(--text-color)] leading-relaxed">
                          {program.programDetails || `${program.totalTests || 35} Tests`}
                        </span>
                      </td>

                      {/* 5. Start Date */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-xs font-semibold text-[var(--text-color)]">
                          {program.batchStartDate || '09 August 2026'}
                        </span>
                      </td>

                      {/* 6. Fee & Download Schedule Link */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-extrabold text-[var(--text-color)] text-sm">
                            ₹ {displayFee?.toLocaleString()}
                          </div>

                          {program.schedulePdfUrl ? (
                            <a
                              href={program.schedulePdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 group/link"
                            >
                              <span>Download Schedule</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert(`Schedule PDF for ${program.title} will be uploaded shortly.`)}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Download Schedule</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 7. Register Action Button */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <Link
                          href={`/test-series/program/${program.slug}`}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs inline-block transition-all shadow-sm hover:shadow-md cursor-pointer"
                        >
                          Register
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
