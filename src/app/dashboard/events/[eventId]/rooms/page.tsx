import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoomOccupantsGrid } from "@/components/dashboard/room-occupants";

export const dynamic = "force-dynamic";

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      guests: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      bookings: {
        include: {
          guest: true,
          roomBlock: true,
          occupants: {
            include: {
              guest: true,
            },
          },
        },
        where: {
          status: { not: "cancelled" },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) return notFound();

  // Transform bookings for the component
  const bookingsForGrid = event.bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guest.name,
    roomType: booking.roomBlock?.roomType || "Standard",
    roomNumber: booking.roomBlock?.floor 
      ? `${booking.roomBlock.floor}${booking.roomBlock.wing || ""}` 
      : null,
    status: booking.status,
    occupants: booking.occupants.map((occ) => ({
      id: occ.id,
      bookingId: occ.bookingId,
      guestId: occ.guestId,
      guest: {
        id: occ.guest.id,
        name: occ.guest.name,
        email: occ.guest.email,
        phone: occ.guest.phone,
      },
      isPrimary: occ.isPrimary,
    })),
  }));

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
          Room Assignments
        </h1>
        <p className="text-gray-500 dark:text-zinc-400">
          Manage guest assignments to rooms for {event.name}
        </p>
      </div>

      {/* Room Occupants Grid Component */}
      <RoomOccupantsGrid
        bookings={bookingsForGrid}
        guests={event.guests}
      />
    </div>
  );
}
