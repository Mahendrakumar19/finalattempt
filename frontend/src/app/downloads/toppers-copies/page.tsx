'use client';

import NcertStyleDownloadPortal from '@/components/NcertStyleDownloadPortal';

export default function ToppersCopiesPage() {
  return (
    <NcertStyleDownloadPortal
      pageSlug="toppers-copies"
      defaultTitle="Toppers' Copies"
      defaultBadge="Evaluated Answer Sheet Vault"
      defaultSubtitle="Evaluated Mains GS & Essay answer copies of top rankers from BPSC 68th & 69th."
      defaultColor={{
        bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
        border: 'border-amber-500/30 hover:border-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        iconBg: 'bg-amber-500 text-slate-950'
      }}
    />
  );
}
