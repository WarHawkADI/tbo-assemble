"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Check, Hotel, MessageSquare, ArrowRight } from "lucide-react";
import { LanguageToggle, T, useI18n } from "@/lib/i18n";

export { LanguageToggle, T };

export function MicrositeCopyLink() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 lg:p-2.5 rounded-lg lg:rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/10 transition-all"
      title="Copy event link"
      aria-label="Copy event link to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-emerald-500" />
      ) : (
        <Share2 className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600 dark:text-zinc-400" />
      )}
    </button>
  );
}

export function MicrositeWhatsAppShare({ eventName }: { eventName: string }) {
  const handleShare = () => {
    const text = encodeURIComponent(
      `🎉 You're invited to ${eventName}! Book your stay here: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 lg:p-2.5 rounded-lg lg:rounded-xl backdrop-blur-sm border border-white/20 hover:bg-green-500/10 transition-all"
      title="Share via WhatsApp"
      aria-label="Share event via WhatsApp"
    >
      <MessageSquare className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-green-600 dark:text-green-400" />
    </button>
  );
}

export function MicrositeSocialProof({ guestCount }: { guestCount: number }) {
  const [show, setShow] = useState(false);
  const [proofIndex, setProofIndex] = useState(0);
  const { t } = useI18n();

  const proofs = [
    `${guestCount} ${t("guests_confirmed_count")}`,
    t("rooms_filling_fast"),
    t("special_group_rates"),
  ];

  useEffect(() => {
    if (guestCount < 1) return;

    const showTimer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(showTimer);
  }, [guestCount]);

  useEffect(() => {
    if (!show) return;

    const hideTimer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        setProofIndex((i) => (i + 1) % proofs.length);
        setShow(true);
      }, 3000);
    }, 4000);

    return () => clearTimeout(hideTimer);
  }, [show, proofs.length]);

  if (guestCount < 1 || !show) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 z-40 animate-social-proof">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 px-4 py-3 flex items-center gap-3 max-w-xs relative">
        <button
          onClick={() => setShow(false)}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors text-xs leading-none"
          aria-label="Dismiss"
        >
          &times;
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
          <Hotel className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-xs font-medium text-gray-700 dark:text-zinc-300">
          {proofs[proofIndex]}
        </p>
      </div>
    </div>
  );
}

export function MicrositeBottomNav({
  bookUrl,
  feedbackUrl,
  primaryColor,
  accentColor,
}: {
  bookUrl: string;
  feedbackUrl: string;
  primaryColor: string;
  accentColor: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-up-nav">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link
          href={feedbackUrl}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <T k="feedback" />
        </Link>
        <Link
          href={bookUrl}
          className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-md"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
        >
          <T k="reserve_room" /> <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
