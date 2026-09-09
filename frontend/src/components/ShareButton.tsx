'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  path?: string;
  variant?: 'button' | 'icon' | 'compact' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ShareButton({
  title,
  text,
  url,
  path,
  variant = 'button',
  size = 'md',
  className = ''
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getShareUrl = () => {
    const target = url || path;
    if (typeof window === 'undefined') return target || '';
    if (!target) return window.location.href;
    if (target.startsWith('http://') || target.startsWith('https://')) return target;
    return `${window.location.origin}${target.startsWith('/') ? target : `/${target}`}`;
  };

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetUrl = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const input = document.createElement('input');
        input.value = targetUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl = getShareUrl();
    const message = encodeURIComponent(`${title}\n${text ? `${text}\n` : ''}${targetUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    setShowMenu(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetUrl = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: targetUrl
        });
        setShowMenu(false);
        return;
      } catch (err) {
        // Fallback to menu if user canceled or share failed
      }
    }
    setShowMenu(!showMenu);
  };

  if (variant === 'icon') {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleNativeShare}
          className={`p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-500/10 transition-all cursor-pointer ${className}`}
          title="Share Link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500 animate-bounce" /> : <Share2 className="w-4 h-4" />}
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-purple-500" />}
              <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'pill' || variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleCopyLink}
          className={`px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 ${className}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-purple-500" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleNativeShare}
        className={`px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold rounded-2xl text-xs flex items-center gap-2 border border-purple-200 dark:border-purple-800/60 transition-all cursor-pointer shadow-xs ${className}`}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
        <span>{copied ? 'Link Copied!' : 'Share Item'}</span>
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-purple-500" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Direct Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>Share via WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
}
