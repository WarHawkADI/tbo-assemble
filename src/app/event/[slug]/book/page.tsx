import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import BookingClient from "@/components/microsite/booking-client";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      roomBlocks: true,
      addOns: true,
    },
  });

  if (!event) return notFound();

  return (
    <BookingClient
      event={{
        id: event.id,
        name: event.name,
        slug: event.slug,
        type: event.type,
        primaryColor: event.primaryColor,
        secondaryColor: event.secondaryColor,
        accentColor: event.accentColor,
        checkIn: event.checkIn.toISOString(),
        checkOut: event.checkOut.toISOString(),
        venue: event.venue,
        roomBlocks: event.roomBlocks.map((r) => ({
          id: r.id,
          roomType: r.roomType,
          rate: r.rate,
          floor: r.floor,
          wing: r.wing,
          hotelName: r.hotelName,
          totalQty: r.totalQty,
          bookedQty: r.bookedQty,
        })),
        addOns: event.addOns.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          price: a.price,
          isIncluded: a.isIncluded,
        })),
      }}
    />
  );
}
