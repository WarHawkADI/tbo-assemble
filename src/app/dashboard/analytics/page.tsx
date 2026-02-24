import Link from "next/link";
import prisma from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { ComparativeAnalytics } from "@/components/dashboard/comparative-analytics";
import { PdfExportButton } from "@/components/dashboard/pdf-export";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics | TBO Assemble",
};

export default async function AnalyticsPage() {
  const events = await prisma.event.findMany({
    include: {
      guests: true,
      roomBlocks: { include: { bookings: true } },
      bookings: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const comparisons = events.map((event) => {
    const totalRooms = event.roomBlocks.reduce(
      (s, rb) => s + rb.totalQty,
      0
    );
    const bookedRooms = event.roomBlocks.reduce(
      (s, rb) => s + rb.bookedQty,
      0
    );
    const confirmedGuests = event.guests.filter(
      (g) => g.status === "confirmed"
    ).length;

    const nights = Math.ceil(
      (new Date(event.checkOut).getTime() -
        new Date(event.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const revenue = event.roomBlocks.reduce(
      (s, rb) => s + rb.bookings.filter((b: { status?: string }) => b.status !== "cancelled").length * rb.rate * nights,
      0
    );

    return {
      id: event.id,
      name: event.name,
      totalGuests: event.guests.length,
      confirmedGuests,
      totalRooms,
      bookedRooms,
      revenue,
      occupancy: totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0,
      conversionRate:
        event.guests.length > 0
          ? Math.round((confirmedGuests / event.guests.length) * 100)
          : 0,
    };
  });

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Compare performance across all your events
          </p>
        </div>
        <PdfExportButton events={comparisons} />
      </div>

      <ComparativeAnalytics events={comparisons} />
    </div>
  );
}
