'use client';

import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, 
  HelpCircle, Eye, Edit3, Trash2, ArrowRight, ShieldCheck, Database,
  Layers, RefreshCw, X, FileCode, Check, Download
} from 'lucide-react';

export interface QuestionBankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCommit?: (quizId: string) => void;
}

export function QuestionBankImportModal({ isOpen, onClose, onSuccessCommit }: QuestionBankImportModalProps) {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'DASHBOARD' | 'REVIEW'>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importRecord, setImportRecord] = useState<any>(null);
  const [stagedQnas, setStagedQnas] = useState<any[]>([]);
  const [selectedQnaIndex, setSelectedQnaIndex] = useState(0);

  // Commit Settings
  const [quizTitle, setQuizTitle] = useState('');
  const [courseId, setCourseId] = useState('course-polity-101');
  const [lessonId, setLessonId] = useState('lesson-1');
  const [isFirstTestFree, setIsFirstTestFree] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  if (!isOpen) return null;

  const handleUploadSubmit = async () => {
    if (!file && !pastedText.trim()) {
      alert('Please select a document file or paste question bank text.');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (pastedText) formData.append('pastedText', pastedText);
    formData.append('filename', file?.name || 'pasted_question_bank.txt');

    try {
      const res = await fetch('/api/document-imports', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!data.success) {
        alert(`Ingestion failed: ${data.error}`);
        setIsProcessing(false);
        return;
      }

      setImportRecord(data.import);
      setQuizTitle(`Imported: ${data.import.filename}`);

      // Fetch Staged QnAs
      const qnasRes = await fetch(`/api/document-imports/${data.import.id}/qnas`);
      const qnasData = await qnasRes.json();

      setStagedQnas(qnasData.qnas || []);
      setIsProcessing(false);
      setActiveTab('DASHBOARD');
    } catch (err: any) {
      alert(`Network error during ingestion: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleApproveQna = async (qnaId: string) => {
    try {
      const res = await fetch(`/api/document-imports/${importRecord.id}/qnas/${qnaId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStagedQnas(prev => prev.map(q => q.id === qnaId ? { ...q, reviewStatus: 'APPROVED' } : q));
      }
    } catch (_) {}
  };

  const handleRejectQna = async (qnaId: string) => {
    try {
      const res = await fetch(`/api/document-imports/${importRecord.id}/qnas/${qnaId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStagedQnas(prev => prev.map(q => q.id === qnaId ? { ...q, reviewStatus: 'REJECTED' } : q));
      }
    } catch (_) {}
  };

  const handleBulkApprovePass = () => {
    setStagedQnas(prev => prev.map(q => q.validationStatus === 'PASS' ? { ...q, reviewStatus: 'APPROVED' } : q));
  };

  const handleCommitToLms = async () => {
    const approvedCount = stagedQnas.filter(q => q.reviewStatus === 'APPROVED' || q.reviewStatus === 'EDITED').length;
    if (approvedCount === 0) {
      alert('No approved questions to commit. Please approve at least one question in the review tab.');
      return;
    }

    setIsCommitting(true);
    try {
      const res = await fetch(`/api/document-imports/${importRecord.id}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizTitle,
          courseId,
          lessonId,
          isFirstTestFree,
          isFree: isFirstTestFree
        })
      });
      const data = await res.json();

      if (!data.success) {
        alert(`LMS Commit failed: ${data.error}`);
        setIsCommitting(false);
        return;
      }

      alert(`✓ Successfully committed ${data.result.totalCommitted} questions into LMS Quiz ID: ${data.result.quizId}`);
      setIsCommitting(false);
      if (onSuccessCommit) onSuccessCommit(data.result.quizId);
      onClose();
    } catch (err: any) {
      alert(`Commit transaction error: ${err.message}`);
      setIsCommitting(false);
    }
  };

  const handleDownloadAuditJson = () => {
    if (!stagedQnas || stagedQnas.length === 0) {
      alert('No imported questions available to export.');
      return;
    }

    const auditData = stagedQnas.map((q, idx) => {
      let parsedData: any = {};
      try {
        parsedData = typeof q.parsedQnaJson === 'string' ? JSON.parse(q.parsedQnaJson) : q.parsedQnaJson || {};
      } catch (e) {
        parsedData = {};
      }
      
      const enQuestion = parsedData.question?.versions?.find((v: any) => v.language === 'en')?.text || q.questionText || '';
      const hiQuestion = parsedData.question?.versions?.find((v: any) => v.language === 'hi')?.text || '';

      const options = (parsedData.options || []).map((opt: any) => ({
        label: opt.label,
        text_en: opt.versions?.find((v: any) => v.language === 'en')?.text || '',
        text_hi: opt.versions?.find((v: any) => v.language === 'hi')?.text || ''
      }));

      return {
        index: idx + 1,
        questionNumber: q.questionNumber || idx + 1,
        sectionName: q.sectionName || parsedData.metadata?.sectionHeader || 'GENERAL',
        questionType: q.questionType || 'MCQ',
        questionText_en: enQuestion,
        questionText_hi: hiQuestion,
        optionsCount: options.length,
        options: options,
        correctAnswer: q.correctAnswer || parsedData.answer?.values?.[0] || 'A',
        explanation_en: parsedData.explanation?.versions?.find((v: any) => v.language === 'en')?.text || q.explanation || '',
        explanation_hi: parsedData.explanation?.versions?.find((v: any) => v.language === 'hi')?.text || '',
        confidenceScore: q.confidenceScore || 1.0,
        reviewStatus: q.reviewStatus || 'PENDING'
      };
    });

    const jsonString = JSON.stringify(auditData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_questions_audit_${importRecord?.id || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentQna = stagedQnas[selectedQnaIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl text-white shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Universal Question Bank Import Engine</h2>
              <p className="text-xs text-slate-400">PDF (Digital & Scanned), DOCX, TXT, HTML, Images into LMS Quiz</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex gap-1 text-xs">
              <button
                onClick={() => setActiveTab('UPLOAD')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'UPLOAD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                1. Upload Document
              </button>
              <button
                disabled={!importRecord}
                onClick={() => setActiveTab('DASHBOARD')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white disabled:opacity-40'}`}
              >
                2. Summary Dashboard
              </button>
              <button
                disabled={!importRecord || stagedQnas.length === 0}
                onClick={() => setActiveTab('REVIEW')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'REVIEW' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white disabled:opacity-40'}`}
              >
                3. Dual-Pane Review ({stagedQnas.length})
              </button>
            </div>

            {importRecord && stagedQnas.length > 0 && (
              <button
                onClick={handleDownloadAuditJson}
                className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5 shadow"
                title="Download Extracted Questions Audit JSON File"
              >
                <Download className="w-3.5 h-3.5" />
                Audit JSON
              </button>
            )}

            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* TAB 1: UPLOAD & INGESTION */}
          {activeTab === 'UPLOAD' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-800/50 transition">
                <Upload className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
                <h3 className="text-base font-semibold mb-1">Select Question Bank File</h3>
                <p className="text-xs text-slate-400 mb-4">Supports PDF, DOCX, TXT, HTML, JPG, PNG, WEBP files up to 50MB</p>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl cursor-pointer transition inline-block"
                >
                  Browse Files
                </label>
                {file && <p className="mt-3 text-xs text-emerald-400 font-mono">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-bold tracking-wider">OR PASTE TEXT</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Paste Question Bank Content</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={6}
                  placeholder="Q1. Consider the following statements:&#10;1. Statement A&#10;2. Statement B&#10;(a) 1 only&#10;(b) 2 only&#10;Ans: A"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                disabled={isProcessing}
                onClick={handleUploadSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting & Analyzing Document...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Start Ingestion Pipeline
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: DASHBOARD */}
          {activeTab === 'DASHBOARD' && importRecord && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-1">Total Detected</span>
                  <span className="text-2xl font-bold text-white">{stagedQnas.length}</span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl">
                  <span className="text-xs text-emerald-400 block mb-1">Ready (PASS)</span>
                  <span className="text-2xl font-bold text-emerald-300">{stagedQnas.filter(q => q.validationStatus === 'PASS').length}</span>
                </div>
                <div className="bg-amber-950/40 border border-amber-800/50 p-4 rounded-xl">
                  <span className="text-xs text-amber-400 block mb-1">Warnings</span>
                  <span className="text-2xl font-bold text-amber-300">{stagedQnas.filter(q => q.validationStatus === 'WARNING').length}</span>
                </div>
                <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-xl">
                  <span className="text-xs text-rose-400 block mb-1">Review Required</span>
                  <span className="text-2xl font-bold text-rose-300">{stagedQnas.filter(q => q.validationStatus === 'REVIEW_REQUIRED').length}</span>
                </div>
                <div className="bg-indigo-950/40 border border-indigo-800/50 p-4 rounded-xl">
                  <span className="text-xs text-indigo-400 block mb-1">Approved</span>
                  <span className="text-2xl font-bold text-indigo-300">{stagedQnas.filter(q => q.reviewStatus === 'APPROVED' || q.reviewStatus === 'EDITED').length}</span>
                </div>
              </div>

              {/* Commit Setup Section */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl space-y-4">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" /> Target LMS Quiz Destination
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Quiz Title</label>
                    <input
                      type="text"
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Course ID</label>
                    <input
                      type="text"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Lesson ID</label>
                    <input
                      type="text"
                      value={lessonId}
                      onChange={(e) => setLessonId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs font-semibold text-amber-400 cursor-pointer select-none bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={isFirstTestFree}
                    onChange={(e) => setIsFirstTestFree(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                  <span>🎁 Mark 1st Test / Free Demo Test for All Students (No Paid Course Enrollment Required)</span>
                </label>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkApprovePass}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-xl transition"
                    >
                      Auto-Approve High-Confidence PASS QnAs
                    </button>

                    <button
                      onClick={handleDownloadAuditJson}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl transition flex items-center gap-2 shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Audit JSON File
                    </button>
                  </div>

                  <button
                    disabled={isCommitting}
                    onClick={handleCommitToLms}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2"
                  >
                    {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Commit Approved Questions to LMS Database
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUAL-PANE REVIEW UI */}
          {activeTab === 'REVIEW' && currentQna && (
            <div className="grid grid-cols-12 gap-6 h-[72vh]">
              
              {/* Left Pane: Questions Sidebar & Evidence */}
              <div className="col-span-4 bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 flex flex-col overflow-y-auto">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Detected Questions ({stagedQnas.length})</h4>
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {stagedQnas.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQnaIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                        selectedQnaIndex === idx
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold">Q{q.questionNumber}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                          {q.data.question.versions[0]?.text || 'Question'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.reviewStatus === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        q.validationStatus === 'PASS' ? 'bg-slate-800 text-slate-300' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {q.reviewStatus === 'APPROVED' ? 'Approved' : q.validationStatus}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Pane: Interactive ExtractedQnA Review Editor */}
              <div className="col-span-8 bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>Q{currentQna.questionNumber} ({currentQna.questionType})</span>
                      {currentQna.data.metadata?.sectionHeader && (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold uppercase tracking-wider">
                          Section: {currentQna.data.metadata.sectionHeader}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-400">Source Document Page #{currentQna.data.source.pages.join(', ')}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectQna(currentQna.id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500 text-rose-300 text-xs font-semibold rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveQna(currentQna.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Approve Question
                    </button>
                  </div>
                </div>

                {/* Validation Warnings */}
                {currentQna.data.validation?.warnings?.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-800 p-3 rounded-lg text-xs text-amber-200">
                    <span className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-400" /> Warnings:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                      {currentQna.data.validation.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                {/* Question Body */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Question Text (EN)</label>
                  <textarea
                    readOnly
                    value={currentQna.data.question.versions.find((v: any) => v.language === 'en')?.text || currentQna.data.question.versions[0]?.text}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                  />
                </div>

                {/* Statements (if present) */}
                {currentQna.data.question.statements && currentQna.data.question.statements.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Statements ({currentQna.data.question.statements.length})</label>
                    <div className="space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-xs">
                      {currentQna.data.question.statements.map((s: any) => (
                        <div key={s.number} className="text-slate-300 font-mono">
                          <span className="text-indigo-400 font-bold">{s.number}.</span> {s.versions[0]?.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Options ({currentQna.data.options.length})</label>
                  <div className="space-y-2">
                    {currentQna.data.options.map((o: any) => (
                      <div key={o.label} className="flex gap-2 items-center bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs">
                        <span className="font-bold text-indigo-400 w-6 text-center">{o.label}.</span>
                        <span className="text-slate-200 flex-1">{o.versions[0]?.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Answer</label>
                    <input
                      type="text"
                      readOnly
                      value={currentQna.data.answer.values.join(', ')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confidence Metrics</label>
                    <div className="text-[11px] text-slate-400 bg-slate-900 border border-slate-700 p-2 rounded-lg flex justify-between">
                      <span>Overall: <strong className="text-white">{Math.round(currentQna.data.confidence.overall * 100)}%</strong></span>
                      <span>Alignment: <strong className="text-white">{currentQna.data.confidence.bilingualAlignment !== null ? Math.round(currentQna.data.confidence.bilingualAlignment * 100) + '%' : 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
