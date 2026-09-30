'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertTriangle, ShieldCheck, ShieldAlert, XCircle, Eye, EyeOff } from 'lucide-react';

export interface ProctoringViolation {
  id: string;
  type: 'PERSON_NOT_DETECTED' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT';
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

  // Status & camera states
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true);
  const [consecutiveMissingCount, setConsecutiveMissingCount] = useState<number>(0);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [activeWarning, setActiveWarning] = useState<ProctoringViolation | null>(null);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState<boolean>(false);
  const [countdownToDismiss, setCountdownToDismiss] = useState<number>(0);

  // Keep a stable ref to violation count to avoid stale closures in listeners
  const violationCountRef = useRef<number>(0);
  violationCountRef.current = violations.length;

  const isAutoSubmittingRef = useRef<boolean>(false);
  isAutoSubmittingRef.current = isAutoSubmitting;

  const triggerViolation = useCallback(
    (
      type: 'PERSON_NOT_DETECTED' | 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT',
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
      setCountdownToDismiss(6); // Give user 6s to read warning before auto-clearing modal

      if (onViolationAdded) {
        onViolationAdded(newViolation, newCount);
      }

      // If flag is 3 times (or maxViolations reached), terminate & auto-submit immediately!
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

  // 1. Initialize Camera Feed
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraPermission('denied');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setCameraPermission('granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        if (onCameraReady) onCameraReady();
      } catch (err) {
        console.warn('Camera access denied or unassisted:', err);
        if (mounted) {
          setCameraPermission('denied');
        }
      }
    }

    if (isActive) {
      initCamera();
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, onCameraReady]);

  // 2. Tab Switch & Blur Tracking (Counts towards 3 strikes)
  useEffect(() => {
    if (!isActive || isAutoSubmitting) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerViolation(
            'TAB_SWITCH',
            'Tab Switched Detected',
            'You switched browser tabs or minimized the examination window. This action is recorded.'
          );
        }, 300);
      }
    };

    const handleWindowBlur = () => {
      // If window blurs (user opened another app, split screen, etc.)
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Only trigger if document is actually inactive/blurred and not just clicking an internal iframe
        if (!document.hasFocus() || document.hidden) {
          triggerViolation(
            'WINDOW_BLUR',
            'Focus Lost / External Window Opened',
            'You switched focus away from the test window. Keep your focus on the test screen at all times.'
          );
        }
      }, 500);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, isAutoSubmitting, triggerViolation]);

  // 3. Periodic Face Presence & Person Detection Proctoring (Runs every 2 seconds when active)
  useEffect(() => {
    if (!isActive || isAutoSubmitting || cameraPermission !== 'granted') return;

    let faceDetectorInstance: any = null;
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const FaceDetectorClass = (window as any).FaceDetector;
        faceDetectorInstance = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 2 });
      } catch {
        faceDetectorInstance = null;
      }
    }

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      let detectedPerson = false;

      // Method A: Native Browser Shape Detection FaceDetector (Chrome/Edge with experimental/standard flag)
      if (faceDetectorInstance) {
        try {
          const faces = await faceDetectorInstance.detect(video);
          if (faces && faces.length > 0) {
            detectedPerson = true;
          }
        } catch {
          // Fall back to canvas heuristics
          detectedPerson = false;
        }
      }

      // Method B: High-reliability fallback using offscreen canvas frame analysis:
      // Evaluates luminance variance, skin-tone chroma ratio (YCbCr / RGB human skin color distribution),
      // and frame luminosity to ensure the user is sitting in front of the camera and not an obscured/dark lens.
      if (!detectedPerson && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = 120;
          canvas.height = 90;
          ctx.drawImage(video, 0, 0, 120, 90);
          const imageData = ctx.getImageData(0, 0, 120, 90);
          const data = imageData.data;

          let skinPixelMatches = 0;
          let totalLuminance = 0;
          const pixelCount = data.length / 4;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;

            // Normalized human skin color tone range detector in RGB:
            // R > 60 && G > 40 && B > 20 && max(R,G,B) - min(R,G,B) > 15 && |R - G| > 15 && R > G && R > B
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            if (
              r > 55 &&
              g > 35 &&
              b > 20 &&
              max - min > 15 &&
              Math.abs(r - g) > 12 &&
              r > g &&
              r > b
            ) {
              skinPixelMatches++;
            }
          }

          const avgLuminance = totalLuminance / pixelCount;
          const skinRatio = skinPixelMatches / pixelCount;

          // Camera not blocked, reasonable lighting, and skin-tone presence consistent with a human face/head
          if (avgLuminance > 18 && skinRatio >= 0.04) {
            detectedPerson = true;
          }
        }
      }

      if (detectedPerson) {
        setIsFaceDetected(true);
        setConsecutiveMissingCount(0);
      } else {
        setIsFaceDetected(false);
        setConsecutiveMissingCount((prev) => {
          const next = prev + 1;
          // If person is not detected for 2 consecutive cycles (~4-5 seconds), trigger official strike
          if (next === 2) {
            triggerViolation(
              'PERSON_NOT_DETECTED',
              'Person is not detected',
              'Your face is not visible on the proctoring camera. Please keep your face centered and clearly visible.'
            );
          }
          return next;
        });
      }
    }, 2200);

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

      {/* ── Floating Proctoring Camera PiP (Top-Right or Bottom-Right corner) ── */}
      {isActive && (
        <div
          className={`fixed bottom-4 right-4 z-40 w-44 sm:w-52 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-300 ${
            !isFaceDetected
              ? 'border-red-500 shadow-red-500/30'
              : 'border-emerald-500/80 shadow-emerald-500/20'
          } ${isDark ? 'bg-black/90' : 'bg-slate-900/95'} backdrop-blur-md`}
        >
          {/* Header Bar */}
          <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-white bg-slate-950/80 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  !isFaceDetected ? 'bg-red-500' : 'bg-emerald-400'
                }`}
              />
              <span className="uppercase tracking-wider text-[10px]">
                {cameraPermission === 'granted' ? 'AI Proctor' : 'Proctor Cam'}
              </span>
            </div>
            <div
              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                currentCount === 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : currentCount === 1
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              Flags: {currentCount}/{maxViolations}
            </div>
          </div>

          {/* Camera Viewport */}
          <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* If camera permission pending or denied */}
            {cameraPermission === 'denied' && (
              <div className="absolute inset-0 bg-red-950/90 text-white flex flex-col items-center justify-center p-3 text-center">
                <XCircle className="w-6 h-6 text-red-400 mb-1" />
                <p className="text-[10px] font-bold">Camera Blocked</p>
                <p className="text-[8px] text-red-200 mt-0.5">Please allow webcam access in browser</p>
              </div>
            )}

            {/* Face presence badge */}
            <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white">
              <span className="flex items-center gap-1 font-semibold truncate">
                {isFaceDetected ? (
                  <>
                    <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300">Face Detected</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="text-red-300 font-bold">No Person Detected</span>
                  </>
                )}
              </span>
              <span className="text-[8px] text-slate-400 font-mono">LIVE</span>
            </div>
          </div>
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
