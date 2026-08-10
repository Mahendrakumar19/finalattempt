'use client';

import NcertStyleDownloadPortal from '@/components/NcertStyleDownloadPortal';

export default function ValueAddedMainsPage() {
  return (
    <NcertStyleDownloadPortal
      pageSlug="value-added-mains"
      defaultTitle="Value Added Materials — Mains"
      defaultBadge="Mains Answer Enrichment"
      defaultSubtitle="Mains data, quotes, Supreme Court landmark judgments, case studies and Bihar schemes."
      defaultColor={{
        bg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
        border: 'border-cyan-500/30 hover:border-cyan-500',
        text: 'text-cyan-600 dark:text-cyan-400',
        badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
        iconBg: 'bg-cyan-500 text-slate-950'
      }}
    />
  );
}
