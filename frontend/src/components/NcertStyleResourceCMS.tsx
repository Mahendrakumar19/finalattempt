/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, FileText, ExternalLink, Image as ImageIcon, Upload, Save, CheckCircle } from 'lucide-react';
import MediaPicker from './MediaPicker';
import RichTextEditor from './RichTextEditor';
import Link from 'next/link';
import { db, CustomPage, DownloadItem } from '@/services/db';
import { INITIAL_FALLBACK_ITEMS } from './RapidRevisionPortal';

function createPageId() {
  return `page-${Date.now()}`;
}

function createItemId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface NcertStyleCMSProps {
  pageSlug: string;
  pageTitle: string;
  portalCategoryLabel: string;
  portalDescription: string;
  themeColor: 'purple' | 'rose' | 'cyan' | 'blue' | 'emerald' | 'amber';
  typeOptions: string[];
}

export default function NcertStyleResourceCMS({
  pageSlug,
  pageTitle,
  portalCategoryLabel,
  portalDescription,
  themeColor,
  typeOptions
}: NcertStyleCMSProps) {
  const [page, setPage] = useState<CustomPage | null>(null);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [activeMediaTargetId, setActiveMediaTargetId] = useState<string | null>(null);

  // Page Header Banner & Icon Branding State
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  const [filterType, setFilterType] = useState('ALL');
  const [folderFilter, setFolderFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState<DownloadItem>({
    id: '',
    title: '',
    description: '',
    type: typeOptions[0] || 'Polity and Governance',
    examCategory: 'BPSC (Bihar)',
    language: 'English',
    editionYear: '2025-26 Edition',
    price: undefined,
    discountedPrice: undefined,
    size: '2.5 MB',
    url: '',
    thumbnailUrl: '',
    samplePdfUrl: '',
    buyUrl: ''
  });

  const [pageOverviewContent, setPageOverviewContent] = useState('');

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  };

  useEffect(() => {
    let ignore = false;
    async function loadPage() {
      try {
        const isRrmSlug = pageSlug === 'rapid-revision' || pageSlug === 'quick-revision-material';
        let data = await db.getCustomPageBySlug(`downloads/${pageSlug}`);
        if (!data) {
          data = await db.getCustomPageBySlug(pageSlug);
        }
        if (!data && isRrmSlug) {
          data = await db.getCustomPageBySlug('downloads/rapid-revision') ||
                 await db.getCustomPageBySlug('rapid-revision') ||
                 await db.getCustomPageBySlug('downloads/quick-revision-material') ||
                 await db.getCustomPageBySlug('quick-revision-material');
        }
        if (!data) {
          const allPages = await db.getCustomPages(false);
          data = allPages.find(p => p.slug === `downloads/${pageSlug}` || p.slug === pageSlug) || null;
        }

        if (ignore) return;

        if (data) {
          setPage(data);
          setDownloadItems(Array.isArray(data.downloadItems) ? data.downloadItems : []);
          setPageOverviewContent(data.content || '');
          setBannerUrl(data.bannerUrl || '');
          setLogoUrl(data.logoUrl || '');
        } else {
          const defaultItems = isRrmSlug ? INITIAL_FALLBACK_ITEMS : [];
          const initPage: CustomPage = {
            id: createPageId(),
            title: pageTitle,
            slug: `downloads/${pageSlug}`,
            content: `<h3>${pageTitle}</h3><p>${portalDescription}</p>`,
            showLocation: 'DOWNLOADS_HUB',
            displayOrder: 1,
            isPublished: true,
            downloadItems: defaultItems,
            bannerUrl: '',
            logoUrl: ''
          };
          setPage(initPage);
          setDownloadItems(defaultItems);
          setPageOverviewContent(initPage.content);
          setBannerUrl('');
          setLogoUrl('');
          if (isRrmSlug) {
            db.saveCustomPage(initPage).catch(e => console.warn('Auto-seed rapid revision items:', e));
          }
        }
      } catch (err) {
        console.error(`Failed fetching portal page downloads/${pageSlug}:`, err);
      }
    }
    loadPage();
    return () => {
      ignore = true;
    };
  }, [pageSlug, pageTitle, portalDescription]);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const updatedPage: CustomPage = {
        ...page,
        id: page?.id || createPageId(),
        title: page?.title || pageTitle,
        slug: page?.slug || `downloads/${pageSlug}`,
        content: pageOverviewContent || page?.content || `<h3>${pageTitle}</h3>`,
        downloadItems,
        bannerUrl,
        logoUrl,
        showLocation: page?.showLocation || 'DOWNLOADS_HUB',
        isPublished: true
      };
      const ok = await db.saveCustomPage(updatedPage);
      if (ok) {
        setPage(updatedPage);
        setBrandingSuccess(true);
        setTimeout(() => setBrandingSuccess(false), 3000);
      } else {
        alert('Failed to save page banner and logo.');
      }
    } catch (err) {
      console.error('Error saving branding:', err);
      alert('Error saving banner.');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success && (data.fileUrl || data.url)) {
        setBannerUrl(data.fileUrl || data.url);
        return;
      }
    } catch {}
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setBannerUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success && (data.fileUrl || data.url)) {
        setLogoUrl(data.fileUrl || data.url);
        return;
      }
    } catch {}
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setLogoUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || (!form.url && !form.buyUrl)) {
      alert('Item Title and File URL / Buy Link are required.');
      return;
    }

    let updatedList: DownloadItem[] = [];
    if (form.id) {
      updatedList = downloadItems.map(item => item.id === form.id ? { ...item, ...form } : item);
    } else {
      const newItem: DownloadItem = {
        ...form,
        id: createItemId()
      };
      updatedList = [newItem, ...downloadItems];
    }

    const updatedPage: CustomPage = {
      ...page,
      id: page?.id || createPageId(),
      title: page?.title || pageTitle,
      slug: page?.slug || `downloads/${pageSlug}`,
      content: pageOverviewContent,
      downloadItems: updatedList,
      bannerUrl: bannerUrl || page?.bannerUrl || '',
      logoUrl: logoUrl || page?.logoUrl || '',
      showLocation: page?.showLocation || 'DOWNLOADS_HUB',
      isPublished: true
    };

    try {
      const ok = await db.saveCustomPage(updatedPage);

      if (ok) {
        setDownloadItems(updatedList);
        setPage(updatedPage);
        setForm({
          id: '',
          title: '',
          description: '',
          type: typeOptions[0] || 'Polity and Governance',
          examCategory: 'BPSC (Bihar)',
          language: 'English',
          editionYear: '2025-26 Edition',
          price: undefined,
          discountedPrice: undefined,
          size: '2.5 MB',
          url: '',
          thumbnailUrl: '',
          samplePdfUrl: '',
          buyUrl: ''
        });
        alert('Publication / Study Item saved successfully!');
      } else {
        alert('Failed to save item.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this study document?')) return;
    const updatedList = downloadItems.filter(i => i.id !== itemId);
    const updatedPage: CustomPage = {
      ...page,
      id: page?.id || createPageId(),
      title: page?.title || pageTitle,
      slug: page?.slug || `downloads/${pageSlug}`,
      content: pageOverviewContent || page?.content || `<h3>${pageTitle}</h3>`,
      downloadItems: updatedList,
      bannerUrl: bannerUrl || page?.bannerUrl || '',
      logoUrl: logoUrl || page?.logoUrl || '',
      showLocation: page?.showLocation || 'DOWNLOADS_HUB',
      isPublished: true
    };
    try {
      const ok = await db.saveCustomPage(updatedPage);
      if (ok) {
        setDownloadItems(updatedList);
        setPage(updatedPage);
      } else {
        alert('Failed to delete item from database. Please try again.');
      }
    } catch (err) {
      console.error('Delete item error:', err);
      alert('Error deleting item.');
    }
  };

  const handleSaveOverview = async () => {
    try {
      const updatedPage: CustomPage = {
        ...page,
        id: page?.id || createPageId(),
        title: page?.title || pageTitle,
        slug: page?.slug || `downloads/${pageSlug}`,
        content: pageOverviewContent,
        downloadItems,
        bannerUrl: bannerUrl || page?.bannerUrl || '',
        logoUrl: logoUrl || page?.logoUrl || '',
        showLocation: page?.showLocation || 'DOWNLOADS_HUB',
        isPublished: true
      };
      const ok = await db.saveCustomPage(updatedPage);
      if (ok) {
        setPage(updatedPage);
        alert('Page Overview content updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = downloadItems.filter(item => {
    if (filterType !== 'ALL' && (item.type || '').toLowerCase() !== filterType.toLowerCase()) return false;
    if (folderFilter !== 'ALL') {
      const exam = `${item.examCategory || ''} ${item.type || ''} ${item.title || ''}`.toLowerCase();
      if (folderFilter === 'UPSC' && !exam.includes('upsc')) return false;
      if (folderFilter === 'BIHAR' && !exam.includes('bihar') && !exam.includes('bpsc')) return false;
      if (folderFilter === 'UP' && !exam.includes('uppsc') && !exam.includes('uttar pradesh') && !/\bup\b/.test(exam)) return false;
      if (folderFilter === 'STATE_PCS' && !exam.includes('bpsc') && !exam.includes('uppsc') && !exam.includes('state')) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || (item.examCategory || '').toLowerCase().includes(q);
    }
    return true;
  });

  const THEME_CLASSES = {
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600', badge: 'bg-purple-500/10 text-purple-600 border-purple-200' },
    rose: { text: 'text-rose-500', bg: 'bg-rose-500', hoverBg: 'hover:bg-rose-600', badge: 'bg-rose-500/10 text-rose-600 border-rose-200' },
    cyan: { text: 'text-cyan-500', bg: 'bg-cyan-500', hoverBg: 'hover:bg-cyan-600', badge: 'bg-cyan-500/10 text-cyan-700 border-cyan-200' },
    blue: { text: 'text-blue-500', bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', badge: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-600', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-500', hoverBg: 'hover:bg-amber-600', badge: 'bg-amber-500/10 text-amber-700 border-amber-200' }
  }[themeColor || 'amber'];

  return (
    <div className="space-y-6">
      {/* Top Banner Header (NCERT Style) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div>
          <span className={`text-xs font-bold ${THEME_CLASSES.text} uppercase tracking-widest`}>{portalCategoryLabel}</span>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 dark:text-white">{pageTitle} Vault Editor</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {portalDescription}
          </p>
        </div>
        <Link
          href={`/downloads/${pageSlug}`}
          target="_blank"
          className={`px-4 py-2.5 ${THEME_CLASSES.bg} ${THEME_CLASSES.hoverBg} text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shrink-0`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Live /downloads/{pageSlug}</span>
        </Link>
      </div>

      {/* ── Page Image Banner & Icon Branding Panel ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${THEME_CLASSES.badge}`}>
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                Page Header Image Banner &amp; Icon Branding
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Set a high-resolution top hero banner image and category icon for /downloads/{pageSlug}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveBranding}
            disabled={savingBranding}
            className={`px-4 py-2 ${THEME_CLASSES.bg} ${THEME_CLASSES.hoverBg} text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0`}
          >
            {brandingSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{savingBranding ? 'Saving...' : 'Save Banner & Branding'}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* Banner URL & Upload */}
          <div className="md:col-span-8 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Top Image Banner URL (Full-Width Responsive Header)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. /uploads/images/useful-documents-banner.webp or https://domain.com/banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                />
                <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-200 dark:border-white/10 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Banner Live Preview */}
            <div className="w-full h-32 sm:h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
              {bannerUrl ? (
                <img
                  src={bannerUrl.startsWith('http') || bannerUrl.startsWith('data:') ? bannerUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/${bannerUrl.replace(/^\//, '')}`}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center p-4 text-slate-400 space-y-1">
                  <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs font-semibold">No banner image uploaded yet</p>
                  <p className="text-[10px] text-slate-400">Recommended size: 1920x480px or 1200x400px (16:4 aspect ratio)</p>
                </div>
              )}
            </div>
          </div>

          {/* Logo / Icon URL & Upload */}
          <div className="md:col-span-4 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Category Logo / Hub Icon
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. /uploads/images/icon.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                />
                <label className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer shrink-0 border border-slate-200 dark:border-white/10" title="Upload Icon">
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Logo Preview */}
            <div className="w-20 h-20 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden p-2">
              {logoUrl ? (
                <img
                  src={logoUrl.startsWith('http') || logoUrl.startsWith('data:') ? logoUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/${logoUrl.replace(/^\//, '')}`}
                  alt="Icon Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[10px] font-bold text-slate-400 text-center">No Icon</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Shown on Downloads Hub card ({pageSlug}).
            </p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Form Panel: Add / Edit Document Item */}
        <form onSubmit={handleSaveItem} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-xs">
          <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
            {form.id ? 'Edit Study Document' : `Add New ${pageTitle} Material`}
          </h4>

          {/* Category / Vault Section (Allow Free Custom Text Typing with Comma & Space) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">
              Category / Vault Section Name (Type custom name or pick suggestion)
            </label>
            <input
              type="text"
              list={`category-options-${pageSlug}`}
              placeholder="e.g. 69th BPSC Rankers, GS Paper 1 & 2, Essay Copies..."
              value={form.type || ''}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              required
            />
            <datalist id={`category-options-${pageSlug}`}>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            <p className="text-[10px] text-slate-400">
              You can type any custom category name freely (commas, spaces &amp; special chars supported).
            </p>
          </div>

          {/* Target Exam / Folder (UPSC & State PCS) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>Target Exam / Folder (UPSC &amp; State PCS)</span>
              <span className="text-amber-500 font-bold text-[9px]">*Used for State Filters</span>
            </label>
            <select
              value={form.examCategory || 'BPSC (Bihar)'}
              onChange={(e) => setForm({ ...form, examCategory: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="UPSC CSE">🏛️ UPSC CSE</option>
              <option value="BPSC (Bihar)">📍 Bihar Special (BPSC)</option>
              <option value="UPPSC (UP)">📍 UP Special (UPPSC)</option>
              <option value="BPSC & UPSC">🌐 BPSC &amp; UPSC (Combined)</option>
              <option value="State PCS">🗺️ Other State PCS</option>
              <option value="General Studies">📚 General Studies (All)</option>
            </select>
          </div>

          {/* Document Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Booklet / File Title</label>
            <input
              type="text"
              placeholder="e.g. Bihar Special GK Master Handbook"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
              required
            />
          </div>

          {/* Language & Edition Year */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Language</label>
              <select
                value={form.language || 'English'}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Edition / Year</label>
              <input
                type="text"
                placeholder="e.g. 2025-26 Edition"
                value={form.editionYear || ''}
                onChange={(e) => setForm({ ...form, editionYear: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Pricing: MRP & Offer Price (Optional for Free Items) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">MRP Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 450 (Leave empty if FREE)"
                value={form.price !== undefined ? form.price : ''}
                onChange={(e) => setForm({ ...form, price: e.target.value !== '' ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Offer Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 299 (Leave empty if FREE)"
                value={form.discountedPrice !== undefined ? form.discountedPrice : ''}
                onChange={(e) => setForm({ ...form, discountedPrice: e.target.value !== '' ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          {/* Book Cover Image Thumbnail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Book Cover Image URL (Thumbnail)</label>
              {form.thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, thumbnailUrl: '' }))}
                  className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                >
                  ✕ Remove Cover
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. /uploads/images/book-cover.png"
                value={form.thumbnailUrl || ''}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveMediaTargetId('thumbnail');
                  setShowMediaPicker(true);
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                Cover DAM
              </button>
            </div>

            {/* Direct Cover Image Upload from Computer */}
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/png,image/jpeg,image/webp,image/jpg';
                input.onchange = async (evt: Event) => {
                  const target = evt.target as HTMLInputElement | null;
                  const file = target?.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                    const res = await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.success && (data.url || data.fileUrl)) {
                      setForm(prev => ({
                        ...prev,
                        thumbnailUrl: data.fileUrl || data.url
                      }));
                    }
                  } catch (e) {
                    console.error('Error uploading cover photo:', e);
                  }
                };
                input.click();
              }}
              className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/20 font-bold text-[11px] rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              🖼️ Upload Cover Image From Computer
            </button>

            {/* Live Cover Preview */}
            {form.thumbnailUrl && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10">
                <img
                  src={resolveUrl(form.thumbnailUrl)}
                  alt="Cover Preview"
                  className="w-10 h-14 object-cover rounded-lg border border-slate-300 dark:border-white/20 shadow-xs"
                />
                <div className="text-[11px] overflow-hidden">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[10px]">✓ Cover Attached</span>
                  <span className="text-[9px] text-slate-400 font-mono truncate block max-w-[200px]">{form.thumbnailUrl}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sample PDF URL */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Free Sample PDF URL (Optional for &quot;Read Sample&quot;)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. /uploads/documents/sample-chapter.pdf"
                value={form.samplePdfUrl || ''}
                onChange={(e) => setForm({ ...form, samplePdfUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveMediaTargetId('sample');
                  setShowMediaPicker(true);
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                Sample DAM
              </button>
            </div>
          </div>

          {/* Main Download PDF or Custom Buy URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Main Full Book PDF / Buy Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. /uploads/documents/full-book.pdf or https://wa.me/..."
                value={form.url || ''}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveMediaTargetId('main');
                  setShowMediaPicker(true);
                }}
                className={`px-3 py-2 ${THEME_CLASSES.bg} text-slate-950 text-xs font-extrabold rounded-xl shrink-0 cursor-pointer shadow-xs`}
              >
                File DAM
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.mp4,.jpg,.jpeg,.png';
                input.onchange = async (evt: Event) => {
                  const target = evt.target as HTMLInputElement | null;
                  const file = target?.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                    const res = await fetch(`${backendUrl}/api/upload`, { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.success && data.url) {
                      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                      setForm(prev => ({
                        ...prev,
                        url: data.url,
                        size: `${sizeMB} MB`,
                        title: prev.title || file.name.replace(/\.[^.]+$/, '')
                      }));
                    }
                  } catch (e) {
                    console.error(e);
                  }
                };
                input.click();
              }}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-xl cursor-pointer"
            >
              ⬆ Upload File From Computer
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Book Description &amp; Details</label>
            <textarea
              rows={3}
              placeholder="Brief summary of syllabus coverage, key features, author, etc..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white"
            />
          </div>

          <button type="submit" className={`w-full py-3 ${THEME_CLASSES.bg} ${THEME_CLASSES.hoverBg} text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md cursor-pointer`}>
            {form.id ? '💾 Save Changes' : `🚀 Publish ${pageTitle} Item`}
          </button>
        </form>

        {/* List & Table Panel */}
        <div className="lg:col-span-8 space-y-6">

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs">
            {/* Table Filters */}
            <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                  {pageTitle} Materials Vault ({filteredItems.length})
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search materials…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                  />

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {Array.from(new Set([...typeOptions, ...downloadItems.map(i => i.type || 'General Notes')])).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Folder Tabs (All, UPSC, Bihar BPSC, UP UPPSC, Combined) */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-white/10 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-1">
                  📁 Folder:
                </span>
                {[
                  { id: 'ALL', label: 'All Folders' },
                  { id: 'UPSC', label: '🏛️ UPSC CSE' },
                  { id: 'BIHAR', label: '📍 Bihar Special (BPSC)' },
                  { id: 'UP', label: '📍 UP Special (UPPSC)' },
                  { id: 'STATE_PCS', label: '🗺️ State PCS' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFolderFilter(f.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      folderFilter === f.id
                        ? `${THEME_CLASSES.bg} text-slate-950 shadow-xs font-black`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Cover</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Title &amp; Details</th>
                    <th className="p-3">Lang / Ed</th>
                    <th className="p-3">Price / Offer</th>
                    <th className="p-3">Sample</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No materials uploaded for {pageTitle} matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-amber-500/5 transition-colors">
                        <td className="p-3">
                          {item.thumbnailUrl ? (
                            <img
                              src={resolveUrl(item.thumbnailUrl)}
                              alt={item.title}
                              className="w-10 h-14 rounded-lg object-cover border border-slate-200 dark:border-white/10 shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-14 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex flex-col items-center justify-center p-1 text-center shadow-xs">
                              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-0.5" />
                              <span className="text-[7px] font-black uppercase tracking-tighter text-amber-700 dark:text-amber-300 line-clamp-1 leading-tight">
                                {item.language === 'Hindi' ? 'हिन्दी' : 'PDF'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-bold text-slate-900 dark:text-white text-[11px]">{item.type || 'General'}</span>
                            {item.examCategory && (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                item.examCategory.includes('BPSC')
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                  : item.examCategory.includes('UPPSC')
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                              }`}>
                                📁 {item.examCategory}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</div>
                          {item.description && <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[10px] text-slate-700 dark:text-slate-300">{item.language || 'English'}</div>
                          {item.editionYear && <div className="text-[9px] text-slate-400">{item.editionYear}</div>}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {item.discountedPrice !== undefined || item.price !== undefined ? (
                            <div className="flex flex-col">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{item.discountedPrice || item.price}</span>
                              {item.price && item.discountedPrice && item.price > item.discountedPrice && (
                                <span className="text-[9px] line-through text-slate-400">₹{item.price}</span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">FREE</span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.samplePdfUrl ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">✓ Sample</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setForm(item);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Page Overview Content Editor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                Page Intro &amp; Study Overview Content (Rich Text)
              </h4>
              <button
                type="button"
                onClick={handleSaveOverview}
                className={`px-4 py-2 ${THEME_CLASSES.bg} text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer`}
              >
                💾 Save Overview Notes
              </button>
            </div>

            <RichTextEditor
              label={`${pageTitle} Overview`}
              value={pageOverviewContent}
              onChange={(html) => setPageOverviewContent(html)}
            />
          </div>

        </div>

      </div>

      {showMediaPicker && (
        <MediaPicker
          onClose={() => {
            setShowMediaPicker(false);
            setActiveMediaTargetId(null);
          }}
          onSelect={(url, item) => {
            const sizeMB = (item.size ? (item.size / (1024 * 1024)).toFixed(1) : '1.0');
            setForm(prev => {
              if (activeMediaTargetId === 'thumbnail') {
                return { ...prev, thumbnailUrl: url };
              } else if (activeMediaTargetId === 'sample') {
                return { ...prev, samplePdfUrl: url };
              } else {
                return {
                  ...prev,
                  url,
                  size: `${sizeMB} MB`,
                  title: prev.title || item.title || item.originalName
                };
              }
            });
            setShowMediaPicker(false);
            setActiveMediaTargetId(null);
          }}
        />
      )}
    </div>
  );
}
