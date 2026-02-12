import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { FeedbackClient } from "./feedback-client";

export const dynamic = "force-dynamic";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, slug: true },
  });

  if (!event) return notFound();

  const feedbacks = await prisma.feedback.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
      : 0;
  const avgStay =
    feedbacks.filter((f) => f.stayRating).length > 0
      ? feedbacks.reduce((s, f) => s + (f.stayRating || 0), 0) /
        feedbacks.filter((f) => f.stayRating).length
      : 0;
  const avgEvent =
    feedbacks.filter((f) => f.eventRating).length > 0
      ? feedbacks.reduce((s, f) => s + (f.eventRating || 0), 0) /
        feedbacks.filter((f) => f.eventRating).length
      : 0;

  return (
    <div>
      <Link
        href={`/dashboard/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {event.name}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-md">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Guest Feedback
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
            Reviews & ratings for {event.name}
          </p>
        </div>
      </div>

    <FeedbackClient
      eventName={event.name}
      feedbackUrl={`/event/${event.slug}/feedback`}
      feedbacks={feedbacks.map((f) => ({
        id: f.id,
        guestName: f.guestName,
        rating: f.rating,
        stayRating: f.stayRating,
        eventRating: f.eventRating,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
      }))}
      stats={{ avgRating, avgStay, avgEvent, total: feedbacks.length }}
    />
    </div>
  );
}
