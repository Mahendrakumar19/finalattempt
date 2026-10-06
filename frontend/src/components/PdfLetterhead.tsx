'use client';

import React from 'react';

export interface PdfLetterheadProps {
  type: 'CURRENT_AFFAIRS' | 'BLOG';
  subtitle?: string;
  date?: string;
}

export function triggerPdfDownload() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

export default function PdfLetterhead({
  type,
  subtitle,
  date
}: PdfLetterheadProps) {
  const defaultSubtitle = type === 'CURRENT_AFFAIRS'
    ? 'DAILY CURRENT AFFAIRS & EDITORIAL BRIEF'
    : 'BLOG & TOPPERS STRATEGY DOSSIER';

  return (
    <div className="print-only hidden border-b-2 border-slate-900 pb-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/darklogofull.png"
            alt="FINAL ATTEMPT"
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="text-right text-[10px] text-slate-700 leading-tight">
          <p className="font-extrabold text-xs text-slate-900">FINAL ATTEMPT IAS ACADEMY</p>
          <p>UPSC &amp; BPSC Mentorship Platform</p>
          <p>🌐 www.finalattemptias.com • ✉️ enquiry@finalattemptias.com</p>
          <p>📞 +91 97099 92093 • Boring Road Crossing, Patna</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span>{subtitle || defaultSubtitle}</span>
        {date && <span>Date: {date}</span>}
      </div>
    </div>
  );
}
