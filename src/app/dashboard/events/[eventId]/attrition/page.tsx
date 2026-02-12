import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import AttritionClient from "@/components/dashboard/attrition-client";

export const dynamic = "force-dynamic";

export default async function AttritionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roomBlocks: true,
      guests: true,
      attritionRules: { orderBy: { releaseDate: "asc" } },
    },
  });

  if (!event) return notFound();

  const totalRooms = event.roomBlocks.reduce((s, r) => s + r.totalQty, 0);
  const bookedRooms = event.roomBlocks.reduce((s, r) => s + r.bookedQty, 0);
  const avgRate =
    event.roomBlocks.length > 0 && totalRooms > 0
      ? event.roomBlocks.reduce((s, r) => s + r.rate * r.totalQty, 0) / totalRooms
      : 0;
  const pendingGuests = event.guests.filter((g) => g.status === "invited").length;

  return (
    <div>
      <Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {event.name}
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          Attrition & Smart-Yield Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Track release schedules and protect revenue — {event.name}
        </p>
      </div>

      <AttritionClient
        eventId={eventId}
        eventSlug={event.slug}
        eventName={event.name}
        rules={event.attritionRules.map((r) => ({
          id: r.id,
          releaseDate: r.releaseDate.toISOString(),
          releasePercent: r.releasePercent,
          description: r.description,
          isTriggered: r.isTriggered,
        }))}
        totalRooms={totalRooms}
        bookedRooms={bookedRooms}
        ratePerRoom={Math.round(avgRate)}
        pendingGuests={pendingGuests}
      />
    </div>
  );
}
