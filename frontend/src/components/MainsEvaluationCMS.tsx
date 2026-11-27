'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Search, Download, Eye,
  Award, Upload, RefreshCw, X, PenTool, UserCheck,
  Users, User, GraduationCap, Trash2, ArrowLeft,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Filter
} from 'lucide-react';
import {
  getAllMainsSubmissionsAdmin,
  evaluateMainsSubmissionAdmin,
  assignMainsEvaluatorAdmin,
  deleteMainsSubmissionAdmin,
  deleteMainsEvaluatedCopyAdmin
} from '@/services/auth';
import PDFAnnotationEditor, { RubricsScore } from './PDFAnnotationEditor';

interface SubmissionItem {
  id: string;
  userId: string;
  assignmentId: string;
  studentName?: string;
  studentEmail?: string;
  studentRollNumber?: string;
  studentMobile?: string;
  testTitle?: string;
  testTitleHi?: string;
  testSeriesTitle?: string;
  testSeriesTitleHi?: string;
  maxMarks?: number;
  submissionUrl?: string;
  submissionText?: string;
  questionPaperUrl?: string;
  questionPaperUrlHi?: string;
  answerBookletUrl?: string;
  answerBookletUrlHi?: string;
  modelAnswerUrl?: string;
  modelAnswerUrlHi?: string;
  syllabus?: string;
  syllabusHi?: string;
  testMedium?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status?: string;
  evaluatedCopyUrl?: string;
  evaluatedAt?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  evaluationDeadline?: string;
  rubricsBreakdown?: string | Record<string, unknown>;
}

interface StudentGroup {
  userId: string;
  studentName: string;
  studentEmail: string;
  studentRollNumber?: string;
  studentMobile?: string;
  totalSubmissions: number;
  pendingCount: number;
  evaluatedCount: number;
  lastSubmittedAt: string;
  submissions: SubmissionItem[];
}

export default function MainsEvaluationCMS({ accessToken }: { accessToken?: string }) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Submitted' | 'Under Evaluation' | 'Evaluated'>('ALL');
  
  // Student-first navigation state
  const [viewMode, setViewMode] = useState<'students' | 'feed'>('students');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'PENDING' | 'EVALUATED'>('ALL');

  // Evaluation modal state
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [evalGrade, setEvalGrade] = useState<string>('');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [evalPdfUrl, setEvalPdfUrl] = useState<string>('');
  const [evalStatus, setEvalStatus] = useState<string>('Evaluated');
  const [uploadingEvaluatedPdf, setUploadingEvaluatedPdf] = useState(false);
  const [submittingEval, setSubmittingEval] = useState(false);

  // Fast Direct PDF Upload state for any card
  const [uploadingForSubId, setUploadingForSubId] = useState<string | null>(null);

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

  const loadSubmissions = useCallback(async () => {
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
  }, [accessToken]);

  useEffect(() => {
    let isCancelled = false;
    const fetchSubs = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getAllMainsSubmissionsAdmin(accessToken);
        if (!isCancelled && res.success && res.data) {
          setSubmissions(res.data);
        }
      } catch (err) {
        console.error('Error loading mains submissions:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchSubs();
    return () => {
      isCancelled = true;
    };
  }, [accessToken]);

  // Group submissions by student (userId)
  const studentGroups: StudentGroup[] = useMemo(() => {
    const map = new Map<string, StudentGroup>();
    submissions.forEach(sub => {
      const key = sub.userId || sub.studentEmail || sub.id;
      if (!map.has(key)) {
        map.set(key, {
          userId: sub.userId,
          studentName: sub.studentName || 'Student',
          studentEmail: sub.studentEmail || '',
          studentRollNumber: sub.studentRollNumber || '',
          studentMobile: sub.studentMobile || '',
          totalSubmissions: 0,
          pendingCount: 0,
          evaluatedCount: 0,
          lastSubmittedAt: sub.submittedAt,
          submissions: []
        });
      }
      const grp = map.get(key)!;
      grp.totalSubmissions += 1;
      if (sub.status === 'Evaluated' || (sub.grade !== undefined && sub.grade !== null)) {
        grp.evaluatedCount += 1;
      } else {
        grp.pendingCount += 1;
      }
      if (new Date(sub.submittedAt).getTime() > new Date(grp.lastSubmittedAt).getTime()) {
        grp.lastSubmittedAt = sub.submittedAt;
      }
      grp.submissions.push(sub);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastSubmittedAt).getTime() - new Date(a.lastSubmittedAt).getTime()
    );
  }, [submissions]);

  // Filtered student groups
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return studentGroups.filter(grp => {
      const matchesSearch =
        !q ||
        grp.studentName.toLowerCase().includes(q) ||
        grp.studentEmail.toLowerCase().includes(q) ||
        (grp.studentRollNumber && grp.studentRollNumber.toLowerCase().includes(q)) ||
        (grp.studentMobile && grp.studentMobile.includes(q)) ||
        grp.submissions.some(s => (s.testTitle || '').toLowerCase().includes(q));

      let matchesFilter = true;
      if (studentFilter === 'PENDING') matchesFilter = grp.pendingCount > 0;
      if (studentFilter === 'EVALUATED') matchesFilter = grp.pendingCount === 0 && grp.evaluatedCount > 0;

      return matchesSearch && matchesFilter;
    });
  }, [studentGroups, searchQuery, studentFilter]);

  // Active student details when drilled down
  const activeStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentGroups.find(g => g.userId === selectedStudentId) || null;
  }, [studentGroups, selectedStudentId]);

  // Global flat feed filter
  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return submissions.filter(s => {
      const matchesSearch =
        !q ||
        (s.studentName && s.studentName.toLowerCase().includes(q)) ||
        (s.studentEmail && s.studentEmail.toLowerCase().includes(q)) ||
        (s.studentRollNumber && s.studentRollNumber.toLowerCase().includes(q)) ||
        (s.testTitle && s.testTitle.toLowerCase().includes(q)) ||
        (s.testSeriesTitle && s.testSeriesTitle.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Delete an entire submission copy
  const handleDeleteSubmission = async (sub: SubmissionItem) => {
    if (!accessToken) return;
    const studentLabel = sub.studentName
      ? `${sub.studentName} (${sub.studentRollNumber || sub.studentEmail || 'Student'})`
      : 'Student';
    const confirmMsg = `Are you sure you want to delete this Mains copy submission?\n\n• Test: ${sub.testTitle || 'Mains Test'}\n• Student: ${studentLabel}\n\nThis will permanently delete the uploaded answer file and evaluation records.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await deleteMainsSubmissionAdmin(sub.id, accessToken);
      if (res.success) {
        alert('Submission copy deleted successfully.');
        setSubmissions(prev => prev.filter(s => s.id !== sub.id));
      } else {
        alert('Failed to delete submission: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
      alert('Network error while deleting submission.');
    }
  };

  // Remove just the evaluated copy PDF from a submission
  const handleRemoveEvaluatedCopy = async (sub: SubmissionItem) => {
    if (!accessToken) return;
    if (
      !confirm(
        `Remove the checked/evaluated copy for "${sub.testTitle}"?\n\nThe student's original answer copy will be kept intact, and the status will reset to "Submitted".`
      )
    ) {
      return;
    }

    try {
      const res = await deleteMainsEvaluatedCopyAdmin(sub.id, accessToken);
      if (res.success) {
        alert('Evaluated copy removed successfully.');
        loadSubmissions();
      } else {
        alert('Failed removing evaluated copy: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error removing evaluated copy:', err);
      alert('Network error while removing evaluated copy.');
    }
  };

  // Quick Direct Upload Handler: Upload checked copy directly from the card
  const handleDirectEvaluatedUpload = async (sub: SubmissionItem, file: File) => {
    if (!file || !accessToken) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setUploadingForSubId(sub.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', 'mains_evaluated_copy');

      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const uploadRes = await fetch(`${backendBase}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.url) {
        alert('PDF Upload failed: ' + (uploadData.error || 'Server error'));
        return;
      }

      const uploadedUrl = uploadData.url;

      // Ask for marks or confirm publication directly
      const inputMarks = prompt(
        `Checked PDF uploaded successfully!\n\nEnter marks obtained (Max: ${sub.maxMarks || 100}) or leave blank to keep current:`,
        sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : ''
      );

      const payload: Record<string, unknown> = {
        evaluatedCopyUrl: uploadedUrl,
        status: 'Evaluated'
      };

      if (inputMarks !== null && inputMarks.trim() !== '') {
        const num = Number(inputMarks.trim());
        if (!isNaN(num)) {
          payload.grade = num;
        }
      }

      const evalRes = await evaluateMainsSubmissionAdmin(sub.id, payload, accessToken);
      if (evalRes.success) {
        alert('Checked Evaluated PDF has been successfully linked and published for the student!');
        loadSubmissions();
      } else {
        alert('Failed saving evaluated record: ' + (evalRes.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error during direct evaluated PDF upload:', err);
      alert('Network error while uploading evaluated PDF.');
    } finally {
      setUploadingForSubId(null);
    }
  };

  const openEvaluationModal = (sub: SubmissionItem) => {
    setSelectedSub(sub);
    setEvalGrade(sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : '');
    setEvalFeedback(sub.feedback || '');
    setEvalPdfUrl(sub.evaluatedCopyUrl || '');
    setEvalStatus(sub.status || 'Evaluated');

    let parsedRubrics: Record<string, unknown> | null = null;
    if (sub.rubricsBreakdown) {
      try {
        parsedRubrics =
          typeof sub.rubricsBreakdown === 'string'
            ? JSON.parse(sub.rubricsBreakdown)
            : (sub.rubricsBreakdown as Record<string, unknown>);
      } catch {
        // ignore
      }
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
        alert('Checked PDF copy and evaluation saved & published successfully!');
        setAnnotatingSub(null);
        loadSubmissions();
      } else {
        alert('Failed to save evaluation: ' + (res.error || 'Unknown error'));
      }
    } catch (err: unknown) {
      console.error('Error saving checked PDF:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert('Error saving evaluated copy: ' + msg);
    }
  };

  // Render a clean, non-cluttered single submission card
  const renderSubmissionCard = (sub: SubmissionItem, showStudentBadge = false) => {
    const isGraded = sub.status === 'Evaluated' || (sub.grade !== undefined && sub.grade !== null);

    return (
      <div
        key={sub.id}
        className="p-5 sm:p-6 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/40 rounded-3xl transition-all space-y-5 shadow-xs"
      >
        {/* Top Header: Test Info, Status, Marks */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            {showStudentBadge && (
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <User className="w-3.5 h-3.5" />
                  {sub.studentName || 'Student'}
                </span>
                {sub.studentRollNumber ? (
                  <span className="font-mono font-bold text-[11px] text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 px-2 py-0.5 rounded-md">
                    🎓 {sub.studentRollNumber}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No Roll No</span>
                )}
                <span className="text-slate-400 text-xs">({sub.studentEmail})</span>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[var(--text-color)] font-heading font-black text-lg">
                {sub.testTitle || 'Mains Test'}
              </h4>
              {sub.testSeriesTitle && (
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold text-[11px] border border-indigo-500/20">
                  {sub.testSeriesTitle}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted: {new Date(sub.submittedAt).toLocaleString('en-IN')}
              </span>
              {sub.testMedium && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  Medium: {sub.testMedium}
                </span>
              )}
              {sub.assignedToName && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                  Evaluator: {sub.assignedToName}
                </span>
              )}
            </div>

            {/* Candidate remarks note */}
            {sub.submissionText && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl mt-2 text-xs text-amber-900 dark:text-amber-300">
                <span className="font-bold">Student Note:</span> {sub.submissionText}
              </div>
            )}
          </div>

          {/* Right Status & Score Badge */}
          <div className="flex md:flex-col items-end gap-2 shrink-0">
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

            {isGraded && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Marks Awarded</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-heading font-black text-xl">
                  {sub.grade} <span className="text-xs text-slate-400 font-normal">/ {sub.maxMarks || 100}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Clean File Slots: Exact files only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--card-border)]">
          {/* File Slot 1: Student Submitted Answer Copy */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                1. Student Answer Copy (PDF)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Original Upload
              </span>
            </div>

            {sub.submissionUrl ? (
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={sub.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl border border-blue-500/20 text-center flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview PDF</span>
                </a>
                <a
                  href={sub.submissionUrl}
                  download
                  className="py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-center flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">No submission URL found.</p>
            )}
          </div>

          {/* File Slot 2: Checked & Evaluated Copy */}
          <div className="p-4 rounded-2xl bg-amber-500/[0.03] dark:bg-amber-500/[0.02] border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5" />
                2. Checked & Evaluated Copy
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  sub.evaluatedCopyUrl
                    ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-amber-600 bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                {sub.evaluatedCopyUrl ? 'Checked PDF Attached' : 'Awaiting Check'}
              </span>
            </div>

            {sub.evaluatedCopyUrl ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <a
                    href={sub.evaluatedCopyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View Checked Copy (PDF)</span>
                  </a>

                  {/* Remove Checked PDF button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveEvaluatedCopy(sub)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-all cursor-pointer"
                    title="Remove Checked PDF and reset status"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Replace evaluated copy */}
                <label className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer inline-flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Replace Checked Copy</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={uploadingForSubId === sub.id}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleDirectEvaluatedUpload(sub, file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                {sub.submissionUrl && (
                  <button
                    type="button"
                    onClick={() => setAnnotatingSub(sub)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Check & Annotate</span>
                  </button>
                )}

                <label className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                  <Upload className={`w-3.5 h-3.5 ${uploadingForSubId === sub.id ? 'animate-bounce' : ''}`} />
                  <span>{uploadingForSubId === sub.id ? 'Uploading…' : 'Upload Checked PDF'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={uploadingForSubId === sub.id}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleDirectEvaluatedUpload(sub, file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Optional Reference Files (Question Paper / Model Answer) if attached */}
        {(sub.questionPaperUrl || sub.modelAnswerUrl || sub.answerBookletUrl) && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Exam Reference Papers:</span>
            {sub.questionPaperUrl && (
              <a
                href={sub.questionPaperUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500/20 text-[11px]"
              >
                <Download className="w-3 h-3" /> Question Paper (QP)
              </a>
            )}
            {sub.modelAnswerUrl && (
              <a
                href={sub.modelAnswerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px]"
              >
                <Download className="w-3 h-3" /> Model Answer
              </a>
            )}
            {sub.answerBookletUrl && (
              <a
                href={sub.answerBookletUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded-lg border border-amber-500/20 hover:bg-amber-500/20 text-[11px]"
              >
                <Download className="w-3 h-3" /> Booklet Format
              </a>
            )}
          </div>
        )}

        {/* Feedback Snippet if Graded */}
        {isGraded && sub.feedback && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Examiner Feedback</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{sub.feedback}</p>
          </div>
        )}

        {/* Bottom Action Controls: Evaluate Modal, Assign, and DELETE */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--card-border)]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openEvaluationModal(sub)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isGraded ? 'Edit Marks & Feedback' : 'Score & Remarks'}</span>
            </button>

            <button
              type="button"
              onClick={() => openAssignModal(sub)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--text-color)] text-xs font-bold rounded-xl transition-all border border-[var(--card-border)] cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>{sub.assignedToName ? `Assigned: ${sub.assignedToName}` : 'Assign Evaluator'}</span>
            </button>
          </div>

          {/* Delete Submission File Button */}
          <button
            type="button"
            onClick={() => handleDeleteSubmission(sub)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
            title="Permanently delete this submission and file"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Submission</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-body">
      {/* Top Banner Header */}
      <div className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                Mains Evaluation Master Station
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                Student-Wise Tracking
              </span>
            </div>
            <h2 className="text-2xl font-heading font-black text-[var(--text-color)]">
              Mains Answer Copy Evaluation & Student Tracking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select any student to review their individual test copies, check answers, upload evaluated PDFs, or delete redundant files.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* View Mode Toggle: Student Directory vs All Submissions Feed */}
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center border border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => {
                  setViewMode('students');
                  setSelectedStudentId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'students'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text-color)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Students View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'feed'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text-color)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>All Submissions Feed</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadSubmissions}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        {(() => {
          const totalStudents = studentGroups.length;
          const totalSubs = submissions.length;
          const totalPending = submissions.filter(
            s => s.status !== 'Evaluated' && (s.grade === undefined || s.grade === null)
          ).length;
          const totalEvaluated = totalSubs - totalPending;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--card-border)]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
                <span className="text-xl font-heading font-black text-[var(--text-color)] mt-0.5 block">
                  {totalStudents}
                </span>
                <span className="text-[10px] text-slate-500">With answer uploads</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--card-border)]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Copies</span>
                <span className="text-xl font-heading font-black text-[var(--text-color)] mt-0.5 block">
                  {totalSubs}
                </span>
                <span className="text-[10px] text-slate-500">Mains answer sheets</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                  Pending Checking
                </span>
                <span className="text-xl font-heading font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {totalPending}
                </span>
                <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70">Awaiting evaluation</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                  Evaluated Copies
                </span>
                <span className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {totalEvaluated}
                </span>
                <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Marks published</span>
              </div>
            </div>
          );
        })()}

        {/* Search Bar & Filter Options */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                viewMode === 'students'
                  ? 'Search by student name, roll number, email, or mobile…'
                  : 'Search by student name, roll number, or test title…'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] placeholder-slate-400 outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {viewMode === 'students' ? (
            <div className="flex gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: 'All Students' },
                  { id: 'PENDING', label: 'Needs Evaluation' },
                  { id: 'EVALUATED', label: 'All Checked' }
                ] as const
              ).map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStudentFilter(st.id)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 cursor-pointer ${
                    studentFilter === st.id
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-[var(--card-bg)] text-slate-600 dark:text-slate-300 border-[var(--card-border)] hover:text-amber-500'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto">
              {(['ALL', 'Submitted', 'Under Evaluation', 'Evaluated'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-[var(--card-bg)] text-slate-600 dark:text-slate-300 border-[var(--card-border)] hover:text-amber-500'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      {loading ? (
        <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">Loading Mains Submissions…</p>
        </div>
      ) : viewMode === 'students' ? (
        /* MODE 1: STUDENT DIRECTORY OR SINGLE-STUDENT DRILL-DOWN */
        selectedStudentId && activeStudent ? (
          /* SINGLE STUDENT DRILL-DOWN WORKSPACE */
          <div className="space-y-6">
            {/* Student Navigation Bar & Header */}
            <div className="p-6 bg-[var(--card-bg)] border border-amber-500/30 rounded-3xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to All Students List</span>
                  </button>

                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-heading font-black text-2xl text-[var(--text-color)]">
                      {activeStudent.studentName}
                    </h3>
                    {activeStudent.studentRollNumber ? (
                      <span className="font-mono font-black text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 px-3 py-1 rounded-xl">
                        🎓 Roll No: {activeStudent.studentRollNumber}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 px-2.5 py-0.5 rounded-lg">
                        No Roll No Assigned
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Email: <span className="font-mono text-slate-800 dark:text-slate-200">{activeStudent.studentEmail}</span>
                    {activeStudent.studentMobile && (
                      <span className="ml-3">
                        Mobile: <span className="font-mono text-slate-800 dark:text-slate-200">{activeStudent.studentMobile}</span>
                      </span>
                    )}
                  </p>
                </div>

                {/* Student Score / Status Summary Pills */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[var(--card-border)]">
                    {activeStudent.totalSubmissions} Total Copies
                  </span>
                  {activeStudent.pendingCount > 0 && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {activeStudent.pendingCount} Pending Check
                    </span>
                  )}
                  {activeStudent.evaluatedCount > 0 && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {activeStudent.evaluatedCount} Evaluated
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Submissions of THIS student */}
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Submitted Mains Papers ({activeStudent.submissions.length})</span>
                <span className="text-xs text-slate-400 normal-case font-normal">
                  Showing answer copies submitted by {activeStudent.studentName}
                </span>
              </h4>

              {activeStudent.submissions.map(sub => renderSubmissionCard(sub, false))}
            </div>
          </div>
        ) : (
          /* STUDENT LIST VIEW (FIRST SCREEN) */
          filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-[var(--text-color)] font-bold text-base">No Students Found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
                {studentGroups.length === 0
                  ? 'No student answer copy submissions have been received yet.'
                  : 'No student matches your current search criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map(student => {
                const hasPending = student.pendingCount > 0;

                return (
                  <div
                    key={student.userId || student.studentEmail}
                    onClick={() => setSelectedStudentId(student.userId)}
                    className="p-6 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-amber-500/60 rounded-3xl transition-all space-y-4 cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Student Header: Initials + Name + Roll Number */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-heading font-black text-base flex items-center justify-center shrink-0">
                            {student.studentName
                              .split(' ')
                              .map(p => p[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <h4 className="font-heading font-black text-base text-[var(--text-color)] group-hover:text-amber-600 transition-colors">
                              {student.studentName}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                              {student.studentEmail}
                            </p>
                          </div>
                        </div>

                        {student.studentRollNumber ? (
                          <span className="font-mono font-bold text-[10px] text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 px-2 py-0.5 rounded-md shrink-0">
                            🎓 {student.studentRollNumber}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic shrink-0">No Roll No</span>
                        )}
                      </div>

                      {/* Metrics Badges */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--card-border)]">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Total</span>
                          <span className="text-sm font-black text-[var(--text-color)]">{student.totalSubmissions}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${hasPending ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-[var(--card-border)]'}`}>
                          <span className={`text-[9px] font-bold uppercase block ${hasPending ? 'text-amber-600' : 'text-slate-400'}`}>Pending</span>
                          <span className={`text-sm font-black ${hasPending ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                            {student.pendingCount}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase block">Checked</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {student.evaluatedCount}
                          </span>
                        </div>
                      </div>

                      {/* Latest Paper Title Preview */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Latest:</span>{' '}
                        {student.submissions[0]?.testTitle || 'Mains Assignment'}
                      </div>
                    </div>

                    {/* Footer Button */}
                    <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {new Date(student.lastSubmittedAt).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View Evaluations ({student.totalSubmissions})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )
      ) : (
        /* MODE 2: FLAT FEED OF ALL SUBMISSIONS */
        filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-[var(--text-color)] font-bold text-base">No Mains Submissions Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
              No submissions match your current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map(sub => renderSubmissionCard(sub, true))}
          </div>
        )
      )}

      {/* EVALUATION POPUP MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Evaluation Scorecard
                </span>
                <h3 className="text-lg font-heading font-black text-[var(--text-color)]">{selectedSub.testTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student: {selectedSub.studentName}{' '}
                  {selectedSub.studentRollNumber ? `(Roll: ${selectedSub.studentRollNumber})` : ''} ({selectedSub.studentEmail})
                </p>
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
              {/* Student Remarks / Note Banner */}
              {selectedSub.submissionText && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block tracking-wider">
                    Candidate Remarks / Note:
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedSub.submissionText}
                  </p>
                </div>
              )}

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
                  Evaluation Rubrics Breakdown
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
                  Upload Checked/Evaluated PDF Copy
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
                <label className="text-[10px] font-bold uppercase text-slate-400">
                  Evaluator Detailed Feedback & Remarks
                </label>
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
                <p className="text-slate-400">
                  Student: {assigningSub.studentName} ({assigningSub.studentEmail})
                </p>
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
            initialRubrics =
              typeof annotatingSub.rubricsBreakdown === 'string'
                ? JSON.parse(annotatingSub.rubricsBreakdown)
                : annotatingSub.rubricsBreakdown;
          } catch {
            // ignore
          }
        }
        return (
          <PDFAnnotationEditor
            pdfUrl={annotatingSub.submissionUrl || ''}
            studentName={annotatingSub.studentName}
            studentEmail={annotatingSub.studentEmail}
            testTitle={annotatingSub.testTitle}
            testSeriesTitle={annotatingSub.testSeriesTitle}
            submissionText={annotatingSub.submissionText}
            questionPaperUrl={annotatingSub.questionPaperUrl}
            questionPaperUrlHi={annotatingSub.questionPaperUrlHi}
            modelAnswerUrl={annotatingSub.modelAnswerUrl}
            modelAnswerUrlHi={annotatingSub.modelAnswerUrlHi}
            answerBookletUrl={annotatingSub.answerBookletUrl}
            answerBookletUrlHi={annotatingSub.answerBookletUrlHi}
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
