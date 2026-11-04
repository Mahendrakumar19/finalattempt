'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool, Highlighter, Type, Check, X, Undo, Redo, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Save, Download, RotateCcw, Award, Trash2,
  Maximize2, Minimize2, Palette, ShieldAlert, Sparkles, Sliders, Eraser
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';

export interface PDFAnnotationEditorProps {
  pdfUrl: string;
  studentName?: string;
  testTitle?: string;
  maxMarks?: number;
  initialMarks?: number;
  initialFeedback?: string;
  onSaveCheckedPdf: (fileBlob: Blob, marks?: number, feedback?: string) => Promise<void>;
  onClose: () => void;
}

type ToolMode = 'pen' | 'highlighter' | 'eraser' | 'text' | 'tick' | 'cross' | 'score_stamp';

interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

interface DrawingPath {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  size: number;
  points: StrokePoint[];
}

interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface StampAnnotation {
  id: string;
  type: 'tick' | 'cross' | 'score_stamp';
  value?: string;
  x: number;
  y: number;
  color?: string;
}

interface PageAnnotations {
  paths: DrawingPath[];
  texts: TextAnnotation[];
  stamps: StampAnnotation[];
}

const PRESET_QUICK_REMARKS = [
  'Good Introduction 👍',
  'Add Map / Diagram 🗺️',
  'Structure Needs Improvement',
  'Well Addressed Demand of Question ⭐',
  'Include Factual / Statistical Data',
  'Conclusion is weak, make it forward-looking',
  'Irrelevant point ❌',
  'Underline Key Keywords ✍️'
];

const PRESET_SCORE_BADGES = ['+0.5', '+1.0', '+1.5', '+2.0', '+2.5', '+3.0', '+5.0', '-0.5', '-1.0'];

export default function PDFAnnotationEditor({
  pdfUrl,
  studentName,
  testTitle,
  maxMarks = 100,
  initialMarks,
  initialFeedback,
  onSaveCheckedPdf,
  onClose
}: PDFAnnotationEditorProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [penColor, setPenColor] = useState<string>('#dc2626'); // Standard Examiner Red
  const [penSize, setPenSize] = useState<number>(3);
  const [selectedScoreBadge, setSelectedScoreBadge] = useState<string>('+1.0');

  // Text comment popover state
  const [textInput, setTextInput] = useState<string>('');
  const [activeTextInputPos, setActiveTextInputPos] = useState<{ x: number; y: number } | null>(null);

  // Score & feedback state
  const [marks, setMarks] = useState<string>(initialMarks !== undefined && initialMarks !== null ? String(initialMarks) : '');
  const [feedback, setFeedback] = useState<string>(initialFeedback || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fullscreen toggle for tablets & small screens
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Annotation storage per page
  const [annotations, setAnnotations] = useState<Record<number, PageAnnotations>>({});
  const [undoHistory, setUndoHistory] = useState<Record<number, PageAnnotations[]>>({});
  const [redoHistory, setRedoHistory] = useState<Record<number, PageAnnotations[]>>({});

  // Canvas refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // PDF instance refs
  const pdfDocRef = useRef<any>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPathRef = useRef<DrawingPath | null>(null);

  // 1. Fetch & parse PDF with pdfjs-dist
  useEffect(() => {
    let active = true;

    async function loadPdf() {
      try {
        setLoadingPdf(true);
        setLoadError(null);

        // @ts-ignore
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '4.0.379'}/build/pdf.worker.min.mjs`;

        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to load PDF (${response.status}: ${response.statusText})`);
        }

        const buffer = await response.arrayBuffer();
        if (!active) return;
        pdfBytesRef.current = buffer.slice(0);

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        if (!active) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('Error loading PDF for annotation:', err);
        if (active) {
          setLoadError(err.message || 'Failed to load PDF document.');
        }
      } finally {
        if (active) {
          setLoadingPdf(false);
        }
      }
    }

    loadPdf();

    return () => {
      active = false;
    };
  }, [pdfUrl]);

  // 2. Render PDF Page on Base Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDocRef.current || !pdfCanvasRef.current || !drawCanvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const pdfCanvas = pdfCanvasRef.current;
      const pdfCtx = pdfCanvas.getContext('2d');
      if (!pdfCtx) return;

      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;

      const drawCanvas = drawCanvasRef.current;
      drawCanvas.width = viewport.width;
      drawCanvas.height = viewport.height;

      await page.render({
        canvasContext: pdfCtx,
        viewport: viewport
      }).promise;

      redrawAnnotations();
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // 3. Redraw Overlay Annotations with High-Performance Smooth Curves
  const redrawAnnotations = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageData = annotations[currentPage];
    if (!pageData) return;

    // A. Draw Paths (Pen & Highlighter with pressure/quadratic bezier)
    pageData.paths.forEach(p => {
      if (p.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (p.tool === 'highlighter') {
        ctx.globalAlpha = 0.38;
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.moveTo(p.points[0].x * canvas.width, p.points[0].y * canvas.height);
      for (let i = 1; i < p.points.length; i++) {
        const xc = (p.points[i - 1].x + p.points[i].x) / 2 * canvas.width;
        const yc = (p.points[i - 1].y + p.points[i].y) / 2 * canvas.height;
        ctx.quadraticCurveTo(
          p.points[i - 1].x * canvas.width,
          p.points[i - 1].y * canvas.height,
          xc,
          yc
        );
      }
      ctx.lineTo(
        p.points[p.points.length - 1].x * canvas.width,
        p.points[p.points.length - 1].y * canvas.height
      );
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // B. Draw Stamps (Tick, Cross, Score Badges)
    pageData.stamps.forEach(s => {
      const cx = s.x * canvas.width;
      const cy = s.y * canvas.height;

      if (s.type === 'tick') {
        ctx.strokeStyle = '#16a34a'; // Vibrant Examiner Green
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy);
        ctx.lineTo(cx - 4, cy + 12);
        ctx.lineTo(cx + 18, cy - 12);
        ctx.stroke();
      } else if (s.type === 'cross') {
        ctx.strokeStyle = '#dc2626'; // Vibrant Examiner Red
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 12);
        ctx.lineTo(cx + 12, cy + 12);
        ctx.moveTo(cx + 12, cy - 12);
        ctx.lineTo(cx - 12, cy + 12);
        ctx.stroke();
      } else if (s.type === 'score_stamp' && s.value) {
        // Render score badge (e.g. [+2.5], [+1.0])
        const badgeText = s.value;
        ctx.font = 'bold 15px sans-serif';
        const txtWidth = ctx.measureText(badgeText).width;
        const padX = 8;
        const padY = 5;

        ctx.fillStyle = s.value.startsWith('-') ? '#dc2626' : '#16a34a';
        ctx.beginPath();
        ctx.roundRect(cx - (txtWidth / 2) - padX, cy - 12 - padY, txtWidth + (padX * 2), 24 + padY, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, cx, cy);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    });

    // C. Draw Text Annotations
    pageData.texts.forEach(t => {
      ctx.font = `bold ${t.fontSize || 14}px sans-serif`;
      ctx.fillStyle = t.color || '#dc2626';

      // Subtle bubble background for readability
      const textMetrics = ctx.measureText(t.text);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = t.color || '#dc2626';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(t.x * canvas.width - 4, t.y * canvas.height - 15, textMetrics.width + 8, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = t.color || '#dc2626';
      ctx.fillText(t.text, t.x * canvas.width, t.y * canvas.height);
    });
  }, [annotations, currentPage]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // History Recording for Undo / Redo
  const recordHistory = () => {
    const cur = annotations[currentPage] || { paths: [], texts: [], stamps: [] };
    setUndoHistory(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), JSON.parse(JSON.stringify(cur))]
    }));
    // Clear redo stack on new action
    setRedoHistory(prev => ({
      ...prev,
      [currentPage]: []
    }));
  };

  const handleUndo = () => {
    const stack = undoHistory[currentPage];
    if (!stack || stack.length === 0) return;

    const previousState = stack[stack.length - 1];
    const currentState = annotations[currentPage] || { paths: [], texts: [], stamps: [] };

    setUndoHistory(prev => ({
      ...prev,
      [currentPage]: prev[currentPage].slice(0, -1)
    }));

    setRedoHistory(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), JSON.parse(JSON.stringify(currentState))]
    }));

    setAnnotations(prev => ({
      ...prev,
      [currentPage]: previousState
    }));
  };

  const handleRedo = () => {
    const stack = redoHistory[currentPage];
    if (!stack || stack.length === 0) return;

    const nextState = stack[stack.length - 1];
    const currentState = annotations[currentPage] || { paths: [], texts: [], stamps: [] };

    setRedoHistory(prev => ({
      ...prev,
      [currentPage]: prev[currentPage].slice(0, -1)
    }));

    setUndoHistory(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), JSON.parse(JSON.stringify(currentState))]
    }));

    setAnnotations(prev => ({
      ...prev,
      [currentPage]: nextState
    }));
  };

  const handleClearPage = () => {
    if (confirm('Clear all markings on this page?')) {
      recordHistory();
      setAnnotations(prev => ({
        ...prev,
        [currentPage]: { paths: [], texts: [], stamps: [] }
      }));
    }
  };

  // Coordinates helper supporting Mouse & Stylus/Touch Event
  const getCanvasNormalizedCoords = (clientX: number, clientY: number) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  // Pointer Event Handlers (Full Stylus/Apple Pencil/S-Pen & Finger Touch support)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = getCanvasNormalizedCoords(e.clientX, e.clientY);

    if (tool === 'text') {
      setActiveTextInputPos(pos);
      return;
    }

    if (tool === 'tick' || tool === 'cross' || tool === 'score_stamp') {
      recordHistory();
      setAnnotations(prev => {
        const pageAnn = prev[currentPage] || { paths: [], texts: [], stamps: [] };
        return {
          ...prev,
          [currentPage]: {
            ...pageAnn,
            stamps: [
              ...pageAnn.stamps,
              {
                id: `stamp-${Date.now()}-${Math.random()}`,
                type: tool,
                value: tool === 'score_stamp' ? selectedScoreBadge : undefined,
                x: pos.x,
                y: pos.y
              }
            ]
          }
        };
      });
      return;
    }

    if (tool === 'eraser') {
      recordHistory();
      setAnnotations(prev => {
        const pageAnn = prev[currentPage] || { paths: [], texts: [], stamps: [] };
        const threshold = 0.03;
        const remainingPaths = pageAnn.paths.filter(p => !p.points.some(pt => Math.hypot(pt.x - pos.x, pt.y - pos.y) < threshold));
        const remainingStamps = pageAnn.stamps.filter(s => Math.hypot(s.x - pos.x, s.y - pos.y) >= threshold);
        const remainingTexts = pageAnn.texts.filter(t => Math.hypot(t.x - pos.x, t.y - pos.y) >= threshold);
        return {
          ...prev,
          [currentPage]: {
            paths: remainingPaths,
            stamps: remainingStamps,
            texts: remainingTexts
          }
        };
      });
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      isDrawingRef.current = true;
      recordHistory();

      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
      const effectiveSize = tool === 'highlighter' ? 16 : penSize * (0.8 + pressure * 0.4);

      currentPathRef.current = {
        id: `path-${Date.now()}`,
        tool,
        color: tool === 'highlighter' ? '#fde047' : penColor,
        size: effectiveSize,
        points: [{ x: pos.x, y: pos.y, pressure }]
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentPathRef.current) return;
    const pos = getCanvasNormalizedCoords(e.clientX, e.clientY);
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;

    currentPathRef.current.points.push({ x: pos.x, y: pos.y, pressure });

    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = currentPathRef.current;
    const pts = p.points;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (p.tool === 'highlighter') ctx.globalAlpha = 0.38;

      const xc = (pts[pts.length - 2].x + pts[pts.length - 1].x) / 2 * canvas.width;
      const yc = (pts[pts.length - 2].y + pts[pts.length - 1].y) / 2 * canvas.height;
      ctx.quadraticCurveTo(
        pts[pts.length - 2].x * canvas.width,
        pts[pts.length - 2].y * canvas.height,
        xc,
        yc
      );
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!isDrawingRef.current || !currentPathRef.current) return;
    isDrawingRef.current = false;
    const completedPath = currentPathRef.current;
    currentPathRef.current = null;

    setAnnotations(prev => {
      const pageAnn = prev[currentPage] || { paths: [], texts: [], stamps: [] };
      return {
        ...prev,
        [currentPage]: {
          ...pageAnn,
          paths: [...pageAnn.paths, completedPath]
        }
      };
    });
  };

  const handleAddTextAnnotation = (customText?: string) => {
    const val = (customText || textInput).trim();
    if (!activeTextInputPos || !val) {
      setActiveTextInputPos(null);
      setTextInput('');
      return;
    }

    recordHistory();
    setAnnotations(prev => {
      const pageAnn = prev[currentPage] || { paths: [], texts: [], stamps: [] };
      return {
        ...prev,
        [currentPage]: {
          ...pageAnn,
          texts: [
            ...pageAnn.texts,
            {
              id: `text-${Date.now()}`,
              x: activeTextInputPos.x,
              y: activeTextInputPos.y,
              text: val,
              color: penColor,
              fontSize: 14
            }
          ]
        }
      };
    });

    setTextInput('');
    setActiveTextInputPos(null);
  };

  // PDF-Lib Vector Burn & Revert to Student
  const handleSaveAndExport = async () => {
    if (!pdfBytesRef.current) {
      alert('Original PDF data not loaded.');
      return;
    }

    setIsSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
      const pages = pdfDoc.getPages();

      for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
        const pageAnn = annotations[pageNum];
        if (!pageAnn) continue;

        const page = pages[pageNum - 1];
        const { width, height } = page.getSize();

        // 1. Draw Paths (Pen & Highlighter)
        for (const p of pageAnn.paths) {
          if (p.points.length < 2) continue;

          const r = parseInt(p.color.slice(1, 3), 16) / 255;
          const g = parseInt(p.color.slice(3, 5), 16) / 255;
          const b = parseInt(p.color.slice(5, 7), 16) / 255;
          const opacity = p.tool === 'highlighter' ? 0.38 : 1.0;

          for (let i = 1; i < p.points.length; i++) {
            const startX = p.points[i - 1].x * width;
            const startY = height - (p.points[i - 1].y * height);
            const endX = p.points[i].x * width;
            const endY = height - (p.points[i].y * height);

            page.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              thickness: p.size,
              color: rgb(r, g, b),
              opacity
            });
          }
        }

        // 2. Draw Stamps (Ticks, Crosses, Score Pills)
        for (const s of pageAnn.stamps) {
          const cx = s.x * width;
          const cy = height - (s.y * height);

          if (s.type === 'tick') {
            page.drawLine({
              start: { x: cx - 12, y: cy },
              end: { x: cx - 3, y: cy - 10 },
              thickness: 3.5,
              color: rgb(0.08, 0.64, 0.29)
            });
            page.drawLine({
              start: { x: cx - 3, y: cy - 10 },
              end: { x: cx + 16, y: cy + 12 },
              thickness: 3.5,
              color: rgb(0.08, 0.64, 0.29)
            });
          } else if (s.type === 'cross') {
            page.drawLine({
              start: { x: cx - 10, y: cy - 10 },
              end: { x: cx + 10, y: cy + 10 },
              thickness: 3.5,
              color: rgb(0.86, 0.15, 0.15)
            });
            page.drawLine({
              start: { x: cx + 10, y: cy - 10 },
              end: { x: cx - 10, y: cy + 10 },
              thickness: 3.5,
              color: rgb(0.86, 0.15, 0.15)
            });
          } else if (s.type === 'score_stamp' && s.value) {
            const isNegative = s.value.startsWith('-');
            const badgeColor = isNegative ? rgb(0.86, 0.15, 0.15) : rgb(0.08, 0.64, 0.29);

            page.drawRectangle({
              x: cx - 24,
              y: cy - 10,
              width: 48,
              height: 20,
              color: badgeColor,
              opacity: 0.95
            });

            page.drawText(s.value, {
              x: cx - 16,
              y: cy - 4,
              size: 12,
              color: rgb(1, 1, 1)
            });
          }
        }

        // 3. Draw Text Comments (Sanitize non-ascii/emojis to avoid PDF font encoding errors)
        for (const t of pageAnn.texts) {
          const tx = t.x * width;
          const ty = height - (t.y * height);

          const r = parseInt(t.color.slice(1, 3), 16) / 255;
          const g = parseInt(t.color.slice(3, 5), 16) / 255;
          const b = parseInt(t.color.slice(5, 7), 16) / 255;

          // Strip characters outside basic printable ASCII (e.g. emojis) for standard PDF Type1 fonts
          const cleanText = t.text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
          if (cleanText) {
            page.drawText(cleanText, {
              x: tx,
              y: ty,
              size: t.fontSize || 12,
              color: rgb(r, g, b)
            });
          }
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      const numMarks = marks.trim() !== '' ? Number(marks) : undefined;
      await onSaveCheckedPdf(blob, numMarks, feedback);
    } catch (err: any) {
      console.error('Error saving checked PDF:', err);
      alert('Failed to burn annotations into PDF: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col ${isFullscreen ? 'h-screen w-screen' : 'h-screen'} text-slate-100 font-body select-none touch-none`}>
      {/* ── TOP ACTION BAR (TABLET & DESKTOP RESPONSIVE) ────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Exit Evaluator"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="hidden sm:block">
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
              Canvas Mains Evaluation Studio
            </span>
            <h3 className="text-xs font-bold text-white truncate max-w-[200px] md:max-w-xs">
              {testTitle || 'Mains Copy'} {studentName ? `(${studentName})` : ''}
            </h3>
          </div>
        </div>

        {/* ── CORE CANVAS TOOLBAR (STYLUS / TABLET OPTIMIZED) ────────────────── */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 shadow-md">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              tool === 'pen' ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
            title="Pen (Stylus / Mouse)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Pen</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              tool === 'highlighter' ? 'bg-amber-400 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:text-white'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Highlight</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('tick')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              tool === 'tick' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
            title="Tick Stamp (Correct)"
          >
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">Tick</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('cross')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              tool === 'cross' ? 'bg-rose-700 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
            title="Cross Stamp (Incorrect)"
          >
            <X className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden md:inline">Cross</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('score_stamp')}
            className={`px-2 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              tool === 'score_stamp' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
            title="Score Stamp Pill"
          >
            <Award className="w-3.5 h-3.5 text-indigo-300" />
            <span className="font-mono text-[11px]">{selectedScoreBadge}</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('text')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              tool === 'text' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
            title="Text Marginal Note"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Comment</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-xl flex items-center text-xs font-bold transition-all cursor-pointer ${
              tool === 'eraser' ? 'bg-slate-200 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
            title="Eraser (Tap annotation to remove)"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Color Presets */}
          <div className="flex items-center gap-1 px-1">
            {['#dc2626', '#1e3a8a', '#16a34a', '#d97706'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setPenColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full border-2 transition-transform cursor-pointer ${
                  penColor === c ? 'scale-125 border-white shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!undoHistory[currentPage] || undoHistory[currentPage].length === 0}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!redoHistory[currentPage] || redoHistory[currentPage].length === 0}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── RIGHT CONTROLS (PAGING, ZOOM, FULLSCREEN) ─────────────────────── */}
        <div className="flex items-center gap-1.5">
          {/* Paging */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.6, s - 0.15))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-200">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sidebar Toggle for Tablet Drawing Room */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            title="Toggle Marks Panel (Expand Canvas)"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── QUICK STAMP SELECTOR BAR (WHEN SCORE STAMP IS ACTIVE) ───────────── */}
      {tool === 'score_stamp' && (
        <div className="bg-slate-900/90 border-b border-indigo-500/30 px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider shrink-0">
            Tap on page to stamp score:
          </span>
          <div className="flex items-center gap-1.5">
            {PRESET_SCORE_BADGES.map(badge => (
              <button
                key={badge}
                type="button"
                onClick={() => setSelectedScoreBadge(badge)}
                className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                  selectedScoreBadge === badge
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── WORKSPACE: CANVAS + EVALUATION SIDEBAR ────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Scrollable Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex justify-center items-start select-none relative"
        >
          {loadingPdf ? (
            <div className="m-auto text-center space-y-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading student answer sheet...</p>
            </div>
          ) : loadError ? (
            <div className="m-auto text-center space-y-3 max-w-md p-6 bg-red-950/40 border border-red-800 rounded-2xl">
              <p className="text-red-400 text-sm font-bold">{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
              {/* PDF Background Canvas */}
              <canvas ref={pdfCanvasRef} className="block" />

              {/* High-Precision Interactive Drawing Canvas */}
              <canvas
                ref={drawCanvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'none' }}
                className={`absolute inset-0 z-10 ${
                  tool === 'pen' || tool === 'highlighter' ? 'cursor-crosshair' :
                  tool === 'text' ? 'cursor-text' :
                  tool === 'eraser' ? 'cursor-pointer' :
                  'cursor-pointer'
                }`}
              />

              {/* Floating Quick Remarks / Text Annotations Popover */}
              {activeTextInputPos && (
                <div
                  className="absolute z-20 p-3 bg-slate-900 border border-amber-500/70 rounded-2xl shadow-2xl space-y-2 w-72"
                  style={{
                    left: `${Math.min(0.7, activeTextInputPos.x) * 100}%`,
                    top: `${Math.min(0.8, activeTextInputPos.y) * 100}%`
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Examiner Comment</span>
                    <button
                      type="button"
                      onClick={() => setActiveTextInputPos(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type custom remark..."
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddTextAnnotation();
                        if (e.key === 'Escape') setActiveTextInputPos(null);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTextAnnotation()}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* 1-Tap Quick Examiner Tags */}
                  <div className="pt-1 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">Quick UPSC Tags:</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {PRESET_QUICK_REMARKS.map((remark, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddTextAnnotation(remark)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 rounded-md text-left transition-colors cursor-pointer"
                        >
                          {remark}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── EVALUATION SIDEBAR (COLLAPSIBLE FOR MAXIMUM TABLET CANVAS SPACE) ── */}
        {!isSidebarCollapsed && (
          <div className="w-72 sm:w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between shrink-0 space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block">
                    Mains Scorecard
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">Evaluation & Feedback</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  title="Collapse Sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Marks Allocation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Awarded Marks</span>
                  <span className="text-[10px] text-slate-400 font-mono">Max: {maxMarks}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    step="0.5"
                    placeholder={`0 - ${maxMarks}`}
                    value={marks}
                    onChange={e => setMarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-base font-black text-amber-400 outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    / {maxMarks}
                  </span>
                </div>
              </div>

              {/* Detailed Feedback */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Detailed Remarks & Suggestions
                </label>
                <textarea
                  rows={5}
                  placeholder="Feedback on introduction, answer framing, factual accuracy, diagrams, and marks deduction details..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-500 leading-relaxed font-medium resize-none"
                />
              </div>

              {/* Tablet / Pen Usage Guidance */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tablet & Stylus Ready</span>
                </div>
                <p className="leading-relaxed">
                  Apple Pencil, Samsung S-Pen, and touch screens are fully supported. Use Red Pen to annotate and Score Stamps for instant marks.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                disabled={isSaving || loadingPdf}
                onClick={handleSaveAndExport}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Burning & Uploading...' : 'Save & Revert Checked PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearPage}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Markings on Page {currentPage}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
