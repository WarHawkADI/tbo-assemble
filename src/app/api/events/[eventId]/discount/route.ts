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
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    await prisma.discountRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete discount rule error:", error);
    return NextResponse.json({ error: "Failed to delete discount rule" }, { status: 500 });
  }
}
