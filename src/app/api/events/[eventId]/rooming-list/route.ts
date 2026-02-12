import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { escapeCsv } from "@/lib/utils";

// GET - Export rooming list as CSV (hotel operations format)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: {
          where: { status: "confirmed" },
          include: {
            bookings: { include: { roomBlock: true } },
          },
          orderBy: [{ allocatedFloor: "asc" }, { group: "asc" }, { name: "asc" }],
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const headers = [
      "Guest Name",
      "Room Type",
      "Rate/Night",
      "Floor",
      "Wing",
      "Check-In",
      "Check-Out",
      "Group",
      "Email",
      "Phone",
      "Proximity Request",
      "Special Notes",
      "Booking ID",
    ];

    const checkIn = new Date(event.checkIn).toLocaleDateString("en-IN");
    const checkOut = new Date(event.checkOut).toLocaleDateString("en-IN");

    const rows = event.guests.map((g) => {
      const booking = g.bookings[0];
      return [
        g.name,
        booking?.roomBlock?.roomType || "Unassigned",
        booking?.roomBlock?.rate?.toString() || "",
        g.allocatedFloor || "",
        g.allocatedWing || "",
        checkIn,
        checkOut,
        g.group || "",
        g.email || "",
        g.phone || "",
        g.proximityRequest || "",
        g.notes || "",
        booking?.id || "",
      ];
    });

    const csv = [
      `ROOMING LIST - ${event.name}`,
      `Venue: ${event.venue}, ${event.location}`,
      `Dates: ${checkIn} to ${checkOut}`,
      `Generated: ${new Date().toLocaleDateString("en-IN")}`,
      "",
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          const safe = escapeCsv(String(cell));
          // Always quote for CSV consistency
          if (safe.startsWith('"')) return safe;
          return `"${safe.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ].join("\n");

    await prisma.activityLog.create({
      data: {
        eventId,
        action: "rooming_list_exported",
        details: `Rooming list exported with ${event.guests.length} guests`,
        actor: "Agent",
      },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="rooming-list-${event.slug}.csv"`,
      },
    });
  } catch (error) {
    console.error("Rooming list error:", error);
    return NextResponse.json({ error: "Failed to generate rooming list" }, { status: 500 });
  }
}
