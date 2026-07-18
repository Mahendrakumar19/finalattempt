'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Eye } from 'lucide-react';
import MediaPicker from './MediaPicker';

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface PYQItem {
  id: string;
  examId: string;
  exam: Exam;
  year: number;
  stage: 'PRELIMS' | 'MAINS' | 'INTERVIEW';
  paperName: string;
  questionPaperMediaId?: string | null;
  questionPaper?: { originalName: string } | null;
  answerKeyMediaId?: string | null;
  answerKey?: { originalName: string } | null;
  description?: string | null;
  sortOrder: number;
}

export default function PYQsManagerCMS() {
  const [pyqs, setPyqs] = useState<PYQItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  // Picker toggles
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'paper' | 'key' | null>(null);

  // Form states
  const [form, setForm] = useState({
    id: '',
    examId: '',
    year: new Date().getFullYear(),
    stage: 'PRELIMS',
    paperName: '',
    questionPaperMediaId: '',
    answerKeyMediaId: '',
    description: '',
    sortOrder: 0
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const examsRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
      const examsData = await examsRes.json();
      if (examsData.success) setExams(examsData.data);

      const pyqsRes = await fetch(`${BACKEND_URL}/api/pyqs?limit=100`);
      const pyqsData = await pyqsRes.json();
      if (pyqsData.success) setPyqs(pyqsData.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examId || !form.year || !form.paperName) {
      alert('Exam, Year, and Paper Name are required.');
      return;
    }

    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `${BACKEND_URL}/api/pyqs/${form.id}` : `${BACKEND_URL}/api/pyqs`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setForm({
          id: '',
          examId: '',
          year: new Date().getFullYear(),
          stage: 'PRELIMS',
          paperName: '',
          questionPaperMediaId: '',
          answerKeyMediaId: '',
          description: '',
          sortOrder: 0
        });
        fetchData();
        alert('PYQ Booklet saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PYQ booklet?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/pyqs/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectMedia = (url: string, item: any) => {
    if (pickerTarget === 'paper') {
      setForm(prev => ({ ...prev, questionPaperMediaId: item.id }));
    } else if (pickerTarget === 'key') {
      setForm(prev => ({ ...prev, answerKeyMediaId: item.id }));
    }
    setShowPicker(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Form panel */}
      <form onSubmit={handleSave} className="lg:col-span-4 bg-white border p-6 rounded-3xl space-y-4 shadow-xs">
        <h4 className="font-heading font-black text-sm text-slate-900">{form.id ? 'Edit PYQ Booklet' : 'Add PYQ Booklet'}</h4>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Target Exam</label>
          <select
            value={form.examId}
            onChange={(e) => setForm({ ...form, examId: e.target.value })}
            className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none font-bold"
            required
          >
            <option value="">Select Exam</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none font-bold"
            >
              <option value="PRELIMS">Prelims</option>
              <option value="MAINS">Mains</option>
              <option value="INTERVIEW">Interview</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Paper Name / Title</label>
          <input
            type="text"
            placeholder="e.g. BPSC Prelims GS Booklets"
            value={form.paperName}
            onChange={(e) => setForm({ ...form, paperName: e.target.value })}
            className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase block">Question Paper File (DAM)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Question Paper Media ID"
              value={form.questionPaperMediaId}
              className="w-full px-3 py-2 text-xs border bg-slate-100 rounded-xl outline-none"
              readOnly
            />
            <button
              type="button"
              onClick={() => { setPickerTarget('paper'); setShowPicker(true); }}
              className="btn-outline px-3 text-xs"
            >
              Pick
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase block">Official Answer Key (DAM)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Answer Key Media ID"
              value={form.answerKeyMediaId}
              className="w-full px-3 py-2 text-xs border bg-slate-100 rounded-xl outline-none"
              readOnly
            />
            <button
              type="button"
              onClick={() => { setPickerTarget('key'); setShowPicker(true); }}
              className="btn-outline px-3 text-xs"
            >
              Pick
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Meta Notes</label>
          <textarea
            placeholder="Paper structure info..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
            rows={3}
          />
        </div>

        <button type="submit" className="w-full btn-primary text-xs py-2.5">Save Booklet</button>
      </form>

      {/* List panel */}
      <div className="lg:col-span-8 bg-white border rounded-3xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <th className="p-4">Exam</th>
              <th className="p-4">Year</th>
              <th className="p-4">Stage</th>
              <th className="p-4">Paper Name</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pyqs.map((pq) => (
              <tr key={pq.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-4 font-bold">{pq.exam.name}</td>
                <td className="p-4 font-bold font-mono">{pq.year}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                    {pq.stage}
                  </span>
                </td>
                <td className="p-4 font-medium">{pq.paperName}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => setForm({ id: pq.id, examId: pq.examId, year: pq.year, stage: pq.stage, paperName: pq.paperName, questionPaperMediaId: pq.questionPaperMediaId || '', answerKeyMediaId: pq.answerKeyMediaId || '', description: pq.description || '', sortOrder: pq.sortOrder })} className="p-1 bg-slate-50 rounded hover:bg-slate-100">
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(pq.id)} className="p-1 bg-slate-50 rounded hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Media Picker Modal */}
      {showPicker && (
        <MediaPicker
          onSelect={selectMedia}
          onClose={() => setShowPicker(false)}
        />
      )}

    </div>
  );
}
