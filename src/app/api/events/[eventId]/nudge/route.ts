import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    await request.json().catch(() => ({})); // ruleId is optional context

    // Get all pending guests for this event
    const pendingGuests = await prisma.guest.findMany({
      where: {
        eventId,
        status: "invited",
      },
    });

    if (pendingGuests.length === 0) {
      return NextResponse.json({
        success: true,
        nudgesSent: 0,
        message: "No pending guests to nudge.",
      });
    }

    // Check for recently nudged guests (within last 24h) to avoid spamming
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNudges = await prisma.nudge.findMany({
      where: {
        guestId: { in: pendingGuests.map((g) => g.id) },
        sentAt: { gte: oneDayAgo },
      },
      select: { guestId: true },
    });
    const recentlyNudgedIds = new Set(recentNudges.map((n) => n.guestId));

    const eligibleGuests = pendingGuests.filter((g) => !recentlyNudgedIds.has(g.id));

    // Create nudge records for each eligible guest
    const nudges = [];
    for (const guest of eligibleGuests) {
      const nudge = await prisma.nudge.create({
        data: {
          guestId: guest.id,
          channel: "whatsapp",
          message: `Hi ${guest.name}! Friendly reminder: rooms are filling up fast. Book your room now before the release deadline. Visit your event microsite to secure your spot!`,
          status: "sent",
        },
      });
      nudges.push(nudge);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "nudge_sent",
        details: `WhatsApp nudges sent to ${nudges.length} pending guest${nudges.length !== 1 ? "s" : ""}${recentlyNudgedIds.size > 0 ? ` (${recentlyNudgedIds.size} skipped — nudged recently)` : ""}`,
        actor: "Agent",
      },
    });

    return NextResponse.json({
      success: true,
      nudgesSent: nudges.length,
      skipped: recentlyNudgedIds.size,
      message: `${nudges.length} WhatsApp nudges sent to pending guests.${recentlyNudgedIds.size > 0 ? ` ${recentlyNudgedIds.size} guests skipped (nudged within 24h).` : ""}`,
    });
  } catch (error) {
    console.error("Nudge error:", error);
    return NextResponse.json({ error: "Failed to send nudges" }, { status: 500 });
  }
}
