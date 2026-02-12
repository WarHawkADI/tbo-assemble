import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { QrCode, ArrowLeft } from "lucide-react";
import { CheckinClient } from "@/components/dashboard/checkin-client";

export const dynamic = "force-dynamic";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true },
  });

  if (!event) return notFound();

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
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Guest Check-In
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
            QR code scanner & manual check-in for {event.name}
          </p>
        </div>
      </div>

      <CheckinClient eventId={eventId} eventName={event.name} />
    </div>
  );
}
