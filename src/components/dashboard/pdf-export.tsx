"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface EventData {
  name: string;
  totalGuests: number;
  confirmedGuests: number;
  totalRooms: number;
  bookedRooms: number;
  revenue: number;
  occupancy: number;
  conversionRate: number;
}

export function PdfExportButton({ events }: { events: EventData[] }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);

    const totalGuests = events.reduce((s, e) => s + e.totalGuests, 0);
    const totalRevenue = events.reduce((s, e) => s + e.revenue, 0);
    const avgOccupancy = events.length > 0 ? events.reduce((s, e) => s + e.occupancy, 0) / events.length : 0;
    const avgConversion = events.length > 0 ? events.reduce((s, e) => s + e.conversionRate, 0) / events.length : 0;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Please allow popups for this site to export the PDF report.");
      setExporting(false);
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>TBO Assemble — Analytics Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 3px solid #ff6b35;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ff6b35;
    }
    .header .subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .header .date {
      font-size: 13px;
      color: #888;
      text-align: right;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #f8f9fb;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .stat-card .value {
      font-size: 28px;
      font-weight: 800;
      color: #1a1a2e;
    }
    .stat-card .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #888;
      margin-top: 4px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #ff6b35;
      color: white;
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }
    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; }
    td {
      padding: 10px 14px;
      font-size: 13px;
      border-bottom: 1px solid #f0f0f0;
    }
    tr:nth-child(even) td { background: #fafafa; }
    tr:hover td { background: #fff5f0; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1a1a2e;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #aaa;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📊 TBO Assemble</h1>
      <div class="subtitle">Analytics Report — Cross-Event Performance Summary</div>
    </div>
    <div class="date">Generated: ${now}<br/>Events: ${events.length}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${totalGuests.toLocaleString()}</div>
      <div class="label">Total Guests</div>
    </div>
    <div class="stat-card">
      <div class="value">₹${(totalRevenue / 100000).toFixed(1)}L</div>
      <div class="label">Total Revenue</div>
    </div>
    <div class="stat-card">
      <div class="value">${avgOccupancy.toFixed(0)}%</div>
      <div class="label">Avg Occupancy</div>
    </div>
    <div class="stat-card">
      <div class="value">${avgConversion.toFixed(0)}%</div>
      <div class="label">Avg Conversion</div>
    </div>
  </div>

  <div class="section-title">Event-Wise Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Event</th>
        <th>Guests</th>
        <th>Confirmed</th>
        <th>Rooms</th>
        <th>Booked</th>
        <th>Revenue</th>
        <th>Occupancy</th>
      </tr>
    </thead>
    <tbody>
      ${events.map(e => `
        <tr>
          <td><strong>${e.name}</strong></td>
          <td>${e.totalGuests}</td>
          <td>${e.confirmedGuests}</td>
          <td>${e.totalRooms}</td>
          <td>${e.bookedRooms}</td>
          <td>₹${e.revenue.toLocaleString()}</td>
          <td>${e.occupancy}%</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    TBO Assemble — The Operating System for Group Travel &bull; Powered by TBO.com<br/>
    Built by Team IIITDards for VOYAGEHACK 3.0
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`);
    printWindow.document.close();

    setTimeout(() => setExporting(false), 1500);
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || events.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {exporting ? "Generating…" : "Export PDF"}
    </button>
  );
}
