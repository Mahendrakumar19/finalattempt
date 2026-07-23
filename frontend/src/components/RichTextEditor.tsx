'use client';

import { useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link as LinkIcon, Sparkles, Paintbrush,
  Table, Image as ImageIcon, Box, CheckCircle
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && isFirstLoad.current && value) {
      editorRef.current.innerHTML = value;
      isFirstLoad.current = false;
    }
  }, [value]);

  // If the value gets cleared, empty the editor
  useEffect(() => {
    if (editorRef.current && !value) {
      editorRef.current.innerHTML = '';
      isFirstLoad.current = true;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, val: string = '') => {
    document.execCommand(command, false, val);
    handleInput();
  };

  const clearFormatting = () => {
    if (editorRef.current) {
      // Extract plain text content to strip all HTML tags, spans, styles, and containers while keeping text
      const plainText = editorRef.current.innerText || editorRef.current.textContent || '';
      editorRef.current.innerHTML = plainText ? `<p>${plainText.replace(/\n/g, '<br/>')}</p>` : '';
      onChange(editorRef.current.innerHTML);
    }
  };

  const clearAllContent = () => {
    if (window.confirm('Are you sure you want to clear all text and content from the editor?')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        onChange('');
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g., https://example.com):');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter Image URL (e.g., https://... or /uploads/images/...):');
    if (url) {
      execCmd('insertImage', url);
    }
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (!rows || !cols) return;

    const numRows = parseInt(rows, 10) || 3;
    const numCols = parseInt(cols, 10) || 3;

    let tableHtml = '<table className="editor-table" style="width:100%; border-collapse:collapse; margin:1rem 0; border:1px solid #e2e8f0;"><thead><tr style="background:#f8fafc;">';
    for (let c = 1; c <= numCols; c++) {
      tableHtml += `<th style="border:1px solid #cbd5e1; padding:8px; text-align:left; font-weight:bold; font-size:12px;">Header ${c}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 1; r <= numRows - 1; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= numCols; c++) {
        tableHtml += `<td style="border:1px solid #e2e8f0; padding:8px; font-size:12px;">Cell ${r}-${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += 'tbody></table><p></p>';

    execCmd('insertHTML', tableHtml);
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
    { name: 'Rose Red', value: '#f43f5e' }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/50 p-2">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('italic')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('underline')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => execCmd('formatBlock', 'H1')}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-xs font-black border border-slate-200 bg-white"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', 'H2')}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-xs font-black border border-slate-200 bg-white"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', 'H3')}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-xs font-black border border-slate-200 bg-white"
          title="Heading 3"
        >
          H3
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => execCmd('insertUnorderedList')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('insertOrderedList')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={insertLink}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Insert Image"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={insertTable}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Insert Table"
        >
          <Table className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        {/* Vision IAS Style Container Component Insertion Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertCalloutBox('summary')}
            className="px-2 py-1 bg-slate-900 text-amber-400 font-extrabold text-[10px] rounded hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700 shadow-2xs"
            title="Insert Vision IAS style Summary Container"
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

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={clearFormatting}
          className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
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
          Clear All Text
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        {/* Font Family Selector */}
        <div className="flex items-center gap-1 rounded bg-white border border-slate-200 px-2 py-0.5">
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
        <div className="flex items-center gap-1 rounded bg-white border border-slate-200 px-2 py-0.5">
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
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[220px] max-h-[350px] overflow-y-auto bg-white p-4 outline-none text-slate-800 text-xs leading-relaxed prose max-w-none focus:outline-none"
        style={{ minHeight: '220px' }}
      />
    </div>
  );
}
