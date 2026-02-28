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

    // Limit batch size
    if (bookingIds.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 bookings can be checked in at once" },
        { status: 400 }
      );
    }

    // Verify event exists and is active
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "cancelled" || event.status === "draft") {
      return NextResponse.json({ 
        error: `Cannot check in guests for an event with status: ${event.status}` 
      }, { status: 400 });
    }

    // Fetch all bookings at once instead of one-by-one (fix N+1)
    const allBookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
      include: { guest: true, roomBlock: true },
    });
    const bookingMap = new Map(allBookings.map((b) => [b.id, b]));

    const results: { id: string; status: "checked_in" | "already_checked_in" | "cancelled" | "error"; guest?: string }[] = [];
    const toCheckIn: string[] = [];
    const guestIdsToUpdate: string[] = [];

    for (const bookingId of bookingIds) {
      const booking = bookingMap.get(bookingId);

      if (!booking || booking.eventId !== eventId) {
        results.push({ id: bookingId, status: "error" });
        continue;
      }

      if (booking.status === "cancelled") {
        results.push({ id: bookingId, status: "cancelled", guest: booking.guest.name });
        continue;
      }

      if (booking.checkedIn) {
        results.push({ id: bookingId, status: "already_checked_in", guest: booking.guest.name });
        continue;
      }

      toCheckIn.push(bookingId);
      guestIdsToUpdate.push(booking.guestId);
      results.push({ id: bookingId, status: "checked_in", guest: booking.guest.name });
    }

    // Batch update all bookings and guests in a transaction
    if (toCheckIn.length > 0) {
      await prisma.$transaction([
        prisma.booking.updateMany({
          where: { id: { in: toCheckIn } },
          data: { checkedIn: true, checkedInAt: new Date() },
        }),
        prisma.guest.updateMany({
          where: { id: { in: guestIdsToUpdate } },
          data: { status: "checked-in" },
        }),
      ]);
    }

    const checkedIn = toCheckIn.length;

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
