"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Check, Hotel, MessageSquare, ArrowRight, CalendarPlus, Users, Sparkles, Clock, TrendingUp } from "lucide-react";
import { LanguageToggle, T, useI18n } from "@/lib/i18n";

export { LanguageToggle, T };

// Calendar export component for adding event to user's calendar
export function MicrositeCalendarExport({
  eventName,
  venue,
  location,
  checkIn,
  checkOut,
  description,
  primaryColor = "#3B82F6",
}: {
  eventName: string;
  venue: string;
  location: string;
  checkIn: string;
  checkOut: string;
  description?: string;
  primaryColor?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const generateICS = () => {
    setDownloading(true);
    
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const escapeICS = (str: string) => {
      return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tboassemble`;
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TBO Assemble//Event Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatICSDate(startDate)}`,
      `DTEND;VALUE=DATE:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(eventName)}`,
      `LOCATION:${escapeICS(`${venue}, ${location}`)}`,
      description ? `DESCRIPTION:${escapeICS(description)}` : '',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICS(eventName)} starts tomorrow!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventName.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setTimeout(() => setDownloading(false), 1000);
  };

  return (
    <button
      onClick={generateICS}
      disabled={downloading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border shadow-sm hover:scale-105 transition-all duration-200 disabled:opacity-50 ml-2"
      style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}25`, color: primaryColor }}
      title="Add to your calendar"
    >
      <CalendarPlus className={`h-3 w-3 ${downloading ? 'animate-bounce' : ''}`} />
      {downloading ? 'Adding...' : 'Add to Calendar'}
    </button>
  );
}

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

  // Enhanced proof messages with icons
  const proofs = [
    { text: `${guestCount} ${t("guests_confirmed_count")}`, icon: Users, color: "emerald" },
    { text: t("rooms_filling_fast"), icon: TrendingUp, color: "amber" },
    { text: t("special_group_rates"), icon: Sparkles, color: "violet" },
    { text: "Book now for best selection", icon: Clock, color: "blue" },
  ];

  const currentProof = proofs[proofIndex];
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
    violet: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
    blue: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
  };

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

  const Icon = currentProof.icon;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 z-40 animate-social-proof">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 px-4 py-3 flex items-center gap-3 max-w-xs relative group hover:shadow-xl transition-shadow">
        <button
          onClick={() => setShow(false)}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors text-xs leading-none opacity-0 group-hover:opacity-100"
          aria-label="Dismiss"
        >
          &times;
        </button>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${colorClasses[currentProof.color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-gray-700 dark:text-zinc-300">
          {currentProof.text}
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
