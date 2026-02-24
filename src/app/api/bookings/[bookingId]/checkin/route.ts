import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Mark a booking as checked in (QR scan / manual entry)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, event: true, roomBlock: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.checkedIn) {
      return NextResponse.json(
        {
          error: "Already checked in",
          checkedInAt: booking.checkedInAt,
        },
        { status: 409 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot check in a cancelled booking" },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        status: "confirmed",
      },
      include: { guest: true, roomBlock: true },
    });

    // Update guest status to checked-in
    await prisma.guest.update({
      where: { id: booking.guest.id },
      data: { status: "checked-in" },
    });

    await prisma.activityLog.create({
      data: {
        eventId: booking.eventId,
        action: "guest_checked_in",
        details: `${booking.guest.name} checked in — ${booking.roomBlock.roomType}`,
        actor: "Front Desk",
      },
    });

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `${booking.guest.name} checked in successfully`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
