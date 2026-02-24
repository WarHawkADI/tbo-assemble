import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Search events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const slug = searchParams.get("slug");

    const where: {
      status?: string;
      type?: string;
      slug?: string;
      OR?: { name?: { contains: string }; venue?: { contains: string }; location?: { contains: string } }[];
    } = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (slug) where.slug = slug;
    if (query) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q } },
        { venue: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        roomBlocks: true,
        guests: { select: { id: true, status: true } },
        bookings: { select: { id: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add computed stats
    const results = events.map((event) => ({
      id: event.id,
      name: event.name,
      slug: event.slug,
      type: event.type,
      status: event.status,
      venue: event.venue,
      location: event.location,
      checkIn: event.checkIn,
      checkOut: event.checkOut,
      primaryColor: event.primaryColor,
      totalRooms: event.roomBlocks.reduce((s, r) => s + r.totalQty, 0),
      bookedRooms: event.roomBlocks.reduce((s, r) => s + r.bookedQty, 0),
      guestCount: event.guests.length,
      confirmedGuests: event.guests.filter((g) => g.status === "confirmed").length,
      totalRevenue: event.bookings.reduce((s, b) => s + b.totalAmount, 0),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search events error:", error);
    return NextResponse.json({ error: "Failed to search events" }, { status: 500 });
  }
}
