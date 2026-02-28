import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all RFPs or filter by eventId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    const where = eventId ? { eventId } : {};

    const rfps = await prisma.rFP.findMany({
      where,
      include: {
        vendor: true,
        event: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rfps);
  } catch (error) {
    console.error("Get RFPs error:", error);
    return NextResponse.json({ error: "Failed to fetch RFPs" }, { status: 500 });
  }
}

// POST - Create new RFP
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      eventId,
      vendorId,
      quotedAmount,
      roomRate,
      foodRate,
      venueRate,
      additionalCosts,
      validUntil,
      notes,
    } = data;

    if (!eventId || !vendorId) {
      return NextResponse.json(
        { error: "Event ID and Vendor ID are required" },
        { status: 400 }
      );
    }

    if (quotedAmount === undefined || quotedAmount < 0) {
      return NextResponse.json(
        { error: "Valid quoted amount is required" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const rfp = await prisma.rFP.create({
      data: {
        eventId,
        vendorId,
        quotedAmount,
        roomRate: roomRate || null,
        foodRate: foodRate || null,
        venueRate: venueRate || null,
        additionalCosts: additionalCosts || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        status: "pending",
      },
      include: { vendor: true, event: { select: { name: true } } },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "rfp_created",
        details: `RFP created for ${vendor.name} — ₹${quotedAmount.toLocaleString("en-IN")}`,
        actor: "Agent",
      },
    });

    return NextResponse.json(rfp, { status: 201 });
  } catch (error) {
    console.error("Create RFP error:", error);
    return NextResponse.json({ error: "Failed to create RFP" }, { status: 500 });
  }
}

// PUT - Update RFP
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      quotedAmount,
      roomRate,
      foodRate,
      venueRate,
      additionalCosts,
      validUntil,
      status,
      notes,
      responseDate,
    } = data;

    if (!id) {
      return NextResponse.json({ error: "RFP ID is required" }, { status: 400 });
    }

    const existingRfp = await prisma.rFP.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!existingRfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Validate status if provided
    const VALID_STATUSES = ["pending", "accepted", "rejected", "negotiating", "expired"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` 
      }, { status: 400 });
    }

    const rfp = await prisma.rFP.update({
      where: { id },
      data: {
        ...(quotedAmount !== undefined && { quotedAmount }),
        ...(roomRate !== undefined && { roomRate }),
        ...(foodRate !== undefined && { foodRate }),
        ...(venueRate !== undefined && { venueRate }),
        ...(additionalCosts !== undefined && { additionalCosts }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(responseDate !== undefined && { responseDate: responseDate ? new Date(responseDate) : null }),
      },
      include: { vendor: true, event: { select: { name: true } } },
    });

    // Log status change
    if (status && status !== existingRfp.status) {
      await prisma.activityLog.create({
        data: {
          eventId: rfp.eventId,
          action: "rfp_status_changed",
          details: `RFP from ${existingRfp.vendor.name} status changed to ${status}`,
          actor: "Agent",
        },
      });
    }

    return NextResponse.json(rfp);
  } catch (error) {
    console.error("Update RFP error:", error);
    return NextResponse.json({ error: "Failed to update RFP" }, { status: 500 });
  }
}

// DELETE - Remove RFP
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "RFP ID is required" }, { status: 400 });
    }

    const rfp = await prisma.rFP.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    await prisma.rFP.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId: rfp.eventId,
        action: "rfp_deleted",
        details: `RFP from ${rfp.vendor.name} deleted`,
        actor: "Agent",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete RFP error:", error);
    return NextResponse.json({ error: "Failed to delete RFP" }, { status: 500 });
  }
}
