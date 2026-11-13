'use client';

import React, { useMemo } from 'react';
import { Flame, Calendar, Trophy, CheckCircle, Target } from 'lucide-react';

interface AttendanceTrackerProps {
  completedDates?: string[]; // array of ISO or YYYY-MM-DD strings
}

export default function StudyStreakHeatmap({ completedDates = [] }: AttendanceTrackerProps) {
  // Generate last 28 days grid
  const days = useMemo(() => {
    const list: { dateStr: string; label: string; dayNum: number; active: boolean; isToday: boolean }[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const activeSet = new Set(
      completedDates.map(d => {
        try {
          return new Date(d).toISOString().split('T')[0];
        } catch {
          return d;
        }
      })
    );

    // Auto-mark today as active so user immediately gets positive reinforcement on dashboard visit
    activeSet.add(todayStr);

    for (let i = 27; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const str = d.toISOString().split('T')[0];
      const isToday = str === todayStr;
      list.push({
        dateStr: str,
        label: d.toLocaleDateString('en-IN', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        active: activeSet.has(str),
        isToday,
      });
    }
    return list;
  }, [completedDates]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let count = 0;
    // Iterate from today backwards
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].active) count++;
      else break;
    }
    return Math.max(1, count);
  }, [days]);

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Daily Study Streak
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                🔥 {currentStreak} DAYS STREAK
              </span>
            </div>
            <h3 className="text-white font-extrabold text-sm sm:text-base mt-0.5">
              Consistent Practice & Lecture Heatmap
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Last 28 Days Activity</span>
        </div>
      </div>

      {/* 28-day Squares Grid */}
      <div className="pt-2">
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {days.map((day, idx) => (
            <div
              key={idx}
              title={`${day.dateStr}: ${day.active ? 'Study Goal Completed ✓' : 'No Activity Logged'}`}
              className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                day.active
                  ? day.isToday
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black ring-2 ring-amber-400 shadow-md shadow-amber-900/30'
                    : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold'
                  : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:border-slate-500'
              }`}
            >
              <span className="text-[9px] uppercase opacity-75">{day.label}</span>
              <span className="text-xs">{day.dayNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Motivation Banner */}
      <div className="pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Keep your streak alive to rank higher on the Bihar Aspirant Leaderboard!</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-white/[0.05] border border-white/10" /> Inactive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500" /> Studied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Today
          </span>
        </div>
      </div>
    </div>
  );
}
