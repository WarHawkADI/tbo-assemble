import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { EventOverviewActions } from "./overview-actions";
import {
  Hotel,
  Users,
  Calendar,
  MapPin,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  BarChart3,
} from "lucide-react";
import { DiscountRulesClient } from "@/components/dashboard/discount-rules-client";
import { EventEditForm } from "@/components/dashboard/event-edit-form";

export const dynamic = "force-dynamic";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      roomBlocks: true,
      guests: true,
      bookings: true,
      addOns: true,
      attritionRules: { orderBy: { releaseDate: "asc" } },
      discountRules: { orderBy: { minRooms: "asc" } },
    },
  });

  if (!event) return notFound();

  const totalRooms = event.roomBlocks.reduce((s, r) => s + r.totalQty, 0);
  const bookedRooms = event.roomBlocks.reduce((s, r) => s + r.bookedQty, 0);
  const occupancyPct = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
  const totalRevenue = event.bookings.reduce((s, b) => s + b.totalAmount, 0);
  const confirmedGuests = event.guests.filter((g) => g.status === "confirmed").length;
  const invitedGuests = event.guests.filter((g) => g.status === "invited").length;

  const nextRelease = event.attritionRules.find((r) => !r.isTriggered);

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Event Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">{event.name}</h1>
            <Badge variant={
              event.status === "active" ? "success"
              : event.status === "draft" ? "warning"
              : event.status === "cancelled" ? "destructive"
              : "secondary"
            }>
              {event.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" /> {event.venue}, {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" /> {formatDate(event.checkIn)} – {formatDate(event.checkOut)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EventEditForm
            eventId={eventId}
            initialData={{
              name: event.name,
              venue: event.venue,
              location: event.location,
              checkIn: event.checkIn.toISOString(),
              checkOut: event.checkOut.toISOString(),
              type: event.type,
              primaryColor: event.primaryColor,
              secondaryColor: event.secondaryColor,
            }}
          />
          <EventOverviewActions slug={event.slug} eventId={eventId} currentStatus={event.status} eventName={event.name} />
          <Link href={`/event/${event.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Guest Microsite
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Room Occupancy</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Hotel className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{occupancyPct}%</p>
            <Progress value={occupancyPct} className="mt-3 h-2" indicatorClassName={occupancyPct > 80 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : occupancyPct > 50 ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-amber-500 to-orange-500"} />
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{bookedRooms}/{totalRooms} rooms booked</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Guests</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{confirmedGuests}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4">{invitedGuests} pending confirmation</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Revenue</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4">From {event.bookings.length} bookings</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Attrition Risk</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            {nextRelease ? (
              <>
                <p className="text-3xl font-bold text-amber-600">
                  {nextRelease.releasePercent}%
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Releases {formatDate(nextRelease.releaseDate)}
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-emerald-600">Safe</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4">No pending releases</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href={`/dashboard/events/${eventId}/guests`}>
          <Card className="border-0 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">Guest List</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{event.guests.length} guests total</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/events/${eventId}/inventory`}>
          <Card className="border-0 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50">
                  <Hotel className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">Room Inventory</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{event.roomBlocks.length} room types configured</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/events/${eventId}/allocator`}>
          <Card className="border-0 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md shadow-purple-200/50">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-purple-600 transition-colors">Visual Allocator</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Drag-and-drop guest placement</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 dark:text-zinc-600 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/events/${eventId}/attrition`}>
          <Card className="border-0 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-200/50">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-amber-600 transition-colors">Attrition Dashboard</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{event.attritionRules.length} release rules</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 dark:text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Room Blocks Summary */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-sm">
              <Hotel className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold">Room Blocks</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-zinc-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Room Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Rate/Night</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Available</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Booked</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {event.roomBlocks.map((room) => {
                  const pct = room.totalQty > 0 ? Math.round((room.bookedQty / room.totalQty) * 100) : 0;
                  return (
                    <tr key={room.id} className="border-t border-gray-100 dark:border-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-zinc-100">{room.roomType}</td>
                      <td className="px-5 py-4 text-gray-700 dark:text-zinc-300">{formatCurrency(room.rate)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          {room.totalQty - room.bookedQty}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-zinc-300">{room.bookedQty}/{room.totalQty}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Progress value={pct} className="w-24 h-2" />
                          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Forecast Widget */}
      <div className="mt-8">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Revenue Forecast</CardTitle>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">Projected revenue at full occupancy vs. current</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {(() => {
              const nights = Math.ceil(
                (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) / (1000 * 60 * 60 * 24)
              );
              const maxRevenue = event.roomBlocks.reduce((s, r) => s + r.totalQty * r.rate * nights, 0);
              const currentRevenue = totalRevenue;
              const projectedRevenue = totalRooms > 0
                ? Math.round((bookedRooms / totalRooms) * maxRevenue * 1.1)
                : 0;
              const revenuePercent = maxRevenue > 0 ? Math.round((currentRevenue / maxRevenue) * 100) : 0;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Current Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(currentRevenue)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{revenuePercent}% of potential</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Projected (at trend)</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(projectedRevenue)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Based on current pace</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Max Potential</p>
                    <p className="text-2xl font-bold text-gray-400 dark:text-zinc-500">{formatCurrency(maxRevenue)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{totalRooms} rooms × {nights} nights</p>
                  </div>
                </div>
              );
            })()}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                <span>Revenue progress</span>
                <span>{formatCurrency(totalRevenue)} / {formatCurrency(
                  event.roomBlocks.reduce((s, r) => s + r.totalQty * r.rate * Math.ceil((new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) / (1000 * 60 * 60 * 24)), 0)
                )}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      100,
                      (() => {
                        const nights = Math.ceil(
                          (new Date(event.checkOut).getTime() - new Date(event.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const maxRevenue = event.roomBlocks.reduce((s, r) => s + r.totalQty * r.rate * nights, 0);
                        return maxRevenue > 0 ? Math.round((totalRevenue / maxRevenue) * 100) : 0;
                      })()
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discount Rules */}
      <div className="mt-8">
        <DiscountRulesClient
          eventId={eventId}
          initialRules={event.discountRules.map((r) => ({
            id: r.id,
            minRooms: r.minRooms,
            discountPct: r.discountPct,
            description: r.description,
            isActive: r.isActive,
          }))}
        />
      </div>

      {/* Analytics Charts */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-sm">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Analytics</h2>
        </div>
        <AnalyticsCharts
          roomBlocks={event.roomBlocks.map(r => ({
            id: r.id,
            roomType: r.roomType,
            totalQty: r.totalQty,
            bookedQty: r.bookedQty,
            rate: r.rate,
          }))}
          guests={event.guests.map(g => ({
            status: g.status,
            group: g.group,
          }))}
          bookings={event.bookings.map(b => ({
            totalAmount: b.totalAmount,
            createdAt: b.createdAt.toISOString(),
          }))}
          eventColor={event.primaryColor}
        />
      </div>
    </div>
  );
}
