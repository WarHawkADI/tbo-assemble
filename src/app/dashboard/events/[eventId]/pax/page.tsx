import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DynamicPaxManager } from "@/components/dashboard/dynamic-pax";
import { QuoteDownload } from "@/components/dashboard/quote-download";

export const dynamic = "force-dynamic";

export default async function PaxPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      expectedPax: true,
      _count: {
        select: {
          guests: true,
          bookings: true,
        },
      },
    },
  });

  if (!event) return notFound();

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <Link
        href={`/dashboard/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Event Overview
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight mb-2">
            Pax & Pricing Management
          </h1>
          <p className="text-gray-500 dark:text-zinc-400">
            Adjust guest count and view pricing estimates for {event.name}
          </p>
        </div>
        <QuoteDownload eventId={eventId} eventName={event.name} variant="full" />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pax Manager */}
        <DynamicPaxManager
          eventId={eventId}
          currentPax={event.expectedPax || event._count.guests || 50}
        />

        {/* Current Stats Card */}
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
            <h3 className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">Current Event Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-500 dark:text-zinc-400">Registered Guests</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{event._count.guests}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-500 dark:text-zinc-400">Total Bookings</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{event._count.bookings}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 dark:text-zinc-400">Expected Pax</span>
                <span className="font-semibold text-blue-600">{event.expectedPax || "Not set"}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Tip:</strong> Update the expected pax count when guest numbers change. 
              Pricing will automatically recalculate based on room requirements and F&B plans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
