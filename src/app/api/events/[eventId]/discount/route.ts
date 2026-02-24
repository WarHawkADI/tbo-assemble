import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch discount rules for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const rules = await prisma.discountRule.findMany({
      where: { eventId },
      orderBy: { minRooms: "asc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Discount rules error:", error);
    return NextResponse.json({ error: "Failed to fetch discount rules" }, { status: 500 });
  }
}

// POST - Create discount rule
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { minRooms, discountPct, description } = await request.json();

    if (!minRooms || !discountPct) {
      return NextResponse.json(
        { error: "Min rooms and discount percentage are required" },
        { status: 400 }
      );
    }

    // Validate discountPct range (0 < discountPct <= 100)
    if (discountPct <= 0 || discountPct > 100) {
      return NextResponse.json({ error: "Discount percentage must be between 0 and 100" }, { status: 400 });
    }

    // Validate minRooms is positive
    if (minRooms <= 0) {
      return NextResponse.json({ error: "Minimum rooms must be greater than 0" }, { status: 400 });
    }

    const rule = await prisma.discountRule.create({
      data: {
        eventId,
        minRooms,
        discountPct,
        description: description || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        eventId,
        action: "discount_created",
        details: `Created discount rule: ${discountPct}% off for ${minRooms}+ rooms`,
        actor: "Agent",
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Create discount rule error:", error);
    return NextResponse.json({ error: "Failed to create discount rule" }, { status: 500 });
  }
}

// DELETE - Remove discount rule
export async function DELETE(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    // Verify the rule belongs to this event
    const rule = await prisma.discountRule.findUnique({ where: { id } });
    if (!rule || rule.eventId !== eventId) {
      return NextResponse.json({ error: "Discount rule not found for this event" }, { status: 404 });
    }

    await prisma.discountRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete discount rule error:", error);
    return NextResponse.json({ error: "Failed to delete discount rule" }, { status: 500 });
  }
}

// PATCH - Toggle discount rule active/inactive
export async function PATCH(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const { id, isActive } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    // Verify the rule belongs to this event
    const existing = await prisma.discountRule.findUnique({ where: { id } });
    if (!existing || existing.eventId !== eventId) {
      return NextResponse.json({ error: "Discount rule not found for this event" }, { status: 404 });
    }

    const rule = await prisma.discountRule.update({
      where: { id },
      data: { isActive },
    });
    return NextResponse.json(rule);
  } catch (error) {
    console.error("Update discount rule error:", error);
    return NextResponse.json({ error: "Failed to update discount rule" }, { status: 500 });
  }
}
