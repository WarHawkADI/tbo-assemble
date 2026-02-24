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
      specialRequests,
    } = await request.json();

    // Validate guestName is non-empty
    if (!guestName || !guestName.trim()) {
      return NextResponse.json({ error: "Guest name is required" }, { status: 400 });
    }

    // Validate eventId exists and event is active/published
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !["active", "published"].includes(event.status)) {
      return NextResponse.json({ error: "Event not available for booking" }, { status: 400 });
    }

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

    // Pre-validate room block exists
    const roomBlock = await prisma.roomBlock.findUnique({ where: { id: roomBlockId } });
    if (!roomBlock) {
      return NextResponse.json({ error: "Room type not found." }, { status: 400 });
    }

    // Server-side price calculation: compute total from room rate + add-ons
    const nights = Math.ceil(
      (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    const computedRoomTotal = roomBlock.rate * nights;

    // Calculate add-on total server-side
    let computedAddOnTotal = 0;
    if (selectedAddOns && selectedAddOns.length > 0) {
      const validAddOns = await prisma.addOn.findMany({
        where: { id: { in: selectedAddOns }, eventId },
      });
      if (validAddOns.length !== selectedAddOns.length) {
        return NextResponse.json(
          { error: "One or more selected add-ons do not belong to this event" },
          { status: 400 }
        );
      }
      computedAddOnTotal = validAddOns.reduce((sum, a) => sum + (a.isIncluded ? 0 : a.price), 0);
    }

    const serverComputedTotal = computedRoomTotal + computedAddOnTotal;

    // Wrap booking creation in a transaction — availability check INSIDE to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Re-check room availability inside transaction (prevents double-booking)
      const freshRoomBlock = await tx.roomBlock.findUnique({ where: { id: roomBlockId } });
      if (!freshRoomBlock || freshRoomBlock.bookedQty >= freshRoomBlock.totalQty) {
        throw new Error("SOLD_OUT");
      }

      // Apply discount rules inside transaction for accurate count
      const currentBookedCount = freshRoomBlock.bookedQty + 1;
      const discountRules = await tx.discountRule.findMany({
        where: { eventId, isActive: true },
        orderBy: { minRooms: "desc" },
      });
      const applicableRule = discountRules.find((r: { minRooms: number }) => currentBookedCount >= r.minRooms);
      const discountPct = applicableRule ? applicableRule.discountPct : 0;
      const finalAmount = discountPct > 0
        ? Math.round(serverComputedTotal * (1 - discountPct / 100))
        : serverComputedTotal;

      // Create guest (save specialRequests to notes)
      const guest = await tx.guest.create({
        data: {
          name: guestName,
          email: guestEmail || null,
          phone: guestPhone || null,
          group: guestGroup || null,
          proximityRequest: proximityRequest || null,
          notes: specialRequests || null,
          status: "confirmed",
          eventId,
        },
      });

      // Create booking (with discount applied)
      const booking = await tx.booking.create({
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
          const addOn = await tx.addOn.findUnique({ where: { id: addOnId } });
          if (addOn) {
            await tx.bookingAddOn.create({
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
      await tx.roomBlock.update({
        where: { id: roomBlockId },
        data: {
          bookedQty: { increment: 1 },
        },
      });

      return { guest, booking };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "booking_created",
        details: `${guestName} booked ${result.booking.id.slice(0, 8)} — ₹${result.booking.totalAmount.toLocaleString("en-IN")}`,
        actor: guestName,
      },
    });

    return NextResponse.json({
      success: true,
      booking: { id: result.booking.id },
      bookingId: result.booking.id,
      guestId: result.guest.id,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SOLD_OUT") {
      return NextResponse.json(
        { error: "This room type is no longer available." },
        { status: 400 }
      );
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
