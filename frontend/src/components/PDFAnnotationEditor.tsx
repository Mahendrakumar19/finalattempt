'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool, Highlighter, Type, Check, X, Undo, Redo, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Save, Award, Trash2,
  Eraser, PanelRightClose,
  Sparkles
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

interface PDFDocumentProxyLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => {
      promise: Promise<void>;
      cancel: () => void;
    };
  }>;
}

interface PDFRenderTaskLike {
  promise: Promise<void>;
  cancel: () => void;
}

const PRESET_QUICK_REMARKS = [
  'Good Introduction 👍',
  'Add Map / Flowchart 🗺️',
  'Structure Needs Improvement',
  'Well Addressed Demand ⭐',
  'Include Factual / Statistical Data',
  'Forward-looking Conclusion',
  'Irrelevant point ❌',
  'Underline Key Keywords ✍️'
];

const PRESET_SCORE_BADGES = ['+0.5', '+1.0', '+1.5', '+2.0', '+2.5', '+3.0', '+5.0', '-0.5', '-1.0'];

const PEN_COLORS = [
  { label: 'Red (Examiner)', hex: '#dc2626' },
  { label: 'Navy Blue', hex: '#1e3a8a' },
  { label: 'Emerald Green', hex: '#15803d' },
  { label: 'Charcoal', hex: '#1e293b' }
];

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
  const [scale, setScale] = useState<number>(1.25);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [penColor, setPenColor] = useState<string>('#dc2626');
  const [penSize] = useState<number>(3);
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

  // Responsive / Sidebar controls
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Annotation storage per page
  const [annotations, setAnnotations] = useState<Record<number, PageAnnotations>>({});
  const [undoHistory, setUndoHistory] = useState<Record<number, PageAnnotations[]>>({});
  const [redoHistory, setRedoHistory] = useState<Record<number, PageAnnotations[]>>({});

  // Canvas refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // PDF instance refs
  const pdfDocRef = useRef<PDFDocumentProxyLike | null>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPathRef = useRef<DrawingPath | null>(null);
  const renderTaskRef = useRef<PDFRenderTaskLike | null>(null);

  // 1. Fetch & parse PDF with pdfjs-dist
  useEffect(() => {
    let active = true;

    async function loadPdf() {
      try {
        setLoadingPdf(true);
        setLoadError(null);

        // @ts-expect-error - dynamic pdfjs module import
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        // Resolve target PDF URL handling relative backend paths and external domains
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        let resolvedTargetUrl = pdfUrl;
        if (pdfUrl.startsWith('/uploads/') || pdfUrl.startsWith('/api/')) {
          resolvedTargetUrl = `${backendBase}${pdfUrl}`;
        } else if (pdfUrl.includes('finalattemptias.com/sample_copy')) {
          resolvedTargetUrl = '/sample_copy_gs1.pdf';
        }

        let response: Response;
        try {
          response = await fetch(resolvedTargetUrl);
        } catch {
          response = await fetch('/sample_copy_gs1.pdf');
        }

        if (!response.ok) {
          throw new Error(`Failed to load PDF (${response.status}: ${response.statusText})`);
        }

        const buffer = await response.arrayBuffer();
        if (!active) return;
        pdfBytesRef.current = buffer.slice(0);

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
          cMapPacked: true
        });
        const pdf = (await loadingTask.promise) as PDFDocumentProxyLike;
        if (!active) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err: unknown) {
        console.error('Error loading PDF for annotation:', err);
        if (active) {
          const message = err instanceof Error ? err.message : 'Failed to load PDF document.';
          setLoadError(message);
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

  // 2. High-performance Rendering of Overlay Annotations
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
        ctx.globalAlpha = 0.35;
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
        ctx.strokeStyle = '#15803d'; // Examiner Green
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy);
        ctx.lineTo(cx - 4, cy + 12);
        ctx.lineTo(cx + 18, cy - 12);
        ctx.stroke();
      } else if (s.type === 'cross') {
        ctx.strokeStyle = '#dc2626'; // Examiner Red
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy - 12);
        ctx.lineTo(cx + 12, cy + 12);
        ctx.moveTo(cx + 12, cy - 12);
        ctx.lineTo(cx - 12, cy + 12);
        ctx.stroke();
      } else if (s.type === 'score_stamp' && s.value) {
        const badgeText = s.value;
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        const txtWidth = ctx.measureText(badgeText).width;
        const padX = 8;
        const padY = 5;

        ctx.fillStyle = s.value.startsWith('-') ? '#dc2626' : '#15803d';
        ctx.beginPath();
        ctx.roundRect(cx - (txtWidth / 2) - padX, cy - 12 - padY, txtWidth + (padX * 2), 24 + padY, 6);
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
      ctx.font = `bold ${t.fontSize || 13}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = t.color || '#dc2626';

      const textMetrics = ctx.measureText(t.text);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = t.color || '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(t.x * canvas.width - 6, t.y * canvas.height - 16, textMetrics.width + 12, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = t.color || '#dc2626';
      ctx.fillText(t.text, t.x * canvas.width, t.y * canvas.height);
    });
  }, [annotations, currentPage]);

  const renderPage = useCallback(async () => {
    if (!pdfDocRef.current || !pdfCanvasRef.current || !drawCanvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Task cancel safely ignored
      }
    }

    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const pdfCanvas = pdfCanvasRef.current;
      const pdfCtx = pdfCanvas.getContext('2d');
      if (!pdfCtx) return;

      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      pdfCanvas.style.width = `${viewport.width}px`;
      pdfCanvas.style.height = `${viewport.height}px`;

      const drawCanvas = drawCanvasRef.current;
      drawCanvas.width = viewport.width;
      drawCanvas.height = viewport.height;
      drawCanvas.style.width = `${viewport.width}px`;
      drawCanvas.style.height = `${viewport.height}px`;

      const renderTask = page.render({
        canvasContext: pdfCtx,
        viewport: viewport
      });
      renderTaskRef.current = renderTask;
      await renderTask.promise;

      redrawAnnotations();
    } catch (err: unknown) {
      const renderError = err as { name?: string; message?: string };
      if (renderError?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    }
  }, [currentPage, scale, redrawAnnotations]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // History Recording for Undo / Redo
  const recordHistory = () => {
    const cur = annotations[currentPage] || { paths: [], texts: [], stamps: [] };
    setUndoHistory(prev => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), JSON.parse(JSON.stringify(cur))]
    }));
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
    if (confirm(`Clear all annotations on Page ${currentPage}?`)) {
      recordHistory();
      setAnnotations(prev => ({
        ...prev,
        [currentPage]: { paths: [], texts: [], stamps: [] }
      }));
    }
  };

  const getCanvasNormalizedCoords = (clientX: number, clientY: number) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  // Pointer Event Handlers
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
                id: `stamp-${Date.now()}`,
                type: tool,
                value: tool === 'score_stamp' ? selectedScoreBadge : undefined,
                x: pos.x,
                y: pos.y,
                color: tool === 'tick' ? '#15803d' : tool === 'cross' ? '#dc2626' : undefined
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
        const threshold = 0.035;
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
      const effectiveSize = tool === 'highlighter' ? 18 : penSize * (0.8 + pressure * 0.4);

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
      if (p.tool === 'highlighter') ctx.globalAlpha = 0.35;

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

  // Burn annotations into PDF and Export
  const handleSaveAndExport = async () => {
    if (!pdfBytesRef.current) return;

    try {
      setIsSaving(true);
      const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
      const pages = pdfDoc.getPages();

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pageNum = pIdx + 1;
        const pageAnn = annotations[pageNum];
        if (!pageAnn) continue;

        const page = pages[pIdx];
        const { width, height } = page.getSize();

        // 1. Draw Paths (Pen & Highlighter)
        for (const p of pageAnn.paths) {
          if (p.points.length < 2) continue;
          const r = parseInt(p.color.slice(1, 3), 16) / 255;
          const g = parseInt(p.color.slice(3, 5), 16) / 255;
          const b = parseInt(p.color.slice(5, 7), 16) / 255;

          for (let i = 1; i < p.points.length; i++) {
            const startX = p.points[i - 1].x * width;
            const startY = height - (p.points[i - 1].y * height);
            const endX = p.points[i].x * width;
            const endY = height - (p.points[i].y * height);

            page.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              thickness: p.tool === 'highlighter' ? 14 : p.size * 0.75,
              color: rgb(r, g, b),
              opacity: p.tool === 'highlighter' ? 0.35 : 1.0
            });
          }
        }

        // 2. Draw Stamps (Tick, Cross, Score Badges)
        for (const s of pageAnn.stamps) {
          const sx = s.x * width;
          const sy = height - (s.y * height);

          if (s.type === 'tick') {
            page.drawLine({
              start: { x: sx - 12, y: sy },
              end: { x: sx - 4, y: sy - 10 },
              thickness: 3.5,
              color: rgb(0.08, 0.5, 0.24)
            });
            page.drawLine({
              start: { x: sx - 4, y: sy - 10 },
              end: { x: sx + 16, y: sy + 10 },
              thickness: 3.5,
              color: rgb(0.08, 0.5, 0.24)
            });
          } else if (s.type === 'cross') {
            page.drawLine({
              start: { x: sx - 10, y: sy - 10 },
              end: { x: sx + 10, y: sy + 10 },
              thickness: 3.5,
              color: rgb(0.86, 0.15, 0.15)
            });
            page.drawLine({
              start: { x: sx + 10, y: sy - 10 },
              end: { x: sx - 10, y: sy + 10 },
              thickness: 3.5,
              color: rgb(0.86, 0.15, 0.15)
            });
          } else if (s.type === 'score_stamp' && s.value) {
            const isNegative = s.value.startsWith('-');
            page.drawRectangle({
              x: sx - 22,
              y: sy - 10,
              width: 44,
              height: 20,
              color: isNegative ? rgb(0.86, 0.15, 0.15) : rgb(0.08, 0.5, 0.24)
            });
            page.drawText(s.value, {
              x: sx - 16,
              y: sy - 4,
              size: 11,
              color: rgb(1, 1, 1)
            });
          }
        }

        // 3. Draw Text Comments
        for (const t of pageAnn.texts) {
          const tx = t.x * width;
          const ty = height - (t.y * height);

          const r = parseInt(t.color.slice(1, 3), 16) / 255;
          const g = parseInt(t.color.slice(3, 5), 16) / 255;
          const b = parseInt(t.color.slice(5, 7), 16) / 255;

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
    } catch (err: unknown) {
      console.error('Error saving checked PDF:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert('Failed to burn annotations into PDF: ' + errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#334155] dark:bg-[#020617] flex flex-col h-screen text-slate-800 dark:text-slate-100 font-sans select-none touch-none">
      {/* ── TOP ACTION BAR (Clean Neutral Canvas Bar) ────────────────────────── */}
      <header className="h-14 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between gap-3 shrink-0 z-20 shadow-xs">
        
        {/* Left: Back & Details */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-white/10"
            title="Exit Evaluator"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              {/* <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-500/20">
                Evaluation Studio
              </span> */}
              <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-xs">
                {testTitle || 'Mains Copy'}
              </h3>
            </div>
            {studentName && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Candidate: <strong className="text-slate-900 dark:text-slate-200">{studentName}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Center: Examiner Tools Group */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1e293b]/70 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setTool('pen')}
            style={tool === 'pen' ? { backgroundColor: penColor } : undefined}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              tool === 'pen' ? 'text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
            }`}
            title="Pen Tool"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Pen</span>
            {tool !== 'pen' && (
              <span
                className="w-2 h-2 rounded-full inline-block ml-0.5 border border-white/20"
                style={{ backgroundColor: penColor }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              tool === 'highlighter' ? 'bg-amber-400 text-slate-950 font-black shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
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
              tool === 'tick' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
            }`}
            title="Correct Stamp"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden md:inline">Tick</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('cross')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              tool === 'cross' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
            }`}
            title="Incorrect Stamp"
          >
            <X className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden md:inline">Cross</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('score_stamp')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              tool === 'score_stamp' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
            }`}
            title="Score Stamp"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-bold">{selectedScoreBadge}</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('text')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              tool === 'text' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
            }`}
            title="Text Note"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Note</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-xl flex items-center text-xs font-bold transition-all cursor-pointer ${
              tool === 'eraser' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10'
            }`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Color Palettes */}
          <div className="hidden sm:flex items-center gap-1 px-1">
            {PEN_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPenColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-4 h-4 rounded-full border-2 transition-transform cursor-pointer ${
                  penColor === c.hex ? 'scale-125 border-slate-900 dark:border-white shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={c.label}
              />
            ))}
          </div>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!undoHistory[currentPage] || undoHistory[currentPage].length === 0}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-25 cursor-pointer"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!redoHistory[currentPage] || redoHistory[currentPage].length === 0}
            className="p-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-25 cursor-pointer"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Paging & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {/* Paging */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1e293b]/70 rounded-xl p-0.5 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-2 text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-[#1e293b]/70 rounded-xl p-0.5 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.6, s - 0.15))}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 text-slate-800 dark:text-slate-200">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Sidebar */}
          {/* <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSidebarOpen ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-sky-300 border-blue-200 dark:border-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
            title="Toggle Marks & Feedback Sidebar"
          >
            {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button> */}
        </div>
      </header>

      {/* ── SUB-BAR: SCORE STAMP BADGES ───────────────────────────────── */}
      {tool === 'score_stamp' && (
        <div className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/10 px-4 py-2 flex items-center gap-3 overflow-x-auto text-xs shrink-0 z-10">
          <span className="text-[11px] font-bold text-blue-700 dark:text-sky-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Tap on page to stamp score:
          </span>
          <div className="flex items-center gap-1.5">
            {PRESET_SCORE_BADGES.map(badge => (
              <button
                key={badge}
                type="button"
                onClick={() => setSelectedScoreBadge(badge)}
                className={`px-3 py-1 rounded-lg font-mono font-black text-xs transition-all cursor-pointer ${
                  selectedScoreBadge === badge
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── WORKSPACE: CANVAS + EVALUATION SIDEBAR ────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Scrollable Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-[#475569] dark:bg-[#090d16] p-6 sm:p-10 flex justify-center items-start select-none relative"
        >
          {loadingPdf ? (
            <div className="m-auto text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-200">Loading student answer copy...</p>
            </div>
          ) : loadError ? (
            <div className="m-auto text-center space-y-3 max-w-md p-6 bg-white dark:bg-[#0f172a] border border-rose-300 dark:border-rose-900/50 rounded-2xl shadow-lg">
              <p className="text-rose-600 dark:text-rose-400 text-sm font-bold">{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm border border-slate-300 dark:border-slate-700 bg-white inline-block">
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

              {/* Quick Remarks Popover */}
              {activeTextInputPos && (
                <div
                  className="absolute z-20 p-3.5 bg-white dark:bg-[#0f172a] border border-blue-300 dark:border-blue-500/40 rounded-2xl shadow-2xl space-y-2.5 w-80 text-slate-900 dark:text-white"
                  style={{
                    left: `${Math.min(0.65, activeTextInputPos.x) * 100}%`,
                    top: `${Math.min(0.75, activeTextInputPos.y) * 100}%`
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-sky-300 uppercase tracking-wider">Examiner Note</span>
                    <button
                      type="button"
                      onClick={() => setActiveTextInputPos(null)}
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type remark..."
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddTextAnnotation();
                        if (e.key === 'Escape') setActiveTextInputPos(null);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl outline-none font-medium focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTextAnnotation()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* 1-Tap Quick Examiner Tags */}
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Quick UPSC Remarks:</span>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                      {PRESET_QUICK_REMARKS.map((remark, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddTextAnnotation(remark)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-800 dark:text-slate-200 rounded-lg text-left transition-colors cursor-pointer border border-slate-200 dark:border-white/5"
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

        {/* ── EVALUATION SIDEBAR (Standard Card & Clean Layout) ────────── */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-96 bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-white/10 flex flex-col justify-between shrink-0 shadow-lg z-10 transition-all duration-200">
            {/* Top Scorecard Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 dark:text-sky-300 tracking-wider block">
                  Scorecard & Assessment
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Mains Copy Evaluation</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Evaluation Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Awarded Marks Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Awarded Marks</span>
                  <span className="text-[11px] text-blue-700 dark:text-sky-300 font-mono font-bold">Max Marks: {maxMarks}</span>
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl text-lg font-black text-blue-900 dark:text-sky-300 outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    / {maxMarks}
                  </span>
                </div>
              </div>

              {/* Detailed Feedback & Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Comprehensive Review & Feedback
                </label>
                <textarea
                  rows={6}
                  placeholder="Feedback on introduction, demand addressing, answer structuring, diagrams/flowcharts, and forward-looking conclusion..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 leading-relaxed font-medium resize-none transition-colors"
                />
              </div>

              {/* Stylus Guidance Pill */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-sky-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Tablet & Stylus Support</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Use Apple Pencil or Stylus with red pen to correct answers. Tap Score Stamps to award marks right on the page.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-slate-200 dark:border-white/10 space-y-2.5 bg-slate-50 dark:bg-[#0b101d]">
              <button
                type="button"
                disabled={isSaving || loadingPdf}
                onClick={handleSaveAndExport}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving & Publishing...' : 'Publish Checked Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearPage}
                className="w-full py-2 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Markings on Page {currentPage}</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
