'use client';

import React from 'react';
import Image from 'next/image';

export interface PdfLetterheadProps {
  type?: 'CURRENT_AFFAIRS' | 'BLOG' | 'PREPARATION_NOTES' | 'STRATEGY_GUIDE';
  subtitle?: string;
  date?: string;
}

export function triggerPdfDownload() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

export default function PdfLetterhead({
  type = 'CURRENT_AFFAIRS',
  subtitle,
  date
}: PdfLetterheadProps) {
  const typeLabel = 
    type === 'CURRENT_AFFAIRS' ? 'DAILY CURRENT AFFAIRS & EDITORIAL DIGEST' :
    type === 'BLOG' ? 'EXAM STRATEGY & TOPPERS ANALYSIS' :
    type === 'PREPARATION_NOTES' ? 'OFFICIAL VALUE-ADDED STUDY MATERIAL' :
    'EXAM PREPARATION & VALUE ADDITION';

  return (
    <div className="pdf-print-header print-only hidden mb-3 pb-2 border-b-2 border-slate-900">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Official Brand Logo & Tagline */}
        <div className="flex items-center gap-2">
          <div className="relative w-36 h-9">
            <Image
              src="/darklogofull.png"
              alt="Final Attempt"
              fill
              sizes="144px"
              priority
              className="object-contain object-left"
            />
          </div>
        </div>

        {/* Right: Clean Document Type & Issue Date Badge */}
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-800">
            {subtitle || typeLabel}
          </div>
          {date && (
            <div className="text-[11px] font-extrabold text-amber-700 mt-0.5">
              Edition: {date}
            </div>
          )}
          <div className="text-[8px] font-semibold text-slate-500">
            www.finalattemptias.com
          </div>
        </div>
      </div>
    </div>
  );
}

