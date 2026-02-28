import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all schedule items for an event
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: { eventId },
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(scheduleItems);
  } catch (error) {
    console.error("Get schedule items error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule items" }, { status: 500 });
  }
}

// POST - Create new schedule item
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      eventId,
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      type,
      cost,
      paxCount,
      notes,
    } = data;

    if (!eventId || !title?.trim() || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Event ID, title, date, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:mm" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get max sort order for the date
    const maxSortOrder = await prisma.scheduleItem.findFirst({
      where: { eventId, date: new Date(date) },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const scheduleItem = await prisma.scheduleItem.create({
      data: {
        eventId,
        title: title.trim(),
        description: description || null,
        date: new Date(date),
        startTime,
        endTime,
        venue: venue || null,
        type: type || "session",
        cost: cost || null,
        paxCount: paxCount || null,
        notes: notes || null,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "schedule_item_created",
        details: `Schedule item "${title}" added for ${new Date(date).toLocaleDateString("en-IN")}`,
        actor: "Agent",
      },
    });

    return NextResponse.json(scheduleItem, { status: 201 });
  } catch (error) {
    console.error("Create schedule item error:", error);
    return NextResponse.json({ error: "Failed to create schedule item" }, { status: 500 });
  }
}

// PUT - Update schedule item
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      type,
      cost,
      paxCount,
      notes,
      sortOrder,
    } = data;

    if (!id) {
      return NextResponse.json({ error: "Schedule item ID is required" }, { status: 400 });
    }

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json({ error: "Invalid start time format" }, { status: 400 });
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json({ error: "Invalid end time format" }, { status: 400 });
    }

    const scheduleItem = await prisma.scheduleItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(venue !== undefined && { venue }),
        ...(type !== undefined && { type }),
        ...(cost !== undefined && { cost }),
        ...(paxCount !== undefined && { paxCount }),
        ...(notes !== undefined && { notes }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(scheduleItem);
  } catch (error) {
    console.error("Update schedule item error:", error);
    return NextResponse.json({ error: "Failed to update schedule item" }, { status: 500 });
  }
}

// DELETE - Remove schedule item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Schedule item ID is required" }, { status: 400 });
    }

    const item = await prisma.scheduleItem.findUnique({
      where: { id },
      select: { eventId: true, title: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Schedule item not found" }, { status: 404 });
    }

    await prisma.scheduleItem.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: item.eventId,
        action: "schedule_item_deleted",
        details: `Schedule item "${item.title}" deleted`,
        actor: "Agent",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete schedule item error:", error);
    return NextResponse.json({ error: "Failed to delete schedule item" }, { status: 500 });
  }
}
