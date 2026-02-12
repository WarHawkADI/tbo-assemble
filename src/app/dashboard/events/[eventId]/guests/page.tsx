import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";
import { GuestManagement } from "@/components/dashboard/guest-management";

export const dynamic = "force-dynamic";

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      guests: {
        include: { bookings: { include: { roomBlock: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) return notFound();

  // Serialize guests for client component
  const serializedGuests = event.guests.map((g) => ({
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    group: g.group,
    status: g.status,
    proximityRequest: g.proximityRequest,
    notes: g.notes,
    allocatedFloor: g.allocatedFloor,
    allocatedRoom: g.allocatedRoom,
    bookings: g.bookings.map((b) => ({
      roomBlock: b.roomBlock ? { roomType: b.roomBlock.roomType } : null,
    })),
  }));

  return (
    <div className="animate-fade-in">
      <Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {event.name}
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" /> Guest List
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Manage guests for {event.name}
          </p>
        </div>
      </div>

      <GuestManagement
        eventId={eventId}
        initialGuests={serializedGuests}
        eventName={event.name}
      />
    </div>
  );
}
