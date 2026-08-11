'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload, FileText, CheckCircle, Clock, AlertCircle, Eye,
  ArrowRight, Download, RefreshCw, BookOpen, Layers, ShieldCheck, ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/services/db';
import { getMainsTests, submitMainsCopy, getMyMainsSubmissions } from '@/services/auth';

interface TestSeriesItem {
  id: string;
  title: string;
  slug: string;
  examId?: string;
  exam?: { name: string };
}

interface MainsTestItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxMarks?: number;
  questionPaperUrl?: string;
  syllabus?: string;
  testSeriesId?: string;
}

interface StudentSubmission {
  id: string;
  assignmentId: string;
  testTitle?: string;
  testSeriesTitle?: string;
  submissionUrl?: string;
  submittedAt: string;
  grade?: number;
  maxMarks?: number;
  feedback?: string;
  status?: string;
  evaluatedCopyUrl?: string;
}

export default function UploadMainsCopyPage() {
  const { user, accessToken, isLoading, requireAuth } = useAuth();

  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  
  const [mainsTests, setMainsTests] = useState<MainsTestItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [submissionText, setSubmissionText] = useState<string>('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submittingCopy, setSubmittingCopy] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const [mySubmissions, setMySubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Auth guard
  useEffect(() => {
    requireAuth('/auth/login/student');
  }, [requireAuth]);

  // Fetch Test Series
  useEffect(() => {
    const loadSeries = async () => {
      try {
        const series = await db.getTestSeries(false);
        if (series && Array.isArray(series)) {
          setTestSeriesList(series as any);
        }
      } catch (err) {
        console.error('Failed to load test series:', err);
      }
    };
    loadSeries();
  }, []);

  // Fetch Mains Tests when Series selected
  useEffect(() => {
    const loadTests = async () => {
      if (!selectedSeriesId) {
        setMainsTests([]);
        setSelectedTestId('');
        return;
      }
      try {
        const res = await getMainsTests(selectedSeriesId);
        if (res.success && res.data) {
          setMainsTests(res.data);
          if (res.data.length > 0) {
            setSelectedTestId(res.data[0].id);
          } else {
            setSelectedTestId('');
          }
        }
      } catch (err) {
        console.error('Failed to load mains tests:', err);
      }
    };
    loadTests();
  }, [selectedSeriesId]);

  // Fetch Student Submissions
  const loadSubmissions = async () => {
    if (!accessToken) return;
    setLoadingSubmissions(true);
    try {
      const res = await getMyMainsSubmissions(accessToken);
      if (res.success && res.data) {
        setMySubmissions(res.data);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [accessToken]);

  // PDF File Selection & Local Preview
  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError('');

    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Invalid file format. Only PDF files are allowed.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setValidationError('File size exceeds maximum limit of 50 MB.');
      return;
    }

    setPdfFile(file);
    const localUrl = URL.createObjectURL(file);
    setPdfPreviewUrl(localUrl);

    // Auto upload to Media/Upload server
    setUploadingPdf(true);
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
        setUploadedUrl(data.url);
      } else {
        setValidationError(data.error || 'Failed to upload PDF file.');
      }
    } catch (err) {
      console.error('PDF upload error:', err);
      setValidationError('Network error while uploading PDF file.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Submit Answer Copy
  const handleSubmitCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) {
      setValidationError('Please select a Mains test.');
      return;
    }

    if (!uploadedUrl) {
      setValidationError('Please select and upload a valid PDF answer copy file.');
      return;
    }

    if (!accessToken) return;

    setSubmittingCopy(true);
    setValidationError('');

    try {
      const res = await submitMainsCopy(
        selectedTestId,
        { submissionUrl: uploadedUrl, submissionText },
        accessToken
      );

      if (res.success) {
        alert('Your Mains Answer Copy has been submitted successfully for evaluation!');
        setPdfFile(null);
        setPdfPreviewUrl('');
        setUploadedUrl('');
        setSubmissionText('');
        loadSubmissions();
      } else {
        setValidationError(res.error || 'Failed to submit answer copy.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setValidationError('Network error while submitting answer copy.');
    } fontFinally: {
      setSubmittingCopy(false);
    }
  };

  const selectedTest = mainsTests.find(t => t.id === selectedTestId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] py-10 px-4 sm:px-6 lg:px-8 font-body space-y-10">
      {/* Header Banner */}
      <div className="max-w-6xl mx-auto space-y-4 border-b border-[var(--card-border)] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-black uppercase tracking-widest inline-block">
              Dedicated Mains Evaluation Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[var(--text-color)] tracking-tight">
              Upload Mains Copy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Submit your handwritten Mains answer copies as PDF for evaluation by Senior Faculty &amp; Selected Officers.
            </p>
          </div>

          <Link
            href="/student/mains"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] hover:bg-slate-100 dark:hover:bg-slate-800 border border-[var(--card-border)] text-[var(--text-color)] text-xs font-bold rounded-2xl transition-all self-start sm:self-auto"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Go to Mains Tests Page
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT FORM COLUMN: Upload Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[var(--card-border)] pb-4">
              <h2 className="text-xl font-heading font-black text-[var(--text-color)] flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Submit Answer Copy for Evaluation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your test series and test, attach your scanned answer PDF, and hit submit.
              </p>
            </div>

            <form onSubmit={handleSubmitCopy} className="space-y-6">
              
              {/* STEP 1: Select Test Series */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  1. Select Mains Test Series *
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={e => setSelectedSeriesId(e.target.value)}
                  className="w-full px-4 py-3 bg.bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-color)] outline-none focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">-- Choose Test Series --</option>
                  {testSeriesList.map(ts => (
                    <option key={ts.id} value={ts.id}>
                      {ts.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* STEP 2: Select Specific Mains Test */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  2. Select Mains Test *
                </label>
                {!selectedSeriesId ? (
                  <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-xs text-slate-400 font-medium">
                    Please select a Test Series above to see available Mains tests.
                  </div>
                ) : mainsTests.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    No active Mains tests published under this test series yet.
                  </div>
                ) : (
                  <select
                    value={selectedTestId}
                    onChange={e => setSelectedTestId(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl text-xs font-bold text-[var(--text-color)] outline-none focus:border-indigo-500 transition-colors"
                    required
                  >
                    {mainsTests.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} {t.maxMarks ? `(Max Marks: ${t.maxMarks})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Test Details Preview Box */}
              {selectedTest && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{selectedTest.title}</span>
                    <span>Max Marks: {selectedTest.maxMarks || 100}</span>
                  </div>
                  {selectedTest.description && (
                    <p className="text-slate-500 leading-relaxed text-[11px]">{selectedTest.description}</p>
                  )}
                  {selectedTest.questionPaperUrl && (
                    <a
                      href={selectedTest.questionPaperUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:underline pt-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Question Paper PDF
                    </a>
                  )}
                </div>
              )}

              {/* STEP 3: PDF File Picker */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  3. Upload Scanned Answer PDF * (Max 50 MB)
                </label>
                <div className="border-2 border-dashed border-[var(--card-border)] hover:border-indigo-500/50 rounded-2xl p-6 text-center space-y-3 transition-colors bg-[var(--bg-color)]">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <label className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                      <Upload className="w-4 h-4" />
                      {uploadingPdf ? 'Uploading PDF…' : pdfFile ? 'Replace PDF File' : 'Browse PDF File'}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {pdfFile ? (
                    <p className="text-xs font-bold text-emerald-500 truncate">
                      Selected: {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">Only PDF format accepted. Ensure clear page scans.</p>
                  )}
                </div>
              </div>

              {/* PDF Preview Frame */}
              {pdfPreviewUrl && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    PDF Document Preview
                  </span>
                  <div className="border border-[var(--card-border)] rounded-2xl overflow-hidden h-64 bg-slate-900">
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              )}

              {/* Submission Notes */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                  4. Optional Remarks / Student Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any note for the evaluator (e.g. attempted 8 out of 10 questions, optional subject paper)..."
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl text-xs text-[var(--text-color)] outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {validationError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingCopy || uploadingPdf || !uploadedUrl}
                className={`w-full py-4 text-white text-sm font-heading font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all ${
                  uploadingPdf || submittingCopy || !uploadedUrl
                    ? 'bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 cursor-pointer'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {submittingCopy ? 'Submitting Copy…' : 'Submit Mains Copy for Evaluation'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Submission History & Evaluated Copies */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <h3 className="font-heading font-black text-lg text-[var(--text-color)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                My Mains Submissions
              </h3>
              <button
                onClick={loadSubmissions}
                className="p-2 rounded-xl text-slate-400 hover:text-[var(--text-color)] hover:bg-slate-500/10"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                <p>Loading submission status…</p>
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-[var(--bg-color)] border border-[var(--card-border)] rounded-2xl">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  No answer copies submitted yet. Select a test on the left to submit your first Mains copy.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {mySubmissions.map((sub) => {
                  const isEvaluated = sub.status === 'Evaluated';
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-[var(--bg-color)] border border-[var(--card-border)] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase block">
                            {sub.testSeriesTitle || 'Mains Series'}
                          </span>
                          <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)]">
                            {sub.testTitle}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Submitted: {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border shrink-0 ${
                            isEvaluated
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : sub.status === 'Under Evaluation'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {sub.status || 'Submitted'}
                        </span>
                      </div>

                      {/* Submitted PDF Link */}
                      {sub.submissionUrl && (
                        <a
                          href={sub.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Submitted Copy (PDF)
                        </a>
                      )}

                      {/* Evaluation Results if Evaluated */}
                      {isEvaluated && (
                        <div className="pt-3 border-t border-[var(--card-border)] space-y-2 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              Score: {sub.grade} / {sub.maxMarks || 100} Marks
                            </span>
                            {sub.evaluatedCopyUrl && (
                              <a
                                href={sub.evaluatedCopyUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <Download className="w-3.5 h-3.5" /> Evaluated Copy PDF
                              </a>
                            )}
                          </div>

                          {sub.feedback && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                              <span className="font-bold text-slate-500">Evaluator Feedback:</span> {sub.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
