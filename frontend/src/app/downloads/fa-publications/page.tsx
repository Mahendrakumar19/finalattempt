'use client';

import NcertStyleDownloadPortal from '@/components/NcertStyleDownloadPortal';

export default function FaPublicationsPage() {
  return (
    <NcertStyleDownloadPortal
      pageSlug="fa-publications"
      defaultTitle="Final Attempt Publications"
      defaultBadge="Books & Yearbooks Repository"
      defaultSubtitle="Official books, Bihar special handbooks, yearbooks and model answer compilations."
      defaultColor={{
        bg: 'from-purple-500/15 via-purple-500/5 to-transparent',
        border: 'border-purple-500/30 hover:border-purple-500',
        text: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
        iconBg: 'bg-purple-500 text-white'
      }}
    />
  );
}
