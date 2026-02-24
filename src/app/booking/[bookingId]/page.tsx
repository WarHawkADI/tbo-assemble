"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  User,
  Bed,
  QrCode,
  FileText,
  ArrowLeft,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Share2,
  MessageSquare,
  CalendarPlus,
} from "lucide-react";
import Link from "next/link";
import { StatusTimeline, buildBookingTimeline } from "@/components/ui/status-timeline";

interface BookingDetail {
  id: string;
  status: string;
  createdAt: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  guest: {
    name: string;
    email: string;
    phone: string;
    group: string;
  };
  roomBlock: {
    roomType: string;
    rate: number;
  };
  event: {
    name: string;
    venue: string;
    location: string;
    checkIn: string;
    checkOut: string;
    slug: string;
  };
  addOns: {
    addOn: { name: string; price: number };
    price: number;
  }[];
  calculated: {
    nights: number;
    roomTotal: number;
    addOnTotal: number;
    grandTotal: number;
  };
}

export default function BookingSelfServicePage() {
  const params = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeRooms, setUpgradeRooms] = useState<{ id: string; roomType: string; rate: number; available: number }[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${params.bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Booking not found");
        return res.json();
      })
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.bookingId]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${params.bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : null));
        setToastMsg({ text: "Booking cancelled successfully", type: "success" });
      } else {
        const data = await res.json().catch(() => null);
        setToastMsg({ text: data?.error || "Failed to cancel booking", type: "error" });
      }
    } catch {
      setToastMsg({ text: "Failed to cancel booking. Please try again.", type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  const fetchUpgradeOptions = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.bookingId}`);
      if (!res.ok) return;
      const data = await res.json();
      // Fetch event rooms
      const eventSlug = data.event?.slug;
      if (!eventSlug) return;
      const eventRes = await fetch(`/api/events/search?q=${encodeURIComponent(data.event.name)}`);
      if (!eventRes.ok) return;
      const events = await eventRes.json();
      const event = events.find((e: { name: string }) => e.name === data.event.name);
      if (!event) return;
      // Get room blocks from event detail
      const detailRes = await fetch(`/api/events/${event.id}`);
      if (!detailRes.ok) return;
      const detail = await detailRes.json();
      const rooms = (detail.roomBlocks || [])
        .filter((r: { id: string; totalQty: number; bookedQty: number }) => r.id !== data.roomBlock?.id && r.totalQty - r.bookedQty > 0)
        .map((r: { id: string; roomType: string; rate: number; totalQty: number; bookedQty: number }) => ({
          id: r.id,
          roomType: r.roomType,
          rate: r.rate,
          available: r.totalQty - r.bookedQty,
        }));
      setUpgradeRooms(rooms);
      setShowUpgrade(true);
    } catch {
      setToastMsg({ text: "Could not load upgrade options", type: "error" });
    }
  };

  const handleUpgrade = async (newRoomId: string) => {
    setUpgrading(true);
    try {
      const res = await fetch(`/api/bookings/${params.bookingId}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRoomBlockId: newRoomId }),
      });
      if (res.ok) {
        const data = await res.json();
        setBooking((prev) => prev ? { ...prev, roomBlock: data.booking.roomBlock } : null);
        setToastMsg({ text: "Room upgraded successfully!", type: "success" });
        setShowUpgrade(false);
        // Refresh booking data
        const refreshRes = await fetch(`/api/bookings/${params.bookingId}`);
        if (refreshRes.ok) setBooking(await refreshRes.json());
      } else {
        const err = await res.json().catch(() => null);
        setToastMsg({ text: err?.error || "Upgrade failed", type: "error" });
      }
    } catch {
      setToastMsg({ text: "Upgrade failed. Please try again.", type: "error" });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
            Booking Not Found
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            The booking ID may be incorrect or expired.
          </p>
        </div>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    typeof window !== "undefined"
      ? `${window.location.origin}/api/bookings/${booking.id}/checkin`
      : booking.id
  )}`;

  const checkIn = new Date(booking.event.checkIn).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const checkOut = new Date(booking.event.checkOut).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Build Google Calendar link
  const calStart = new Date(booking.event.checkIn).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const calEnd = new Date(booking.event.checkOut).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const calTitle = encodeURIComponent(`${booking.event.name} — Hotel Check-In`);
  const calDetails = encodeURIComponent(`Room: ${booking.roomBlock.roomType}\nGuest: ${booking.guest.name}\nBooking ID: ${booking.id}\nTotal: ₹${booking.calculated.grandTotal.toLocaleString("en-IN")}`);
  const calLocation = encodeURIComponent(`${booking.event.venue}, ${booking.event.location}`);
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calStart}/${calEnd}&details=${calDetails}&location=${calLocation}`;

  // WhatsApp share
  const whatsappText = encodeURIComponent(`🏨 Booking Confirmed!\n\n📋 ${booking.event.name}\n🛏️ Room: ${booking.roomBlock.roomType}\n📅 ${checkIn} → ${checkOut}\n📍 ${booking.event.venue}\n💰 Total: ₹${booking.calculated.grandTotal.toLocaleString("en-IN")}\n\n🔗 Manage: ${typeof window !== "undefined" ? window.location.href : ""}\n\nPowered by TBO Assemble`);
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/event/${booking.event.slug}`}
            className="p-2.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-6 w-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] shadow-sm">
                <span className="text-[8px] font-bold text-white leading-none">TBO</span>
              </div>
              <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">TBO Assemble</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              Your Booking
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {booking.event.name}
            </p>
          </div>
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              booking.status === "confirmed"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800"
                : booking.status === "cancelled"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"
            }`}
          >
            {booking.status}
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <QrCode className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Show this QR code at check-in
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Booking QR Code"
            width={200}
            height={200}
            className="mx-auto rounded-lg"
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 font-mono">
            {booking.id}
          </p>
          {booking.checkedIn && (
            <div className="mt-3 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Checked in{" "}
                {booking.checkedInAt &&
                  new Date(booking.checkedInAt).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {/* Booking Status Timeline */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            Booking Timeline
          </h2>
          <StatusTimeline steps={buildBookingTimeline(booking)} />
        </div>

        {/* Booking Details */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
            Booking Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Guest</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {booking.guest.name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bed className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Room</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {booking.roomBlock.roomType}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Check-in</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {checkIn}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Check-out</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {checkOut}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Venue</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {booking.event.venue}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-zinc-400 mt-0.5" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Email</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {booking.guest.email || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-zinc-400" />
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
              Cost Breakdown
            </h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {booking.roomBlock.roomType} × {booking.calculated.nights} nights
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                ₹{booking.calculated.roomTotal.toLocaleString("en-IN")}
              </span>
            </div>
            {booking.addOns.map((ba, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {ba.addOn.name}
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {ba.price === 0 ? 'Free' : `₹${ba.price.toLocaleString("en-IN")}`}
                </span>
              </div>
            ))}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2 flex justify-between font-semibold">
              <span className="text-zinc-800 dark:text-zinc-200">Total</span>
              <span className="text-zinc-800 dark:text-zinc-200">
                ₹{booking.calculated.grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href={`/booking/${booking.id}/invoice`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            Invoice
          </Link>
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm"
            title="Add to Google Calendar"
          >
            <CalendarPlus className="w-4 h-4" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 font-medium rounded-xl transition-colors text-sm"
            title="Share via WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(
                () => setToastMsg({ text: "Booking link copied!", type: "success" }),
                () => setToastMsg({ text: "Failed to copy link", type: "error" })
              );
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm"
            aria-label="Share booking link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        {booking.status !== "cancelled" && (
          booking.checkedIn ? (
            <div className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-medium rounded-xl text-sm cursor-not-allowed">
              <CheckCircle className="w-4 h-4" />
              Already checked in — cannot cancel
            </div>
          ) : (
            <div className="space-y-2">
              {/* Upgrade Room Button */}
              <button
                onClick={fetchUpgradeOptions}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium rounded-xl transition-colors text-sm"
              >
                <Bed className="w-4 h-4" />
                Upgrade Room
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl transition-colors text-sm"
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Cancel Booking
              </button>
            </div>
          )
        )}

        {/* Upgrade Room Modal */}
        {showUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Upgrade Your Room</h2>
                <button onClick={() => setShowUpgrade(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm">
                  ✕
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Current room: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{booking.roomBlock.roomType}</span> (₹{booking.roomBlock.rate.toLocaleString("en-IN")}/night)
              </p>
              {upgradeRooms.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                  <Bed className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No other rooms available for upgrade</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upgradeRooms.map((room) => {
                    const diff = room.rate - booking.roomBlock.rate;
                    const isDowngrade = diff < 0;
                    return (
                      <button
                        key={room.id}
                        onClick={() => handleUpgrade(room.id)}
                        disabled={upgrading}
                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{room.roomType}</h3>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">{room.available} available</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">₹{room.rate.toLocaleString("en-IN")}<span className="text-xs font-normal text-zinc-400">/night</span></p>
                            <p className={`text-xs font-semibold ${isDowngrade ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isDowngrade ? '↓' : '↑'} {isDowngrade ? 'Save' : '+'} ₹{Math.abs(diff).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {upgrading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Upgrading...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 ${
            toastMsg.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
          onAnimationEnd={() => setTimeout(() => setToastMsg(null), 2500)}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toastMsg.text}
        </div>
      )}
    </div>
  );
}
