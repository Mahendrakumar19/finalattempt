'use client';

import { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, Clock, Search, Download, Eye,
  Award, MessageSquare, Upload, AlertCircle, RefreshCw, X, Check
} from 'lucide-react';
import { getAllMainsSubmissionsAdmin, evaluateMainsSubmissionAdmin } from '@/services/auth';

interface SubmissionItem {
  id: string;
  userId: string;
  assignmentId: string;
  studentName?: string;
  studentEmail?: string;
  testTitle?: string;
  testSeriesTitle?: string;
  maxMarks?: number;
  submissionUrl?: string;
  submissionText?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status?: string;
  evaluatedCopyUrl?: string;
  evaluatedAt?: string;
}

export default function MainsEvaluationCMS({ accessToken }: { accessToken?: string }) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Submitted' | 'Under Evaluation' | 'Evaluated'>('ALL');

  // Evaluation modal state
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [evalGrade, setEvalGrade] = useState<string>('');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalPdfUrl, setEvalPdfUrl] = useState<string>('');
  const [evalStatus, setEvalStatus] = useState<string>('Evaluated');
  const [uploadingEvaluatedPdf, setUploadingEvaluatedPdf] = useState(false);
  const [submittingEval, setSubmittingEval] = useState(false);

  const loadSubmissions = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAllMainsSubmissionsAdmin(accessToken);
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.error('Error loading mains submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [accessToken]);

  const openEvaluationModal = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setEvalGrade(sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : '');
    setEvalFeedback(sub.feedback || '');
    setEvalPdfUrl(sub.evaluatedCopyUrl || '');
    setEvalStatus(sub.status || 'Evaluated');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setUploadingEvaluatedPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendBase}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setEvalPdfUrl(data.url);
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Evaluated PDF upload error:', err);
      alert('Network error while uploading evaluated PDF.');
    } finally {
      setUploadingEvaluatedPdf(false);
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !accessToken) return;

    setSubmittingEval(true);
    try {
      const payload = {
        grade: evalGrade !== '' ? Number(evalGrade) : undefined,
        feedback: evalFeedback,
        evaluatedCopyUrl: evalPdfUrl,
        status: evalStatus
      };

      const res = await evaluateMainsSubmissionAdmin(selectedSub.id, payload, accessToken);
      if (res.success) {
        alert('Evaluation saved successfully!');
        setSelectedSub(null);
        loadSubmissions();
      } else {
        alert('Failed to save evaluation: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving evaluation:', err);
      alert('Network error while saving evaluation.');
    } finally {
      setSubmittingEval(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch =
      !searchQuery.trim() ||
      (s.studentName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.testTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.testSeriesTitle?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
              Mains Evaluation Engine
            </span>
            <h2 className="text-2xl font-heading font-black text-white">
              Student Mains Answer Copy Evaluation
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Review submitted answer PDFs, assign marks out of Max Marks, write feedback, and attach annotated copies.
            </p>
          </div>
          <button
            onClick={loadSubmissions}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-2xl transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Submissions
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, email, or test title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(['ALL', 'Submitted', 'Under Evaluation', 'Evaluated'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-bold">Loading Mains Submissions…</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-white font-bold text-base">No Mains Submissions Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {submissions.length === 0
              ? 'No student answer copies have been submitted yet.'
              : 'No submissions match your current search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((sub) => {
            const isGraded = sub.status === 'Evaluated' || sub.grade !== undefined && sub.grade !== null;
            return (
              <div
                key={sub.id}
                className="p-5 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all space-y-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student & Test Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 font-extrabold text-sm">
                        {sub.studentName || 'Student'}
                      </span>
                      <span className="text-slate-500 text-xs">({sub.studentEmail})</span>
                    </div>
                    <h4 className="text-white font-heading font-black text-base">
                      {sub.testTitle || 'Mains Test'}
                    </h4>
                    <p className="text-slate-400 text-xs">
                      {sub.testSeriesTitle ? `Series: ${sub.testSeriesTitle} · ` : ''}
                      Submitted: {new Date(sub.submittedAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        sub.status === 'Evaluated'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : sub.status === 'Under Evaluation'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {sub.status || 'Submitted'}
                    </span>

                    {sub.submissionUrl && (
                      <a
                        href={sub.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        View Student PDF
                      </a>
                    )}

                    <button
                      onClick={() => openEvaluationModal(sub)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      <Award className="w-3.5 h-3.5" />
                      {isGraded ? 'Edit Evaluation' : 'Grade & Evaluate'}
                    </button>
                  </div>
                </div>

                {/* Grade & Feedback snippet if already evaluated */}
                {isGraded && (
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Marks Awarded</span>
                      <span className="text-emerald-400 font-black text-sm">
                        {sub.grade} / {sub.maxMarks || 100} Marks
                      </span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 md:col-span-2">
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Evaluator Feedback</span>
                      <p className="text-slate-300 font-medium line-clamp-2 mt-0.5">
                        {sub.feedback || 'No written feedback provided.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* EVALUATION POPUP MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Evaluation Portal</span>
                <h3 className="text-lg font-heading font-black text-white">{selectedSub.testTitle}</h3>
                <p className="text-xs text-slate-400">Student: {selectedSub.studentName} ({selectedSub.studentEmail})</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-5">
              {/* Submitted Answer Copy Link */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Student Submitted Copy (PDF)</span>
                <a
                  href={selectedSub.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Open PDF File
                </a>
              </div>

              {/* Status Picker */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Evaluation Status</label>
                <select
                  value={evalStatus}
                  onChange={e => setEvalStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Under Evaluation">Under Evaluation</option>
                  <option value="Evaluated">Evaluated (Completed)</option>
                </select>
              </div>

              {/* Marks / Grade */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">
                  Marks Obtained (Max: {selectedSub.maxMarks || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSub.maxMarks || 100}
                  placeholder={`Enter score (0 - ${selectedSub.maxMarks || 100})`}
                  value={evalGrade}
                  onChange={e => setEvalGrade(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              {/* Evaluated Copy PDF Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">
                  Upload Checked/Evaluated PDF Copy (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL of Evaluated Copy PDF"
                    value={evalPdfUrl}
                    onChange={e => setEvalPdfUrl(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <label className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingEvaluatedPdf ? 'Uploading…' : 'Browse PDF'}
                    <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Feedback Text Area */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Evaluator Detailed Feedback & Remarks</label>
                <textarea
                  rows={4}
                  placeholder="Provide constructive feedback on introduction, body structure, conclusion, map diagrams, and factual coverage…"
                  value={evalFeedback}
                  onChange={e => setEvalFeedback(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEval}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {submittingEval ? 'Saving…' : 'Save & Publish Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
