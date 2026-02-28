import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper to calculate cost estimates
function calculateCostEstimates(
  event: {
    checkIn: Date;
    checkOut: Date;
    roomBlocks: { rate: number; totalQty: number }[];
    scheduleItems: { cost: number | null; paxCount: number | null; type: string }[];
    addOns: { price: number; isIncluded: boolean }[];
  },
  paxCount: number
) {
  const nights = Math.max(1, Math.ceil(
    (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  ));

  // Room costs: estimate rooms needed (2 pax per room average)
  const estimatedRooms = Math.ceil(paxCount / 2);
  const avgRoomRate = event.roomBlocks.length > 0
    ? event.roomBlocks.reduce((sum, rb) => sum + rb.rate, 0) / event.roomBlocks.length
    : 8000; // Default avg rate if no room blocks
  const roomCost = estimatedRooms * avgRoomRate * nights;

  // Separate F&B (meals) from other schedule items (catering/events)
  let foodCost = 0;
  let cateringCost = 0;
  
  event.scheduleItems.forEach((item) => {
    if (!item.cost) return;
    
    // Scale cost based on pax if it's a per-person item
    let itemCost = item.cost;
    if (item.paxCount && item.paxCount > 0) {
      // Recalculate for new pax count
      itemCost = (item.cost / item.paxCount) * paxCount;
    }
    
    // Categorize: meals go to food, everything else to catering
    if (item.type === "meal" || item.type === "break") {
      foodCost += itemCost;
    } else {
      cateringCost += itemCost;
    }
  });

  // Add-on costs (per-pax for non-included items)
  const addonCost = event.addOns.reduce((sum, addon) => {
    if (!addon.isIncluded) {
      return sum + addon.price * paxCount;
    }
    return sum;
  }, 0);

  const total = roomCost + foodCost + cateringCost + addonCost;

  return {
    rooms: Math.round(roomCost),
    food: Math.round(foodCost),
    catering: Math.round(cateringCost),
    addons: Math.round(addonCost),
    total: Math.round(total),
    perPax: paxCount > 0 ? Math.round(total / paxCount) : 0,
    nights,
    estimatedRooms,
  };
}

// Update expected pax count and recalculate costs
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { expectedPax } = await request.json();

    if (expectedPax === undefined || expectedPax < 1) {
      return NextResponse.json(
        { error: "Valid expected pax count is required (minimum 1)" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        roomBlocks: true,
        scheduleItems: true,
        addOns: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const previousPax = event.expectedPax || 0;

    // Update event with new pax count
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { expectedPax },
      include: {
        roomBlocks: true,
        scheduleItems: true,
        addOns: true,
      },
    });

    // Calculate cost estimates
    const costEstimates = calculateCostEstimates(updatedEvent, expectedPax);

    // Log the pax change
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "pax_updated",
        details: `Expected pax updated from ${previousPax} to ${expectedPax}. New estimated cost: ₹${costEstimates.total.toLocaleString("en-IN")}`,
        actor: "Agent",
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        expectedPax: updatedEvent.expectedPax,
      },
      costEstimates,
      previousPax,
      paxChange: expectedPax - previousPax,
    });
  } catch (error) {
    console.error("Update pax count error:", error);
    return NextResponse.json({ error: "Failed to update pax count" }, { status: 500 });
  }
}

// GET cost estimates - accepts optional newPax query param for "what-if" calculations
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const newPax = searchParams.get("newPax");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        roomBlocks: true,
        scheduleItems: true,
        addOns: true,
        bookings: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Use newPax query param if provided, otherwise use event's expectedPax
    const paxCount = newPax 
      ? parseInt(newPax) 
      : (event.expectedPax || event.bookings.length || 50);
    
    if (isNaN(paxCount) || paxCount < 1) {
      return NextResponse.json(
        { error: "Invalid pax count" },
        { status: 400 }
      );
    }

    const costEstimates = calculateCostEstimates(event, paxCount);
    const actualPax = event.bookings.length;
    const actualRevenue = event.bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    return NextResponse.json({
      success: true,
      expectedPax: event.expectedPax,
      calculatedFor: paxCount,
      actualPax,
      costEstimates,
      actualRevenue,
      projectedRevenue: costEstimates.total,
      variance: actualRevenue - costEstimates.total,
    });
  } catch (error) {
    console.error("Get pax estimates error:", error);
    return NextResponse.json({ error: "Failed to get pax estimates" }, { status: 500 });
  }
}
