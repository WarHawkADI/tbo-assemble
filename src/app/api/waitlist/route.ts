import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Join waitlist for a sold-out room block
// GET  - List waitlist entries for an event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, roomBlockId, eventId } = body;

    if (!guestName || !roomBlockId || !eventId) {
      return NextResponse.json(
        { error: "guestName, roomBlockId, and eventId are required" },
        { status: 400 }
      );
    }

    // Verify event exists and is active
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "cancelled" || event.status === "completed") {
      return NextResponse.json({ error: "Event is no longer accepting waitlist entries" }, { status: 400 });
    }

    // Check room block exists and belongs to this event
    const roomBlock = await prisma.roomBlock.findUnique({
      where: { id: roomBlockId },
      include: { bookings: true },
    });

    if (!roomBlock) {
      return NextResponse.json({ error: "Room block not found" }, { status: 404 });
    }

    if (roomBlock.eventId !== eventId) {
      return NextResponse.json({ error: "Room block does not belong to this event" }, { status: 400 });
    }

    // Check for duplicate waitlist entry (only when email is provided)
    if (guestEmail) {
      const existing = await prisma.waitlist.findFirst({
        where: { guestEmail, roomBlockId, status: "waiting" },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Already on waitlist for this room type" },
          { status: 409 }
        );
      }
    }

    const entry = await prisma.waitlist.create({
      data: {
        guestName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        roomBlockId,
        eventId,
      },
    });

    await prisma.activityLog.create({
      data: {
        eventId,
        action: "waitlist_joined",
        details: `${guestName} joined waitlist for ${roomBlock.roomType}`,
        actor: guestName,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const entries = await prisma.waitlist.findMany({
      where: { eventId },
      include: { roomBlock: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Waitlist fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}
