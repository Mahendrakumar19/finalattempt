'use client';

import React from 'react';
import Image from 'next/image';

export interface PdfLetterheadProps {
  type?: 'CURRENT_AFFAIRS' | 'BLOG' | 'PREPARATION_NOTES' | 'STRATEGY_GUIDE';
  subtitle?: string;
  date?: string;
}

/**
 * Formats the PDF document title as:
 * [First 3 words of topic name] Final Attempt
 * (Nothing else)
 */
export function formatPdfDocumentTitle(topicTitle?: string): string {
  const cleanTitle = (topicTitle || '')
    // Remove unwanted prefixes like "Edition:" or dates if accidentally passed
    .replace(/^Edition\s*:\s*/i, '')
    // Normalize punctuation/whitespace
    .replace(/[–—_]+/g, ' ')
    .trim();

  const words = cleanTitle.split(/\s+/).filter(Boolean);
  const firstThreeWords = words.slice(0, 3).join(' ');

  if (!firstThreeWords) {
    return 'Final Attempt';
  }

  return `${firstThreeWords} Final Attempt`;
}

/**
 * Triggers PDF download/print dialog with the exact required title:
 * "[First 3 words of topic name] Final Attempt"
 */
export function triggerPdfDownload(topicTitle?: string) {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  const pdfTitle = formatPdfDocumentTitle(topicTitle);

  try {
    document.title = pdfTitle;
  } catch {
    // ignore
  }

  const restoreTitle = () => {
    try {
      document.title = originalTitle;
    } catch {
      // ignore
    }
    window.removeEventListener('afterprint', restoreTitle);
  };

  window.addEventListener('afterprint', restoreTitle);

  // Call print
  window.print();

  // Safety fallback restore after 1000ms if afterprint didn't fire
  setTimeout(restoreTitle, 1000);
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
    <>
      {/* Repeating Official Watermark Element for PDF/Print */}
      <div 
        className="fixed-print-watermark print-only" 
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          <Image
            src="/darklogofull.png"
            alt="Final Attempt Watermark"
            fill
            sizes="145mm"
            priority
            className="object-contain print-watermark-img"
          />
        </div>
      </div>

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

          {/* Right: Clean Document Type & Issue Date Badge (No URL at all) */}
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-800">
              {subtitle || typeLabel}
            </div>
            {date && (
              <div className="text-[11px] font-extrabold text-amber-700 mt-0.5">
                Edition: {date}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

