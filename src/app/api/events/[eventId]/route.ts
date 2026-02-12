import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        roomBlocks: true,
        guests: { select: { id: true, name: true, email: true, phone: true, status: true, group: true } },
        bookings: { include: { guest: true, roomBlock: true, addOns: { include: { addOn: true } } } },
        addOns: true,
        attritionRules: true,
        discountRules: true,
        feedbacks: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.venue && { venue: body.venue }),
        ...(body.location && { location: body.location }),
        ...(body.checkIn && { checkIn: new Date(body.checkIn) }),
        ...(body.checkOut && { checkOut: new Date(body.checkOut) }),
        ...(body.primaryColor && { primaryColor: body.primaryColor }),
        ...(body.secondaryColor && { secondaryColor: body.secondaryColor }),
        ...(body.type && { type: body.type }),
      },
      include: {
        roomBlocks: true,
        guests: true,
        bookings: true,
        addOns: true,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    
    // Delete in correct order to respect foreign keys
    await prisma.$transaction([
      prisma.bookingAddOn.deleteMany({ where: { booking: { eventId } } }),
      prisma.booking.deleteMany({ where: { eventId } }),
      prisma.feedback.deleteMany({ where: { eventId } }),
      prisma.waitlist.deleteMany({ where: { eventId } }),
      prisma.nudge.deleteMany({ where: { guest: { eventId } } }),
      prisma.activityLog.deleteMany({ where: { eventId } }),
      prisma.discountRule.deleteMany({ where: { eventId } }),
      prisma.attritionRule.deleteMany({ where: { eventId } }),
      prisma.addOn.deleteMany({ where: { eventId } }),
      prisma.guest.deleteMany({ where: { eventId } }),
      prisma.roomBlock.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
