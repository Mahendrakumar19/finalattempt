'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    if (isPreview) {
      setIsOpen(true);
      return;
    }

    if (!banner || !banner.enabled || !banner.imageUrl) {
      setIsOpen(false);
      return;
    }

    // Check frequency rule
    const mode = banner.displayMode || 'once_per_session';
    if (mode === 'first_visit_only') {
      const seen = typeof window !== 'undefined' ? localStorage.getItem('fa_promo_seen') : '1';
      if (seen) return;
    } else if (mode === 'once_per_session') {
      const seen = typeof window !== 'undefined' ? sessionStorage.getItem('fa_promo_seen') : '1';
      if (seen) return;
    }

    // Delay slightly (700ms) for smooth page load before showing popup
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [banner, isPreview]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (isPreview) {
      onClosePreview?.();
      return;
    }

    if (!banner) return;
    const mode = banner.displayMode || 'once_per_session';
    if (mode === 'first_visit_only') {
      try { localStorage.setItem('fa_promo_seen', '1'); } catch {}
    } else {
      try { sessionStorage.setItem('fa_promo_seen', '1'); } catch {}
    }
  }, [banner, isPreview, onClosePreview]);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* Floating Top-Right Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close promotional banner"
          className="absolute -top-12 right-0 sm:-right-4 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <X className="w-5 h-5 text-white/90 group-hover:text-white" />
        </button>

        {/* Poster Card */}
        <div
          className={`w-full rounded-3xl overflow-hidden bg-slate-950 border border-white/20 shadow-2xl group relative transition-all ${
            banner.linkUrl ? 'cursor-pointer hover:shadow-amber-500/10' : ''
          }`}
          onClick={handleClick}
        >
          {/* Badge: Special Promotion */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-400 font-extrabold text-[11px] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Special Announcement</span>
          </div>

          {/* Banner Poster Image */}
          <div className="relative w-full max-h-[70vh] overflow-hidden flex items-center justify-center bg-slate-950">
            <img
              src={banner.imageUrl}
              alt={banner.title || 'Special Promotion Banner'}
              className="w-full h-auto max-h-[70vh] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
              }}
            />
          </div>

          {/* Bottom Action Footer if title or ctaText or linkUrl exists */}
          {(banner.title || banner.ctaText || banner.linkUrl) && (
            <div className="p-4 sm:p-5 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900/90 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {banner.title && (
                  <h4 className="text-sm sm:text-base font-heading font-black text-white truncate">
                    {banner.title}
                  </h4>
                )}
                {banner.linkUrl && (
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span>Click to view details</span>
                    <ExternalLink className="w-3 h-3 inline" />
                  </p>
                )}
              </div>

              {banner.ctaText ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{banner.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : banner.linkUrl ? (
                <div className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Dismiss Subtitle */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-3 text-xs text-white/60 hover:text-white transition-colors cursor-pointer select-none"
        >
          Close &amp; continue to website
        </button>
      </div>
    </div>
  );
}
