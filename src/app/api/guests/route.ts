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
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
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

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create guest
    const guest = await prisma.guest.create({
      data: {
        name,
        email: email || null,
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

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
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

    // Get guest info for activity log before deletion
    const guest = await prisma.guest.findUnique({
      where: { id },
      select: { name: true, eventId: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Delete associated bookings first
    await prisma.booking.deleteMany({ where: { guestId: id } });

    // Delete guest
    await prisma.guest.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: guest.eventId,
        action: "guest_removed",
        details: `Guest "${guest.name}" removed from event`,
        actor: "Agent",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guest error:", error);
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 });
  }
}
