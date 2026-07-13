'use client';

import { useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link as LinkIcon, Sparkles, Paintbrush 
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

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g., https://example.com):');
    if (url) {
      execCmd('createLink', url);
    }
  };

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
          onClick={() => execCmd('formatBlock', '<h1>')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-xs font-bold"
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h2>')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-xs font-bold"
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execCmd('formatBlock', '<h3>')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-xs font-bold"
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
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
          onClick={() => execCmd('formatBlock', '<blockquote>')}
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
          onClick={() => execCmd('removeFormat')}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Clear Formatting"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        {/* Text Color Picker */}
        <div className="flex items-center gap-1 rounded bg-white border border-slate-100 px-1.5 py-0.5">
          <Paintbrush className="h-3 w-3 text-slate-400" />
          <select
            onChange={(e) => execCmd('foreColor', e.target.value)}
            className="bg-transparent text-[10px] text-slate-550 outline-none cursor-pointer border-none font-bold"
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
