import Link from "next/link";
import prisma from "@/lib/db";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar | TBO Assemble",
};

export default async function CalendarPage() {
  const events = await prisma.event.findMany({
    include: {
      guests: true,
      roomBlocks: true,
    },
    orderBy: { checkIn: "asc" },
  });

  const calendarEvents = events.map((e) => ({
    id: e.id,
    name: e.name,
    checkIn: e.checkIn.toISOString(),
    checkOut: e.checkOut.toISOString(),
    venue: e.venue,
    location: e.location,
    status: e.status,
    type: e.type,
    totalGuests: e.guests.length,
    confirmedGuests: e.guests.filter((g) => g.status === "confirmed").length,
    totalRooms: e.roomBlocks.reduce((s, r) => s + r.totalQty, 0),
    bookedRooms: e.roomBlocks.reduce((s, r) => s + r.bookedQty, 0),
    primaryColor: e.primaryColor,
  }));

  // Upcoming events (sorted by check-in)
  const now = new Date();
  const upcoming = calendarEvents
    .filter((e) => new Date(e.checkIn) >= now)
    .slice(0, 4);

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 tracking-tight">
            Event Calendar
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Visualize all your events across time — {calendarEvents.length} event{calendarEvents.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
            <CalendarDays className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">{upcoming.length} upcoming</span>
          </div>
        </div>
      </div>

      {/* Upcoming Events Strip */}
      {upcoming.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {upcoming.map((event) => {
            const daysAway = Math.ceil((new Date(event.checkIn).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="group relative bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4 hover:shadow-lg hover:border-zinc-200 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ background: event.primaryColor }}
                />
                <div className="flex items-start justify-between mb-2 mt-1">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate pr-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {event.name}
                  </h3>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40">
                    {daysAway}d
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {formatDate(new Date(event.checkIn))}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {event.venue}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Users className="h-3 w-3 shrink-0" />
                    {event.confirmedGuests}/{event.totalGuests} guests
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 p-4 sm:p-6 shadow-sm">
        <CalendarView events={calendarEvents} />
      </div>
    </div>
  );
}
