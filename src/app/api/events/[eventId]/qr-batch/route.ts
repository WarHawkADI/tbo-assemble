import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { escapeHtml } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { 
      roomBlock: { eventId },
      status: "confirmed" 
    },
    include: {
      guest: { select: { name: true, email: true, group: true } },
      roomBlock: { select: { roomType: true } },
    },
    orderBy: { guest: { name: "asc" } },
  });

  // Generate a printable HTML page with QR codes for all bookings
  // XSS-safe: escape all user-controlled strings
  const bookingCards = bookings.map((b) => `
    <div class="qr-card">
      <div class="qr-code">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(b.id)}" 
             alt="QR Code" width="150" height="150" />
      </div>
      <div class="qr-info">
        <h3>${escapeHtml(b.guest.name)}</h3>
        <p class="room">${escapeHtml(b.roomBlock.roomType)}</p>
        <p class="group">${escapeHtml(b.guest.group || "General")}</p>
        <p class="id">${escapeHtml(b.id.slice(0, 8).toUpperCase())}</p>
      </div>
    </div>
  `).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>QR Codes - Batch Print</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background: white; }
    h1 { text-align: center; margin-bottom: 8px; font-size: 24px; color: #333; }
    .subtitle { text-align: center; margin-bottom: 24px; color: #666; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .qr-card { 
      border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; 
      page-break-inside: avoid; break-inside: avoid;
    }
    .qr-code { margin-bottom: 12px; }
    .qr-code img { border-radius: 8px; }
    .qr-info h3 { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
    .qr-info .room { font-size: 12px; color: #6b7280; }
    .qr-info .group { font-size: 11px; color: #9ca3af; }
    .qr-info .id { font-size: 10px; color: #d1d5db; font-family: monospace; margin-top: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .qr-card { border: 1px solid #ddd; }
    }
    .print-btn {
      display: block; margin: 0 auto 24px; padding: 10px 32px; 
      background: #2563eb; color: white; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <h1>Check-In QR Codes</h1>
  <p class="subtitle">${bookings.length} confirmed bookings</p>
  <button class="print-btn no-print" onclick="window.print()">Print All QR Codes</button>
  <div class="grid">
    ${bookingCards}
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
