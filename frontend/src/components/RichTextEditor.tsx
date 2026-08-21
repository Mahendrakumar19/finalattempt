'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Sparkles, Paintbrush,
  Table, Image as ImageIcon, Box, CheckCircle, Maximize2, Minimize2, X, Scaling,
  FileText, Paperclip, FolderOpen, AlignLeft, AlignCenter, AlignRight, Layout, Move, Eye, ChevronDown
} from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
}

export default function RichTextEditor({ value, onChange, label = 'Rich Text Editor' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const modalEditorRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTableWidth, setSelectedTableWidth] = useState('100%');

  // Selected element for text-wrapping operations
  const [selectedImageNode, setSelectedImageNode] = useState<HTMLElement | null>(null);
  const [showWrapTextMenu, setShowWrapTextMenu] = useState(false);

  // Pending image placement modal state
  const [pendingImage, setPendingImage] = useState<{ url: string; title: string } | null>(null);

  // Media Asset Picker Modal state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'IMAGE' | 'DOCUMENT'>('IMAGE');

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && isFirstLoad.current && value) {
      editorRef.current.innerHTML = value;
      isFirstLoad.current = false;
    }
  }, [value]);

  // Synchronize modal editor with current content when opening popup
  useEffect(() => {
    if (isFullscreen && modalEditorRef.current) {
      modalEditorRef.current.innerHTML = editorRef.current ? editorRef.current.innerHTML : value;
    }
  }, [isFullscreen]);

  // If the value gets cleared, empty the editor
  useEffect(() => {
    if (editorRef.current && !value) {
      editorRef.current.innerHTML = '';
      isFirstLoad.current = true;
    }
  }, [value]);

  const handleInput = () => {
    const targetRef = isFullscreen ? modalEditorRef : editorRef;
    if (targetRef.current) {
      const html = targetRef.current.innerHTML;
      onChange(html);
      // Sync content between inline & modal editor
      if (isFullscreen && editorRef.current) {
        editorRef.current.innerHTML = html;
      }
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.nodeName === 'IMG') {
      setSelectedImageNode(target);
    } else if (target.closest('.image-wrap-container')) {
      setSelectedImageNode(target.closest('.image-wrap-container') as HTMLElement);
    } else if (target.closest('img')) {
      setSelectedImageNode(target.closest('img') as HTMLElement);
    } else {
      setSelectedImageNode(null);
    }
  };

  const execCmd = (command: string, val: string = '') => {
    document.execCommand(command, false, val);
    handleInput();
  };

  const clearFormatting = () => {
    const targetRef = isFullscreen ? modalEditorRef : editorRef;
    if (targetRef.current) {
      const plainText = targetRef.current.innerText || targetRef.current.textContent || '';
      targetRef.current.innerHTML = plainText ? `<p>${plainText.replace(/\n/g, '<br/>')}</p>` : '';
      handleInput();
    }
  };

  const clearAllContent = () => {
    if (window.confirm('Are you sure you want to clear all text and content from the editor?')) {
      const targetRef = isFullscreen ? modalEditorRef : editorRef;
      if (targetRef.current) {
        targetRef.current.innerHTML = '';
        handleInput();
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g., https://example.com):');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const openImagePicker = () => {
    setMediaPickerMode('IMAGE');
    setShowMediaPicker(true);
  };

  const openDocumentPicker = () => {
    setMediaPickerMode('DOCUMENT');
    setShowMediaPicker(true);
  };

  const handleMediaSelect = (fileUrl: string, item: any) => {
    setShowMediaPicker(false);
    if (mediaPickerMode === 'IMAGE') {
      // Open visual text wrap placement modal
      setPendingImage({ url: fileUrl, title: item.title || item.originalName || 'Image' });
    } else {
      // Document / PDF / Attachment card
      const docName = item.originalName || item.title || 'Download Document';
      const fileSize = (item.size / 1024).toFixed(1);
      const ext = (item.extension || 'FILE').toUpperCase();
      const docHtml = `
        <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:14px; padding:12px 16px; margin:1rem 0; display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="background:#0f172a; color:#f59e0b; padding:8px; border-radius:10px; font-weight:900; font-size:11px;">📄 ${ext}</div>
            <div>
              <div style="font-weight:800; font-size:13px; color:#0f172a;">${docName}</div>
              <div style="font-size:11px; color:#64748b;">${ext} File · ${fileSize} KB</div>
            </div>
          </div>
          <a href="${fileUrl}" target="_blank" download style="background:#f59e0b; color:#0f172a; font-weight:800; font-size:11px; text-decoration:none; padding:8px 14px; border-radius:10px; display:inline-block;">📥 Download Document</a>
        </div><p></p>
      `;
      execCmd('insertHTML', docHtml);
    }
  };

  const insertImageWithWrap = (wrapMode: string) => {
    if (!pendingImage) return;
    const { url, title } = pendingImage;
    setPendingImage(null);

    let wrapperStyle = 'margin:1.5rem auto; text-align:center; display:block; max-width:85%; clear:both;';
    let imgStyle = 'max-width:100%; height:auto; border-radius:12px; border:1px solid #cbd5e1; box-shadow:0 4px 12px rgba(0,0,0,0.06);';

    switch (wrapMode) {
      case 'SQUARE_RIGHT':
        wrapperStyle = 'margin:0.5rem 0 1rem 1.5rem; float:right; max-width:48%; display:inline-block; clear:none;';
        break;
      case 'SQUARE_LEFT':
        wrapperStyle = 'margin:0.5rem 1.5rem 1rem 0; float:left; max-width:48%; display:inline-block; clear:none;';
        break;
      case 'INLINE':
        wrapperStyle = 'margin:0.5rem; float:none; display:inline-block; vertical-align:middle; max-width:100%; clear:none;';
        break;
      case 'TOP_BOTTOM':
        wrapperStyle = 'margin:1.5rem auto; float:none; clear:both; display:block; text-align:center; max-width:85%;';
        break;
      case 'FULL_WIDTH':
        wrapperStyle = 'margin:1.5rem 0; float:none; clear:both; width:100%; display:block; text-align:center;';
        imgStyle += ' width:100%; object-fit:cover;';
        break;
      case 'BEHIND_TEXT':
        wrapperStyle = 'margin:0.5rem 0 1rem 1.5rem; float:right; max-width:48%; position:relative; z-index:0; opacity:0.55;';
        break;
      case 'IN_FRONT':
        wrapperStyle = 'margin:0.5rem 0 1rem 1.5rem; float:right; max-width:48%; position:relative; z-index:10;';
        break;
      default:
        wrapperStyle = 'margin:0.5rem 0 1rem 1.5rem; float:right; max-width:48%; display:inline-block;';
    }

    const captionHtml = title ? `<p style="font-size:11px; color:#64748b; margin-top:6px; font-weight:600; text-align:center;">${title}</p>` : '';
    const imgHtml = `<div class="image-wrap-container" style="${wrapperStyle}"><img src="${url}" alt="${title}" style="${imgStyle}" />${captionHtml}</div><p style="clear:none;"></p>`;
    execCmd('insertHTML', imgHtml);
  };

  const applyWrapStyle = (wrapMode: string) => {
    setShowWrapTextMenu(false);
    const targetRef = isFullscreen ? modalEditorRef : editorRef;
    if (!targetRef.current) return;

    let targetNode: HTMLElement | null = selectedImageNode;

    if (!targetNode) {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let node: Node | null = sel.anchorNode;
        while (node && node !== targetRef.current) {
          if (node.nodeName === 'IMG') {
            targetNode = node as HTMLElement;
            break;
          }
          if (node.nodeType === 1 && (node as HTMLElement).classList?.contains('image-wrap-container')) {
            targetNode = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }
      }
    }

    if (!targetNode) {
      const imgs = targetRef.current.querySelectorAll('img');
      if (imgs.length === 1) {
        targetNode = imgs[0];
      }
    }

    if (!targetNode) {
      alert('Please click on an image inside the editor first to apply text wrapping options.');
      return;
    }

    let wrapper: HTMLElement;
    if (targetNode.classList.contains('image-wrap-container')) {
      wrapper = targetNode;
    } else if (targetNode.parentNode && (targetNode.parentNode as HTMLElement).classList?.contains('image-wrap-container')) {
      wrapper = targetNode.parentNode as HTMLElement;
    } else {
      const parent = targetNode.parentNode;
      wrapper = document.createElement('div');
      wrapper.className = 'image-wrap-container';
      if (parent) {
        parent.insertBefore(wrapper, targetNode);
        wrapper.appendChild(targetNode);
      }
    }

    const imgEl = wrapper.querySelector('img') || (targetNode.nodeName === 'IMG' ? targetNode : null);

    if (imgEl) {
      (imgEl as HTMLElement).style.maxWidth = '100%';
      (imgEl as HTMLElement).style.height = 'auto';
      (imgEl as HTMLElement).style.borderRadius = '12px';
      (imgEl as HTMLElement).style.border = '1px solid #cbd5e1';
      (imgEl as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
    }

    switch (wrapMode) {
      case 'SQUARE_RIGHT':
        wrapper.style.cssText = 'margin: 0.5rem 0 1rem 1.5rem; float: right; max-width: 48%; display: inline-block; clear: none;';
        break;
      case 'SQUARE_LEFT':
        wrapper.style.cssText = 'margin: 0.5rem 1.5rem 1rem 0; float: left; max-width: 48%; display: inline-block; clear: none;';
        break;
      case 'INLINE':
        wrapper.style.cssText = 'margin: 0.5rem; float: none; display: inline-block; vertical-align: middle; max-width: 100%; clear: none;';
        break;
      case 'TOP_BOTTOM':
        wrapper.style.cssText = 'margin: 1.5rem auto; float: none; clear: both; display: block; text-align: center; max-width: 85%;';
        break;
      case 'FULL_WIDTH':
        wrapper.style.cssText = 'margin: 1.5rem 0; float: none; clear: both; width: 100%; display: block; text-align: center;';
        if (imgEl) (imgEl as HTMLElement).style.width = '100%';
        break;
      case 'BEHIND_TEXT':
        wrapper.style.cssText = 'margin: 0.5rem 0 1rem 1.5rem; float: right; max-width: 48%; position: relative; z-index: 0; opacity: 0.55;';
        break;
      case 'IN_FRONT':
        wrapper.style.cssText = 'margin: 0.5rem 0 1rem 1.5rem; float: right; max-width: 48%; position: relative; z-index: 10;';
        break;
      default:
        wrapper.style.cssText = 'margin: 0.5rem 0 1rem 1.5rem; float: right; max-width: 48%; display: inline-block;';
    }

    handleInput();
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    const tableWidth = prompt('Table Width (e.g. 100%, 80%, 600px):', '100%');
    if (!rows || !cols) return;

    const numRows = parseInt(rows, 10) || 3;
    const numCols = parseInt(cols, 10) || 3;
    const widthStyle = tableWidth || '100%';

    let tableHtml = `<div style="overflow-x:auto; margin:1rem 0;"><table style="width:${widthStyle}; border-collapse:collapse; margin:0 auto; border:1.5px solid #cbd5e1;" resize="both"><thead><tr style="background:#f1f5f9;">`;
    for (let c = 1; c <= numCols; c++) {
      tableHtml += `<th style="border:1px solid #cbd5e1; padding:10px; text-align:left; font-weight:bold; font-size:12px; resize:horizontal; overflow:auto;">Header ${c}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 1; r <= numRows - 1; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= numCols; c++) {
        tableHtml += `<td style="border:1px solid #e2e8f0; padding:10px; font-size:12px; resize:horizontal; overflow:auto;">Cell ${r}-${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div><p></p>';

    execCmd('insertHTML', tableHtml);
  };

  const setTableWidth = (width: string) => {
    setSelectedTableWidth(width);
    const targetRef = isFullscreen ? modalEditorRef : editorRef;
    if (!targetRef.current) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    let node: Node | null = sel.anchorNode;
    while (node && node !== targetRef.current) {
      if (node.nodeName === 'TABLE') {
        (node as HTMLElement).style.width = width;
        handleInput();
        return;
      }
      node = node.parentNode;
    }
    alert('Click inside a table cell first to resize that table.');
  };

  const insertCalloutBox = (type: 'summary' | 'key_feature' | 'info') => {
    let boxHtml = '';
    if (type === 'summary') {
      boxHtml = `
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 1.25rem; border-radius: 16px; margin: 1rem 0; border-left: 6px solid #f59e0b; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:900; font-size:13px; letter-spacing:0.05em; text-transform:uppercase; color:#f59e0b;">
            📌 Summary Overview
          </div>
          <p style="margin:0; font-size:13px; line-height:1.6; color:#f8fafc;">Write quick executive summary points here...</p>
        </div><p></p>
      `;
    } else if (type === 'key_feature') {
      boxHtml = `
        <div style="background: #fffbf2; border: 1.5px solid #fde68a; border-left: 5px solid #d97706; padding: 1.25rem; border-radius: 14px; margin: 1rem 0;">
          <div style="font-weight: 800; font-size: 13px; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            ⭐ Key Features & Policy Highlights
          </div>
          <ul style="margin:0; padding-left:1.25rem; font-size:13px; color:#334155;">
            <li>Highlight point 1...</li>
            <li>Highlight point 2...</li>
          </ul>
        </div><p></p>
      `;
    } else {
      boxHtml = `
        <div style="background: #f0f9ff; border: 1.5px solid #bae6fd; border-left: 5px solid #0284c7; padding: 1.25rem; border-radius: 14px; margin: 1rem 0;">
          <div style="font-weight: 800; font-size: 13px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            💡 Important Context / Exam Note
          </div>
          <p style="margin:0; font-size:13px; color:#0c4a6e;">Add context note for prelims/mains revision...</p>
        </div><p></p>
      `;
    }
    execCmd('insertHTML', boxHtml);
  };

  const fonts = [
    { name: 'Default Body (Inter)', value: 'var(--font-body), sans-serif' },
    { name: 'Heading (Plus Jakarta Sans)', value: 'var(--font-heading), sans-serif' },
    { name: 'Serif (Georgia)', value: 'Georgia, serif' },
    { name: 'Monospace (Code)', value: 'monospace' }
  ];

  const colors = [
    { name: 'Default', value: 'inherit' },
    { name: 'Primary Blue', value: '#3b82f6' },
    { name: 'Emerald Green', value: '#10b981' },
    { name: 'Violet Purple', value: '#8b5cf6' },
    { name: 'Amber Yellow', value: '#f59e0b' },
    { name: 'Rose Red', value: '#f43f5e' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Gray', value: '#808080' }
  ];

  const ToolbarControls = () => (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 p-2 text-slate-800 relative select-none">
      <button
        type="button"
        onClick={() => execCmd('bold')}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => execCmd('italic')}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => execCmd('underline')}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        title="Underline"
      >
        <Underline className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

      <button
        type="button"
        onClick={() => execCmd('formatBlock', 'H1')}
        className="rounded px-2 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer text-xs font-black border border-slate-300 bg-white"
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => execCmd('formatBlock', 'H2')}
        className="rounded px-2 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer text-xs font-black border border-slate-300 bg-white"
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => execCmd('formatBlock', 'H3')}
        className="rounded px-2 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer text-xs font-black border border-slate-300 bg-white"
        title="Heading 3"
      >
        H3
      </button>

      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

      <button
        type="button"
        onClick={() => execCmd('insertUnorderedList')}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => execCmd('insertOrderedList')}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

      <button
        type="button"
        onClick={insertLink}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        title="Insert Hyperlink"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={openImagePicker}
        className="rounded p-1.5 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px]"
        title="Insert Image from Media Library"
      >
        <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
        <span>+ Image</span>
      </button>

      {/* ── DYNAMIC WRAP TEXT DROPDOWN MENU ─────────────────────────────────── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowWrapTextMenu(!showWrapTextMenu)}
          className="rounded p-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1 font-extrabold text-[10px]"
          title="Wrap text around image (Square, In Line, Top/Bottom, Behind, In Front)"
        >
          <Layout className="h-3.5 w-3.5 text-indigo-600" />
          <span>Wrap Text</span>
          <ChevronDown className="h-3 w-3 text-indigo-500" />
        </button>

        {showWrapTextMenu && (
          <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
            <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/10">
              Wrap Text & Layout Options
            </div>

            <button
              type="button"
              onClick={() => applyWrapStyle('SQUARE_RIGHT')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>🔲 Square / Wrap Right (Float Right)</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapStyle('SQUARE_LEFT')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>🔳 Square / Wrap Left (Float Left)</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapStyle('INLINE')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>📄 In Line with Text</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapStyle('TOP_BOTTOM')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>⬆️⬇️ Top and Bottom (Center)</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapStyle('FULL_WIDTH')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>↔️ Full Width (100%)</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapStyle('BEHIND_TEXT')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>👻 Behind Text</span>
            </button>

            <button
              type="button"
              onClick={() => applyWrapStyle('IN_FRONT')}
              className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>🔝 In Front of Text</span>
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openDocumentPicker}
        className="rounded p-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px]"
        title="Attach Document / PDF Download Card"
      >
        <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
        <span>+ File/PDF</span>
      </button>
      <button
        type="button"
        onClick={insertTable}
        className="rounded p-1.5 text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px]"
        title="Insert Table"
      >
        <Table className="h-3.5 w-3.5 text-amber-600" />
        <span>+ Table</span>
      </button>

      {/* Table Width Resizer Selector */}
      <div className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px]">
        <Scaling className="h-3 w-3 text-amber-600" />
        <span className="font-bold text-amber-700 uppercase">Width:</span>
        <select
          onChange={(e) => setTableWidth(e.target.value)}
          className="bg-transparent text-[10px] text-amber-900 outline-none cursor-pointer border-none font-extrabold"
          title="Click inside a table to adjust width"
          defaultValue="100%"
        >
          <option value="100%">Full Width (100%)</option>
          <option value="90%">90% Width</option>
          <option value="80%">80% Width</option>
          <option value="70%">70% Width</option>
          <option value="50%">50% Half Width</option>
          <option value="600px">Fixed 600px</option>
          <option value="800px">Fixed 800px</option>
        </select>
      </div>

      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

      {/* Container Component Insertion Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => insertCalloutBox('summary')}
          className="px-2 py-1 bg-slate-900 text-amber-400 font-extrabold text-[10px] rounded hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700 shadow-2xs"
          title="Insert Summary Container"
        >
          + Summary Card
        </button>
        <button
          type="button"
          onClick={() => insertCalloutBox('key_feature')}
          className="px-2 py-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded hover:bg-amber-600 transition-colors cursor-pointer border border-amber-600 shadow-2xs"
          title="Insert Highlight Container"
        >
          + Key Features
        </button>
        <button
          type="button"
          onClick={() => insertCalloutBox('info')}
          className="px-2 py-1 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200 shadow-2xs"
          title="Insert Info Callout"
        >
          + Note Box
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

      <button
        type="button"
        onClick={clearFormatting}
        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
        title="Strip all styles and tags while keeping your text"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>Clear Styles</span>
      </button>

      <button
        type="button"
        onClick={clearAllContent}
        className="rounded px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer text-[10px] font-extrabold"
        title="Empty entire editor content"
      >
        Clear All
      </button>

      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

      {/* Font Family Selector */}
      <div className="flex items-center gap-1 rounded bg-white border border-slate-300 px-2 py-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Font:</span>
        <select
          onChange={(e) => execCmd('fontName', e.target.value)}
          className="bg-transparent text-[10px] text-slate-700 outline-none cursor-pointer border-none font-bold"
          title="Font Style"
          defaultValue="var(--font-body), sans-serif"
        >
          {fonts.map((f) => (
            <option key={f.value} value={f.value} className="text-slate-800 bg-white">
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Text Color Picker */}
      <div className="flex items-center gap-1 rounded bg-white border border-slate-300 px-2 py-0.5">
        <Paintbrush className="h-3 w-3 text-slate-400" />
        <select
          onChange={(e) => execCmd('foreColor', e.target.value)}
          className="bg-transparent text-[10px] text-slate-700 outline-none cursor-pointer border-none font-bold"
          title="Text Color"
          defaultValue="inherit"
        >
          {colors.map((c) => (
            <option key={c.value} value={c.value} className="text-slate-800 bg-white" style={{ color: c.value === 'inherit' ? 'currentColor' : c.value }}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase rounded-lg shadow-sm transition-all cursor-pointer"
          title="Expand editor to full-screen popup view"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit Popup</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full-Screen Popup Editor ↗</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Inline Compact View */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40">
        <ToolbarControls />
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
          className="min-h-[220px] max-h-[350px] overflow-y-auto bg-white p-4 outline-none text-slate-800 text-xs leading-relaxed prose max-w-none focus:outline-none [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-bold [&_td]:p-2.5 [&_td]:border [&_td]:border-slate-200 [&_tr:nth-child(even)]:bg-slate-50/50"
        />
      </div>

      {/* Full Screen Popup View Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-extrabold text-sm">✏️ Full-Screen Canvas</span>
                <h3 className="font-heading font-black text-slate-900 dark:text-white text-base">{label}</h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  Done / Save & Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Toolbar */}
            <ToolbarControls />

            {/* Expanded Editor Content Area */}
            <div className="flex-grow p-8 bg-slate-50/50 dark:bg-slate-950/30 overflow-y-auto">
              <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 min-h-[600px] shadow-sm">
                <div
                  ref={modalEditorRef}
                  contentEditable
                  onInput={handleInput}
                  onClick={handleEditorClick}
                  className="min-h-[550px] outline-none text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed prose dark:prose-invert max-w-none focus:outline-none [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_td]:p-3 [&_td]:border [&_td]:border-slate-200 [&_td]:dark:border-white/10 [&_tr:nth-child(even)]:bg-slate-50/50 [&_tr:nth-child(even)]:dark:bg-slate-800/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE WRAP TEXT PLACEMENT SELECTION MODAL ─────────────────────── */}
      {pendingImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-extrabold text-sm">🖼️ Image Text Wrap & Placement</span>
              </div>
              <button onClick={() => setPendingImage(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-white/5">
              <img src={pendingImage.url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-300 dark:border-white/10 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{pendingImage.title || 'Selected Image'}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Select how text should flow around this image:</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => insertImageWithWrap('SQUARE_RIGHT')}
                className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-left font-bold text-amber-700 dark:text-amber-400 space-y-1 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>🔲 Square (Wrap Right)</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Image floats right. Text flows around image on the left (recommended!).</p>
              </button>

              <button
                type="button"
                onClick={() => insertImageWithWrap('SQUARE_LEFT')}
                className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-left font-bold text-amber-700 dark:text-amber-400 space-y-1 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>🔳 Square (Wrap Left)</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Image floats left. Text flows around image on the right.</p>
              </button>

              <button
                type="button"
                onClick={() => insertImageWithWrap('TOP_BOTTOM')}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white space-y-1 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>⬆️⬇️ Top and Bottom</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Centered image. Breaks text into top and bottom blocks.</p>
              </button>

              <button
                type="button"
                onClick={() => insertImageWithWrap('FULL_WIDTH')}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white space-y-1 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>↔️ Full Width (100%)</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Spans full 100% container width.</p>
              </button>

              <button
                type="button"
                onClick={() => insertImageWithWrap('INLINE')}
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-white/10 rounded-2xl text-left font-bold text-slate-900 dark:text-white space-y-1 transition-all cursor-pointer sm:col-span-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>📄 In Line with Text</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Treat image as an inline text element.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Asset Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          allowedTypes={mediaPickerMode === 'IMAGE' ? ['IMAGE'] : ['PDF', 'DOCUMENT', 'ARCHIVE', 'ZIP']}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </>
  );
}

