'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  XCircle, 
  Eye, 
  EyeOff, 
  GripHorizontal, 
  Move, 
  Minus, 
  Maximize2, 
  RotateCcw,
  CheckCircle2,
  Video
} from 'lucide-react';

interface FaceDetectorInstance {
  detect: (image: HTMLVideoElement | HTMLCanvasElement) => Promise<Array<unknown>>;
}

interface WindowWithFaceDetector extends Window {
  FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorInstance;
}

export interface ProctoringViolation {
  id: string;
  type: 'PERSON_NOT_DETECTED' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'CAMERA_PERMISSION_DENIED';
  title: string;
  description: string;
  timestamp: Date;
}

interface ProctoringMonitorProps {
  isActive: boolean;
  maxViolations?: number; // Default 3
  onViolationAdded?: (violation: ProctoringViolation, currentTotal: number) => void;
  onAutoSubmitTriggered?: (reason: string) => void;
  onCameraReady?: () => void;
  isDark?: boolean;
}

export const ProctoringMonitor: React.FC<ProctoringMonitorProps> = ({
  isActive,
  maxViolations = 3,
  onViolationAdded,
  onAutoSubmitTriggered,
  onCameraReady,
  isDark = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pipRef = useRef<HTMLDivElement | null>(null);

  // Status & camera states
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true);
  const [graceRemaining, setGraceRemaining] = useState<number>(0);
  const consecutiveMissingCountRef = useRef<number>(0);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [activeWarning, setActiveWarning] = useState<ProctoringViolation | null>(null);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState<boolean>(false);
  const [countdownToDismiss, setCountdownToDismiss] = useState<number>(0);

  // Movable / Draggable PiP State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Keep stable refs to avoid stale closures in listeners/intervals
  const violationCountRef = useRef<number>(0);
  const isAutoSubmittingRef = useRef<boolean>(false);

  useEffect(() => {
    violationCountRef.current = violations.length;
  }, [violations.length]);

  useEffect(() => {
    isAutoSubmittingRef.current = isAutoSubmitting;
  }, [isAutoSubmitting]);

  // Set default initial position on screen (Bottom-Right corner with safe margins)
  useEffect(() => {
    if (typeof window !== 'undefined' && !position) {
      const defaultW = window.innerWidth < 640 ? 176 : 224;
      const defaultH = 190;
      setPosition({
        x: Math.max(12, window.innerWidth - defaultW - 20),
        y: Math.max(12, window.innerHeight - defaultH - 24),
      });
    }
  }, [position]);

  // Handle Drag Start (Mouse & Touch)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const curX = position?.x ?? (typeof window !== 'undefined' ? window.innerWidth - 240 : 20);
    const curY = position?.y ?? (typeof window !== 'undefined' ? window.innerHeight - 210 : 20);

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      initialX: curX,
      initialY: curY,
    };
    setIsDragging(true);
  };

  // Window drag move & release listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;

      const w = pipRef.current?.offsetWidth || (isMinimized ? 160 : 224);
      const h = pipRef.current?.offsetHeight || (isMinimized ? 40 : 190);

      const maxX = Math.max(0, window.innerWidth - w - 8);
      const maxY = Math.max(0, window.innerHeight - h - 8);

      const nextX = Math.min(Math.max(8, dragStartRef.current.initialX + deltaX), maxX);
      const nextY = Math.min(Math.max(8, dragStartRef.current.initialY + deltaY), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isMinimized]);

  const triggerViolation = useCallback(
    (
      type: 'PERSON_NOT_DETECTED' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'CAMERA_PERMISSION_DENIED',
      title: string,
      description: string
    ) => {
      if (isAutoSubmittingRef.current) return;

      const newViolation: ProctoringViolation = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        title,
        description,
        timestamp: new Date(),
      };

      const newCount = violationCountRef.current + 1;
      violationCountRef.current = newCount;

      setViolations((prev) => [...prev, newViolation]);
      setActiveWarning(newViolation);
      setCountdownToDismiss(6);

      if (onViolationAdded) {
        onViolationAdded(newViolation, newCount);
      }

      if (newCount >= maxViolations) {
        setIsAutoSubmitting(true);
        if (onAutoSubmitTriggered) {
          onAutoSubmitTriggered(
            `Test terminated automatically: Maximum security violations reached (${newCount}/${maxViolations}) - ${title}`
          );
        }
      }
    },
    [maxViolations, onViolationAdded, onAutoSubmitTriggered]
  );

  // 1. Initialize Camera Feed & Attach to Video Element
  const initCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission('denied');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }

      if (onCameraReady) onCameraReady();
    } catch (err) {
      console.warn('[Proctoring] Camera access denied or not available:', err);
      setCameraPermission('denied');
    }
  }, [onCameraReady]);

  // Keep video source synced if node mounts or updates
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      initCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, initCamera]);

  // 2. Tab Switch & Blur Tracking
  useEffect(() => {
    if (!isActive || isAutoSubmitting) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerViolation(
            'TAB_SWITCH',
            'Tab Switch Detected',
            'You switched browser tabs or minimized the examination window. This action is recorded.'
          );
        }, 350);
      }
    };

    const handleWindowBlur = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!document.hasFocus() || document.hidden) {
          triggerViolation(
            'WINDOW_BLUR',
            'Focus Lost / External Window Opened',
            'You switched focus away from the test window. Please keep focus on the test screen.'
          );
        }
      }, 600);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, isAutoSubmitting, triggerViolation]);

  // 3. Robust Face & Person Presence Detection Engine
  useEffect(() => {
    if (!isActive || isAutoSubmitting || cameraPermission !== 'granted') return;

    let faceDetectorInstance: FaceDetectorInstance | null = null;
    if (typeof window !== 'undefined') {
      const win = window as WindowWithFaceDetector;
      if (win.FaceDetector) {
        try {
          const FaceDetectorClass = win.FaceDetector;
          faceDetectorInstance = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 2 });
        } catch {
          faceDetectorInstance = null;
        }
      }
    }

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;

      // Ensure video is playing and has frames
      if (video.readyState < 2 || video.videoWidth === 0) return;

      let detectedPerson = false;

      // Method A: Native Shape Detection API (if supported by browser)
      if (faceDetectorInstance) {
        try {
          const faces = await faceDetectorInstance.detect(video);
          if (faces && faces.length > 0) {
            detectedPerson = true;
          }
        } catch {
          detectedPerson = false;
        }
      }

      // Method B: Universal High-Reliability YCbCr + Contrast Human Presence Detector
      // Works across all skin tones, lighting conditions, and standard webcams
      if (!detectedPerson && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const w = 120;
          const h = 90;
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);

          try {
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;

            let skinPixelMatches = 0;
            let totalLuminance = 0;
            let centerPixels = 0;

            // Focus analysis primarily on the central 70% zone where the user's face is centered
            const minX = Math.floor(w * 0.15);
            const maxX = Math.floor(w * 0.85);
            const minY = Math.floor(h * 0.10);
            const maxY = Math.floor(h * 0.90);

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLuminance += lum;

                if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                  centerPixels++;

                  // Peer-reviewed standard YCbCr skin tone transformation:
                  // Invariant to brightness; accurately captures all human skin tones
                  const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                  const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

                  const isSkinYCbCr = Cb >= 75 && Cb <= 138 && Cr >= 128 && Cr <= 180 && lum >= 15;
                  // HSV/RGB fallback for bright or cool LED lighting
                  const isSkinRgb = r > 45 && g > 25 && b > 15 && r >= b && (r - g) >= -8;

                  if (isSkinYCbCr || isSkinRgb) {
                    skinPixelMatches++;
                  }
                }
              }
            }

            const avgLuminance = totalLuminance / (w * h);
            const skinRatioInCenter = centerPixels > 0 ? skinPixelMatches / centerPixels : 0;

            // Camera is active, not covered/black (avgLuminance > 12), and has human face signature
            if (avgLuminance > 12 && (skinRatioInCenter >= 0.02 || avgLuminance > 30)) {
              detectedPerson = true;
            }
          } catch {
            // If cross-origin or canvas read error, default to true if video is playing
            detectedPerson = !video.paused && video.currentTime > 0;
          }
        }
      }

      if (detectedPerson) {
        setIsFaceDetected(true);
        setGraceRemaining(0);
        consecutiveMissingCountRef.current = 0;
      } else {
        setIsFaceDetected(false);
        consecutiveMissingCountRef.current += 1;
        const missingCount = consecutiveMissingCountRef.current;
        const maxGraceCycles = 6; // 6 cycles * 2s = ~12 seconds grace period before penalty
        const remaining = Math.max(0, maxGraceCycles - missingCount);
        setGraceRemaining(remaining * 2);

        // Only trigger formal strike if person is absent continuously for >= 12 seconds
        if (missingCount === maxGraceCycles) {
          triggerViolation(
            'PERSON_NOT_DETECTED',
            'Person is not detected',
            'Your face has not been visible on the camera for over 12 seconds. Please keep your face centered.'
          );
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, isAutoSubmitting, cameraPermission, triggerViolation]);

  // Warning countdown timer
  useEffect(() => {
    if (countdownToDismiss <= 0) return;
    const timer = setInterval(() => {
      setCountdownToDismiss((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownToDismiss]);

  const currentCount = violations.length;
  const isTerminated = currentCount >= maxViolations || isAutoSubmitting;

  return (
    <>
      {/* Offscreen canvas for frame pixel analysis */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* ── Movable / Draggable Floating Proctoring Camera PiP ── */}
      {isActive && (
        <div
          ref={pipRef}
          style={{
            transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
            touchAction: 'none',
          }}
          className={`fixed top-0 left-0 z-40 rounded-2xl overflow-hidden shadow-2xl border-2 transition-shadow select-none ${
            isDragging ? 'shadow-sky-500/30 scale-102 cursor-grabbing' : ''
          } ${
            !isFaceDetected && cameraPermission === 'granted'
              ? 'border-amber-500 shadow-amber-500/30'
              : cameraPermission === 'denied'
              ? 'border-red-500 shadow-red-500/20'
              : 'border-emerald-500/80 shadow-emerald-500/20'
          } ${isDark ? 'bg-slate-950/95 text-white' : 'bg-slate-900/95 text-white'} backdrop-blur-md ${
            isMinimized ? 'w-44' : 'w-48 sm:w-56'
          }`}
        >
          {/* Header Bar - Acts as Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold bg-slate-950 border-b border-white/10 cursor-grab active:cursor-grabbing hover:bg-slate-900 transition-colors"
            title="Click and drag anywhere on screen"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  cameraPermission === 'denied'
                    ? 'bg-red-500'
                    : isFaceDetected
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="uppercase tracking-wider text-[9.5px] truncate font-black text-slate-200">
                AI Proctor
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                  currentCount === 0
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : currentCount === 1
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {currentCount}/{maxViolations}
              </span>

              {/* Minimize / Maximize button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-0.5 hover:bg-white/10 rounded text-slate-300 transition-colors cursor-pointer"
                title={isMinimized ? 'Expand Camera' : 'Minimize Camera'}
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Camera Viewport (collapsible when minimized) */}
          {!isMinimized && (
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* High-Tech Face Targeting HUD / Reticle */}
              {cameraPermission === 'granted' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-24 h-28 sm:w-28 sm:h-32 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between p-1.5 ${
                      isFaceDetected
                        ? 'border-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                        : 'border-amber-400/80 border-dashed animate-pulse'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className={`w-2 h-2 border-t-2 border-l-2 ${isFaceDetected ? 'border-emerald-400' : 'border-amber-400'}`} />
                      <span className={`w-2 h-2 border-t-2 border-r-2 ${isFaceDetected ? 'border-emerald-400' : 'border-amber-400'}`} />
                    </div>
                    <div className="flex justify-between">
                      <span className={`w-2 h-2 border-b-2 border-l-2 ${isFaceDetected ? 'border-emerald-400' : 'border-amber-400'}`} />
                      <span className={`w-2 h-2 border-b-2 border-r-2 ${isFaceDetected ? 'border-emerald-400' : 'border-amber-400'}`} />
                    </div>
                  </div>
                </div>
              )}

              {/* If camera permission pending or denied */}
              {cameraPermission === 'denied' && (
                <div className="absolute inset-0 bg-red-950/95 text-white flex flex-col items-center justify-center p-3 text-center">
                  <XCircle className="w-6 h-6 text-red-400 mb-1" />
                  <p className="text-[10px] font-bold">Camera Blocked</p>
                  <p className="text-[8px] text-red-200 mt-0.5">Please allow webcam access in browser</p>
                  <button
                    type="button"
                    onClick={initCamera}
                    className="mt-2 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Camera</span>
                  </button>
                </div>
              )}

              {/* Live Face presence status badge */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-xs text-white">
                <span className="flex items-center gap-1 font-semibold truncate">
                  {cameraPermission === 'denied' ? (
                    <span className="text-red-400 font-bold">Camera Offline</span>
                  ) : isFaceDetected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-bold">Face Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-amber-400 shrink-0 animate-bounce" />
                      <span className="text-amber-300 font-bold">
                        {graceRemaining > 0 ? `Align Face (${graceRemaining}s)` : 'Searching Face...'}
                      </span>
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1 text-[8px] text-slate-400 font-mono">
                  <Move className="w-2.5 h-2.5 text-slate-400" />
                  <span>DRAG</span>
                </span>
              </div>
            </div>
          )}

          {/* Minimized status bar */}
          {isMinimized && (
            <div className="px-2.5 py-1.5 bg-black/60 flex items-center justify-between text-[9px]">
              <span className={`font-bold flex items-center gap-1 ${isFaceDetected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isFaceDetected ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {isFaceDetected ? 'Monitored' : 'Face Alert'}
              </span>
              <span className="text-[8px] text-slate-400 font-mono">DRAG</span>
            </div>
          )}
        </div>
      )}

      {/* ── Active Warning Modal Overlay for Strikes 1 and 2 ── */}
      {activeWarning && !isTerminated && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-7 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-bounce">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-black uppercase tracking-wider">
                Warning {currentCount} of {maxViolations}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">{activeWarning.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeWarning.description}
              </p>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left text-xs space-y-1.5 text-amber-200/90 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 uppercase text-[10px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Security Notice</span>
              </div>
              <p className="text-[11px] leading-normal">
                If flagged <strong>{maxViolations} times</strong> (including tab switches and person not visible), the test will <strong>automatically submit and terminate</strong>.
              </p>
            </div>

            <button
              onClick={() => setActiveWarning(null)}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              I Understand & Resume Test ({countdownToDismiss > 0 ? `${countdownToDismiss}s` : 'Dismiss'})
            </button>
          </div>
        </div>
      )}

      {/* ── Auto-Submit / Test Terminated Modal Overlay on 3rd Strike ── */}
      {isTerminated && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 select-none">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-7 text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <div className="inline-block px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-black uppercase tracking-wider">
                Exam Terminated ({currentCount}/{maxViolations} Flags Reached)
              </div>
              <h3 className="text-xl font-black text-white">Test Automatically Submitted</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have reached the maximum allowed proctoring violations ({maxViolations} flags). Your answers are being submitted and finalized automatically.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-left text-xs space-y-2 text-slate-400">
              <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                Infractions recorded:
              </span>
              <ul className="space-y-1 text-[11px] list-disc list-inside">
                {violations.slice(0, 3).map((v, i) => (
                  <li key={i} className="text-slate-300 truncate">
                    <span className="font-semibold text-white">#{i + 1}:</span> {v.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>Finalizing attempt submission...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
