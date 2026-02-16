import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch booking details (for self-service portal & QR check-in)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: true,
        roomBlock: true,
        event: true,
        addOns: { include: { addOn: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Calculate total
    const nights = Math.ceil(
      (new Date(booking.event.checkOut).getTime() -
        new Date(booking.event.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const roomTotal = booking.roomBlock.rate * nights;
    const addOnTotal = booking.addOns.reduce(
      (sum, ba) => sum + ba.price,
      0
    );

    return NextResponse.json({
      ...booking,
      calculated: {
        nights,
        roomTotal,
        addOnTotal,
        grandTotal: roomTotal + addOnTotal,
      },
    });
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

// PATCH - Update booking (self-service modifications)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true, roomBlock: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Allow updating guest details
    if (body.guestName || body.guestEmail || body.guestPhone) {
      await prisma.guest.update({
        where: { id: booking.guestId },
        data: {
          ...(body.guestName && { name: body.guestName }),
          ...(body.guestEmail && { email: body.guestEmail }),
          ...(body.guestPhone && { phone: body.guestPhone }),
        },
      });
    }

    // Allow cancellation
    if (body.status === "cancelled") {
      // Guard against cancelling checked-in bookings
      if (booking.checkedIn) {
        return NextResponse.json({ error: "Cannot cancel a checked-in booking" }, { status: 400 });
      }

      // Guard against cancelling for past events
      if (new Date(booking.event.checkOut) < new Date()) {
        return NextResponse.json({ error: "Cannot cancel booking for a past event" }, { status: 400 });
      }

      // Only decrement if the booking was not already cancelled
      if (booking.status !== "cancelled") {
        // Wrap cancellation in transaction for atomicity
        const updated = await prisma.$transaction(async (tx) => {
          // Protect bookedQty from going negative
          const currentBlock = await tx.roomBlock.findUnique({ where: { id: booking.roomBlockId } });
          if (currentBlock && currentBlock.bookedQty > 0) {
            await tx.roomBlock.update({
              where: { id: booking.roomBlockId },
              data: { bookedQty: { decrement: 1 } },
            });
          }

          const cancelledBooking = await tx.booking.update({
            where: { id: bookingId },
            data: { status: "cancelled" },
          });

          await tx.activityLog.create({
            data: {
              eventId: booking.eventId,
              action: "booking_cancelled",
              details: `Booking ${bookingId} cancelled via self-service`,
              actor: "Guest",
            },
          });

          // Waitlist auto-promotion: notify first person on waitlist for this room block
          const waitlistEntry = await tx.waitlist.findFirst({
            where: {
              roomBlockId: booking.roomBlockId,
              status: "waiting",
            },
            orderBy: { createdAt: "asc" },
          });

          if (waitlistEntry) {
            await tx.waitlist.update({
              where: { id: waitlistEntry.id },
              data: { status: "notified" },
            });

            await tx.activityLog.create({
              data: {
                eventId: booking.eventId,
                action: "waitlist_promoted",
                details: `${waitlistEntry.guestName} promoted from waitlist — room available after cancellation`,
                actor: "System",
              },
            });
          }

          return cancelledBooking;
        });

        return NextResponse.json(updated);
      }

      // Already cancelled — return as-is
      return NextResponse.json(booking);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
