"use client";

import { CheckCircle, Clock, XCircle, CreditCard, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  label: string;
  description?: string;
  timestamp?: string;
  status: "completed" | "current" | "upcoming" | "cancelled";
  icon?: React.ReactNode;
}

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

const defaultIcons = {
  completed: <CheckCircle className="h-4 w-4" />,
  current: <Clock className="h-4 w-4 animate-pulse" />,
  upcoming: <Clock className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

const statusStyles = {
  completed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  current: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800 ring-2 ring-blue-200 dark:ring-blue-800",
  upcoming: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800",
};

const lineStyles = {
  completed: "bg-emerald-300 dark:bg-emerald-700",
  current: "bg-blue-200 dark:bg-blue-800",
  upcoming: "bg-zinc-200 dark:bg-zinc-700",
  cancelled: "bg-red-200 dark:bg-red-800",
};

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 relative">
          {/* Vertical line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                "absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)]",
                lineStyles[step.status]
              )}
            />
          )}

          {/* Icon */}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all",
              statusStyles[step.status]
            )}
          >
            {step.icon || defaultIcons[step.status]}
          </div>

          {/* Content */}
          <div className="pb-6 flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium",
                step.status === "upcoming"
                  ? "text-zinc-400 dark:text-zinc-500"
                  : step.status === "cancelled"
                  ? "text-red-700 dark:text-red-400 line-through"
                  : "text-zinc-800 dark:text-zinc-200"
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {step.description}
              </p>
            )}
            {step.timestamp && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                {new Date(step.timestamp).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function buildBookingTimeline(booking: {
  status: string;
  createdAt: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
}): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const isCancelled = booking.status === "cancelled";

  steps.push({
    label: "Booking Created",
    description: "Room reserved successfully",
    timestamp: booking.createdAt,
    status: "completed",
    icon: <CreditCard className="h-4 w-4" />,
  });

  if (isCancelled) {
    steps.push({
      label: "Booking Cancelled",
      description: "Reservation was cancelled",
      status: "cancelled",
    });
    return steps;
  }

  steps.push({
    label: "Confirmed",
    description: "Payment processed",
    status: booking.status === "confirmed" ? "completed" : "upcoming",
    icon: <CheckCircle className="h-4 w-4" />,
  });

  steps.push({
    label: "Check-In",
    description: booking.checkedIn ? "Guest checked in" : "Awaiting arrival",
    timestamp: booking.checkedInAt || undefined,
    status: booking.checkedIn ? "completed" : "current",
    icon: <UserCheck className="h-4 w-4" />,
  });

  return steps;
}
