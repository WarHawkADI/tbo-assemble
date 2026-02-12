import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";

// POST - Clone an event with its room blocks, add-ons, attrition rules, and discount rules
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const newName = body.name || "Copy";

    const original = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        roomBlocks: true,
        addOns: true,
        attritionRules: true,
        discountRules: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const slug = slugify(newName) + "-" + Date.now().toString(36);

    const cloned = await prisma.event.create({
      data: {
        name: newName,
        slug,
        type: original.type,
        venue: original.venue,
        location: original.location,
        checkIn: new Date(body.checkIn || original.checkIn),
        checkOut: new Date(body.checkOut || original.checkOut),
        description: original.description,
        primaryColor: original.primaryColor,
        secondaryColor: original.secondaryColor,
        accentColor: original.accentColor,
        agentId: original.agentId,
        status: "draft",
      },
    });

    // Clone room blocks
    for (const room of original.roomBlocks) {
      await prisma.roomBlock.create({
        data: {
          roomType: room.roomType,
          rate: room.rate,
          totalQty: room.totalQty,
          bookedQty: 0,
          floor: room.floor,
          wing: room.wing,
          hotelName: room.hotelName,
          eventId: cloned.id,
        },
      });
    }

    // Clone add-ons
    for (const addon of original.addOns) {
      await prisma.addOn.create({
        data: {
          name: addon.name,
          description: addon.description,
          price: addon.price,
          isIncluded: addon.isIncluded,
          eventId: cloned.id,
        },
      });
    }

    // Clone attrition rules with adjusted dates
    for (const rule of original.attritionRules) {
      const daysDiff = new Date(body.checkIn || original.checkIn).getTime() - original.checkIn.getTime();
      await prisma.attritionRule.create({
        data: {
          releaseDate: new Date(rule.releaseDate.getTime() + daysDiff),
          releasePercent: rule.releasePercent,
          description: rule.description,
          eventId: cloned.id,
        },
      });
    }

    // Clone discount rules
    for (const rule of original.discountRules) {
      await prisma.discountRule.create({
        data: {
          description: rule.description,
          minRooms: rule.minRooms,
          discountPct: rule.discountPct,
          isActive: rule.isActive,
          eventId: cloned.id,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        eventId: cloned.id,
        action: "event_cloned",
        details: `Event cloned from "${original.name}"`,
        actor: "Agent",
      },
    });

    const fullCloned = await prisma.event.findUnique({
      where: { id: cloned.id },
      include: { roomBlocks: true, addOns: true, attritionRules: true },
    });

    return NextResponse.json(fullCloned, { status: 201 });
  } catch (error) {
    console.error("Clone event error:", error);
    return NextResponse.json({ error: "Failed to clone event" }, { status: 500 });
  }
}
