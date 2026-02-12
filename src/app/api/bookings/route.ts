import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const {
      eventId,
      roomBlockId,
      guestName,
      guestEmail,
      guestPhone,
      guestGroup,
      proximityRequest,
      selectedAddOns,
      totalAmount,
    } = await request.json();

    // Duplicate booking prevention: check if this email already has a booking for this event
    if (guestEmail) {
      const existingGuest = await prisma.guest.findFirst({
        where: {
          email: guestEmail,
          eventId,
          status: "confirmed",
          bookings: { some: {} },
        },
      });
      if (existingGuest) {
        return NextResponse.json(
          { error: "A booking with this email already exists for this event." },
          { status: 409 }
        );
      }
    }

    // Check room availability
    const roomBlock = await prisma.roomBlock.findUnique({ where: { id: roomBlockId } });
    if (!roomBlock || roomBlock.bookedQty >= roomBlock.totalQty) {
      return NextResponse.json(
        { error: "This room type is no longer available." },
        { status: 400 }
      );
    }

    // Apply discount rules
    const currentBookedCount = roomBlock.bookedQty + 1; // including this booking
    const discountRules = await prisma.discountRule.findMany({
      where: { eventId, isActive: true },
      orderBy: { minRooms: "desc" },
    });
    const applicableRule = discountRules.find((r) => currentBookedCount >= r.minRooms);
    const discountPct = applicableRule ? applicableRule.discountPct : 0;
    const finalAmount = discountPct > 0
      ? Math.round(totalAmount * (1 - discountPct / 100))
      : totalAmount;

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name: guestName,
        email: guestEmail || null,
        phone: guestPhone || null,
        group: guestGroup || null,
        proximityRequest: proximityRequest || null,
        status: "confirmed",
        eventId,
      },
    });

    // Create booking (with discount applied)
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        eventId,
        roomBlockId,
        totalAmount: finalAmount,
        status: "confirmed",
      },
    });

    // Create booking add-ons
    if (selectedAddOns && selectedAddOns.length > 0) {
      for (const addOnId of selectedAddOns) {
        const addOn = await prisma.addOn.findUnique({ where: { id: addOnId } });
        if (addOn) {
          await prisma.bookingAddOn.create({
            data: {
              bookingId: booking.id,
              addOnId,
              price: addOn.isIncluded ? 0 : addOn.price,
            },
          });
        }
      }
    }

    // Update room block booked count
    await prisma.roomBlock.update({
      where: { id: roomBlockId },
      data: {
        bookedQty: { increment: 1 },
      },
    });

    // Log activity
    const discountNote = discountPct > 0 ? ` (${discountPct}% discount applied)` : "";
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "booking_created",
        details: `${guestName} booked ${booking.id.slice(0, 8)} — ₹${finalAmount.toLocaleString("en-IN")}${discountNote}`,
        actor: guestName,
      },
    });

    return NextResponse.json({
      success: true,
      booking: { id: booking.id },
      bookingId: booking.id,
      guestId: guest.id,
      discount: discountPct > 0 ? { percent: discountPct, originalAmount: totalAmount, finalAmount } : null,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
