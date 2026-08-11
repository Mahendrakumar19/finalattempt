'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, FileText, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaPicker from './MediaPicker';
import { db, CustomPage, DownloadItem } from '@/services/db';

interface CustomPagesCMSProps {
  defaultLocation?: 'DOWNLOADS_HUB' | 'NAVBAR' | 'HEADER_TOP' | 'FOOTER' | 'SLUG_ONLY';
  targetSlug?: string;
}

export default function CustomPagesCMS({ defaultLocation = 'NAVBAR', targetSlug }: CustomPagesCMSProps) {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeMediaTargetId, setActiveMediaTargetId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<CustomPage>>({
    id: '',
    title: '',
    slug: '',
    content: '',
    showLocation: defaultLocation || 'DOWNLOADS_HUB',
    displayOrder: 0,
    metaTitle: '',
    metaDescription: '',
    isPublished: true
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      let data = await db.getCustomPages(false);
      if (data && targetSlug) {
        let filtered = data.filter(p => p.slug === targetSlug || p.slug === targetSlug.replace(/^downloads\//, ''));
        if (filtered.length === 0) {
          // Auto create base page object so user can immediately edit & upload files
          const autoTitle = targetSlug.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'New Download Portal';
          const defaultNewPage: CustomPage = {
            id: `page-${Date.now()}`,
            title: autoTitle,
            slug: targetSlug,
            content: `<h3>${autoTitle}</h3><p>Official study materials and downloadable booklets repository.</p>`,
            showLocation: defaultLocation || 'DOWNLOADS_HUB',
            displayOrder: 1,
            isPublished: true,
            downloadItems: []
          };
          await db.saveCustomPage(defaultNewPage);
          filtered = [defaultNewPage];
        }
        data = filtered;
      }
      setPages(data || []);
    } catch (err) {
      console.error('Failed fetching custom pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    let cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const generatedSlug = `downloads/${cleanSlug}`;
    setForm(prev => ({
      ...prev,
      title,
      showLocation: 'DOWNLOADS_HUB',
      slug: isEditing ? prev.slug : generatedSlug
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      alert('Page Title and Slug URL are required.');
      return;
    }

    try {
      const ok = await db.saveCustomPage(form);
      if (ok) {
        alert('Custom Page saved successfully!');
        resetForm();
        fetchPages();
      } else {
        alert('Failed saving page.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (page: CustomPage) => {
    setForm(page);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom page?')) return;
    try {
      const ok = await db.deleteCustomPage(id);
      if (ok) {
        fetchPages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      id: '',
      title: '',
      slug: targetSlug || '',
      content: '',
      showLocation: defaultLocation || 'DOWNLOADS_HUB',
      displayOrder: 0,
      metaTitle: '',
      metaDescription: '',
      isPublished: true
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Page & Download Portal Management</span>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">Custom Pages Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            All dynamic custom pages and downloadable resource hubs listed below. Click any page to edit content & downloadable files.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-2xl text-xs cursor-pointer shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Page</span>
        </button>
      </div>

      {/* Tabular List View of Pages */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">
            Available Pages Directory ({pages.length})
          </h3>
          <button
            onClick={fetchPages}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Loading Pages Table...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Custom Pages Created Yet</h4>
            <button
              onClick={() => { resetForm(); setIsEditing(true); }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              + Create First Page
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Page Title & Slug</th>
                  <th className="p-4">Target Location</th>
                  <th className="p-4">Files Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 dark:border-white/5 hover:bg-amber-500/5 transition-colors cursor-pointer"
                    onClick={() => handleEdit(p)}
                  >
                    <td className="p-4">
                      <div className="font-heading font-extrabold text-slate-900 dark:text-white text-sm">
                        {p.title}
                      </div>
                      <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                        <span>/{p.slug}</span>
                        <a
                          href={p.slug.startsWith('downloads/') ? `/${p.slug}` : `/page/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline text-slate-400"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {p.showLocation}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {p.downloadItems?.length || 0} Files
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${p.isPublished !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {p.isPublished !== false ? 'Live' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Open CMS</span>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal Popup */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3 shrink-0">
              <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                {form.id ? `Edit Page: ${form.title}` : 'Create New Custom Page'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-6 pr-2">
              <div className="space-y-4">
                {/* Page Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Page Title</label>
                  <input
                    type="text"
                    placeholder="e.g. BPSC Standard Cut Off & Exam Guidelines"
                    value={form.title || ''}
                    onChange={handleTitleChange}
                    className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                {/* URL Slug Path (Strictly /downloads/[slug]) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Download URL</label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span className="text-amber-500 font-bold">/downloads/</span>
                    <input
                      type="text"
                      value={(form.slug || '').replace(/^downloads\//, '').replace(/^page\//, '')}
                      onChange={(e) => {
                        const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setForm({ ...form, showLocation: 'DOWNLOADS_HUB', slug: `downloads/${raw}` });
                      }}
                      className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white"
                      placeholder="ncert"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">This automatically creates the sub-page under Downloads Hub (e.g., /downloads/ncert, /downloads/bpsc-notes).</p>
                </div>

                {/* Custom Page Category Logo */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Custom Category Logo Box</label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-1.5 shrink-0 shadow-xs">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">No Logo</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Image Logo URL (e.g. https://domain.com/logo.png)"
                        value={form.logoUrl || ''}
                        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setForm({ ...form, logoUrl: ev.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[11px] text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Editor */}
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Page Body Content (Rich Text Editor)</label>
                  <RichTextEditor
                    label={form.title || 'Custom Page Editor'}
                    value={form.content || ''}
                    onChange={(html) => setForm({ ...form, content: html })}
                  />
                </div>

                {/* Downloadable Files Package Collection Manager */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        📁 Downloadable Files Package ({ (form.downloadItems || []).length })
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Add downloadable PDFs, ZIPs, DOCX notes & materials for this page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: DownloadItem = {
                          id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          title: 'New Study Document',
                          description: '',
                          type: 'PDF',
                          size: '2.5 MB',
                          url: ''
                        };
                        setForm(prev => ({ ...prev, downloadItems: [...(prev.downloadItems || []), newItem] }));
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl cursor-pointer"
                    >
                      + Add File
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(form.downloadItems || []).length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-2">
                        No files added to this page yet.
                      </p>
                    ) : (
                      (form.downloadItems || []).map((item, idx) => (
                        <div key={item.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-amber-600 uppercase">Item #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  downloadItems: (prev.downloadItems || []).filter(i => i.id !== item.id)
                                }));
                              }}
                              className="text-red-500 text-[10px] font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="File Title (e.g. Class 11 Geography Notes)"
                              value={item.title || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  downloadItems: (prev.downloadItems || []).map(i => i.id === item.id ? { ...i, title: val } : i)
                                }));
                              }}
                              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-slate-900 dark:text-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Type (e.g. PDF)"
                                value={item.type || 'PDF'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setForm(prev => ({
                                    ...prev,
                                    downloadItems: (prev.downloadItems || []).map(i => i.id === item.id ? { ...i, type: val } : i)
                                  }));
                                }}
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white"
                              />
                              <input
                                type="text"
                                placeholder="Size (e.g. 4.2 MB)"
                                value={item.size || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setForm(prev => ({
                                    ...prev,
                                    downloadItems: (prev.downloadItems || []).map(i => i.id === item.id ? { ...i, size: val } : i)
                                  }));
                                }}
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="File Download URL or Upload Path (e.g. /uploads/documents/notes.pdf)"
                              value={item.url || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  downloadItems: (prev.downloadItems || []).map(i => i.id === item.id ? { ...i, url: val } : i)
                                }));
                              }}
                              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMediaTargetId(item.id);
                                setShowMediaPicker(true);
                              }}
                              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
                            >
                              📁 Pick from Media Folders
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.mp4,.jpg,.jpeg,.png';
                                input.onchange = async (evt: any) => {
                                  const file = evt.target?.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  try {
                                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                                    const res = await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: fd });
                                    const data = await res.json();
                                    // Auto organize NCERT books into dynamic folders
                                    if (form.title?.toLowerCase().includes('ncert') || form.slug?.includes('ncert')) {
                                      const mediaRes = await fetch(`${backendUrl}/api/media/upload`, { method: 'POST', body: fd });
                                      const mediaData = await mediaRes.json();
                                      if (mediaData.success && mediaData.data?.id) {
                                        let subject = '';
                                        let className = '';
                                        const fileNameLower = file.name.toLowerCase();
                                        if (fileNameLower.includes('geo')) subject = 'Geography';
                                        else if (fileNameLower.includes('hist')) subject = 'History';
                                        else if (fileNameLower.includes('pol')) subject = 'Polity';
                                        else if (fileNameLower.includes('eco')) subject = 'Economics';
                                        
                                        if (fileNameLower.includes('class 6') || fileNameLower.includes('class_6') || fileNameLower.includes('c6')) className = 'Class 6';
                                        else if (fileNameLower.includes('class 7') || fileNameLower.includes('class_7') || fileNameLower.includes('c7')) className = 'Class 7';
                                        else if (fileNameLower.includes('class 8') || fileNameLower.includes('class_8') || fileNameLower.includes('c8')) className = 'Class 8';
                                        else if (fileNameLower.includes('class 9') || fileNameLower.includes('class_9') || fileNameLower.includes('c9')) className = 'Class 9';
                                        else if (fileNameLower.includes('class 10') || fileNameLower.includes('class_10') || fileNameLower.includes('c10')) className = 'Class 10';
                                        else if (fileNameLower.includes('class 11') || fileNameLower.includes('class_11') || fileNameLower.includes('c11')) className = 'Class 11';
                                        else if (fileNameLower.includes('class 12') || fileNameLower.includes('class_12') || fileNameLower.includes('c12')) className = 'Class 12';

                                        await fetch(`${backendUrl}/api/ncert/auto-upload`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            mediaId: mediaData.data.id,
                                            rootName: 'NCERT Books',
                                            subject,
                                            className
                                          })
                                        });
                                      }
                                    }
                                    if (data.success && data.url) {
                                      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                                      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
                                      setForm(prev => ({
                                        ...prev,
                                        downloadItems: (prev.downloadItems || []).map(i => i.id === item.id ? {
                                          ...i,
                                          url: data.url,
                                          size: `${sizeMB} MB`,
                                          type: ext,
                                          title: i.title === 'New Study Document' ? file.name.replace(/\.[^.]+$/, '') : i.title
                                        } : i)
                                      }));
                                    } else {
                                      alert('File upload failed');
                                    }
                                  } catch (e) {
                                    console.error(e);
                                    alert('Failed uploading file');
                                  }
                                };
                                input.click();
                              }}
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                            >
                              ⬆ Upload File
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer"
                >
                  {form.id ? '💾 Save Changes' : '🚀 Publish Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMediaPicker && (
        <MediaPicker
          onSelect={(url) => {
            setForm(prev => ({ ...prev, bannerUrl: url }));
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
      {/* Media Picker Modal Overlay */}
      {showMediaPicker && (
        <MediaPicker
          onClose={() => {
            setShowMediaPicker(false);
            setActiveMediaTargetId(null);
          }}
          onSelect={(url, item) => {
            if (activeMediaTargetId) {
              const ext = (item.extension || item.mimeType?.split('/')[1] || 'PDF').toUpperCase();
              const sizeMB = (item.size ? (item.size / (1024 * 1024)).toFixed(1) : '1.0');
              setForm(prev => ({
                ...prev,
                downloadItems: (prev.downloadItems || []).map(i => i.id === activeMediaTargetId ? {
                  ...i,
                  url,
                  type: ext,
                  size: `${sizeMB} MB`,
                  title: i.title === 'New Study Document' ? item.title || item.originalName : i.title
                } : i)
              }));
            }
            setShowMediaPicker(false);
            setActiveMediaTargetId(null);
          }}
        />
      )}
    </div>
  );
}
