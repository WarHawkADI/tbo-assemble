"use client";

import { useState, useEffect } from "react";
import { QrCode, Search, CheckCircle, XCircle, UserCheck, Clock, Loader2, Users, CheckSquare, Download, Printer } from "lucide-react";

interface CheckinClientProps {
  eventId: string;
  eventName: string;
}

interface CheckinResult {
  success: boolean;
  message?: string;
  booking?: {
    id: string;
    guest: { name: string; email: string; group: string };
    roomBlock: { roomType: string };
    checkedIn: boolean;
    checkedInAt: string;
  };
  error?: string;
  checkedInAt?: string;
}

interface BookingEntry {
  id: string;
  guest: { name: string; email: string; group: string };
  roomBlock: { roomType: string };
  checkedIn: boolean;
  checkedInAt: string | null;
  status: string;
}

export function CheckinClient({ eventId, eventName }: CheckinClientProps) {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<
    { name: string; room: string; time: string }[]
  >([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [allBookings, setAllBookings] = useState<BookingEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ checked_in: number; already_checked_in: number; errors: number } | null>(null);

  const fetchBookings = () => {
    fetch(`/api/bookings?eventId=${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bookings");
        return res.json();
      })
      .then((bookings) => {
        if (Array.isArray(bookings)) {
          const confirmed = bookings.filter((b: BookingEntry) => b.status === "confirmed");
          const checkedIn = confirmed.filter((b: BookingEntry) => b.checkedIn);
          setStats({ total: confirmed.length, checkedIn: checkedIn.length });
          setAllBookings(confirmed);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Listen for cross-tab booking notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    
    const channel = new BroadcastChannel('tbo-bookings');
    channel.onmessage = (event) => {
      if (event.data?.type === 'new-booking') {
        fetchBookings();
      }
    };
    
    return () => channel.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleCheckin = async () => {
    if (!bookingId.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId.trim()}/checkin`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message, booking: data.booking });
        setRecentCheckins((prev) => [
          {
            name: data.booking.guest.name,
            room: data.booking.roomBlock.roomType,
            time: new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev.slice(0, 9),
        ]);
        setBookingId("");
      } else {
        setResult({
          success: false,
          error: data.error,
          checkedInAt: data.checkedInAt,
        });
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const checkinPercent =
    stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;
  const pendingCount = stats.total - stats.checkedIn;
  const uncheckedBookings = allBookings.filter((b) => !b.checkedIn);

  const [toastMessage, setToastMessage] = useState("");

  const showToastMsg = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleBulkCheckin = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    setBulkResult(null);
    let checkedIn = 0;
    let alreadyCheckedIn = 0;
    let errors = 0;

    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch(`/api/bookings/${id}/checkin`, {
          method: "POST",
        });
        if (res.ok) {
          checkedIn++;
        } else {
          const data = await res.json();
          if (data.checkedInAt) {
            alreadyCheckedIn++;
          } else {
            errors++;
          }
        }
      } catch {
        errors++;
      }
    }

    setBulkResult({ checked_in: checkedIn, already_checked_in: alreadyCheckedIn, errors });
    setSelectedIds(new Set());
    fetchBookings();
    showToastMsg(`Checked in ${checkedIn} guests successfully`);
    setBulkLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === uncheckedBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uncheckedBookings.map((b) => b.id)));
    }
  };

  const handlePrintQRCodes = () => {
    const confirmedBookings = allBookings.filter((b) => b.status === "confirmed");
    if (confirmedBookings.length === 0) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${eventName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 8px; font-size: 20px; color: #1a1a1a; }
          .subtitle { text-align: center; margin-bottom: 24px; font-size: 12px; color: #666; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; break-inside: avoid; }
          .card img { width: 150px; height: 150px; margin: 8px auto; display: block; }
          .guest-name { font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 4px; }
          .booking-id { font-size: 10px; color: #888; font-family: monospace; word-break: break-all; }
          .room-type { font-size: 11px; color: #555; margin-top: 4px; }
          @media print {
            body { padding: 10px; }
            .grid { gap: 12px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>QR Codes — ${eventName}</h1>
        <p class="subtitle">${confirmedBookings.length} confirmed bookings</p>
        <button class="no-print" onclick="window.print()" style="display:block;margin:0 auto 20px;padding:8px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print</button>
        <div class="grid">
          ${confirmedBookings.map((b) => `
            <div class="card">
              <div class="guest-name">${b.guest.name}</div>
              <div class="room-type">${b.roomBlock.roomType}</div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(b.id)}" alt="QR ${b.id}" />
              <div class="booking-id">${b.id}</div>
            </div>
          `).join("")}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportCheckinList = () => {
    const headers = ["Guest Name", "Email", "Group", "Room Type", "Checked In", "Check-In Time"];
    const rows = allBookings.map((b) => [
      b.guest.name,
      b.guest.email || "",
      b.guest.group || "",
      b.roomBlock.roomType,
      b.checkedIn ? "Yes" : "No",
      b.checkedInAt ? new Date(b.checkedInAt).toLocaleString("en-IN") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-report-${eventName.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4 text-center">
          <UserCheck className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            {stats.checkedIn}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Checked In</p>
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4 text-center">
          <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            {pendingCount}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4 text-center">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            {stats.total}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Guests</p>
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4 text-center">
          <div className="relative w-12 h-12 mx-auto mb-2">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={checkinPercent >= 80 ? "#10B981" : checkinPercent >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="3"
                strokeDasharray={`${checkinPercent}, 100`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {checkinPercent}%
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Progress</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setShowBulkMode(!showBulkMode); setSelectedIds(new Set()); setBulkResult(null); }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            showBulkMode
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
              : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          {showBulkMode ? "Exit Bulk Mode" : "Bulk Check-In"}
        </button>
        <button
          onClick={handleExportCheckinList}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors no-print"
        >
          <Printer className="w-3.5 h-3.5" /> Print List
        </button>
        <button
          onClick={handlePrintQRCodes}
          disabled={allBookings.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors no-print disabled:opacity-50"
        >
          <QrCode className="w-3.5 h-3.5" /> Print QR Codes
        </button>
      </div>

      {/* Scanner / Input */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
              QR Check-In Scanner
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Scan QR code or enter booking ID manually
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Enter or scan booking ID..."
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Enter or scan booking ID"
              /* Intentional autoFocus for kiosk/scanner check-in mode */
              autoFocus
            />
          </div>
          <button
            onClick={handleCheckin}
            disabled={loading || !bookingId.trim()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Check In
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              result.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <p
                className={`font-medium text-sm ${
                  result.success
                    ? "text-green-800 dark:text-green-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {result.success ? result.message : result.error}
              </p>
            </div>
            {result.success && result.booking && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                <p>
                  Guest: <strong>{result.booking.guest.name}</strong>
                </p>
                <p>
                  Room: <strong>{result.booking.roomBlock.roomType}</strong>
                </p>
              </div>
            )}
            {result.checkedInAt && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Previously checked in at{" "}
                {new Date(result.checkedInAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Check-ins */}
      {recentCheckins.length > 0 && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Recent Check-ins
          </h3>
          <div className="space-y-2">
            {recentCheckins.map((ci, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-700/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {ci.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {ci.room}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {ci.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Bulk Check-In Mode */}
      {showBulkMode && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Select Guests for Bulk Check-In ({selectedIds.size} selected)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedIds.size === uncheckedBookings.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={handleBulkCheckin}
                disabled={selectedIds.size === 0 || bulkLoading}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckSquare className="w-3 h-3" />
                )}
                Check In {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </button>
            </div>
          </div>

          {bulkResult && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ {bulkResult.checked_in} checked in
                {bulkResult.already_checked_in > 0 && ` • ${bulkResult.already_checked_in} already checked in`}
                {bulkResult.errors > 0 && ` • ${bulkResult.errors} errors`}
              </p>
            </div>
          )}

          {uncheckedBookings.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">All guests have been checked in!</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {uncheckedBookings.map((b) => (
                <label
                  key={b.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(b.id)
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent"
                  }`}
                >
                  <input
                    id={`check-${b.id}`}
                    type="checkbox"
                    checked={selectedIds.has(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`check-${b.id}`} className="sr-only">Select booking {b.guest.name}</label>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{b.guest.name}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{b.guest.email}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {b.roomBlock.roomType}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{b.guest.group || "General"}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
