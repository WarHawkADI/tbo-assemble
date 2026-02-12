import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { GripVertical, ArrowLeft } from "lucide-react";
import AllocatorClient from "@/components/dashboard/allocator-client";

export const dynamic = "force-dynamic";

export default async function AllocatorPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      guests: true,
      roomBlocks: true,
    },
  });

  if (!event) return notFound();

  return (
    <div>
      <Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {event.name}
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <GripVertical className="h-6 w-6 text-purple-600" />
          Visual Proximity Allocator
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Drag and drop guests to floors and wings — {event.name}
        </p>
      </div>

      <AllocatorClient
        guests={event.guests.map((g) => ({
          id: g.id,
          name: g.name,
          group: g.group,
          status: g.status,
          proximityRequest: g.proximityRequest,
          allocatedFloor: g.allocatedFloor,
          allocatedWing: g.allocatedWing,
        }))}
        roomBlocks={event.roomBlocks.map((r) => ({
          id: r.id,
          roomType: r.roomType,
          floor: r.floor,
          wing: r.wing,
          totalQty: r.totalQty,
          bookedQty: r.bookedQty,
        }))}
        eventId={eventId}
      />
    </div>
  );
}
