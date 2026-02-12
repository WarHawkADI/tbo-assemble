import prisma from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | TBO Assemble",
};

export default async function DashboardPage() {
  const events = await prisma.event.findMany({
    include: {
      roomBlocks: true,
      guests: { select: { id: true, status: true } },
      bookings: { select: { id: true, totalAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize events for client component
  const serializedEvents = events.map((event) => ({
    id: event.id,
    name: event.name,
    slug: event.slug,
    type: event.type,
    status: event.status,
    venue: event.venue,
    location: event.location,
    checkIn: event.checkIn.toISOString(),
    checkOut: event.checkOut.toISOString(),
    primaryColor: event.primaryColor,
    totalRooms: event.roomBlocks.reduce((s, r) => s + r.totalQty, 0),
    bookedRooms: event.roomBlocks.reduce((s, r) => s + r.bookedQty, 0),
    guestCount: event.guests.length,
    confirmedGuests: event.guests.filter((g) => g.status === "confirmed").length,
    totalRevenue: event.bookings.reduce((s, b) => s + b.totalAmount, 0),
  }));

  return (
    <div>
      <DashboardHeader />

      <DashboardClient initialEvents={serializedEvents} />
    </div>
  );
}
