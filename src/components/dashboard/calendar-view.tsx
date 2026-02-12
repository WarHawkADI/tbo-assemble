"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface CalendarEvent {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  venue: string;
  status: string;
  totalGuests: number;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusColors: Record<string, string> = {
  draft: "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
  active: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  published: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  completed: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
};

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const goPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Find events that overlap with each day
  const getEventsForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return events.filter((e) => {
      const checkIn = new Date(e.checkIn);
      const checkOut = new Date(e.checkOut);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(23, 59, 59, 999);
      return date >= checkIn && date <= checkOut;
    });
  };

  const days = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50" />);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();

    days.push(
      <div
        key={day}
        className={`h-24 border border-zinc-100 dark:border-zinc-800 p-1 overflow-hidden ${
          isToday ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-white dark:bg-zinc-900"
        }`}
      >
        <span
          className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
            isToday
              ? "bg-blue-600 text-white"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {day}
        </span>
        <div className="space-y-0.5 mt-0.5">
          {dayEvents.slice(0, 2).map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event.id)}
              className={`w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${
                statusColors[event.status] || statusColors.draft
              } hover:opacity-80 transition-opacity`}
            >
              {event.name}
            </button>
          ))}
          {dayEvents.length > 2 && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
              +{dayEvents.length - 2} more
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
          <button
            onClick={goNext}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
        {days}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
