import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch activity log for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const logs = await prisma.activityLog.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Activity log error:", error);
    return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 });
  }
}

// POST - Add activity log entry
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { action, details, actor } = await request.json();

    // Validate required fields and sanitize
    if (!action || typeof action !== "string" || action.length > 100) {
      return NextResponse.json({ error: "Valid action is required (max 100 chars)" }, { status: 400 });
    }
    if (!details || typeof details !== "string" || details.length > 500) {
      return NextResponse.json({ error: "Valid details are required (max 500 chars)" }, { status: 400 });
    }
    const ALLOWED_ACTIONS = [
      "guest_added", "guest_updated", "guest_removed", "guests_imported",
      "booking_created", "booking_cancelled", "guest_checked_in", "bulk_checkin",
      "room_upgraded", "room_downgraded", "status_changed", "event_cloned",
      "rooming_list_exported", "discount_created", "feedback_submitted",
      "allocation_updated", "auto_allocated", "nudge_sent", "note",
    ];
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    const log = await prisma.activityLog.create({
      data: {
        eventId,
        action,
        details: details.replace(/<[^>]*>/g, ""),
        actor: (actor || "Agent").slice(0, 100),
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Activity log create error:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
