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
    const nights = Math.ceil(
      (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

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

    // Group summary by room type
    const roomTypeSummary = new Map<string, { count: number; rate: number; revenue: number }>();
    for (const g of event.guests) {
      const booking = g.bookings[0];
      const roomType = booking?.roomBlock?.roomType || "Unassigned";
      const rate = booking?.roomBlock?.rate || 0;
      const existing = roomTypeSummary.get(roomType) || { count: 0, rate, revenue: 0 };
      existing.count++;
      existing.revenue += rate * nights;
      roomTypeSummary.set(roomType, existing);
    }

    // Group summary by floor/wing
    const zoneSummary = new Map<string, number>();
    for (const g of event.guests) {
      const zone = g.allocatedFloor && g.allocatedWing
        ? `Floor ${g.allocatedFloor} - ${g.allocatedWing} Wing`
        : "Unallocated";
      zoneSummary.set(zone, (zoneSummary.get(zone) || 0) + 1);
    }

    const totalRevenue = Array.from(roomTypeSummary.values()).reduce((s, v) => s + v.revenue, 0);

    const csv = [
      `ROOMING LIST - ${event.name}`,
      `Venue: ${event.venue}, ${event.location}`,
      `Dates: ${checkIn} to ${checkOut} (${nights} nights)`,
      `Total Guests: ${event.guests.length}`,
      `Generated: ${new Date().toLocaleDateString("en-IN")} at ${new Date().toLocaleTimeString("en-IN")}`,
      "",
      "=== ROOM TYPE SUMMARY ===",
      "Room Type,Count,Rate/Night,Total Revenue",
      ...Array.from(roomTypeSummary.entries()).map(([type, data]) =>
        `"${type}",${data.count},${data.rate},"₹${data.revenue.toLocaleString("en-IN")}"`
      ),
      `"TOTAL",${event.guests.length},,"₹${totalRevenue.toLocaleString("en-IN")}"`,
      "",
      "=== ZONE ALLOCATION SUMMARY ===",
      "Zone,Guest Count",
      ...Array.from(zoneSummary.entries()).map(([zone, count]) =>
        `"${zone}",${count}`
      ),
      "",
      "=== GUEST DETAILS ===",
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => escapeCsv(String(cell))).join(",")
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
