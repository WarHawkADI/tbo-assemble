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
    const limit = parseInt(searchParams.get("limit") || "50");

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

    const log = await prisma.activityLog.create({
      data: {
        eventId,
        action,
        details,
        actor: actor || "Agent",
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Activity log create error:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
