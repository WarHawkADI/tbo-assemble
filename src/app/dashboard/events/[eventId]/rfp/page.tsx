import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RFPDashboard } from "@/components/dashboard/rfp-dashboard";
import { QuoteDownload } from "@/components/dashboard/quote-download";

export const dynamic = "force-dynamic";

export default async function RFPPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      rfps: {
        include: { vendor: true },
        orderBy: { createdAt: "desc" },
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
            RFP & Quote Comparison
          </h1>
          <p className="text-gray-500 dark:text-zinc-400">
            Compare vendor quotes and manage RFPs for {event.name}
          </p>
        </div>
        <QuoteDownload eventId={eventId} eventName={event.name} variant="full" />
      </div>

      {/* RFP Dashboard Component */}
      <RFPDashboard eventId={eventId} initialRfps={event.rfps.map(rfp => ({
        ...rfp,
        validUntil: rfp.validUntil?.toISOString() || null,
        responseDate: rfp.responseDate?.toISOString() || null,
        createdAt: rfp.createdAt.toISOString(),
      }))} />
    </div>
  );
}
