'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/services/db';

const emptySubscribe = () => () => {};

export default function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const [whatsappUrl, setWhatsappUrl] = useState<string>('https://wa.me/919709992093');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    db.getSettings()
      .then((settings) => {
        if (settings?.whatsappLink && settings.whatsappLink.trim()) {
          let link = settings.whatsappLink.trim();
          // If it's just a raw number, format into wa.me link
          if (/^\d{10,12}$/.test(link)) {
            link = `https://wa.me/${link.startsWith('91') ? link : '91' + link}`;
          }
          setWhatsappUrl(link);
        }
      })
      .catch(() => {});
  }, []);

  // Avoid rendering on portal / student dashboard or admin pages if desired, but user said right bottom side of website
  if (!mounted) return null;
  if (pathname?.startsWith('/admin')) return null;

  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-end group pointer-events-auto"
    >
      {/* Tooltip on Hover */}
      <span className="hidden sm:inline-flex items-center mr-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 dark:bg-slate-800/95 text-white shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none select-none border border-slate-700/50">
        Chat with us on WhatsApp
      </span>

      {/* Circular Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        id="floating-whatsapp-btn"
        className="relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.65)] hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Soft Pulse Ring animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <svg
          className="w-8 h-8 fill-current relative z-10 drop-shadow-sm"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.031 0C5.396 0 .029 5.367.029 12.003c0 2.123.555 4.195 1.611 6.02L0 24l6.166-1.616a11.966 11.966 0 005.865 1.523h.005c6.635 0 12.002-5.368 12.002-12.004C24.038 5.367 18.666 0 12.031 0zm0 21.99a9.96 9.96 0 01-5.084-1.391l-.365-.216-3.774.989 1.007-3.679-.238-.378a9.92 9.92 0 01-1.529-5.312C2.048 6.48 6.527 2 12.031 2c2.67 0 5.18 1.04 7.067 2.928A9.932 9.932 0 0122.029 12c0 5.518-4.478 9.99-9.998 9.99zm5.474-7.484c-.3-.15-1.776-.876-2.051-.976-.275-.1-.475-.15-.675.15s-.774.976-.95 1.176-.35.225-.65.075a8.19 8.19 0 01-2.414-1.49 9.034 9.034 0 01-1.671-2.08c-.175-.3-.019-.462.131-.612.136-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.675-1.625-.925-2.225c-.244-.583-.491-.504-.675-.513-.175-.009-.375-.01-.575-.01s-.525.075-.8.375c-.275.3-1.05 1.026-1.05 2.502s1.075 2.899 1.225 3.1c.15.2 2.115 3.23 5.124 4.53.716.31 1.275.495 1.71.634.719.229 1.373.197 1.89.12.577-.086 1.776-.726 2.026-1.427.25-.7.25-1.3.175-1.426-.075-.125-.275-.2-.575-.35z" />
        </svg>

        {/* Online Status Dot */}
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-300 border-2 border-white dark:border-slate-900 rounded-full z-20" />
      </a>
    </aside>
  );
}
