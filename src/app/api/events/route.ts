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

    // Date validation — guard against empty strings which produce Invalid Date
    const checkInDate = contract?.checkIn ? new Date(contract.checkIn) : new Date(Date.now());
    const checkOutDate = contract?.checkOut ? new Date(contract.checkOut) : new Date(Date.now() + 3 * 86400000);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
      return NextResponse.json({ error: "Check-in date must be before check-out date" }, { status: 400 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDay = new Date(checkInDate);
    checkInDay.setHours(0, 0, 0, 0);
    if (checkInDay < today) {
      return NextResponse.json({ error: "Check-in date cannot be in the past" }, { status: 400 });
    }

    // Rate validation — ensure room rates and quantities are positive numbers
    if (contract?.rooms) {
      for (const room of contract.rooms) {
        if (!room.rate || room.rate <= 0 || !room.quantity || room.quantity <= 0) {
          return NextResponse.json({ error: "Room rates and quantities must be positive numbers" }, { status: 400 });
        }
      }
    }

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

    const eventName = invite?.eventName || contract?.eventName || "New Event";
    const slug = slugify(eventName) + "-" + Date.now().toString(36);

    // Wrap entire creation in a transaction for atomicity
    const fullEvent = await prisma.$transaction(async (tx) => {
      // Create event
      const event = await tx.event.create({
        data: {
          name: eventName,
          slug,
          type: invite?.eventType || contract?.eventType || "wedding",
          venue: contract?.venue || "Venue TBD",
          location: contract?.location || "Location TBD",
          checkIn: checkInDate,
          checkOut: checkOutDate,
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
          await tx.roomBlock.create({
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
          await tx.addOn.create({
            data: {
              name: addon.name,
              price: addon.price,
              isIncluded: addon.isIncluded,
              eventId: event.id,
            },
          });
        }
      }

      // Create attrition rules — compute releaseDate from description when not explicitly set
      if (contract?.attritionRules) {
        for (const rule of contract.attritionRules) {
          let releaseDate: Date;
          if (rule.releaseDate) {
            releaseDate = new Date(rule.releaseDate);
            if (isNaN(releaseDate.getTime())) continue; // skip truly invalid date strings
          } else {
            // Derive from description: "X days before/prior" relative to checkIn
            const daysMatch = rule.description?.match(/(\d+)\s*days?\s*(?:before|prior|ahead)/i);
            const daysOffset = daysMatch ? parseInt(daysMatch[1]) : 30;
            releaseDate = new Date(checkInDate.getTime() - daysOffset * 86400000);
          }
          await tx.attritionRule.create({
            data: {
              releaseDate,
              releasePercent: rule.releasePercent,
              description: rule.description,
              eventId: event.id,
            },
          });
        }
      }

      return tx.event.findUnique({
        where: { id: event.id },
        include: {
          roomBlocks: true,
          addOns: true,
          attritionRules: true,
        },
      });
    });

    return NextResponse.json(fullEvent);
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
