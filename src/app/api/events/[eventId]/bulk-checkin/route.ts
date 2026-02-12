import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Bulk check-in multiple bookings at once
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { bookingIds } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "bookingIds array is required" },
        { status: 400 }
      );
    }

    const results: { id: string; status: "checked_in" | "already_checked_in" | "cancelled" | "error"; guest?: string }[] = [];

    for (const bookingId of bookingIds) {
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { guest: true, roomBlock: true },
        });

        if (!booking || booking.eventId !== eventId) {
          results.push({ id: bookingId, status: "error" });
          continue;
        }

        // Reject cancelled bookings
        if (booking.status === "cancelled") {
          results.push({ id: bookingId, status: "cancelled", guest: booking.guest.name });
          continue;
        }

        if (booking.checkedIn) {
          results.push({ id: bookingId, status: "already_checked_in", guest: booking.guest.name });
          continue;
        }

        await prisma.booking.update({
          where: { id: bookingId },
          data: { checkedIn: true, checkedInAt: new Date() },
        });

        results.push({ id: bookingId, status: "checked_in", guest: booking.guest.name });
      } catch {
        results.push({ id: bookingId, status: "error" });
      }
    }

    const checkedIn = results.filter((r) => r.status === "checked_in").length;

    if (checkedIn > 0) {
      await prisma.activityLog.create({
        data: {
          eventId,
          action: "bulk_checkin",
          details: `Bulk check-in: ${checkedIn} guests checked in`,
          actor: "Agent",
        },
      });
    }

    return NextResponse.json({
      total: bookingIds.length,
      checkedIn,
      alreadyCheckedIn: results.filter((r) => r.status === "already_checked_in").length,
      cancelled: results.filter((r) => r.status === "cancelled").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    });
  } catch (error) {
    console.error("Bulk check-in error:", error);
    return NextResponse.json({ error: "Failed to perform bulk check-in" }, { status: 500 });
  }
}
