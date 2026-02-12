"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, X } from "lucide-react";

interface CalendarEvent {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  venue: string;
  location?: string;
  status: string;
  type?: string;
  totalGuests: number;
  confirmedGuests?: number;
  totalRooms?: number;
  bookedRooms?: number;
  primaryColor?: string;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-700/50", text: "text-zinc-600 dark:text-zinc-300", dot: "bg-zinc-400", label: "Draft" },
  active: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500", label: "Active" },
  published: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", label: "Published" },
  completed: { bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500", label: "Completed" },
  cancelled: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", label: "Cancelled" },
};

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const today = new Date();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const goPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(null);
  };

  // Memoize event lookup
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = events.filter((e) => {
        const checkIn = new Date(e.checkIn);
        const checkOut = new Date(e.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(23, 59, 59, 999);
        return date >= checkIn && date <= checkOut;
      });
      if (dayEvents.length > 0) map.set(day, dayEvents);
    }
    return map;
  }, [events, currentMonth, currentYear, daysInMonth]);

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : [];

  // Count total events this month
  const monthEventCount = new Set(
    Array.from(eventsByDay.values()).flatMap((evts) => evts.map((e) => e.id))
  ).size;

  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      router.push(`/dashboard/events/${eventId}`);
    }
  };

  // Build calendar grid
  const cells: React.ReactNode[] = [];

  // Previous month trailing days
  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDays - firstDay + 1 + i;
    cells.push(
      <div key={`prev-${i}`} role="gridcell" className="min-h-[100px] sm:min-h-[110px] p-1.5 sm:p-2 bg-zinc-50/60 dark:bg-zinc-900/40">
        <span className="text-xs font-medium text-zinc-300 dark:text-zinc-700">{day}</span>
      </div>
    );
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDay.get(day) || [];
    const isToday = day === today.getDate() && isCurrentMonth;
    const isSelected = day === selectedDay;
    const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;

    cells.push(
      <div
        key={day}
        onClick={() => setSelectedDay(day === selectedDay ? null : day)}
        aria-current={isToday ? "date" : undefined}
        role="gridcell"
        className={`min-h-[100px] sm:min-h-[110px] p-1.5 sm:p-2 cursor-pointer transition-all duration-150 group relative ${
          isSelected
            ? "bg-orange-50/80 dark:bg-orange-950/20 ring-2 ring-orange-400 dark:ring-orange-600 ring-inset"
            : isToday
            ? "bg-blue-50/60 dark:bg-blue-950/15"
            : isWeekend
            ? "bg-zinc-50/50 dark:bg-zinc-900/30"
            : "bg-white dark:bg-zinc-900/60"
        } hover:bg-orange-50/50 dark:hover:bg-orange-950/10`}
      >
        {/* Day number */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
              isToday
                ? "bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-sm shadow-orange-300/50 dark:shadow-orange-900/50"
                : isSelected
                ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400"
                : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
            }`}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <div className="flex gap-0.5">
              {dayEvents.slice(0, 3).map((e) => (
                <div
                  key={e.id}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: e.primaryColor || "#3b82f6" }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Event pills */}
        <div className="space-y-0.5">
          {dayEvents.slice(0, 2).map((event) => {
            const checkIn = new Date(event.checkIn);
            const checkOut = new Date(event.checkOut);
            const currentDate = new Date(currentYear, currentMonth, day);
            const isStart = checkIn.toDateString() === currentDate.toDateString();
            const isEnd = checkOut.toDateString() === currentDate.toDateString();

            return (
              <button
                key={event.id}
                onClick={(e) => { e.stopPropagation(); handleEventClick(event.id); }}
                className={`w-full text-left text-[10px] leading-tight px-1.5 py-[3px] truncate font-medium transition-all hover:shadow-sm hover:-translate-y-px ${
                  isStart ? "rounded-l-md" : ""
                } ${isEnd ? "rounded-r-md" : ""} ${!isStart && !isEnd ? "" : "rounded-md"}`}
                style={{
                  backgroundColor: `${event.primaryColor || "#3b82f6"}18`,
                  color: event.primaryColor || "#3b82f6",
                  borderLeft: isStart ? `2px solid ${event.primaryColor || "#3b82f6"}` : undefined,
                }}
              >
                {isStart ? event.name : ""}
              </button>
            );
          })}
          {dayEvents.length > 2 && (
            <p className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 px-1.5">
              +{dayEvents.length - 2} more
            </p>
          )}
        </div>
      </div>
    );
  }

  // Next month leading days
  const totalCells = cells.length;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    cells.push(
      <div key={`next-${i}`} role="gridcell" className="min-h-[100px] sm:min-h-[110px] p-1.5 sm:p-2 bg-zinc-50/60 dark:bg-zinc-900/40">
        <span className="text-xs font-medium text-zinc-300 dark:text-zinc-700">{i}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] flex items-center justify-center shadow-md shadow-orange-200/50 dark:shadow-orange-900/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              {monthEventCount} event{monthEventCount !== 1 ? "s" : ""} this month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToday}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isCurrentMonth
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Today
          </button>
          <button
            onClick={goPrev}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[11px] font-bold uppercase tracking-wider py-2.5 ${
              i === 0 || i === 6
                ? "text-orange-500/60 dark:text-orange-400/40"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div role="grid" className="grid grid-cols-7 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700/80 divide-x divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, rowIdx) => (
          <div key={`row-${rowIdx}`} role="row" className="contents">
            {cells.slice(rowIdx * 7, rowIdx * 7 + 7)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                {config.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Click a day to see details</p>
      </div>

      {/* Selected Day Panel */}
      {selectedDay !== null && (
        <div className="mt-4 animate-fade-in">
          <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700/60">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                <span className="text-zinc-400 dark:text-zinc-500 font-medium ml-2">
                  {selectedDayEvents.length === 0 ? "No events" : `${selectedDayEvents.length} event${selectedDayEvents.length !== 1 ? "s" : ""}`}
                </span>
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {selectedDayEvents.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {selectedDayEvents.map((event) => {
                  const statusConf = STATUS_CONFIG[event.status] || STATUS_CONFIG.draft;
                  const checkIn = new Date(event.checkIn);
                  const checkOut = new Date(event.checkOut);
                  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white dark:hover:bg-zinc-800/60 transition-colors group"
                    >
                      <div
                        className="h-10 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: event.primaryColor || "#3b82f6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {event.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.venue}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {event.totalGuests} guest{event.totalGuests !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            {nights} night{nights !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No events on this day</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
