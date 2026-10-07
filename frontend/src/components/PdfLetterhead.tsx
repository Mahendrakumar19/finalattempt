'use client';

import React from 'react';

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
  date
}: PdfLetterheadProps) {
  const currentDate = date || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="print-only hidden border-b border-slate-300 pb-2 mb-4 text-right text-xs font-semibold text-slate-600">
      <span>Date: {currentDate}</span>
    </div>
  );
}

