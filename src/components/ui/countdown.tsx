"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string | Date;
  label?: string;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function Countdown({ targetDate, label, className = "", compact = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const target = new Date(targetDate);
    // Use interval starting at 0ms delay for immediate first tick
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);
    // Immediate first tick via rAF to avoid synchronous setState in effect
    const raf = requestAnimationFrame(() => {
      setTimeLeft(calculateTimeLeft(target));
    });
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(raf);
    };
  }, [targetDate]);

  const isExpired = timeLeft !== null && timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds === 0;

  // Show placeholder during SSR / before mount to avoid hydration mismatch
  if (!timeLeft) {
    if (compact) {
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
            --d --h --m
          </span>
          {label && <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>}
        </div>
      );
    }
    return (
      <div className={className}>
        {label && (
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">
            {label}
          </p>
        )}
        <div className="flex items-center gap-2 justify-center">
          {["Days", "Hours", "Minutes", "Seconds"].map((u, i) => (
            <div key={u} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-1 min-w-[3rem] text-center tabular-nums">
                  --
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                  {u}
                </span>
              </div>
              {i < 3 && (
                <span className="text-lg font-bold text-zinc-300 dark:text-zinc-600 mb-4">:</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Event has started!</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
          {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m
        </span>
        {label && <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>}
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2 justify-center">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-1 min-w-[3rem] text-center tabular-nums transition-all">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="text-lg font-bold text-zinc-300 dark:text-zinc-600 mb-4 animate-pulse">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
