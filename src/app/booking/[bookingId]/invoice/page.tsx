"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface BookingDetail {
  id: string;
  status: string;
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
  };
  addOns: {
    addOn: { name: string; price: number; isIncluded: boolean };
    price: number;
  }[];
  calculated: {
    nights: number;
    roomTotal: number;
    addOnTotal: number;
    grandTotal: number;
  };
}

export default function InvoicePage() {
  const params = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${params.bookingId}`)
      .then((res) => res.json())
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">Booking not found</p>
      </div>
    );
  }

  const checkIn = new Date(booking.event.checkIn).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const checkOut = new Date(booking.event.checkOut).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-50 py-8 px-4">
        {/* Print Button */}
        <div className="no-print max-w-3xl mx-auto mb-4 flex justify-end">
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="print-container max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 invoice-watermark relative">
          {/* Letterhead Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#ff6b35] via-[#e55a2b] to-[#ff6b35] rounded-t-2xl" />

          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-200 pb-6 mb-6 mt-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="TBO Assemble" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold text-zinc-800">
                  TBO <span className="text-[#ff6b35]">Assemble</span>
                </h1>
                <p className="text-xs text-zinc-500">Smart Group Travel OS • GSTIN: 07AXXXX1234X1ZX</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-zinc-800 tracking-wider">TAX INVOICE</h2>
              <p className="text-sm text-zinc-500 font-mono">#{booking.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-zinc-500 mt-1">Date: {invoiceDate}</p>
              {booking.status === "confirmed" && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Paid</span>
              )}
            </div>
          </div>

          {/* Guest & Event Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Bill To
              </h3>
              <p className="font-semibold text-zinc-800">{booking.guest.name}</p>
              {booking.guest.email && (
                <p className="text-sm text-zinc-600">{booking.guest.email}</p>
              )}
              {booking.guest.phone && (
                <p className="text-sm text-zinc-600">{booking.guest.phone}</p>
              )}
              <p className="text-sm text-zinc-500 mt-1">
                Group: {booking.guest.group || "General"}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Event Details
              </h3>
              <p className="font-semibold text-zinc-800">{booking.event.name}</p>
              <p className="text-sm text-zinc-600">{booking.event.venue}</p>
              <p className="text-sm text-zinc-600">{booking.event.location}</p>
              <p className="text-sm text-zinc-500 mt-1">
                {checkIn} — {checkOut}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-center py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="text-right py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="text-right py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-100">
                <td className="py-3">
                  <p className="font-medium text-zinc-800">
                    {booking.roomBlock.roomType}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Room accommodation
                  </p>
                </td>
                <td className="text-center text-sm text-zinc-600">
                  {booking.calculated.nights} nights
                </td>
                <td className="text-right text-sm text-zinc-600">
                  ₹{booking.roomBlock.rate.toLocaleString("en-IN")}
                </td>
                <td className="text-right font-medium text-zinc-800">
                  ₹{booking.calculated.roomTotal.toLocaleString("en-IN")}
                </td>
              </tr>
              {booking.addOns.map((ba, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  <td className="py-3">
                    <p className="font-medium text-zinc-800">{ba.addOn.name}</p>
                    <p className="text-xs text-zinc-500">{ba.addOn.isIncluded ? 'Included perk' : 'Add-on service'}</p>
                  </td>
                  <td className="text-center text-sm text-zinc-600">
                    1
                  </td>
                  <td className="text-right text-sm text-zinc-600">
                    {ba.price === 0 ? 'Free' : `₹${ba.price.toLocaleString("en-IN")}`}
                  </td>
                  <td className="text-right font-medium text-zinc-800">
                    {ba.price === 0 ? 'Free' : `₹${ba.price.toLocaleString("en-IN")}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal (Room)</span>
                <span className="text-zinc-700">
                  ₹{booking.calculated.roomTotal.toLocaleString("en-IN")}
                </span>
              </div>
              {booking.calculated.addOnTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Add-ons</span>
                  <span className="text-zinc-700">
                    ₹{booking.calculated.addOnTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">CGST (9%)</span>
                <span className="text-zinc-700">
                  ₹{Math.round(booking.calculated.grandTotal * 0.09).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">SGST (9%)</span>
                <span className="text-zinc-700">
                  ₹{Math.round(booking.calculated.grandTotal * 0.09).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-zinc-200 text-lg font-bold">
                <span className="text-zinc-800">Total (incl. GST)</span>
                <span className="text-zinc-800">
                  ₹{Math.round(booking.calculated.grandTotal * 1.18).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 text-right">
                GST @ 18% on accommodation services
              </p>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-8 p-4 bg-zinc-50 rounded-lg">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Terms & Conditions</h4>
            <ul className="text-[10px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>Payment is due upon confirmation of booking.</li>
              <li>Cancellation policy as per event terms.</li>
              <li>This invoice is subject to Indian tax regulations.</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-400">
                  This is a computer-generated invoice. No signature required.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Powered by TBO Assemble — Smart Hotel Room Block Management
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400">For TBO Assemble</p>
                <p className="text-xs font-semibold text-zinc-500 mt-4">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
