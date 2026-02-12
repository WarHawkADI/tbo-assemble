import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch feedback for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const feedbacks = await prisma.feedback.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

// POST - Submit feedback
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { guestName, guestEmail, rating, stayRating, eventRating, comment } =
      await request.json();

    if (!guestName || !rating) {
      return NextResponse.json(
        { error: "Guest name and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating range (1-5)
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Sanitize comment — strip HTML tags
    const cleanComment = comment?.replace(/<[^>]*>/g, '') || '';

    const feedback = await prisma.feedback.create({
      data: {
        eventId,
        guestName,
        guestEmail: guestEmail || null,
        rating,
        stayRating: stayRating || null,
        eventRating: eventRating || null,
        comment: cleanComment || null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "feedback_submitted",
        details: `${guestName} submitted feedback (${rating}/5 stars)`,
        actor: guestName,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Feedback submit error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
