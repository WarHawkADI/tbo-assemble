import Link from "next/link";
import prisma from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { CalendarView } from "@/components/dashboard/calendar-view";
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
    status: e.status,
    totalGuests: e.guests.length,
  }));

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          Event Calendar
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Visualize all your events in one calendar view
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-6">
        <CalendarView events={calendarEvents} />
      </div>
    </div>
  );
}
