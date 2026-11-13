'use client';

import { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, Clock, Search, Download, Eye,
  Award, MessageSquare, Upload, AlertCircle, RefreshCw, X, Check, PenTool, UserCheck, Calendar
} from 'lucide-react';
import { getAllMainsSubmissionsAdmin, evaluateMainsSubmissionAdmin, assignMainsEvaluatorAdmin } from '@/services/auth';
import PDFAnnotationEditor, { RubricsScore } from './PDFAnnotationEditor';

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
  assignedToUserId?: string;
  assignedToName?: string;
  evaluationDeadline?: string;
  rubricsBreakdown?: any;
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

  // In-browser PDF checking studio state
  const [annotatingSub, setAnnotatingSub] = useState<SubmissionItem | null>(null);

  // Assignment Modal State (Assign Evaluator)
  const [assigningSub, setAssigningSub] = useState<SubmissionItem | null>(null);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [evaluatorUserId, setEvaluatorUserId] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  // Rubrics in Modal
  const [rubricIntro, setRubricIntro] = useState('');
  const [rubricContent, setRubricContent] = useState('');
  const [rubricStruct, setRubricStruct] = useState('');
  const [rubricConcl, setRubricConcl] = useState('');

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

    let parsedRubrics: any = null;
    if (sub.rubricsBreakdown) {
      parsedRubrics = typeof sub.rubricsBreakdown === 'string' ? JSON.parse(sub.rubricsBreakdown) : sub.rubricsBreakdown;
    }
    setRubricIntro(parsedRubrics?.introduction !== undefined ? String(parsedRubrics.introduction) : '');
    setRubricContent(parsedRubrics?.contentAndFacts !== undefined ? String(parsedRubrics.contentAndFacts) : '');
    setRubricStruct(parsedRubrics?.structuringDiagrams !== undefined ? String(parsedRubrics.structuringDiagrams) : '');
    setRubricConcl(parsedRubrics?.conclusion !== undefined ? String(parsedRubrics.conclusion) : '');
  };

  const openAssignModal = (sub: SubmissionItem) => {
    setAssigningSub(sub);
    setEvaluatorName(sub.assignedToName || '');
    setEvaluatorUserId(sub.assignedToUserId || '');
    setAssignDeadline(sub.evaluationDeadline ? sub.evaluationDeadline.split('T')[0] : '');
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningSub || !accessToken) return;
    if (!evaluatorName.trim()) {
      alert('Please specify evaluator name.');
      return;
    }
    setSavingAssign(true);
    try {
      const res = await assignMainsEvaluatorAdmin(
        assigningSub.id,
        {
          assignedToUserId: evaluatorUserId || 'evaluator-faculty',
          assignedToName: evaluatorName.trim(),
          evaluationDeadline: assignDeadline ? new Date(assignDeadline).toISOString() : undefined
        },
        accessToken
      );
      if (res.success) {
        alert(`Mains copy assigned to "${evaluatorName}"!`);
        setAssigningSub(null);
        loadSubmissions();
      } else {
        alert(res.error || 'Failed assigning evaluator.');
      }
    } catch {
      alert('Error assigning evaluator.');
    } finally {
      setSavingAssign(false);
    }
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
      const rubricsPayload = {
        introduction: rubricIntro !== '' ? Number(rubricIntro) : undefined,
        contentAndFacts: rubricContent !== '' ? Number(rubricContent) : undefined,
        structuringDiagrams: rubricStruct !== '' ? Number(rubricStruct) : undefined,
        conclusion: rubricConcl !== '' ? Number(rubricConcl) : undefined
      };

      const payload = {
        grade: evalGrade !== '' ? Number(evalGrade) : undefined,
        feedback: evalFeedback,
        evaluatedCopyUrl: evalPdfUrl,
        status: evalStatus,
        rubricsBreakdown: rubricsPayload
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

  const handleSaveAnnotatedPdf = async (fileBlob: Blob, marks?: number, feedbackText?: string, rubrics?: RubricsScore) => {
    if (!annotatingSub || !accessToken) return;

    try {
      const formData = new FormData();
      formData.append('file', fileBlob, `evaluated_${annotatingSub.id}.pdf`);

      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const uploadRes = await fetch(`${backendBase}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload checked PDF');
      }

      const payload = {
        grade: marks !== undefined ? marks : annotatingSub.grade,
        feedback: feedbackText !== undefined ? feedbackText : annotatingSub.feedback,
        evaluatedCopyUrl: uploadData.url,
        status: 'Evaluated',
        rubricsBreakdown: rubrics
      };

      const res = await evaluateMainsSubmissionAdmin(annotatingSub.id, payload, accessToken);
      if (res.success) {
        alert('Checked PDF copy and evaluation saved & reverted back successfully!');
        setAnnotatingSub(null);
        loadSubmissions();
      } else {
        alert('Failed to save evaluation: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Error saving checked PDF:', err);
      alert('Error saving evaluated copy: ' + err.message);
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
    <div className="space-y-6 font-body">
      {/* Header Banner */}
      <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
              Mains Evaluation Engine
            </span>
            <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">
              Student Mains Answer Copy Evaluation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review submitted answer PDFs, assign marks out of Max Marks, write feedback, and attach annotated copies.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSubmissions}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all self-start sm:self-auto cursor-pointer shadow-sm"
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
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] placeholder-slate-400 outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(['ALL', 'Submitted', 'Under Evaluation', 'Evaluated'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                    : 'bg-[var(--card-bg)] text-slate-600 dark:text-slate-300 border-[var(--card-border)] hover:text-amber-500'
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
        <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">Loading Mains Submissions…</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-[var(--text-color)] font-bold text-base">No Mains Submissions Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
            {submissions.length === 0
              ? 'No student answer copies have been submitted yet.'
              : 'No submissions match your current search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((sub) => {
            const isGraded = sub.status === 'Evaluated' || (sub.grade !== undefined && sub.grade !== null);
            return (
              <div
                key={sub.id}
                className="p-5 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/40 rounded-2xl transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student & Test Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                        {sub.studentName || 'Student'}
                      </span>
                      <span className="text-slate-400 text-xs">({sub.studentEmail})</span>
                    </div>
                    <h4 className="text-[var(--text-color)] font-heading font-black text-base">
                      {sub.testTitle || 'Mains Test'}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {sub.testSeriesTitle ? `Series: ${sub.testSeriesTitle} · ` : ''}
                      Submitted: {new Date(sub.submittedAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        sub.status === 'Evaluated'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : sub.status === 'Under Evaluation'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {sub.status || 'Submitted'}
                    </span>

                    {sub.submissionUrl && (
                      <button
                        type="button"
                        onClick={() => setAnnotatingSub(sub)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
                        title="Open Interactive PDF Evaluation Canvas"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Check & Annotate PDF
                      </button>
                    )}

                    {sub.submissionUrl && (
                      <a
                        href={sub.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--card-bg)] text-[var(--text-color)] text-xs font-bold rounded-xl transition-colors border border-[var(--card-border)]"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        Original PDF
                      </a>
                    )}

                    {/* Assign Evaluator Button */}
                    <button
                      type="button"
                      onClick={() => openAssignModal(sub)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--text-color)] text-xs font-bold rounded-xl transition-all border border-[var(--card-border)] cursor-pointer"
                      title="Assign specific evaluator / faculty teacher"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      {sub.assignedToName ? `Evaluator: ${sub.assignedToName}` : 'Assign Evaluator'}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEvaluationModal(sub)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      {isGraded ? 'Edit Marks/Feedback' : 'Score & Remarks'}
                    </button>
                  </div>
                </div>

                {/* Grade & Feedback snippet if already evaluated */}
                {isGraded && (
                  <div className="pt-3 border-t border-[var(--card-border)] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--card-border)]">
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Marks Awarded</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        {sub.grade} / {sub.maxMarks || 100} Marks
                      </span>
                    </div>
                    <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--card-border)] md:col-span-2">
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Evaluator Feedback</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 mt-0.5">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Evaluation Portal</span>
                <h3 className="text-lg font-heading font-black text-[var(--text-color)]">{selectedSub.testTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Student: {selectedSub.studentName} ({selectedSub.studentEmail})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--text-color)] bg-[var(--card-bg)] border border-[var(--card-border)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-5">
              {/* Submitted Answer Copy Link */}
              <div className="p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Student Submitted Copy (PDF)</span>
                <a
                  href={selectedSub.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
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
                  className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] outline-none focus:border-amber-500 font-bold cursor-pointer"
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
                  step="0.5"
                  placeholder={`Enter score (0 - ${selectedSub.maxMarks || 100})`}
                  value={evalGrade}
                  onChange={e => setEvalGrade(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] outline-none focus:border-amber-500 font-bold"
                />
              </div>

              {/* Rubrics Breakdown in Modal */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-[var(--card-border)] space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">
                  UPSC/BPSC Evaluation Rubrics Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Intro</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 2.5"
                      value={rubricIntro}
                      onChange={e => setRubricIntro(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-[var(--card-border)] rounded-lg font-mono text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Content/Facts</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 5.0"
                      value={rubricContent}
                      onChange={e => setRubricContent(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-[var(--card-border)] rounded-lg font-mono text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Structure/Maps</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 2.0"
                      value={rubricStruct}
                      onChange={e => setRubricStruct(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-[var(--card-border)] rounded-lg font-mono text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Conclusion</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 1.5"
                      value={rubricConcl}
                      onChange={e => setRubricConcl(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-[var(--card-border)] rounded-lg font-mono text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
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
                    className="flex-1 px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] outline-none focus:border-amber-500 font-mono"
                  />
                  <label className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5 shrink-0">
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
                  className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none focus:border-amber-500 leading-relaxed font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEval}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingEval ? 'Saving…' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN EVALUATOR POPUP MODAL */}
      {assigningSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="font-heading font-black text-base text-[var(--text-color)]">
                  Assign Evaluator / Faculty
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningSub(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--text-color)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-[var(--card-border)] text-xs space-y-1">
                <p className="font-bold text-[var(--text-color)]">{assigningSub.testTitle}</p>
                <p className="text-slate-400">Student: {assigningSub.studentName} ({assigningSub.studentEmail})</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Evaluator / Teacher Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. R. K. Sharma (Polity Faculty)"
                  value={evaluatorName}
                  onChange={e => setEvaluatorName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] outline-none focus:border-indigo-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Evaluation Deadline (Optional)</label>
                <input
                  type="date"
                  value={assignDeadline}
                  onChange={e => setAssignDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningSub(null)}
                  className="px-4 py-2 border border-[var(--card-border)] text-slate-400 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingAssign ? 'Assigning…' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE FULL-SCREEN IN-BROWSER PDF ANNOTATION & CHECKING SUITE */}
      {annotatingSub && (() => {
        let initialRubrics: RubricsScore | undefined;
        if (annotatingSub.rubricsBreakdown) {
          try {
            initialRubrics = typeof annotatingSub.rubricsBreakdown === 'string'
              ? JSON.parse(annotatingSub.rubricsBreakdown)
              : annotatingSub.rubricsBreakdown;
          } catch (_) {}
        }
        return (
          <PDFAnnotationEditor
            pdfUrl={annotatingSub.submissionUrl || ''}
            studentName={annotatingSub.studentName}
            testTitle={annotatingSub.testTitle}
            maxMarks={annotatingSub.maxMarks || 100}
            initialMarks={annotatingSub.grade}
            initialFeedback={annotatingSub.feedback}
            initialRubrics={initialRubrics}
            onSaveCheckedPdf={handleSaveAnnotatedPdf}
            onClose={() => setAnnotatingSub(null)}
          />
        );
      })()}
    </div>
  );
}
