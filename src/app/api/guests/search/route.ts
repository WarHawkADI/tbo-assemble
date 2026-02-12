import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Search guests across all events (global guest search)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const guests = await prisma.guest.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      include: {
        event: { select: { id: true, name: true, slug: true } },
        bookings: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            roomBlock: { select: { roomType: true } },
          },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Guest search error:", error);
    return NextResponse.json({ error: "Failed to search guests" }, { status: 500 });
  }
}
