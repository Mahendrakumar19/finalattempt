'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink } from 'lucide-react';
import { PromoBannerConfig } from '@/services/db';

interface PromoOverlayModalProps {
  banner?: PromoBannerConfig | null;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export default function PromoOverlayModal({
  banner,
  isPreview = false,
  onClosePreview,
}: PromoOverlayModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to ensure image URLs (including localhost:5000 or relative paths) load properly
  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    let cleanUrl = url;
    // Strip localhost:5000 / 127.0.0.1:5000 if stored in DB from server upload
    if (cleanUrl.includes('localhost:5000') || cleanUrl.includes('127.0.0.1:5000')) {
      cleanUrl = cleanUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1):5000/g, '');
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;

    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${cleanUrl.replace(/^\//, '')}`;
    }

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      if (protocol === 'https:' || (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
        return `/${cleanUrl.replace(/^\//, '')}`;
      }
      return `http://${hostname}:5000/${cleanUrl.replace(/^\//, '')}`;
    }
    return cleanUrl;
  };

  useEffect(() => {
    if (isPreview) {
      setIsOpen(true);
      return;
    }

    if (!banner || !banner.imageUrl) {
      setIsOpen(false);
      return;
    }

    // Accept true, 'true', 1
    const isEnabled = banner.enabled === true || (banner.enabled as unknown) === 'true' || (banner.enabled as unknown) === 1;
    if (!isEnabled) {
      setIsOpen(false);
      return;
    }

    // Snappy delay on page load/refresh
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [banner, isPreview]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (isPreview) {
      onClosePreview?.();
    }
  }, [isPreview, onClosePreview]);

  // Handle escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !banner?.imageUrl) return null;

  const handleClick = () => {
    if (banner.linkUrl) {
      handleClose();
      if (banner.linkUrl.startsWith('http://') || banner.linkUrl.startsWith('https://')) {
        window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        router.push(banner.linkUrl);
      }
    }
  };

  const finalImageUrl = resolveUrl(banner.imageUrl);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-[92vw] sm:max-w-lg md:max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Floating Top-Right Close Button (Coaching style) */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close banner"
          className="absolute -top-3.5 -right-2.5 sm:-top-4 sm:-right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 hover:bg-red-700 text-white border-2 border-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Close (ESC)"
        >
          <X className="w-5 h-5 text-white stroke-[2.5]" />
        </button>

        {/* Pure Banner Poster Card */}
        <div
          className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-white/20 shadow-2xl group transition-all ${
            banner.linkUrl ? 'cursor-pointer hover:opacity-95' : ''
          }`}
          onClick={handleClick}
        >
          {/* Banner Poster Image */}
          <div className="relative w-full max-h-[82vh] overflow-hidden flex items-center justify-center bg-slate-950">
            <img
              src={finalImageUrl}
              alt={banner.title || 'Promotional Banner'}
              className="w-full h-auto max-h-[82vh] object-contain block select-none"
              onError={() => {
                console.warn('[PromoModal] Image failed to load:', finalImageUrl);
              }}
            />
          </div>

          {/* Optional Click Indicator Bar */}
          {banner.linkUrl && (
            <div className="px-4 py-2.5 bg-slate-900/95 border-t border-white/10 flex items-center justify-between text-white text-xs font-bold">
              <span className="truncate text-[11px] text-amber-400">
                {banner.title || 'Tap banner to open link'}
              </span>
              <span className="flex items-center gap-1 text-[11px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-lg shrink-0">
                <span>View Details</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>

        {/* Text helper */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-2 text-[11px] text-white/70 hover:text-white transition-colors cursor-pointer select-none"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
