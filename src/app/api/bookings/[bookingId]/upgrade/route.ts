import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Upgrade or downgrade a booking's room type
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const { newRoomBlockId, reason } = await request.json();

    if (!newRoomBlockId) {
      return NextResponse.json(
        { error: "newRoomBlockId is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, roomBlock: true, event: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Guard against upgrading cancelled bookings
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Cannot upgrade a cancelled booking" }, { status: 400 });
    }

    const newRoomBlock = await prisma.roomBlock.findUnique({
      where: { id: newRoomBlockId },
      include: { bookings: true },
    });

    if (!newRoomBlock) {
      return NextResponse.json(
        { error: "Target room block not found" },
        { status: 404 }
      );
    }

    // Verify newRoomBlockId belongs to same event
    if (newRoomBlock.eventId !== booking.eventId) {
      return NextResponse.json(
        { error: "Target room block does not belong to the same event" },
        { status: 400 }
      );
    }

    // Check capacity using bookedQty
    if (newRoomBlock.bookedQty >= newRoomBlock.totalQty) {
      return NextResponse.json(
        { error: "No availability in the target room type" },
        { status: 409 }
      );
    }

    const oldRoomType = booking.roomBlock.roomType;
    const newRoomType = newRoomBlock.roomType;
    const isUpgrade = newRoomBlock.rate > booking.roomBlock.rate;

    // Calculate new total amount based on new room rate
    const nights = Math.ceil(
      (new Date(booking.event.checkOut).getTime() -
        new Date(booking.event.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const newRoomTotal = newRoomBlock.rate * nights;
    
    // Get add-on total from existing booking add-ons
    const bookingAddOns = await prisma.bookingAddOn.findMany({
      where: { bookingId },
    });
    const addOnTotal = bookingAddOns.reduce((sum, ba) => sum + ba.price, 0);
    const newTotalAmount = newRoomTotal + addOnTotal;

    // Wrap upgrade in a transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
      // Decrement bookedQty on old room block (guard against negative)
      const oldBlock = await tx.roomBlock.findUnique({ where: { id: booking.roomBlockId } });
      if (oldBlock && oldBlock.bookedQty > 0) {
        await tx.roomBlock.update({
          where: { id: booking.roomBlockId },
          data: { bookedQty: { decrement: 1 } },
        });
      }

      // Increment bookedQty on new room block
      await tx.roomBlock.update({
        where: { id: newRoomBlockId },
        data: { bookedQty: { increment: 1 } },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { roomBlockId: newRoomBlockId, totalAmount: newTotalAmount },
        include: { guest: true, roomBlock: true },
      });

      await tx.activityLog.create({
        data: {
          eventId: booking.eventId,
          action: isUpgrade ? "room_upgraded" : "room_downgraded",
          details: `${booking.guest.name}: ${oldRoomType} → ${newRoomType}${reason ? ` (${reason})` : ""}`,
          actor: "Agent",
        },
      });

      return updatedBooking;
    });

    return NextResponse.json({
      success: true,
      booking: updated,
      change: {
        from: oldRoomType,
        to: newRoomType,
        type: isUpgrade ? "upgrade" : "downgrade",
        rateDifference: newRoomBlock.rate - booking.roomBlock.rate,
        oldAmount: booking.totalAmount,
        newAmount: newRoomTotal,
      },
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade room" },
      { status: 500 }
    );
  }
}
