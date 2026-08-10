'use client';

import NcertStyleDownloadPortal from '@/components/NcertStyleDownloadPortal';

export default function RapidRevisionPage() {
  return (
    <NcertStyleDownloadPortal
      pageSlug="rapid-revision"
      defaultTitle="Rapid Revision Materials"
      defaultBadge="Prelims Fast-Track Vault"
      defaultSubtitle="BPSC Prelims 100 quick revision formulas, economic survey tables and flash notes."
      defaultColor={{
        bg: 'from-rose-500/15 via-rose-500/5 to-transparent',
        border: 'border-rose-500/30 hover:border-rose-500',
        text: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        iconBg: 'bg-rose-500 text-white'
      }}
    />
  );
}
