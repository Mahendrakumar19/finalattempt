'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Hls?: any;
    __hlsScriptLoading?: Promise<void>;
  }
}

interface HlsVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  className?: string;
}

function loadHlsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Hls) return Promise.resolve();
  if (window.__hlsScriptLoading) return window.__hlsScriptLoading;

  window.__hlsScriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-hls-js]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load hls.js')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    script.async = true;
    script.setAttribute('data-hls-js', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load hls.js'));
    document.head.appendChild(script);
  });

  return window.__hlsScriptLoading;
}

export default function HlsVideoPlayer({
  src,
  poster,
  autoPlay = true,
  controls = true,
  playsInline = true,
  className = 'w-full h-full bg-black object-contain'
}: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isM3u8 = src.includes('.m3u8');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hlsInstance: any = null;
    let isCancelled = false;

    setLoadError(null);

    if (!isM3u8) {
      // Standard MP4 or WebM video
      video.src = src;
      if (autoPlay) {
        video.play().catch(() => {
          // Autoplay policy muted fallback
          video.muted = true;
          video.play().catch(() => {});
        });
      }
      return () => {
        video.src = '';
      };
    }

    // 1. Native HLS support (Safari on macOS and all iOS browsers)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const handleLoaded = () => {
        if (autoPlay) {
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        }
      };
      video.addEventListener('loadedmetadata', handleLoaded);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoaded);
        video.src = '';
      };
    }

    // 2. Cross-browser HLS support via hls.js (Chrome, Firefox, Edge, Android)
    loadHlsScript()
      .then(() => {
        if (isCancelled || !videoRef.current || !window.Hls) return;
        if (!window.Hls.isSupported()) {
          setLoadError('Your browser does not support live video streaming.');
          return;
        }

        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          manifestLoadingTimeOut: 15000,
          levelLoadingTimeOut: 15000
        });

        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);

        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay && videoRef.current) {
            videoRef.current.play().catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {});
              }
            });
          }
        });

        hlsInstance.on(window.Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[HlsPlayer] Network error, attempting stream recovery...');
                hlsInstance?.startLoad();
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[HlsPlayer] Media error, attempting buffer recovery...');
                hlsInstance?.recoverMediaError();
                break;
              default:
                console.error('[HlsPlayer] Fatal unrecoverable HLS error:', data);
                hlsInstance?.destroy();
                setLoadError('Stream connection lost. Please refresh or wait for live stream to start.');
                break;
            }
          }
        });
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('[HlsPlayer] Script load error:', err);
          setLoadError('Unable to load video streaming engine.');
        }
      });

    return () => {
      isCancelled = true;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (video) {
        video.src = '';
      }
    };
  }, [src, isM3u8, autoPlay]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3 text-rose-400">
          ⚠️
        </div>
        <p className="text-sm font-bold text-slate-200">{loadError}</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          If the live class was recently started, it may take 5–10 seconds for the first live video chunk to buffer.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls={controls}
      playsInline={playsInline}
      autoPlay={autoPlay}
      className={className}
    />
  );
}
