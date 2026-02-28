import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all guests or filter by eventId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const group = searchParams.get("group");

    const where: {
      eventId?: string;
      status?: string;
      group?: string;
      OR?: { name?: { contains: string }; email?: { contains: string } }[];
    } = {};

    if (eventId) where.eventId = eventId;
    if (status) where.status = status;
    if (group) where.group = group;
    if (search) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s } },
        { email: { contains: s } },
      ];
    }

    const guests = await prisma.guest.findMany({
      where,
      include: {
        bookings: {
          include: { roomBlock: true, addOns: { include: { addOn: true } } },
        },
        event: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Get guests error:", error);
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }
}

// POST - Create new guest (manual add)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { eventId, name, email, phone, group, notes, proximityRequest, status } = data;

    if (!eventId || !name) {
      return NextResponse.json(
        { error: "Event ID and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate phone format - accept 7-15 digits with optional +
    if (phone) {
      const phoneClean = phone.replace(/[^\d+]/g, "");
      if (!/^\+?\d{7,15}$/.test(phoneClean)) {
        return NextResponse.json({ error: "Invalid phone number format. Please enter a valid phone number." }, { status: 400 });
      }
    }

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name,
        email: email ? email.trim().toLowerCase() : null,
        phone: phone || null,
        group: group || null,
        notes: notes || null,
        proximityRequest: proximityRequest || null,
        status: status || "invited",
        eventId,
      },
      include: { bookings: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "guest_added",
        details: `Guest "${name}" added manually${group ? ` (${group})` : ""}`,
        actor: "Agent",
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Create guest error:", error);
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 });
  }
}

// PUT - Update guest
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, email, phone, group, notes, proximityRequest, status, allocatedFloor, allocatedRoom } = data;

    if (!id) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 });
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate phone format - accept 7-15 digits with optional +
    if (phone) {
      const phoneClean = phone.replace(/[^\d+]/g, "");
      if (!/^\+?\d{7,15}$/.test(phoneClean)) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }
    }

    // Check guest exists before updating
    const existing = await prisma.guest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(phone !== undefined && { phone }),
        ...(group !== undefined && { group }),
        ...(notes !== undefined && { notes }),
        ...(proximityRequest !== undefined && { proximityRequest }),
        ...(status !== undefined && { status }),
        ...(allocatedFloor !== undefined && { allocatedFloor }),
        ...(allocatedRoom !== undefined && { allocatedRoom }),
      },
      include: { bookings: { include: { roomBlock: true } }, event: true },
    });

    // Log activity
    const changes: string[] = [];
    if (name !== undefined) changes.push("name");
    if (status !== undefined) changes.push(`status→${status}`);
    if (allocatedFloor !== undefined || allocatedRoom !== undefined) changes.push("allocation");
    await prisma.activityLog.create({
      data: {
        eventId: guest.eventId,
        action: "guest_updated",
        details: `Guest "${guest.name}" updated (${changes.join(", ") || "details"})`,
        actor: "Agent",
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Update guest error:", error);
    return NextResponse.json({ error: "Failed to update guest" }, { status: 500 });
  }
}

// DELETE - Remove guest
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 });
    }

    // Get guest info and bookings for cleanup before deletion
    const guest = await prisma.guest.findUnique({
      where: { id },
      select: { name: true, eventId: true, bookings: { select: { id: true, roomBlockId: true, status: true } } },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Use transaction to decrement bookedQty, delete bookings, delete guest, and log
    await prisma.$transaction(async (tx) => {
      // Decrement bookedQty only for non-cancelled bookings (cancelled ones were already decremented)
      for (const booking of guest.bookings) {
        if (booking.roomBlockId && booking.status !== "cancelled") {
          await tx.roomBlock.update({
            where: { id: booking.roomBlockId },
            data: { bookedQty: { decrement: 1 } },
          });
        }
      }

      // Delete associated bookings
      await tx.booking.deleteMany({ where: { guestId: id } });

      // Delete guest
      await tx.guest.delete({ where: { id } });

      // Log activity
      await tx.activityLog.create({
        data: {
          eventId: guest.eventId,
          action: "guest_removed",
          details: `Guest "${guest.name}" removed from event`,
          actor: "Agent",
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
