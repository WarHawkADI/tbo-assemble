import prisma from "@/lib/db";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">Dashboard</h1>
          <p className="text-base text-gray-500 dark:text-zinc-400 mt-1">
            Manage your group travel events and track performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
          </div>
          <div className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400">
            Welcome back, <span className="font-semibold text-gray-900 dark:text-zinc-100">Rajesh</span>
          </div>
        </div>
      </div>

      <DashboardClient initialEvents={serializedEvents} />
    </div>
  );
}
