'use client';

import React from 'react';

interface FormattedExplanationProps {
  content: string;
  isDark?: boolean;
  className?: string;
}

export const FormattedExplanation: React.FC<FormattedExplanationProps> = ({
  content,
  isDark = false,
  className = ''
}) => {
  if (!content) return null;

  // Split lines
  const rawLines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const elements: React.ReactNode[] = [];

  // Known source/country tags for tabular formatting
  const sourceKeywords = [
    'ब्रिटेन', 'BRITAIN', 'UK',
    'अमेरिका', 'USA', 'US',
    'आयरलैंड', 'IRELAND',
    'कनाडा', 'CANADA',
    'ऑस्ट्रेलिया', 'AUSTRALIA',
    'फ्रांस', 'FRANCE',
    'सोवियत संघ', 'USSR', 'RUSSIA',
    'दक्षिण अफ्रीका', 'SOUTH AFRICA',
    'जर्मनी', 'GERMANY',
    'जापान', 'JAPAN',
    'भारत सरकार अधिनियम', 'GOVERNMENT OF INDIA ACT'
  ];

  rawLines.forEach((line, idx) => {
    // 1. Bullet point check (starts with •, -, *, 1., 2., etc.)
    const bulletMatch = line.match(/^([•\-\*]|(\d+[\.\)]))\s*(.*)/);
    if (bulletMatch) {
      const bulletSymbol = bulletMatch[1];
      const bodyText = (bulletMatch[3] || '').trim();

      // Check if bodyText contains a key-value pattern like "Label: Value"
      const kvMatch = bodyText.match(/^([^:\：]+)[:\：]\s*(.*)/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        const val = kvMatch[2].trim();
        elements.push(
          <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black shrink-0 mt-0.5">
              {bulletSymbol.includes('•') ? '•' : bulletSymbol}
            </span>
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="font-extrabold text-amber-600 dark:text-amber-400 mr-1.5">{key}:</strong>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{val}</span>
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black shrink-0 mt-0.5">
              {bulletSymbol.includes('•') ? '•' : bulletSymbol}
            </span>
            <span className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {bodyText}
            </span>
          </div>
        );
      }
      return;
    }

    // 2. Source Country / Feature Line Check (e.g. "ब्रिटेन संसदीय शासन, विधि का शासन...")
    const matchingKeyword = sourceKeywords.find(kw => line.toLowerCase().startsWith(kw.toLowerCase()));
    if (matchingKeyword) {
      const remainder = line.slice(matchingKeyword.length).replace(/^[\s:\-\–\—,]+/, '').trim();
      elements.push(
        <div
          key={idx}
          className={`my-2 p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-amber-500/5 border-amber-500/20'
          }`}
        >
          <span className="font-black text-xs uppercase px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit shrink-0 border border-amber-500/20">
            {matchingKeyword}
          </span>
          <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {remainder}
          </span>
        </div>
      );
      return;
    }

    // 3. Heading Check:
    // Short line, no ending period, or ends with ?, :, or starts with bold/header marker
    const isHeading =
      line.endsWith('?') ||
      line.endsWith(':') ||
      (line.length <= 60 && !line.endsWith('.') && !line.includes(','));

    if (isHeading) {
      elements.push(
        <div key={idx} className="mt-5 mb-2 pt-1 border-l-4 border-amber-500 pl-3">
          <h4 className={`text-xs sm:text-sm font-heading font-black tracking-wide uppercase ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            {line.replace(/[:\：]$/, '')}
          </h4>
        </div>
      );
      return;
    }

    // 4. Regular Paragraph Line
    elements.push(
      <p key={idx} className={`my-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {line}
      </p>
    );
  });

  return (
    <div className={`space-y-1 font-body ${className}`}>
      {elements}
    </div>
  );
};

export default FormattedExplanation;
