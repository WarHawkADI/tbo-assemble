"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  Hotel,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
  RefreshCw,
  Copy,
  Globe,
  RotateCcw,
  Play,
  AlertTriangle,
  IndianRupee,
  Zap,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  venue: string;
  location: string;
  checkIn: string;
  checkOut: string;
  primaryColor: string;
  totalRooms: number;
  bookedRooms: number;
  guestCount: number;
  confirmedGuests: number;
  totalRevenue: number;
}

interface DashboardClientProps {
  initialEvents: Event[];
}

export function DashboardClient({ initialEvents }: DashboardClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [copyToast, setCopyToast] = useState("");
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoNotifications, setDemoNotifications] = useState<{ id: number; text: string; type: string }[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  // Set initial timestamp after mount to avoid hydration mismatch
  useEffect(() => {
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh every 30 seconds
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const allEvents = await res.json();
        const mapped = allEvents.map((event: Record<string, unknown>) => ({
          id: event.id,
          name: event.name,
          slug: event.slug,
          type: event.type,
          status: event.status,
          venue: event.venue,
          location: event.location,
          checkIn: event.checkIn,
          checkOut: event.checkOut,
          primaryColor: event.primaryColor,
          totalRooms: (event.roomBlocks as { totalQty: number }[])?.reduce((s: number, r: { totalQty: number }) => s + r.totalQty, 0) || 0,
          bookedRooms: (event.roomBlocks as { bookedQty: number }[])?.reduce((s: number, r: { bookedQty: number }) => s + r.bookedQty, 0) || 0,
          guestCount: (event.guests as unknown[])?.length || 0,
          confirmedGuests: (event.guests as { status: string }[])?.filter((g: { status: string }) => g.status === "confirmed").length || 0,
          totalRevenue: (event.bookings as { totalAmount: number }[])?.reduce((s: number, b: { totalAmount: number }) => s + b.totalAmount, 0) || 0,
        }));
        setEvents(mapped);
        setLastRefresh(new Date());
      }
    } catch {
      // silent fail
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Reset demo data
  const resetDemo = useCallback(async () => {
    if (!confirm("This will reset all demo data. Continue?")) return;
    setResettingDemo(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await refreshData();
      }
    } catch {
      // silent fail
    } finally {
      setResettingDemo(false);
    }
  }, [refreshData]);

  // Live Demo Mode — simulate bookings with animated notifications
  const runLiveDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setDemoStep(0);
    setDemoNotifications([]);

    const demoGuests = [
      { name: "Priya Sharma", group: "Bride Side", room: "Deluxe King" },
      { name: "Rahul Mehta", group: "Groom Side", room: "Premium Suite" },
      { name: "Anita Desai", group: "VIP", room: "Deluxe Twin" },
      { name: "Vikram Singh", group: "Family", room: "Deluxe King" },
    ];

    for (let i = 0; i < demoGuests.length; i++) {
      setDemoStep(i + 1);
      const guest = demoGuests[i];

      const notifId = Date.now();
      setDemoNotifications((prev) => [
        { id: notifId, text: `🎉 ${guest.name} booked ${guest.room} (${guest.group})`, type: "booking" },
        ...prev.slice(0, 3),
      ]);

      try {
        const eventsRes = await fetch("/api/events");
        if (eventsRes.ok) {
          const allEvents = await eventsRes.json();
          if (allEvents.length > 0) {
            const evt = allEvents[0];
            const rooms = evt.roomBlocks || [];
            const availableRoom = rooms.find((r: { totalQty: number; bookedQty: number }) => r.totalQty - r.bookedQty > 0);
            if (availableRoom) {
              await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventId: evt.id,
                  roomBlockId: availableRoom.id,
                  guestName: guest.name,
                  guestEmail: `${guest.name.toLowerCase().replace(/\s/g, ".")}@demo.com`,
                  guestPhone: `+91 98765 ${String(43210 + i).slice(0, 5)}`,
                  guestGroup: guest.group,
                  selectedAddOns: [],
                  totalAmount: availableRoom.rate * 2,
                }),
              });
            }
          }
        }
      } catch {
        // Continue demo
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    await refreshData();
    setDemoNotifications((prev) => [
      { id: Date.now(), text: "✅ Live demo complete — 4 bookings simulated!", type: "success" },
      ...prev.slice(0, 3),
    ]);
    setTimeout(() => setDemoNotifications([]), 5000);
    setDemoRunning(false);
    setDemoStep(0);
  }, [demoRunning, refreshData]);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search and filter
  useEffect(() => {
    const searchEvents = async () => {
      if (!debouncedSearch && statusFilter === "all" && typeFilter === "all") {
        setEvents(initialEvents);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (typeFilter !== "all") params.set("type", typeFilter);

        const res = await fetch(`/api/events/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    searchEvents();
  }, [debouncedSearch, statusFilter, typeFilter, initialEvents]);



  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success" as const;
      case "draft":
        return "secondary" as const;
      case "completed":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      wedding: "Wedding",
      conference: "Conference",
      corporate: "Corporate",
      social: "Social Event",
    };
    return labels[type] || type;
  };

  // Calculate totals (memoized)
  const { totalRevenue, totalGuests, totalRooms, bookedRooms } = useMemo(() => ({
    totalRevenue: events.reduce((s, e) => s + e.totalRevenue, 0),
    totalGuests: events.reduce((s, e) => s + e.guestCount, 0),
    totalRooms: events.reduce((s, e) => s + e.totalRooms, 0),
    bookedRooms: events.reduce((s, e) => s + e.bookedRooms, 0),
  }), [events]);

  return (
    <div className="animate-fade-in">
      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <span className="text-[10px] text-gray-400 dark:text-zinc-500">
          Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString("en-IN") : "--:--:--"}
        </span>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 transition-colors"
          title="Refresh data"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats with Animated Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#ff6b35]/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Total Events</p>
              <Calendar className="h-4 w-4 text-[#ff6b35]" />
            </div>
            <AnimatedCounter value={events.length} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Total Revenue</p>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <AnimatedCounter
              value={totalRevenue}
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100"
              prefix="₹"
              formatter={(n) => n.toLocaleString("en-IN")}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Total Guests</p>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <AnimatedCounter value={totalGuests} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Room Occupancy</p>
              <Hotel className="h-4 w-4 text-blue-600" />
            </div>
            <AnimatedCounter
              value={totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0}
              suffix="%"
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100"
            />
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{bookedRooms}/{totalRooms} rooms</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue At-Risk Banner + Live Demo Mode */}
      {(totalRooms - bookedRooms > 0 || demoRunning) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Revenue At-Risk */}
          <Card className="border-0 shadow-sm overflow-hidden relative border-l-4 border-l-red-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Revenue At Risk</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">Unsold rooms × avg rate</p>
                  </div>
                </div>
                <IndianRupee className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ₹{(events.reduce((s, e) => {
                  const unsold = e.totalRooms - e.bookedRooms;
                  const avgRate = e.totalRevenue > 0 && e.bookedRooms > 0 ? e.totalRevenue / e.bookedRooms : 5000;
                  return s + (unsold * avgRate);
                }, 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <div className="mt-3 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  style={{ width: `${totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-zinc-500">
                <span>{bookedRooms} secured</span>
                <span>{totalRooms - bookedRooms} at risk</span>
              </div>
            </CardContent>
          </Card>

          {/* Live Demo Mode */}
          <Card className="border-0 shadow-sm overflow-hidden relative border-l-4 border-l-violet-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                    <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Live Demo Mode</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">Simulate real bookings</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
                Instantly generate 4 realistic bookings with animated notifications to showcase the platform.
              </p>
              <button
                onClick={runLiveDemo}
                disabled={demoRunning}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: demoRunning ? '#7c3aed' : 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
              >
                {demoRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Simulating... ({demoStep}/4)
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Live Demo
                  </>
                )}
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demo Notifications */}
      {demoNotifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {demoNotifications.map((notif) => (
            <div
              key={notif.id}
              className="px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-5 fade-in bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200"
            >
              {notif.text}
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-full sm:flex-1 sm:min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <Input
            placeholder="Search events by name, venue, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
            aria-label="Filter by status"
            className="text-sm border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            title="Filter by type"
            aria-label="Filter by type"
            className="text-sm border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35]"
          >
            <option value="all">All Types</option>
            <option value="wedding">Wedding</option>
            <option value="conference">Conference</option>
            <option value="corporate">Corporate</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={resetDemo}
            disabled={resettingDemo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
            title="Reset demo data"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${resettingDemo ? "animate-spin" : ""}`} />
            {resettingDemo ? "Resetting..." : "Reset Demo"}
          </button>
          <Link href="/dashboard/onboarding">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" /> New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-800/50 mx-auto mb-4 shadow-sm">
              <Calendar className="h-7 w-7 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "No events match your filters"
                : "No events yet"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first event with AI-powered contract parsing to get started."}
            </p>
            {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
              <Link href="/dashboard/onboarding">
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" /> Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.slice(0, visibleCount).map((event) => {
            const occupancy = event.totalRooms > 0
              ? Math.round((event.bookedRooms / event.totalRooms) * 100)
              : 0;
            const checkIn = new Date(event.checkIn);
            const checkOut = new Date(event.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const daysUntil = Math.ceil((checkIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isUpcoming = daysUntil > 0;
            const isOngoing = daysUntil <= 0 && daysUntil > -nights;

            return (
              <Link key={event.id} href={`/dashboard/events/${event.id}`}>
                <div className="group relative bg-white dark:bg-zinc-800/60 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
                  {/* Top color bar */}
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${event.primaryColor}, ${event.primaryColor}88)` }} />

                  {/* Header with gradient */}
                  <div className="relative px-5 pt-4 pb-3">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.07]" style={{ backgroundColor: event.primaryColor }} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge variant={getStatusVariant(event.status)} className="text-[10px]">
                            {event.status}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">{getTypeLabel(event.type)}</Badge>
                          {isOngoing && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                              LIVE
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 group-hover:text-[#ff6b35] transition-colors truncate tracking-tight">
                          {event.name}
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 dark:text-zinc-600 group-hover:text-[#ff6b35] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.venue}, {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(event.checkIn)} · {nights}N
                      </span>
                      {isUpcoming && (
                        <span className="font-semibold" style={{ color: event.primaryColor }}>
                          in {daysUntil}d
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-px mx-5 mb-3 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-700/50">
                    <div className="bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Guests</p>
                      <p className="text-sm font-extrabold text-gray-900 dark:text-zinc-100 mt-0.5">
                        <span style={{ color: event.primaryColor }}>{event.confirmedGuests}</span>
                        <span className="text-gray-300 dark:text-zinc-600 font-medium">/{event.guestCount}</span>
                      </p>
                    </div>
                    <div className="bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Revenue</p>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(event.totalRevenue)}
                      </p>
                    </div>
                    <div className="bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Rooms</p>
                      <p className="text-sm font-extrabold text-gray-900 dark:text-zinc-100 mt-0.5">
                        {event.bookedRooms}<span className="text-gray-300 dark:text-zinc-600 font-medium">/{event.totalRooms}</span>
                      </p>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500">Occupancy</span>
                      <span className="text-[10px] font-bold" style={{ color: occupancy > 80 ? '#ef4444' : occupancy > 50 ? '#f59e0b' : event.primaryColor }}>
                        {occupancy}%{" "}
                        <span className="font-medium text-gray-400 dark:text-zinc-500">
                          ({occupancy > 80 ? "High" : occupancy > 50 ? "Medium" : "Low"})
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${occupancy}%`,
                          background: occupancy > 80 ? '#ef4444' : occupancy > 50 ? '#f59e0b' : `linear-gradient(90deg, ${event.primaryColor}, ${event.primaryColor}aa)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-3 px-5 py-2.5 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = `${window.location.origin}/event/${event.slug}`;
                        navigator.clipboard.writeText(url).then(() => {
                          setCopyToast("Link copied!");
                          setTimeout(() => setCopyToast(""), 2000);
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 hover:text-[#ff6b35] dark:hover:text-[#ff6b35] transition-colors"
                      title="Copy microsite link"
                      aria-label="Copy event microsite link"
                    >
                      <Globe className="h-3 w-3" /> Copy Link
                    </button>
                    <span className="text-gray-200 dark:text-zinc-700">·</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fetch(`/api/events/${event.id}/clone`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: `${event.name} (Copy)` }),
                        }).then(() => refreshData());
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 hover:text-[#ff6b35] dark:hover:text-[#ff6b35] transition-colors"
                      title="Clone this event"
                      aria-label="Clone event"
                    >
                      <Copy className="h-3 w-3" /> Clone
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {events.length > visibleCount && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="gap-2"
            >
              Show More ({events.length - visibleCount} remaining)
            </Button>
          </div>
        )}
        {visibleCount > 6 && events.length > 6 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setVisibleCount(6)}
              className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              Show Less
            </button>
          </div>
        )}
        </>
      )}

      {/* Copy toast notification */}
      {copyToast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {copyToast}
        </div>
      )}
    </div>
  );
}
