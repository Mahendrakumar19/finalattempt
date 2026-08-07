'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, FileText, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaPicker from './MediaPicker';
import { db, CustomPage, DownloadItem } from '@/services/db';

interface CustomPagesCMSProps {
  defaultLocation?: 'DOWNLOADS_HUB' | 'NAVBAR' | 'HEADER_TOP' | 'FOOTER' | 'SLUG_ONLY';
}

export default function CustomPagesCMS({ defaultLocation = 'NAVBAR' }: CustomPagesCMSProps) {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [form, setForm] = useState<Partial<CustomPage>>({
    id: '',
    title: '',
    slug: '',
    content: '',
    showLocation: defaultLocation,
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
      const data = await db.getCustomPages(false);
      setPages(data || []);
    } catch (err) {
      console.error('Failed fetching custom pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    let generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (form.showLocation === 'DOWNLOADS_HUB') {
      generatedSlug = `downloads/${generatedSlug}`;
    }
    setForm(prev => ({
      ...prev,
      title,
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
      slug: '',
      content: '',
      showLocation: 'NAVBAR',
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Live Page Builder</span>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 dark:text-white">Custom Pages Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create dynamic pages, design content with Rich Text Editor & select where to feature links (Navbar Header, Footer, Top Ticker, or Direct URL).
          </p>
        </div>
        <button
          onClick={resetForm}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Custom Page</span>
        </button>
      </div>

      {/* Grid: Form and Pages List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Editor Form Column */}
        <form onSubmit={handleSave} className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-4">
            <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">
              {isEditing ? '✏️ Edit Live Page' : '➕ Create New Live Page'}
            </h3>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-amber-600 hover:underline font-bold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Page Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Page Title</label>
              <input
                type="text"
                placeholder="e.g. Student Code of Conduct & Honor Code"
                value={form.title || ''}
                onChange={handleTitleChange}
                className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            {/* URL Slug & Placement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">URL Slug Path</label>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-3 py-2.5 rounded-2xl text-xs font-mono text-slate-600 dark:text-slate-300">
                  <span className="text-amber-500 font-bold">
                    {form.showLocation === 'DOWNLOADS_HUB' || (form.slug && form.slug.startsWith('downloads/')) ? '/downloads/' : '/page/'}
                  </span>
                  <input
                    type="text"
                    value={(form.slug || '').replace(/^downloads\//, '').replace(/^page\//, '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const isDownload = form.showLocation === 'DOWNLOADS_HUB' || (form.slug && form.slug.startsWith('downloads/'));
                      const clean = isDownload ? `downloads/${raw.replace(/^downloads\//, '')}` : raw;
                      setForm({ ...form, slug: clean });
                    }}
                    className="w-full bg-transparent outline-none font-bold text-slate-900 dark:text-white"
                    placeholder="ncert"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Show Location / Menu</label>
                <select
                  value={form.showLocation || 'NAVBAR'}
                  onChange={(e) => {
                    const loc = e.target.value;
                    let currentSlug = (form.slug || '').replace(/^downloads\//, '');
                    if (loc === 'DOWNLOADS_HUB') {
                      currentSlug = `downloads/${currentSlug}`;
                    }
                    setForm({ ...form, showLocation: loc as any, slug: currentSlug });
                  }}
                  className="w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                >
                  <option value="DOWNLOADS_HUB">📁 Downloads Hub Section (/downloads/[slug])</option>
                  <option value="NAVBAR">📌 Main Navbar Header Menu (/page/[slug])</option>
                  <option value="HEADER_TOP">⭐ Header Upper Ticker Bar</option>
                  <option value="FOOTER">🦶 Footer Bottom Legal Links</option>
                  <option value="SLUG_ONLY">🔗 Direct URL Only (Hidden in Menus)</option>
                </select>
              </div>
            </div>

            {/* Visibility & Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Display Order Index</label>
                <input
                  type="number"
                  value={form.displayOrder || 0}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished !== false}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="isPublished" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Publish Live Immediately
                </label>
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

            {/* Banner Image (Media Picker) */}
            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Page Banner Image (DAM Media)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Banner image URL (e.g., uploads/media/...)"
                  value={form.bannerUrl || ''}
                  onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl outline-none font-mono text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-2xl shrink-0 cursor-pointer shadow-xs"
                >
                  Pick Banner
                </button>
              </div>
            </div>

            {/* Downloadable Files Package Collection Manager */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    📁 Downloadable Files Package ({ (form.downloadItems || []).length })
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Add downloadable PDFs, ZIPs, DOCX notes, reports & materials for this page.
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

              {/* Items List */}
              <div className="space-y-3">
                {(form.downloadItems || []).length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">
                    No files added to this download portal package yet.
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
                          placeholder="File Title (e.g. NCERT Class 11 Polity Chapter 1)"
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

                      <input
                        type="text"
                        placeholder="File Download URL (e.g. uploads/documents/ncert_polity.pdf)"
                        value={item.url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            downloadItems: (prev.downloadItems || []).map(i => i.id === item.id ? { ...i, url: val } : i)
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEO Meta Titles */}
            <div className="space-y-2 border-t border-slate-100 dark:border-white/10 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SEO Meta Configurations</span>
              <input
                type="text"
                placeholder="Meta SEO Title"
                value={form.metaTitle || ''}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white"
              />
              <textarea
                rows={2}
                placeholder="Meta SEO Description..."
                value={form.metaDescription || ''}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                className="w-full px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all cursor-pointer"
          >
            {isEditing ? '💾 Update Live Page' : '🚀 Publish Custom Page'}
          </button>
        </form>

        {/* Existing Pages List Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">
              Existing Custom Pages ({pages.length})
            </h3>
            <button
              onClick={fetchPages}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border rounded-3xl space-y-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Loading Custom Pages...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Custom Pages Created Yet</h4>
              <p className="text-xs text-slate-400">Use the form to create new live content pages.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4 hover:border-amber-500/50 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">{p.title}</h4>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${p.isPublished !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {p.isPublished !== false ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                        <span>/page/{p.slug}</span>
                        <a
                          href={`/page/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-500 hover:underline inline-flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-xl uppercase shrink-0">
                      {p.showLocation}
                    </span>
                  </div>

                  {p.metaDescription && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{p.metaDescription}</p>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Order: {p.displayOrder || 0}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Page</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showMediaPicker && (
        <MediaPicker
          onSelect={(url) => {
            setForm(prev => ({ ...prev, bannerUrl: url }));
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
