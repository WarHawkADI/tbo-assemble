import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST - Import guests from CSV data
export async function POST(request: Request) {
  try {
    const { eventId, guests } = await request.json();

    if (!eventId || !guests || !Array.isArray(guests)) {
      return NextResponse.json(
        { error: "Event ID and guests array are required" },
        { status: 400 }
      );
    }

    // Limit import size to prevent OOM
    if (guests.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 guests can be imported at once" },
        { status: 400 }
      );
    }

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const created: string[] = [];
    const errors: { row: number; error: string }[] = [];
    const guestsToCreate: { name: string; email: string | null; phone: string | null; group: string | null; notes: string | null; proximityRequest: string | null; status: string; eventId: string }[] = [];

    for (let i = 0; i < guests.length; i++) {
      const row = guests[i];
      const name = row.name || row.Name || row.guest_name || row["Guest Name"];
      if (!name) {
        errors.push({ row: i + 1, error: "Missing name" });
        continue;
      }
      guestsToCreate.push({
        name,
        email: row.email || row.Email || row["E-mail"] || null,
        phone: row.phone || row.Phone || row["Phone Number"] || null,
        group: row.group || row.Group || row["Guest Group"] || null,
        notes: row.notes || row.Notes || null,
        proximityRequest: row.proximity || row.Proximity || row["Proximity Request"] || null,
        status: "invited",
        eventId,
      });
      created.push(name);
    }

    // Batch create all guests in a single transaction
    if (guestsToCreate.length > 0) {
      try {
        await prisma.$transaction(
          guestsToCreate.map((g) => prisma.guest.create({ data: g }))
        );
      } catch (err) {
        // Fallback: if batch fails, report as error
        return NextResponse.json({ error: "Failed to import guests: " + String(err) }, { status: 500 });
      }
    }

    // Log activity for the import
    if (created.length > 0) {
      await prisma.activityLog.create({
        data: {
          eventId,
          action: "guests_imported",
          details: `${created.length} guest${created.length !== 1 ? "s" : ""} imported via CSV${errors.length > 0 ? ` (${errors.length} failed)` : ""}`,
          actor: "Agent",
        },
      });
    }

    return NextResponse.json({
      success: true,
      imported: created.length,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    console.error("Import guests error:", error);
    return NextResponse.json({ error: "Failed to import guests" }, { status: 500 });
  }
}

// GET - Export guests as CSV
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const guests = await prisma.guest.findMany({
      where: { eventId },
      include: {
        bookings: { include: { roomBlock: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV content
    const headers = ["Name", "Email", "Phone", "Group", "Status", "Room Type", "Allocated Floor", "Allocated Room", "Proximity Request", "Notes"];
    const rows = guests.map((g) => [
      g.name,
      g.email || "",
      g.phone || "",
      g.group || "",
      g.status,
      g.bookings[0]?.roomBlock?.roomType || "",
      g.allocatedFloor || "",
      g.allocatedRoom || "",
      g.proximityRequest || "",
      g.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="guests-${eventId}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export guests error:", error);
    return NextResponse.json({ error: "Failed to export guests" }, { status: 500 });
  }
}
