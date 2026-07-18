'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, FileText, Settings, Upload, Image as ImageIcon, Check } from 'lucide-react';
import MediaPicker from './MediaPicker';

interface Exam {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  logoMediaId?: string | null;
  logo?: { storagePath: string } | null;
  displayOrder: number;
}

interface SyllabusItem {
  id: string;
  examId: string;
  exam: Exam;
  stage: 'PRELIMS' | 'MAINS' | 'INTERVIEW';
  version: string;
  mediaId: string;
  fileMedia?: { storagePath: string; originalName: string } | null;
  description?: string;
  lastUpdated: string;
  sortOrder: number;
}

interface StrategyBlock {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  featuredImageMediaId?: string | null;
  featuredImage?: { storagePath: string } | null;
  attachmentMediaId?: string | null;
  attachment?: { storagePath: string; originalName: string } | null;
  videoUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  sortOrder: number;
}

interface CompanyValue {
  id: string;
  type: 'MISSION' | 'VISION' | 'CORE_VALUES';
  title: string;
  content: string;
}

export default function SyllabusStrategyCMS({ defaultTab = 'exams' }: { defaultTab?: 'exams' | 'syllabus' | 'strategy' | 'values' }) {
  const [activeSubTab, setActiveSubTab] = useState<'exams' | 'syllabus' | 'strategy' | 'values'>(defaultTab);

  useEffect(() => {
    setActiveSubTab(defaultTab);
  }, [defaultTab]);

  // Data lists
  const [exams, setExams] = useState<Exam[]>([]);
  const [syllabusList, setSyllabusList] = useState<SyllabusItem[]>([]);
  const [strategyBlocks, setStrategyBlocks] = useState<StrategyBlock[]>([]);
  const [companyValues, setCompanyValues] = useState<CompanyValue[]>([]);

  // Modals / forms visibility
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  // Form states
  const [examForm, setExamForm] = useState({ id: '', name: '', code: '', slug: '', description: '', displayOrder: 0, logoMediaId: '' });
  const [syllabusForm, setSyllabusForm] = useState({ id: '', examId: '', stage: 'PRELIMS', version: '1.0', mediaId: '', description: '', sortOrder: 0 });
  const [strategyForm, setStrategyForm] = useState({ id: '', title: '', slug: '', content: '', category: 'Beginner Strategy', featuredImageMediaId: '', attachmentMediaId: '', videoUrl: '', ctaText: '', ctaUrl: '', sortOrder: 0 });
  
  const [editingValueType, setEditingValueType] = useState<string | null>(null);
  const [valueContent, setValueContent] = useState('');
  const [valueTitle, setValueTitle] = useState('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    try {
      const exRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/exams`);
      const exData = await exRes.json();
      if (exData.success) setExams(exData.data);

      const syRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/syllabus`);
      const syData = await syRes.json();
      if (syData.success) setSyllabusList(syData.data);

      const stRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/strategy`);
      const stData = await stRes.json();
      if (stData.success) setStrategyBlocks(stData.data);

      const valRes = await fetch(`${BACKEND_URL}/api/syllabus-strategy/company-values`);
      const valData = await valRes.json();
      if (valData.success) setCompanyValues(valData.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = examForm.id ? 'PUT' : 'POST';
    const url = examForm.id ? `${BACKEND_URL}/api/syllabus-strategy/exams/${examForm.id}` : `${BACKEND_URL}/api/syllabus-strategy/exams`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm)
      });
      const data = await res.json();
      if (data.success) {
        setExamForm({ id: '', name: '', code: '', slug: '', description: '', displayOrder: 0, logoMediaId: '' });
        fetchData();
        alert('Exam saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusForm.examId || !syllabusForm.mediaId) {
      alert('Exam and PDF Media file are required.');
      return;
    }
    const method = syllabusForm.id ? 'PUT' : 'POST';
    const url = syllabusForm.id ? `${BACKEND_URL}/api/syllabus-strategy/syllabus/${syllabusForm.id}` : `${BACKEND_URL}/api/syllabus-strategy/syllabus`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syllabusForm)
      });
      const data = await res.json();
      if (data.success) {
        setSyllabusForm({ id: '', examId: '', stage: 'PRELIMS', version: '1.0', mediaId: '', description: '', sortOrder: 0 });
        fetchData();
        alert('Syllabus saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = strategyForm.id ? 'PUT' : 'POST';
    const url = strategyForm.id ? `${BACKEND_URL}/api/syllabus-strategy/strategy/${strategyForm.id}` : `${BACKEND_URL}/api/syllabus-strategy/strategy`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyForm)
      });
      const data = await res.json();
      if (data.success) {
        setStrategyForm({ id: '', title: '', slug: '', content: '', category: 'Beginner Strategy', featuredImageMediaId: '', attachmentMediaId: '', videoUrl: '', ctaText: '', ctaUrl: '', sortOrder: 0 });
        fetchData();
        alert('Strategy saved successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveValue = async () => {
    if (!editingValueType) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/syllabus-strategy/company-values`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: editingValueType, title: valueTitle, content: valueContent })
      });
      const data = await res.json();
      if (data.success) {
        setEditingValueType(null);
        fetchData();
        alert('Company Value updated!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (type: 'exam' | 'syllabus' | 'strategy', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/syllabus-strategy/${type}/${id}`, {
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
    if (pickerTarget === 'examLogo') {
      setExamForm(prev => ({ ...prev, logoMediaId: item.id }));
    } else if (pickerTarget === 'syllabusPdf') {
      setSyllabusForm(prev => ({ ...prev, mediaId: item.id }));
    } else if (pickerTarget === 'strategyImg') {
      setStrategyForm(prev => ({ ...prev, featuredImageMediaId: item.id }));
    } else if (pickerTarget === 'strategyDoc') {
      setStrategyForm(prev => ({ ...prev, attachmentMediaId: item.id }));
    }
    setShowPicker(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Sub Navigation */}
      <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1 border rounded-2xl w-fit text-xs font-bold text-slate-500">
        {[
          { id: 'exams', label: '🏛️ Exams Directory' },
          { id: 'syllabus', label: '📄 Syllabus Files' },
          { id: 'strategy', label: '🎯 Strategy CMS' },
          { id: 'values', label: '🤝 Values CMS' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`px-5 py-2.5 rounded-xl cursor-pointer transition-all ${activeSubTab === t.id ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-slate-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content: EXAMS */}
      {activeSubTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveExam} className="lg:col-span-4 bg-white border p-6 rounded-3xl space-y-4">
            <h4 className="font-heading font-black text-sm text-slate-900">{examForm.id ? 'Edit Exam' : 'Create Exam'}</h4>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Exam Name</label>
              <input
                type="text"
                placeholder="e.g. 72nd BPSC Combined Competitive Exam"
                value={examForm.name}
                onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Exam Code</label>
              <input
                type="text"
                placeholder="e.g. BPSC-72"
                value={examForm.code}
                onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Slug</label>
              <input
                type="text"
                placeholder="e.g. bpsc-72"
                value={examForm.slug}
                onChange={(e) => setExamForm({ ...examForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
              <textarea
                placeholder="Brief details..."
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Logo Media ID (DAM)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Linked media asset ID"
                  value={examForm.logoMediaId}
                  className="w-full px-3 py-2 text-xs border bg-slate-100 rounded-xl outline-none"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => { setPickerTarget('examLogo'); setShowPicker(true); }}
                  className="btn-outline px-3 text-xs"
                >
                  Pick
                </button>
              </div>
            </div>

            <button type="submit" className="w-full btn-primary text-xs py-2.5">Save Exam</button>
          </form>

          <div className="lg:col-span-8 bg-white border rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-4">Logo</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4">
                      {ex.logo ? (
                        <img src={`${BACKEND_URL}/${ex.logo.storagePath}`} className="w-8 h-8 object-contain" />
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="p-4 font-bold">{ex.name}</td>
                    <td className="p-4 font-mono">{ex.code}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => setExamForm({ id: ex.id, name: ex.name, code: ex.code, slug: ex.slug, description: ex.description || '', displayOrder: ex.displayOrder, logoMediaId: ex.logoMediaId || '' })} className="p-1 bg-slate-50 rounded hover:bg-slate-100">
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDeleteItem('exam', ex.id)} className="p-1 bg-slate-50 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: SYLLABUS */}
      {activeSubTab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveSyllabus} className="lg:col-span-4 bg-white border p-6 rounded-3xl space-y-4">
            <h4 className="font-heading font-black text-sm text-slate-900">{syllabusForm.id ? 'Edit Syllabus' : 'Add Syllabus File'}</h4>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Exam</label>
              <select
                value={syllabusForm.examId}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, examId: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none font-bold"
                required
              >
                <option value="">Select Exam</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Stage</label>
              <select
                value={syllabusForm.stage}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, stage: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none font-bold"
              >
                <option value="PRELIMS">Prelims</option>
                <option value="MAINS">Mains</option>
                <option value="INTERVIEW">Interview</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Version</label>
              <input
                type="text"
                placeholder="e.g. 1.0"
                value={syllabusForm.version}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, version: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Paper Name</label>
              <input
                type="text"
                placeholder="e.g. GS Paper I & Optional Syllabus"
                value={syllabusForm.description}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Syllabus PDF File (DAM)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Linked PDF media ID"
                  value={syllabusForm.mediaId}
                  className="w-full px-3 py-2 text-xs border bg-slate-100 rounded-xl outline-none"
                  readOnly
                  required
                />
                <button
                  type="button"
                  onClick={() => { setPickerTarget('syllabusPdf'); setShowPicker(true); }}
                  className="btn-outline px-3 text-xs"
                >
                  Pick
                </button>
              </div>
            </div>

            <button type="submit" className="w-full btn-primary text-xs py-2.5">Save Syllabus</button>
          </form>

          <div className="lg:col-span-8 bg-white border rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-4">Exam</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">File Name</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {syllabusList.map((sy) => (
                  <tr key={sy.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-bold">{sy.exam.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                        {sy.stage}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{sy.fileMedia?.originalName || 'Syllabus PDF'}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => setSyllabusForm({ id: sy.id, examId: sy.examId, stage: sy.stage, version: sy.version, mediaId: sy.mediaId, description: sy.description || '', sortOrder: sy.sortOrder })} className="p-1 bg-slate-50 rounded hover:bg-slate-100">
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDeleteItem('syllabus', sy.id)} className="p-1 bg-slate-50 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: STRATEGY */}
      {activeSubTab === 'strategy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveStrategy} className="lg:col-span-5 bg-white border p-6 rounded-3xl space-y-4">
            <h4 className="font-heading font-black text-sm text-slate-900">{strategyForm.id ? 'Edit Strategy Block' : 'Add Strategy Block'}</h4>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
              <input
                type="text"
                placeholder="e.g. 3 Months Study Blueprint for Prelims"
                value={strategyForm.title}
                onChange={(e) => setStrategyForm({ ...strategyForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Slug</label>
              <input
                type="text"
                placeholder="e.g. 3-months-blueprint"
                value={strategyForm.slug}
                onChange={(e) => setStrategyForm({ ...strategyForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
              <select
                value={strategyForm.category}
                onChange={(e) => setStrategyForm({ ...strategyForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none font-bold"
              >
                {['Beginner Strategy', '3 Month Plan', '6 Month Plan', '1 Year Plan', 'Book List', 'Time Management', 'Revision Strategy', 'Answer Writing', 'Interview Strategy', 'Test Series Strategy'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Content (HTML Rich Text)</label>
              <textarea
                placeholder="Strategy instructions and analysis..."
                value={strategyForm.content}
                onChange={(e) => setStrategyForm({ ...strategyForm, content: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Featured Image (DAM)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Featured WebP Image ID"
                  value={strategyForm.featuredImageMediaId}
                  className="w-full px-3 py-2 text-xs border bg-slate-100 rounded-xl outline-none"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => { setPickerTarget('strategyImg'); setShowPicker(true); }}
                  className="btn-outline px-3 text-xs"
                >
                  Pick
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Booklist Attachment File (DAM)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Attachment PDF/ZIP Media ID"
                  value={strategyForm.attachmentMediaId}
                  className="w-full px-3 py-2 text-xs border bg-slate-100 rounded-xl outline-none"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => { setPickerTarget('strategyDoc'); setShowPicker(true); }}
                  className="btn-outline px-3 text-xs"
                >
                  Pick
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Video URL</label>
              <input
                type="url"
                placeholder="Optional YouTube Video link"
                value={strategyForm.videoUrl || ''}
                onChange={(e) => setStrategyForm({ ...strategyForm, videoUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">CTA Text</label>
                <input
                  type="text"
                  placeholder="e.g. Enroll Now"
                  value={strategyForm.ctaText || ''}
                  onChange={(e) => setStrategyForm({ ...strategyForm, ctaText: e.target.value })}
                  className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">CTA Url</label>
                <input
                  type="text"
                  placeholder="e.g. /courses"
                  value={strategyForm.ctaUrl || ''}
                  onChange={(e) => setStrategyForm({ ...strategyForm, ctaUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs border bg-slate-50 rounded-xl outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary text-xs py-2.5">Save Strategy Block</button>
          </form>

          <div className="lg:col-span-7 bg-white border rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {strategyBlocks.map((st) => (
                  <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-bold">{st.title}</td>
                    <td className="p-4 text-slate-500 font-bold">{st.category}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => setStrategyForm({ id: st.id, title: st.title, slug: st.slug, content: st.content, category: st.category, featuredImageMediaId: st.featuredImageMediaId || '', attachmentMediaId: st.attachmentMediaId || '', videoUrl: st.videoUrl || '', ctaText: st.ctaText || '', ctaUrl: st.ctaUrl || '', sortOrder: st.sortOrder })} className="p-1 bg-slate-50 rounded hover:bg-slate-100">
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={() => handleDeleteItem('strategy', st.id)} className="p-1 bg-slate-50 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: VALUES */}
      {activeSubTab === 'values' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {companyValues.map((val) => (
              <div key={val.id} className="bg-white border p-6 rounded-3xl space-y-4 shadow-xs relative">
                <h4 className="font-heading font-black text-sm text-slate-900">{val.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{val.content}</p>
                <button
                  onClick={() => {
                    setEditingValueType(val.type);
                    setValueTitle(val.title);
                    setValueContent(val.content);
                  }}
                  className="btn-outline py-1.5 text-[10px] w-full text-center flex items-center justify-center gap-1.5 mt-4"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Content</span>
                </button>
              </div>
            ))}
          </div>

          {editingValueType && (
            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl max-w-xl space-y-4">
              <h4 className="font-heading font-black text-sm text-slate-900">Update Content for: {valueTitle}</h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Section Title</label>
                <input
                  type="text"
                  value={valueTitle}
                  onChange={(e) => setValueTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border bg-white rounded-xl outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Section Content</label>
                <textarea
                  value={valueContent}
                  onChange={(e) => setValueContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border bg-white rounded-xl outline-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveValue} className="btn-primary text-xs py-2 px-4">Update Value</button>
                <button onClick={() => setEditingValueType(null)} className="btn-outline text-xs py-2 px-4">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

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
