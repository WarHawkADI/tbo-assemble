import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventSchedule } from "@/components/dashboard/event-schedule";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      checkIn: true,
      checkOut: true,
    },
  });

  if (!event) return notFound();

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <Link
        href={`/dashboard/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Event Overview
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight mb-2">
          Event Schedule
        </h1>
        <p className="text-gray-500 dark:text-zinc-400">
          Day-wise agenda and costing for {event.name}
        </p>
      </div>

      {/* Schedule Component */}
      <EventSchedule
        eventId={eventId}
        eventStartDate={event.checkIn.toISOString().split("T")[0]}
        eventEndDate={event.checkOut.toISOString().split("T")[0]}
      />
    </div>
  );
}
