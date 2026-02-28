import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { allocations } = await request.json();

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // allocations: Record<guestId, { floor, wing }>
    const allocationCount = Object.keys(allocations).length;
    const guestIds = Object.keys(allocations);
    
    // Verify all guests belong to this event
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds }, eventId },
      select: { id: true },
    });
    const validGuestIds = new Set(guests.map(g => g.id));
    
    for (const [guestId, alloc] of Object.entries(allocations)) {
      if (!validGuestIds.has(guestId)) {
        return NextResponse.json({ error: `Guest ${guestId} not found in this event` }, { status: 400 });
      }
      const { floor, wing } = alloc as { floor: string; wing: string };
      await prisma.guest.update({
        where: { id: guestId },
        data: {
          allocatedFloor: floor,
          allocatedWing: wing,
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "allocation_saved",
        details: `Room allocations saved for ${allocationCount} guest${allocationCount !== 1 ? "s" : ""}`,
        actor: "Agent",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Allocate error:", error);
    return NextResponse.json({ error: "Failed to save allocations" }, { status: 500 });
  }
}
