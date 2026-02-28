import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { escapeHtml } from "@/lib/utils";

// Generate PDF quote for event
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
        addOns: true,
        scheduleItems: { orderBy: [{ date: "asc" }, { sortOrder: "asc" }] },
        bookings: true,
        agent: { select: { name: true, company: true, email: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const nights = Math.ceil(
      (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const expectedPax = event.expectedPax || 50;
    const estimatedRooms = Math.ceil(expectedPax / 2);

    // Calculate costs
    const roomBlocksHtml = event.roomBlocks
      .map(
        (rb) => `
      <tr>
        <td style="border: 1px solid #e5e7eb; padding: 12px;">${escapeHtml(rb.roomType)}</td>
        <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">${rb.totalQty}</td>
        <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">₹${rb.rate.toLocaleString("en-IN")}</td>
        <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">₹${(rb.rate * nights).toLocaleString("en-IN")}</td>
      </tr>`
      )
      .join("");

    const totalRoomCost = event.roomBlocks.reduce(
      (sum, rb) => sum + rb.rate * rb.totalQty * nights,
      0
    );

    const addOnsHtml = event.addOns
      .filter((a) => !a.isIncluded)
      .map(
        (addon) => `
      <tr>
        <td style="border: 1px solid #e5e7eb; padding: 12px;">${escapeHtml(addon.name)}</td>
        <td style="border: 1px solid #e5e7eb; padding: 12px;">${addon.description ? escapeHtml(addon.description) : "-"}</td>
        <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">₹${addon.price.toLocaleString("en-IN")}</td>
      </tr>`
      )
      .join("");

    const totalAddOnCost = event.addOns
      .filter((a) => !a.isIncluded)
      .reduce((sum, a) => sum + a.price * estimatedRooms, 0);

    const scheduleCost = event.scheduleItems.reduce((sum, item) => sum + (item.cost || 0), 0);

    // Group schedule items by date
    const scheduleByDate = new Map<string, typeof event.scheduleItems>();
    for (const item of event.scheduleItems) {
      const dateKey = new Date(item.date).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!scheduleByDate.has(dateKey)) {
        scheduleByDate.set(dateKey, []);
      }
      scheduleByDate.get(dateKey)!.push(item);
    }

    let scheduleHtml = "";
    for (const [dateStr, items] of scheduleByDate.entries()) {
      scheduleHtml += `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 10px; padding: 8px; background: #f3f4f6; border-radius: 6px;">${escapeHtml(dateStr)}</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase;">Time</th>
                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase;">Activity</th>
                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase;">Venue</th>
                <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase;">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px;">${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px;"><strong>${escapeHtml(item.title)}</strong>${item.description ? `<br><span style="color: #6b7280; font-size: 12px;">${escapeHtml(item.description)}</span>` : ""}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 13px;">${item.venue ? escapeHtml(item.venue) : "-"}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 13px;">${item.cost ? `₹${item.cost.toLocaleString("en-IN")}` : "-"}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`;
    }

    const grandTotal = totalRoomCost + totalAddOnCost + scheduleCost;
    const perPaxCost = expectedPax > 0 ? grandTotal / expectedPax : 0;

    const quoteDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Quote - ${escapeHtml(event.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px solid ${event.primaryColor};
    }
    .logo-section h1 {
      font-size: 28px;
      font-weight: 800;
      color: ${event.primaryColor};
    }
    .logo-section p {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .quote-info {
      text-align: right;
    }
    .quote-info .quote-label {
      font-size: 24px;
      font-weight: 700;
      color: #374151;
    }
    .quote-info .quote-date {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .event-details {
      background: linear-gradient(135deg, ${event.primaryColor}10, ${event.accentColor}10);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .event-name {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .event-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .meta-item {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${event.primaryColor};
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: ${event.primaryColor};
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border: 1px solid #e5e7eb;
      font-size: 13px;
    }
    tr:nth-child(even) td {
      background: #f9fafb;
    }
    .total-section {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 24px;
      margin-top: 32px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.subtotal {
      border-top: 1px solid #d1d5db;
      padding-top: 16px;
      margin-top: 8px;
    }
    .total-row.grand-total {
      border-top: 2px solid ${event.primaryColor};
      padding-top: 16px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 700;
      color: ${event.primaryColor};
    }
    .per-pax {
      background: ${event.primaryColor}15;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
      text-align: center;
    }
    .per-pax-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .per-pax-amount {
      font-size: 24px;
      font-weight: 800;
      color: ${event.primaryColor};
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .terms {
      margin-top: 32px;
      padding: 20px;
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 8px;
      font-size: 12px;
      color: #854d0e;
    }
    .terms h4 {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .terms ul {
      margin-left: 20px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <h1>📋 TBO Assemble</h1>
      <p>Group Inventory Management Platform</p>
    </div>
    <div class="quote-info">
      <div class="quote-label">QUOTE</div>
      <div class="quote-date">
        Date: ${quoteDate}<br>
        Valid Until: ${validUntil}
      </div>
    </div>
  </div>

  <div class="event-details">
    <div class="event-name">${escapeHtml(event.name)}</div>
    <div class="event-meta">
      <div class="meta-item">
        <div class="meta-label">Venue</div>
        <div class="meta-value">${escapeHtml(event.venue)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Location</div>
        <div class="meta-value">${escapeHtml(event.location)}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Dates</div>
        <div class="meta-value">${new Date(event.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${new Date(event.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} (${nights} nights)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Event Type</div>
        <div class="meta-value">${escapeHtml(event.type.charAt(0).toUpperCase() + event.type.slice(1))}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Expected Guests</div>
        <div class="meta-value">${expectedPax} pax</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Estimated Rooms</div>
        <div class="meta-value">${estimatedRooms} rooms</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">🏨 Accommodation</h3>
    <table>
      <thead>
        <tr>
          <th>Room Type</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Rate/Night</th>
          <th style="text-align: right;">Total (${nights}N)</th>
        </tr>
      </thead>
      <tbody>
        ${roomBlocksHtml}
      </tbody>
    </table>
  </div>

  ${event.addOns.filter((a) => !a.isIncluded).length > 0 ? `
  <div class="section">
    <h3 class="section-title">✨ Add-Ons & Services</h3>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Description</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${addOnsHtml}
      </tbody>
    </table>
  </div>
  ` : ""}

  ${event.scheduleItems.length > 0 ? `
  <div class="section">
    <h3 class="section-title">📅 Event Schedule</h3>
    ${scheduleHtml}
  </div>
  ` : ""}

  <div class="total-section">
    <div class="total-row">
      <span>Accommodation (${nights} nights)</span>
      <span>₹${totalRoomCost.toLocaleString("en-IN")}</span>
    </div>
    ${totalAddOnCost > 0 ? `
    <div class="total-row">
      <span>Add-Ons & Services</span>
      <span>₹${totalAddOnCost.toLocaleString("en-IN")}</span>
    </div>
    ` : ""}
    ${scheduleCost > 0 ? `
    <div class="total-row">
      <span>Event Activities</span>
      <span>₹${scheduleCost.toLocaleString("en-IN")}</span>
    </div>
    ` : ""}
    <div class="total-row grand-total">
      <span>Grand Total</span>
      <span>₹${grandTotal.toLocaleString("en-IN")}</span>
    </div>
    <div class="per-pax">
      <div class="per-pax-label">Cost Per Person (${expectedPax} pax)</div>
      <div class="per-pax-amount">₹${Math.round(perPaxCost).toLocaleString("en-IN")}</div>
    </div>
  </div>

  <div class="terms">
    <h4>📝 Terms & Conditions</h4>
    <ul>
      <li>Quote valid for 7 days from date of issue</li>
      <li>Prices subject to change based on final guest count</li>
      <li>50% advance payment required for confirmation</li>
      <li>Balance due 7 days before event date</li>
      <li>Cancellation policy applies as per hotel terms</li>
    </ul>
  </div>

  <div class="footer">
    <p>Generated by TBO Assemble — Group Inventory Management Platform</p>
    <p>Quote ID: ${event.id.slice(0, 8)} • Agent: ${escapeHtml(event.agent.name || "Demo Agent")} (${escapeHtml(event.agent.company || "TBO Travel")})</p>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Generate quote error:", error);
    return NextResponse.json({ error: "Failed to generate quote" }, { status: 500 });
  }
}
