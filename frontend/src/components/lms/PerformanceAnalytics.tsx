'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Award, CheckCircle, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { getStudentAnalytics } from '@/services/auth';

interface PerformanceAnalyticsProps {
  accessToken: string;
}

export default function PerformanceAnalytics({ accessToken }: PerformanceAnalyticsProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;

    const loadMetrics = async () => {
      try {
        const res = await getStudentAnalytics(accessToken);
        if (res.success && res.data) {
          setMetrics(res.data);
        } else {
          setError('Failed to fetch performance analytics.');
        }
      } catch (err) {
        setError('Connection error loading your learning analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-900/40 border border-white/10 rounded-2xl animate-pulse">
        <TrendingUp className="w-8 h-8 text-blue-400/50 animate-bounce mb-3" />
        <p className="text-slate-500 text-xs font-semibold">Aggregating BPSC progress metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-xs max-w-md mx-auto">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-bold">Analytics Panel Error</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const courseCompletions = metrics?.courseCompletion || [];
  const quizAnalytics = metrics?.quizAnalytics || [];

  return (
    <div className="space-y-6">
      {/* Cards stats header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Courses Active</p>
            <p className="text-xl font-bold text-white mt-0.5">{courseCompletions.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Quiz Attempts</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {quizAnalytics.reduce((sum: number, q: any) => sum + q.attemptsCount, 0)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Passed Attempts</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {quizAnalytics.reduce((sum: number, q: any) => sum + q.passesCount, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course progress bars */}
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4">
          <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Syllabus Completion</span>
          </h4>

          {courseCompletions.length === 0 ? (
            <p className="text-slate-500 text-xs py-4 text-center">Complete lessons in your courses to see completion rates.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {courseCompletions.map((c: any) => (
                <div key={c.courseId} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-350 truncate pr-4">{c.title}</span>
                    <span className="text-blue-400">{Math.round(c.completionPercentage)}%</span>
                  </div>
                  <div className="h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${c.completionPercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Completed {c.completedLessons} of {c.totalLessons} published lectures</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mock test performance */}
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4">
          <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span>Mock Test Performance</span>
          </h4>

          {quizAnalytics.length === 0 ? (
            <p className="text-slate-500 text-xs py-4 text-center">Take Prelims mock tests to activate score tracking heatmaps.</p>
          ) : (
            <div className="space-y-3 pt-2">
              {quizAnalytics.map((q: any) => (
                <div key={q.quizId} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-300 font-bold font-mono">BPSC prelims test</span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      <span>Attempts: {q.attemptsCount}</span>
                      <span>•</span>
                      <span className="text-emerald-400/90">Passes: {q.passesCount}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{Math.round(q.averageScore)}% avg</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">High: {q.maxScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
