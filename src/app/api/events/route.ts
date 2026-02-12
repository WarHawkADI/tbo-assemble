import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        roomBlocks: true,
        guests: true,
        bookings: true,
        attritionRules: true,
        addOns: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { contract, invite } = data;

    // Ensure we have a demo agent
    let agent = await prisma.agent.findFirst();
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          name: "Demo Agent",
          email: "agent@tbo.com",
          password: "demo123",
          company: "TBO Travel",
        },
      });
    }

    const eventName = invite?.eventName || "New Event";
    const slug = slugify(eventName) + "-" + Date.now().toString(36);

    // Create event
    const event = await prisma.event.create({
      data: {
        name: eventName,
        slug,
        type: invite?.eventType || "wedding",
        venue: contract?.venue || "Venue TBD",
        location: contract?.location || "Location TBD",
        checkIn: new Date(contract?.checkIn || Date.now()),
        checkOut: new Date(contract?.checkOut || Date.now() + 3 * 86400000),
        description: invite?.description || "",
        primaryColor: invite?.primaryColor || "#1e40af",
        secondaryColor: invite?.secondaryColor || "#f0f9ff",
        accentColor: invite?.accentColor || "#3b82f6",
        agentId: agent.id,
        status: "active",
      },
    });

    // Create room blocks
    if (contract?.rooms) {
      for (const room of contract.rooms) {
        await prisma.roomBlock.create({
          data: {
            roomType: room.roomType,
            rate: room.rate,
            totalQty: room.quantity,
            bookedQty: 0,
            floor: room.floor || null,
            wing: room.wing || null,
            hotelName: room.hotelName || null,
            eventId: event.id,
          },
        });
      }
    }

    // Create add-ons
    if (contract?.addOns) {
      for (const addon of contract.addOns) {
        await prisma.addOn.create({
          data: {
            name: addon.name,
            price: addon.price,
            isIncluded: addon.isIncluded,
            eventId: event.id,
          },
        });
      }
    }

    // Create attrition rules
    if (contract?.attritionRules) {
      for (const rule of contract.attritionRules) {
        await prisma.attritionRule.create({
          data: {
            releaseDate: new Date(rule.releaseDate),
            releasePercent: rule.releasePercent,
            description: rule.description,
            eventId: event.id,
          },
        });
      }
    }

    const fullEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        roomBlocks: true,
        addOns: true,
        attritionRules: true,
      },
    });

    return NextResponse.json(fullEvent);
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
