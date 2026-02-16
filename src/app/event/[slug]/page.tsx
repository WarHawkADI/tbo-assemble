import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";
import { Calendar, MapPin, Hotel, Users, ArrowRight, Sparkles, Star, Check, Heart, Clock, Share2, MessageSquare, AlertTriangle, Gift, Mail, ListChecks } from "lucide-react";
import { Countdown } from "@/components/ui/countdown";
import { MicrositeBottomNav, MicrositeSocialProof, MicrositeCopyLink, MicrositeWhatsAppShare, LanguageToggle, T } from "./microsite-extras";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { name: true, description: true, venue: true, location: true, checkIn: true, checkOut: true },
  });
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.name} | Book Your Stay`,
    description: event.description || `Join us at ${event.venue}, ${event.location} from ${formatDate(event.checkIn)} to ${formatDate(event.checkOut)}.`,
    openGraph: {
      title: event.name,
      description: event.description || `Book your room for ${event.name} at ${event.venue}.`,
      type: "website",
    },
  };
}

export default async function MicrositePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      roomBlocks: { orderBy: { hotelName: "asc" } },
      addOns: true,
      guests: true,
      agent: true,
      discountRules: { orderBy: { minRooms: "asc" } },
      attritionRules: { orderBy: { releaseDate: "asc" } },
    },
  });

  if (!event) return notFound();

  const confirmedGuests = event.guests.filter((g) => g.status === "confirmed").length;
  const totalRoomsAvailable = event.roomBlocks.reduce((s, r) => s + r.totalQty - r.bookedQty, 0);
  const totalRooms = event.roomBlocks.reduce((s, r) => s + r.totalQty, 0);
  const includedPerks = event.addOns.filter((a) => a.isIncluded).length;
  const days = daysUntil(event.checkIn);
  const isUpcoming = days > 0;
  const isPast = days < -1;
  const lowestRate = event.roomBlocks.length > 0 ? Math.min(...event.roomBlocks.map(r => r.rate)) : 0;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950">
      {/* Event Status Banner */}
      {isPast && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gray-900 text-white text-center py-2 text-xs font-medium">
          <T k="event_concluded" />
        </div>
      )}
      {!isUpcoming && !isPast && (
        <div className="fixed top-0 left-0 right-0 z-[60] text-white text-center py-2 text-xs font-medium" style={{ backgroundColor: event.primaryColor }}>
          🎉 <T k="event_happening" />
        </div>
      )}

      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-6 py-3 lg:py-4">
        <div 
          className="max-w-6xl mx-auto px-5 lg:px-6 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg bg-white/70 dark:bg-zinc-900/70"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
              >
                <Heart className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-gray-900 dark:text-zinc-100 text-sm lg:text-base leading-tight">{event.name}</span>
                <span className="text-[10px] lg:text-xs text-gray-500 dark:text-zinc-400">{event.venue}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <LanguageToggle />
              <MicrositeWhatsAppShare eventName={event.name} />
              <MicrositeCopyLink />
              <Link
                href={`/event/${slug}/book`}
                className="px-5 lg:px-6 py-2.5 lg:py-2.5 rounded-lg lg:rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
              >
                <T k="reserve_now" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-28">
        {/* Animated Background - Light */}
        <div 
          className="absolute inset-0 dark:hidden"
          style={{ 
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, ${event.primaryColor}30, transparent),
              radial-gradient(ellipse 60% 40% at 80% 100%, ${event.accentColor}25, transparent),
              radial-gradient(ellipse 50% 30% at 10% 80%, ${event.secondaryColor}, transparent),
              linear-gradient(180deg, #fafafa 0%, white 50%, #fafafa 100%)
            `
          }}
        />
        {/* Animated Background - Dark */}
        <div 
          className="absolute inset-0 hidden dark:block"
          style={{ 
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, ${event.primaryColor}18, transparent),
              radial-gradient(ellipse 60% 40% at 80% 100%, ${event.accentColor}12, transparent),
              radial-gradient(ellipse 50% 30% at 10% 80%, ${event.primaryColor}08, transparent),
              linear-gradient(180deg, #09090b 0%, #18181b 50%, #09090b 100%)
            `
          }}
        />
        
        {/* Floating Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse"
            style={{ backgroundColor: event.primaryColor, animationDuration: '4s' }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ backgroundColor: event.accentColor, animationDuration: '6s', animationDelay: '2s' }}
          />
        </div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${event.primaryColor} 1px, transparent 1px), linear-gradient(90deg, ${event.primaryColor} 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Date Badge */}
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm border shadow-sm"
            style={{ backgroundColor: `${event.primaryColor}08`, borderColor: `${event.primaryColor}20`, color: event.primaryColor }}
          >
            <Calendar className="h-4 w-4" />
            {formatDate(event.checkIn)} – {formatDate(event.checkOut)}
          </div>

          <p className="text-sm uppercase tracking-[0.3em] mb-4 font-semibold" style={{ color: event.accentColor }}>
            <T k="youre_invited" />
          </p>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight text-gray-900 dark:text-zinc-100">
            {event.name}
          </h1>
          
          {event.description && (
            <p className="text-lg sm:text-xl text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">{event.description}</p>
          )}

          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-400 mb-12">
            <MapPin className="h-4 w-4" style={{ color: event.primaryColor }} />
            <span className="font-medium">{event.venue}</span>
            <span className="text-gray-300 dark:text-zinc-600">•</span>
            <span>{event.location}</span>
          </div>

          <Link
            href={`/event/${slug}/book`}
            className="group inline-flex items-center gap-2.5 px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-xl lg:rounded-2xl text-sm sm:text-base lg:text-lg font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1"
            style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})`, boxShadow: `0 12px 24px -6px ${event.primaryColor}40` }}
          >
            <T k="book_your_stay" />
            <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Urgency Badge */}
          {totalRoomsAvailable > 0 && totalRoomsAvailable < 20 && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                Only {totalRoomsAvailable} rooms left — filling fast!
              </span>
            </div>
          )}

          {/* Countdown Timer */}
          <div className="mt-8">
            <Countdown targetDate={event.checkIn} label="Event Starts In" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs uppercase tracking-widest text-gray-400"><T k="scroll" /></span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-transparent" />
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative -mt-16 lg:-mt-20 px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-5xl mx-auto">
          <div 
            className="rounded-3xl p-1 shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${event.primaryColor}20, ${event.accentColor}20)` }}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-[22px] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0">
              <div className="text-center sm:border-r border-gray-100 dark:border-zinc-700 group cursor-default">
                <div 
                  className="text-4xl sm:text-5xl font-bold mb-2 transition-transform group-hover:scale-110"
                  style={{ color: event.primaryColor }}
                >
                  {totalRoomsAvailable}
                </div>
                <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                  <Hotel className="h-4 w-4" /> <T k="rooms_available" />
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </p>
              </div>
              <div className="text-center sm:border-r border-gray-100 dark:border-zinc-700 group cursor-default border-t sm:border-t-0 pt-6 sm:pt-0">
                <div 
                  className="text-4xl sm:text-5xl font-bold mb-2 transition-transform group-hover:scale-110"
                  style={{ color: event.primaryColor }}
                >
                  {confirmedGuests}
                </div>
                <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" /> <T k="guests_confirmed" />
                </p>
              </div>
              <div className="text-center group cursor-default border-t sm:border-t-0 pt-6 sm:pt-0">
                <div 
                  className="text-4xl sm:text-5xl font-bold mb-2 transition-transform group-hover:scale-110"
                  style={{ color: event.primaryColor }}
                >
                  {includedPerks}
                </div>
                <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" /> <T k="included_perks" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Starting Price Badge */}
      {lowestRate > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 shadow-sm">
              <div className="text-left">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Starting from</p>
                <p className="text-xl font-bold" style={{ color: event.primaryColor }}>
                  {formatCurrency(lowestRate)}<span className="text-xs font-medium text-gray-400 dark:text-zinc-500">/night</span>
                </p>
              </div>
              {event.discountRules.length > 0 && (
                <>
                  <div className="h-8 w-px bg-gray-200 dark:bg-zinc-700" />
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Group discount</p>
                    <p className="text-xl font-bold text-emerald-600">up to {Math.max(...event.discountRules.map(r => r.discountPct))}% off</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Event Itinerary / Schedule */}
      {isUpcoming && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 shadow-md"
              style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
            >
              <ListChecks className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Event Schedule</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-md mx-auto">What to expect during the event</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-gray-200 dark:via-zinc-700 to-transparent" />
            {(() => {
              const checkInDate = new Date(event.checkIn);
              const checkOutDate = new Date(event.checkOut);
              const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
              const days = [];
              for (let i = 0; i <= Math.min(nights, 3); i++) {
                const date = new Date(checkInDate);
                date.setDate(date.getDate() + i);
                const isFirstDay = i === 0;
                const isLastDay = i === nights;
                days.push(
                  <div key={i} className="relative flex gap-4 pl-0 mb-6">
                    <div 
                      className="relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">
                          {isFirstDay ? "Arrival Day" : isLastDay ? "Departure Day" : `Day ${i + 1}`}
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {isFirstDay ? "Check-in, welcome orientation, room allocation & networking" : 
                         isLastDay ? "Breakfast, checkout & farewell" :
                         i === 1 ? "Main event sessions, keynote & group activities" :
                         "Breakout sessions, leisure time & evening celebrations"}
                      </p>
                    </div>
                  </div>
                );
              }
              return days;
            })()}
          </div>
        </section>
      )}

      {/* Discount Tiers */}
      {event.discountRules.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 shadow-md"
              style={{ background: `linear-gradient(135deg, ${event.accentColor}, ${event.primaryColor})` }}
            >
              <Gift className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2"><T k="group_discounts" /></h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-md mx-auto"><T k="group_discount_desc" /></p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {event.discountRules.map((rule, idx) => (
              <div key={rule.id} className={`relative rounded-xl border p-5 text-center transition-all hover:shadow-lg ${idx === event.discountRules.length - 1 ? 'border-2 shadow-md' : 'border-gray-100 dark:border-zinc-700'}`} style={idx === event.discountRules.length - 1 ? { borderColor: event.primaryColor } : {}}>
                {idx === event.discountRules.length - 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: event.primaryColor }}>
                    <T k="best_value" />
                  </div>
                )}
                <div className="text-3xl font-bold mb-1" style={{ color: event.primaryColor }}>{rule.discountPct}%</div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider mb-2"><T k="discount" /></p>
                <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium"><T k="book_rooms" /> {rule.minRooms}+ <T k="rooms" /></p>
                {lowestRate > 0 && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
                    <T k="from_price" /> {formatCurrency(lowestRate * (1 - rule.discountPct / 100))}/<T k="per_night" />
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Attrition Timeline */}
      {event.attritionRules.length > 0 && isUpcoming && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-14">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm"><T k="booking_deadlines" /></h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400"><T k="book_before_dates" /></p>
              </div>
            </div>
            <div className="space-y-2">{event.attritionRules.map((rule) => {
              const d = daysUntil(rule.releaseDate);
              const isPassed = d < 0;
              return (
                <div key={rule.id} className={`flex items-center justify-between p-3 rounded-xl ${isPassed ? 'bg-red-50 dark:bg-red-950/20' : 'bg-white dark:bg-zinc-900'} border border-gray-100 dark:border-zinc-700`}>
                  <div>
                    <p className={`text-sm font-medium ${isPassed ? 'text-red-600 dark:text-red-400 line-through' : 'text-gray-900 dark:text-zinc-100'}`}>{formatDate(rule.releaseDate)}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{isPassed ? <T k="deadline_passed" /> : <>{d} <T k="days_remaining" /></>}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100"><T k="release" /> {rule.releasePercent}%</p>
                    {rule.description && <p className="text-xs text-gray-500 dark:text-zinc-400">{rule.description}</p>}
                  </div>
                </div>
              );
            })}</div>
          </div>
        </section>
      )}

      {/* Room Selection */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center mb-10 lg:mb-12">
          <div 
            className="inline-flex items-center justify-center h-11 w-11 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl mb-4 shadow-md"
            style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
          >
            <Hotel className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-2"><T k="choose_your_room" /></h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm lg:text-base max-w-md mx-auto"><T k="select_accommodation" /></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {event.roomBlocks.map((room) => {
            const available = room.totalQty - room.bookedQty;
            const isLimited = available > 0 && available < 5;
            const isSoldOut = available === 0;
            const occupancyPct = Math.round((room.bookedQty / room.totalQty) * 100);
            
            return (
              <div
                key={room.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-zinc-700 p-5 lg:p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-200 dark:hover:border-zinc-600 overflow-hidden"
              >
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${event.primaryColor}03, ${event.accentColor}05)` }}
                />
                
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-zinc-100">{room.roomType}</h3>
                        {isLimited && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3" /> {available} <T k="left" />
                          </span>
                        )}
                        {isSoldOut && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold bg-red-100 text-red-600"><T k="sold_out" /></span>
                        )}
                      </div>
                      {room.hotelName && (
                        <p className="text-xs font-medium mb-0.5" style={{ color: event.primaryColor }}>{room.hotelName}</p>
                      )}
                      <p className="text-gray-500 dark:text-zinc-400 text-xs lg:text-sm">
                        {room.floor && <><T k="floor" /> {room.floor}</>}
                        {room.floor && room.wing && ' • '}
                        {room.wing && <>{room.wing} <T k="wing" /></>}
                        {!room.floor && !room.wing && <T k="standard_accommodation" />}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl lg:text-2xl font-bold" style={{ color: event.primaryColor }}>
                        {formatCurrency(room.rate)}
                      </div>
                      <p className="text-[10px] lg:text-xs text-gray-400 font-medium"><T k="per_night" /></p>
                    </div>
                  </div>

                  {/* Live occupancy bar */}
                  {!isSoldOut && (
                    <div className="mt-3 mb-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          {available} <T k="of" /> {room.totalQty} <T k="available" />
                        </span>
                        <span className="text-[10px] text-gray-400">{occupancyPct}% <T k="booked" /></span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${occupancyPct}%`,
                            background: occupancyPct > 80 ? '#ef4444' : occupancyPct > 50 ? '#f59e0b' : `linear-gradient(90deg, ${event.primaryColor}, ${event.accentColor})`
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {!isSoldOut && (
                    <Link
                      href={`/event/${slug}/book?room=${room.id}`}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
                    >
                      <T k="select_room" /> <ArrowRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Perks Section */}
      {event.addOns.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: `${event.secondaryColor}50` }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 lg:mb-12">
              <div 
                className="inline-flex items-center justify-center h-11 w-11 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl mb-4 shadow-md"
                style={{ background: `linear-gradient(135deg, ${event.accentColor}, ${event.primaryColor})` }}
              >
                <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-2"><T k="perks_experiences" /></h2>
              <p className="text-gray-500 dark:text-zinc-400 text-sm lg:text-base max-w-md mx-auto"><T k="enhance_stay" /></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {event.addOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`group relative bg-white dark:bg-zinc-900 rounded-xl lg:rounded-2xl p-4 lg:p-5 transition-all duration-200 hover:shadow-md border ${
                    addon.isIncluded ? 'border-emerald-200 dark:border-emerald-800/50 shadow-sm' : 'border-gray-100 dark:border-zinc-700 hover:border-gray-200 dark:hover:border-zinc-600'
                  }`}
                >
                  {addon.isIncluded && (
                    <div className="absolute -top-1.5 -right-1.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base mb-0.5">{addon.name}</h3>
                      {addon.description && (
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-zinc-400 line-clamp-2">{addon.description}</p>
                      )}
                    </div>
                    <div 
                      className={`shrink-0 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs lg:text-sm font-semibold ${
                        addon.isIncluded ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      {addon.isIncluded ? <T k="included" /> : formatCurrency(addon.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-zinc-100 mb-3"><T k="ready_to_join" /></h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm lg:text-base"><T k="secure_your_spot" /> {event.name}. <T k="limited_rooms" /></p>
          <Link
            href={`/event/${slug}/book`}
            className="group inline-flex items-center gap-2.5 px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 lg:py-4 rounded-xl lg:rounded-2xl text-sm sm:text-base lg:text-lg font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1"
            style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})`, boxShadow: `0 12px 24px -6px ${event.primaryColor}40` }}
          >
            <T k="book_room_now" />
            <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 lg:py-10 border-t border-gray-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Contact Info */}
          {event.agent?.email && (
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-xs text-gray-500 dark:text-zinc-400">
              <a href={`mailto:${event.agent.email}`} className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                <Mail className="h-3.5 w-3.5" /> {event.agent.email}
              </a>
            </div>
          )}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div 
                className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${event.primaryColor}, ${event.accentColor})` }}
              >
                <Star className="h-4 w-4 lg:h-4.5 lg:w-4.5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-zinc-100 text-sm lg:text-base">TBO Assemble</span>
            </div>
            <p className="text-xs lg:text-sm text-gray-400 dark:text-zinc-500"><T k="the_os_for_group_travel" /></p>
            <p className="text-[10px] text-gray-300 dark:text-zinc-600 mt-2"><T k="powered_by" /> · {event.name}</p>
          </div>
        </div>
      </footer>

      {/* Social Proof Popup */}
      <MicrositeSocialProof guestCount={confirmedGuests} />

      {/* Mobile Bottom Nav */}
      <MicrositeBottomNav
        bookUrl={`/event/${slug}/book`}
        feedbackUrl={`/event/${slug}/feedback`}
        primaryColor={event.primaryColor}
        accentColor={event.accentColor}
      />
    </div>
  );
}
