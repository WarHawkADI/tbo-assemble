"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, ArrowLeft, ArrowRight, Loader2, User, Hotel, Sparkles, CreditCard, PartyPopper, Shield, Clock, QrCode, FileText, ExternalLink, BadgePercent } from "lucide-react";
import { ConfettiExplosion, useConfetti } from "@/components/ui/confetti";

interface RoomBlock {
  id: string;
  roomType: string;
  rate: number;
  floor: string | null;
  wing: string | null;
  hotelName: string | null;
  totalQty: number;
  bookedQty: number;
}

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isIncluded: boolean;
}

interface EventData {
  id: string;
  name: string;
  slug: string;
  type: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  checkIn: string;
  checkOut: string;
  venue: string;
  roomBlocks: RoomBlock[];
  addOns: AddOn[];
}

export default function BookingClient({ event }: { event: EventData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedRoom = searchParams.get("room");

  const [selectedRoom, setSelectedRoom] = useState<string>(preselectedRoom || "");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestGroup, setGuestGroup] = useState("");
  const [proximityRequest, setProximityRequest] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const nights = Math.ceil(
    (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const selectedRoomData = event.roomBlocks.find((r) => r.id === selectedRoom);
  const roomTotal = selectedRoomData ? selectedRoomData.rate * nights : 0;

  const addOnTotal = selectedAddOns.reduce((sum, id) => {
    const addon = event.addOns.find((a) => a.id === id);
    return sum + (addon && !addon.isIncluded ? addon.price : 0);
  }, 0);

  const grandTotal = roomTotal + addOnTotal;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const [bookingError, setBookingError] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ percent: number; originalAmount: number; finalAmount: number } | null>(null);
  const [processingPhase, setProcessingPhase] = useState("");
  const confetti = useConfetti();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [qrLoaded, setQrLoaded] = useState(false);

  // Dynamic group options based on event type
  const groupOptions = (() => {
    const t = event.type?.toLowerCase() || "";
    if (t.includes("wedding")) {
      return ["Bride Side", "Groom Side", "VIP", "Family", "Friends"];
    } else if (t.includes("conference") || t.includes("mice") || t.includes("meeting")) {
      return ["Speaker", "Attendee", "Organizer", "VIP", "Sponsor", "Media"];
    } else if (t.includes("exhibition")) {
      return ["Exhibitor", "Visitor", "Organizer", "VIP", "Media"];
    } else {
      return ["VIP", "Group A", "Group B", "Organizer", "Guest"];
    }
  })();

  const handleSubmit = async () => {
    // Inline validation
    const errors: Record<string, string> = {};
    if (!guestName.trim()) errors.name = "Name is required";
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.email = "Invalid email format";
    if (guestPhone && !/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(guestPhone.replace(/\s/g, ''))) errors.phone = "Enter valid Indian phone (+91 XXXXX XXXXX)";
    if (!selectedRoom) errors.room = "Please select a room";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!guestName || !selectedRoom) return;
    setIsSubmitting(true);
    setBookingError("");

    // Payment simulation phases
    const phases = [
      "Verifying room availability...",
      "Processing payment of ₹" + grandTotal.toLocaleString("en-IN") + "...",
      "Securing your reservation...",
      "Generating confirmation...",
    ];
    for (const phase of phases) {
      setProcessingPhase(phase);
      await new Promise((r) => setTimeout(r, 700));
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          roomBlockId: selectedRoom,
          guestName,
          guestEmail,
          guestPhone,
          guestGroup,
          proximityRequest,
          specialRequests,
          selectedAddOns,
          totalAmount: grandTotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingId(data.booking?.id || data.id || "");
        
        // Capture discount info for display
        if (data.discount) {
          setDiscountInfo(data.discount);
        }
        
        setIsBooked(true);
        confetti.trigger();
      } else {
        const err = await res.json();
        setBookingError(err.error || "Booking failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setBookingError("Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (isBooked) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 flex items-center justify-center p-4 lg:p-6">
        {/* Confetti on success */}
        <ConfettiExplosion active={confetti.active} onComplete={confetti.reset} />
        {/* Background Effects */}
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 50% 0%, ${event.primaryColor}15, transparent),
              radial-gradient(ellipse 50% 50% at 100% 100%, ${event.accentColor}10, transparent)
            `
          }}
        />
        
        <div className="relative w-full max-w-sm lg:max-w-md">
          {/* Gradient Border */}
          <div 
            className="absolute -inset-0.5 lg:-inset-1 rounded-2xl lg:rounded-[28px] opacity-50 blur-sm"
            style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
          />
          
          <div className="relative bg-white dark:bg-zinc-900 rounded-xl lg:rounded-3xl shadow-xl lg:shadow-2xl p-6 sm:p-8 lg:p-10">
            {/* Success Icon */}
            <div className="relative mb-6 lg:mb-8">
              <div 
                className="absolute inset-0 w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full animate-ping opacity-20"
                style={{ backgroundColor: event.primaryColor }}
              />
              <div 
                className="relative w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full flex items-center justify-center shadow-lg lg:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
              >
                <PartyPopper className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
              </div>
            </div>
            
            <div className="text-center mb-6 lg:mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-1.5 lg:mb-2">You're All Set!</h1>
              <p className="text-gray-500 dark:text-zinc-400 text-sm lg:text-base">
                Thank you, <span className="font-semibold" style={{ color: event.primaryColor }}>{guestName}</span>
              </p>
              <p className="text-xs lg:text-sm text-gray-400 dark:text-zinc-500 mt-1">Your room at {event.venue} has been reserved</p>
            </div>
            
            {/* Discount Savings Banner */}
            {discountInfo && (
              <div className="mb-5 lg:mb-6 rounded-xl lg:rounded-2xl p-3 lg:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <BadgePercent className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Group Discount Applied!
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {discountInfo.percent}% group discount saved you{" "}
                  <span className="font-bold">₹{(discountInfo.originalAmount - discountInfo.finalAmount).toLocaleString("en-IN")}</span>
                </p>
              </div>
            )}
            
            {/* Booking Details */}
            <div 
              className="rounded-xl lg:rounded-2xl p-4 lg:p-5 mb-5 lg:mb-6 space-y-2.5 lg:space-y-3"
              style={{ backgroundColor: `${event.secondaryColor}50` }}
            >
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Room</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{selectedRoomData?.roomType}</span>
              </div>
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-gray-500 dark:text-zinc-400">{nights} Night{nights > 1 ? 's' : ''}</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">₹{roomTotal.toLocaleString("en-IN")}</span>
              </div>
              {addOnTotal > 0 && (
                <div className="flex justify-between items-center text-xs lg:text-sm">
                  <span className="text-gray-500 dark:text-zinc-400">Add-Ons</span>
                  <span className="font-semibold text-gray-900 dark:text-zinc-100">₹{addOnTotal.toLocaleString("en-IN")}</span>
                </div>
              )}
              {discountInfo && (
                <div className="flex justify-between items-center text-xs lg:text-sm">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <BadgePercent className="h-3 w-3" /> {discountInfo.percent}% discount
                  </span>
                  <span className="font-semibold text-emerald-600">
                    -₹{(discountInfo.originalAmount - discountInfo.finalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2.5 lg:pt-3 border-t border-gray-200 dark:border-zinc-700">
                <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">Total</span>
                <span className="text-lg lg:text-xl font-bold" style={{ color: event.primaryColor }}>
                  ₹{(discountInfo ? discountInfo.finalAmount : grandTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            
            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs text-gray-400 dark:text-zinc-500 mb-4 lg:mb-5">
              <Shield className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
              <span>Powered by <span className="font-semibold text-gray-500 dark:text-zinc-400">TBO Assemble</span></span>
            </div>

            {/* QR Code & Self-Service */}
            {bookingId && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 mb-3">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Your Check-In QR Code</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {!qrLoaded && (
                    <div className="mx-auto w-[150px] h-[150px] rounded-lg bg-gray-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
                      <QrCode className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                    </div>
                  )}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bookingId)}`}
                    alt="Check-in QR Code"
                    width={150}
                    height={150}
                    className={`mx-auto rounded-lg ${qrLoaded ? '' : 'hidden'}`}
                    onLoad={() => setQrLoaded(true)}
                  />
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-2 font-mono">{bookingId.slice(0, 8)}...</p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/booking/${bookingId}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-colors"
                    style={{ backgroundColor: `${event.primaryColor}10`, color: event.primaryColor }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Manage Booking
                  </a>
                  <a
                    href={`/booking/${bookingId}/invoice`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Invoice
                  </a>
                </div>

                {/* Email Preview */}
                <div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4 bg-gray-50/50 dark:bg-zinc-800/50">
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-semibold mb-2">
                    Confirmation Email Preview
                  </p>
                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-700">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">To: {guestEmail || "your@email.com"}</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 mb-2">
                      Booking Confirmed — {event.name}
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
                      Dear {guestName},<br/><br/>
                      Your room ({selectedRoomData?.roomType}) at {event.venue} has been confirmed for{" "}
                      {new Date(event.checkIn).toLocaleDateString("en-IN")} –{" "}
                      {new Date(event.checkOut).toLocaleDateString("en-IN")}.<br/><br/>
                      Total: ₹{grandTotal.toLocaleString("en-IN")}<br/><br/>
                      Show your QR code at the front desk during check-in.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950">
      {/* Confetti on successful booking */}
      <ConfettiExplosion active={confetti.active} onComplete={confetti.reset} />
      
      {/* Background Effects */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${event.primaryColor}15, transparent),
            radial-gradient(ellipse 60% 40% at 100% 100%, ${event.accentColor}10, transparent)
          `
        }}
      />
      
      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${event.primaryColor}05`, borderColor: `${event.primaryColor}10` }}
      >
        <div className="max-w-3xl mx-auto px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-3 lg:gap-4">
          <button 
            onClick={() => router.back()} 
            title="Go back"
            className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 text-gray-600 dark:text-zinc-400" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">{event.name}</h1>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-zinc-400">Complete your booking</p>
          </div>
          <div 
            className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
          >
            <Hotel className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-5 lg:space-y-6 relative">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-6 lg:mb-8">
          {[
            { label: "Guest", icon: User, done: !!guestName },
            { label: "Room", icon: Hotel, done: !!selectedRoom },
            { label: "Confirm", icon: Check, done: false },
          ].map((step, idx, arr) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="h-8 w-8 lg:h-9 lg:w-9 rounded-full flex items-center justify-center transition-all text-xs font-bold"
                  style={{ 
                    backgroundColor: step.done ? event.primaryColor : `${event.primaryColor}15`,
                    color: step.done ? '#fff' : event.primaryColor,
                  }}
                >
                  <step.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </div>
                <span className={`text-[10px] lg:text-xs font-medium ${step.done ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}`}>
                  {step.label}
                </span>
              </div>
              {idx < arr.length - 1 && (
                <div 
                  className="h-0.5 w-8 lg:w-12 mx-1 lg:mx-2 rounded-full mt-[-14px]"
                  style={{ backgroundColor: step.done ? event.primaryColor : `${event.primaryColor}20` }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Guest Information */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 flex items-center gap-2.5 lg:gap-3">
            <div 
              className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
            >
              <User className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">Guest Details</h2>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-zinc-400">Tell us who's attending</p>
            </div>
          </div>
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
            <div>
              <label className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 lg:mb-2 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all bg-gray-50/50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700"
                style={{ "--tw-ring-color": event.primaryColor } as React.CSSProperties}
                placeholder="Enter your full name"
              />
              {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 lg:mb-2 block">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all bg-gray-50/50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700"
                  style={{ "--tw-ring-color": event.primaryColor } as React.CSSProperties}
                  placeholder="you@email.com"
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 lg:mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all bg-gray-50/50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700"
                  style={{ "--tw-ring-color": event.primaryColor } as React.CSSProperties}
                  placeholder="+91 XXXXX XXXXX"
                />
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 lg:mb-2 block">Group / Side</label>
                <select
                  value={guestGroup}
                  onChange={(e) => setGuestGroup(e.target.value)}
                  title="Select your group"
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all bg-gray-50/50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700"
                  style={{ "--tw-ring-color": event.primaryColor } as React.CSSProperties}
                >
                  <option value="">Select group</option>
                  {groupOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 lg:mb-2 block">Stay Near (Proximity)</label>
                <input
                  type="text"
                  value={proximityRequest}
                  onChange={(e) => setProximityRequest(e.target.value)}
                  className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all bg-gray-50/50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700"
                  style={{ "--tw-ring-color": event.primaryColor } as React.CSSProperties}
                  placeholder="e.g. Near Priya Sharma"
                />
              </div>
            </div>
            <div>
              <label className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5 lg:mb-2 block">Special Requests</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 transition-all bg-gray-50/50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-700 resize-none"
                style={{ "--tw-ring-color": event.primaryColor } as React.CSSProperties}
                placeholder="e.g. Early check-in, extra pillows, vegetarian meals..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 flex items-center gap-2.5 lg:gap-3">
            <div 
              className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
            >
              <Hotel className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">Select Your Room</h2>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-zinc-400">Choose your accommodation</p>
            </div>
          </div>
          <div className="p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-3">
            {event.roomBlocks.map((room) => {
              const available = room.totalQty - room.bookedQty;
              const isSelected = selectedRoom === room.id;
              const isLimited = available > 0 && available < 5;
              return (
                <button
                  key={room.id}
                  onClick={() => available > 0 && setSelectedRoom(room.id)}
                  disabled={available === 0}
                  className={`group w-full p-4 lg:p-5 rounded-xl lg:rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? "shadow-md"
                      : available === 0
                      ? "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50"
                      : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: event.primaryColor, backgroundColor: `${event.secondaryColor}30` }
                      : {}
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2 mb-0.5 lg:mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">{room.roomType}</h3>
                        {isLimited && (
                          <span className="px-1.5 lg:px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-0.5 lg:gap-1">
                            <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3" /> {available} left
                          </span>
                        )}
                        {available === 0 && (
                          <span className="px-1.5 lg:px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold bg-red-100 text-red-600">Sold Out</span>
                        )}
                      </div>
                      <p className="text-xs lg:text-sm text-gray-500">
                        {room.hotelName && <span className="font-medium" style={{ color: event.primaryColor }}>{room.hotelName} • </span>}
                        {room.floor && `Floor ${room.floor}`}
                        {room.floor && room.wing && ' • '}
                        {room.wing && `${room.wing} Wing`}
                        {!room.floor && !room.wing && !room.hotelName && 'Standard accommodation'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg lg:text-xl" style={{ color: event.primaryColor }}>
                        ₹{room.rate.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] lg:text-xs text-gray-400 font-medium">/night</p>
                    </div>
                    {isSelected && (
                      <div 
                        className="h-6 w-6 lg:h-7 lg:w-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: event.primaryColor }}
                      >
                        <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add-Ons */}
        {event.addOns.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2.5 lg:gap-3">
              <div 
                className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${event.accentColor}, ${event.primaryColor})` }}
              >
                <Sparkles className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
              </div>
              <div>
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">Add-Ons & Experiences</h2>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-zinc-400">Enhance your stay</p>
              </div>
            </div>
            <div className="p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-2 gap-2">
              {event.addOns.map((addon) => {
                const isSelected = selectedAddOns.includes(addon.id) || addon.isIncluded;
                return (
                  <button
                    key={addon.id}
                    onClick={() => !addon.isIncluded && toggleAddOn(addon.id)}
                    className={`w-full p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 transition-all text-left flex items-start sm:items-center justify-between gap-2.5 lg:gap-3 ${
                      isSelected 
                        ? addon.isIncluded 
                          ? "border-emerald-200 bg-emerald-50/50" 
                          : "border-blue-300 bg-blue-50/50" 
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 lg:gap-3 flex-1 min-w-0">
                      <div
                        className={`h-5 w-5 lg:h-6 lg:w-6 rounded-md lg:rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 sm:mt-0 ${
                          isSelected 
                            ? addon.isIncluded 
                              ? "bg-emerald-500 text-white" 
                              : "bg-blue-500 text-white" 
                            : "border-2 border-gray-200"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 lg:h-3.5 lg:w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-xs lg:text-sm text-gray-900 dark:text-zinc-100 block">{addon.name}</span>
                        {addon.description && (
                          <span className="text-[10px] lg:text-xs text-gray-500 mt-0.5 block truncate">{addon.description}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs lg:text-sm font-semibold px-2 lg:px-3 py-0.5 lg:py-1 rounded-md lg:rounded-lg shrink-0 ${
                        addon.isIncluded ? "text-emerald-700 bg-emerald-100" : "text-gray-700 bg-gray-100"
                      }`}
                    >
                      {addon.isIncluded ? "Included" : `+ ₹${addon.price.toLocaleString("en-IN")}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 flex items-center gap-2.5 lg:gap-3">
            <div 
              className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
            >
              <CreditCard className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">Booking Summary</h2>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-zinc-400">Review your booking details</p>
            </div>
          </div>
          <div className="p-4 lg:p-6 space-y-2 lg:space-y-3 text-sm">
            {selectedRoomData && (
              <div className="flex justify-between items-center py-1.5 lg:py-2">
                <span className="text-gray-500 dark:text-zinc-400 text-xs lg:text-sm">{selectedRoomData.roomType} × {nights} night{nights > 1 ? 's' : ''}</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100 text-xs lg:text-sm">₹{roomTotal.toLocaleString("en-IN")}</span>
              </div>
            )}
            {selectedAddOns.map((id) => {
              const addon = event.addOns.find((a) => a.id === id);
              if (!addon || addon.isIncluded) return null;
              return (
                <div key={id} className="flex justify-between items-center py-1.5 lg:py-2">
                  <span className="text-gray-500 dark:text-zinc-400 text-xs lg:text-sm">{addon.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-zinc-100 text-xs lg:text-sm">₹{addon.price.toLocaleString("en-IN")}</span>
                </div>
              );
            })}
            {event.addOns
              .filter((a) => a.isIncluded)
              .map((addon) => (
                <div key={addon.id} className="flex justify-between items-center text-emerald-600 py-1.5 lg:py-2">
                  <span className="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm">
                    <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> {addon.name}
                  </span>
                  <span className="font-semibold text-xs lg:text-sm">Free</span>
                </div>
              ))}
            <div 
              className="flex justify-between items-center pt-3 lg:pt-4 mt-3 lg:mt-4 rounded-lg lg:rounded-xl p-3 lg:p-4 -mx-1 lg:-mx-2"
              style={{ backgroundColor: `${event.secondaryColor}50` }}
            >
              <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">Total Amount</span>
              <span className="text-xl lg:text-2xl font-bold" style={{ color: event.primaryColor }}>
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm p-4 lg:p-5">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-current"
              style={{ accentColor: event.primaryColor }}
            />
            <span className="text-xs lg:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              I agree to the booking terms and cancellation policy. I understand that room rates are per night and group discounts are applied automatically based on total rooms booked for this event.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4 z-10 max-w-lg mx-auto w-full">
          <div className="rounded-2xl border border-white/20 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-3 shadow-2xl">
            {/* Price summary bar */}
            {selectedRoomData ? (
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-xs text-gray-500 dark:text-zinc-400">
                  <span className="font-medium text-gray-700 dark:text-zinc-300">{selectedRoomData.roomType}</span>
                  <span className="mx-1">·</span>
                  <span>{nights} night{nights > 1 ? 's' : ''}</span>
                  {addOnTotal > 0 && <span className="mx-1">+ add-ons</span>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: event.primaryColor }}>
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-3 px-1 py-1">
                <Hotel className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">Select a room and enter your name to continue</span>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!guestName || !selectedRoom || isSubmitting || !agreedToTerms}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:saturate-50 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl relative overflow-hidden"
              style={{ 
                background: !guestName || !selectedRoom || !agreedToTerms
                  ? '#94a3b8'
                  : `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})`,
                boxShadow: !guestName || !selectedRoom || !agreedToTerms
                  ? 'none'
                  : `0 8px 24px -4px ${event.primaryColor}40`
              }}
            >
              {/* Shimmer */}
              {guestName && selectedRoom && agreedToTerms && !isSubmitting && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
              )}
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {processingPhase || "Processing..."}</>
              ) : (
                <>
                  Confirm Booking
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
          {bookingError && (
            <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-xs text-red-600 font-medium">{bookingError}</p>
            </div>
          )}
          <p className="text-center text-[10px] text-gray-400 mt-2.5 flex items-center justify-center gap-1">
            <Shield className="h-2.5 w-2.5" /> Secure booking powered by TBO Assemble
          </p>
        </div>
      </div>
    </div>
  );
}
