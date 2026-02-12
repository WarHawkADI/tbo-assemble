import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["active"],
  active: ["completed", "cancelled"],
  completed: ["active"], // Allow reactivation
  cancelled: ["draft"],  // Allow restart
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status: true, name: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[event.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from '${event.status}' to '${status}'`,
          allowedTransitions: allowed,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    // Log the status change
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "status_changed",
        details: `Event status changed from '${event.status}' to '${status}'`,
        actor: "Agent",
      },
    });

    return NextResponse.json({
      event: updated,
      message: `Event status changed to '${status}'`,
      previousStatus: event.status,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
