import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all occupants for a booking
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const occupants = await prisma.roomOccupant.findMany({
      where: { bookingId },
      include: { guest: true },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(occupants);
  } catch (error) {
    console.error("Get room occupants error:", error);
    return NextResponse.json({ error: "Failed to fetch room occupants" }, { status: 500 });
  }
}

// POST - Add occupant to room
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { bookingId, guestId, isPrimary } = data;

    if (!bookingId || !guestId) {
      return NextResponse.json(
        { error: "Booking ID and guest ID are required" },
        { status: 400 }
      );
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, event: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify guest exists
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Check if guest is already an occupant in this booking
    const existingOccupant = await prisma.roomOccupant.findFirst({
      where: { bookingId, guestId },
    });

    if (existingOccupant) {
      return NextResponse.json(
        { error: "Guest is already assigned to this room" },
        { status: 400 }
      );
    }

    const occupant = await prisma.roomOccupant.create({
      data: {
        bookingId,
        guestId,
        isPrimary: isPrimary || false,
      },
      include: { guest: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: booking.eventId,
        action: "room_occupant_added",
        details: `${guest.name} added to ${booking.guest.name}'s room`,
        actor: "Agent",
      },
    });

    return NextResponse.json(occupant, { status: 201 });
  } catch (error) {
    console.error("Add room occupant error:", error);
    return NextResponse.json({ error: "Failed to add room occupant" }, { status: 500 });
  }
}

// PUT - Update occupant (change primary status)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, isPrimary } = data;

    if (!id) {
      return NextResponse.json({ error: "Occupant ID is required" }, { status: 400 });
    }

    const occupant = await prisma.roomOccupant.update({
      where: { id },
      data: {
        ...(isPrimary !== undefined && { isPrimary }),
      },
      include: { guest: true },
    });

    return NextResponse.json(occupant);
  } catch (error) {
    console.error("Update room occupant error:", error);
    return NextResponse.json({ error: "Failed to update room occupant" }, { status: 500 });
  }
}

// DELETE - Remove occupant from room
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Occupant ID is required" }, { status: 400 });
    }

    const occupant = await prisma.roomOccupant.findUnique({
      where: { id },
      include: { guest: true, booking: { include: { guest: true, event: true } } },
    });

    if (!occupant) {
      return NextResponse.json({ error: "Occupant not found" }, { status: 404 });
    }

    await prisma.roomOccupant.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: occupant.booking.eventId,
        action: "room_occupant_removed",
        details: `${occupant.guest.name} removed from ${occupant.booking.guest.name}'s room`,
        actor: "Agent",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete room occupant error:", error);
    return NextResponse.json({ error: "Failed to delete room occupant" }, { status: 500 });
  }
}

// PATCH - Bulk add occupants to a booking
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { bookingId, guestIds } = data;

    if (!bookingId || !Array.isArray(guestIds)) {
      return NextResponse.json(
        { error: "Booking ID and guestIds array are required" },
        { status: 400 }
      );
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const created: string[] = [];
    const errors: { guestId: string; error: string }[] = [];

    for (const guestId of guestIds) {
      if (!guestId) {
        errors.push({ guestId: "Unknown", error: "Guest ID is required" });
        continue;
      }

      // Check if guest exists
      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
      });

      if (!guest) {
        errors.push({ guestId, error: "Guest not found" });
        continue;
      }

      // Check if already assigned
      const existing = await prisma.roomOccupant.findFirst({
        where: { bookingId, guestId },
      });

      if (existing) {
        errors.push({ guestId, error: "Guest already assigned to this room" });
        continue;
      }

      try {
        await prisma.roomOccupant.create({
          data: {
            bookingId,
            guestId,
            isPrimary: false,
          },
        });
        created.push(guest.name);
      } catch (e) {
        errors.push({ guestId, error: String(e) });
      }
    }

    // Log activity
    if (created.length > 0) {
      await prisma.activityLog.create({
        data: {
          eventId: booking.eventId,
          action: "room_occupants_bulk_added",
          details: `${created.length} occupants added to room`,
          actor: "Agent",
        },
      });
    }

    return NextResponse.json({
      success: true,
      added: created.length,
      failed: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("Bulk add room occupants error:", error);
    return NextResponse.json({ error: "Failed to add room occupants" }, { status: 500 });
  }
}
