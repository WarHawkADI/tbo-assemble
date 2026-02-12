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

    // Check capacity
    if (newRoomBlock.bookings.length >= newRoomBlock.totalQty) {
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

    // Decrement bookedQty on old room block
    await prisma.roomBlock.update({
      where: { id: booking.roomBlockId },
      data: { bookedQty: { decrement: 1 } },
    });

    // Increment bookedQty on new room block
    await prisma.roomBlock.update({
      where: { id: newRoomBlockId },
      data: { bookedQty: { increment: 1 } },
    });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { roomBlockId: newRoomBlockId, totalAmount: newTotalAmount },
      include: { guest: true, roomBlock: true },
    });

    await prisma.activityLog.create({
      data: {
        eventId: booking.eventId,
        action: isUpgrade ? "room_upgraded" : "room_downgraded",
        details: `${booking.guest.name}: ${oldRoomType} → ${newRoomType}${reason ? ` (${reason})` : ""}`,
        actor: "Agent",
      },
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
        newAmount: newTotalAmount,
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
