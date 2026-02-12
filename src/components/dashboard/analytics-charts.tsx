"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

interface RoomBlock {
  id: string;
  roomType: string;
  totalQty: number;
  bookedQty: number;
  rate: number;
}

interface Guest {
  status: string;
  group: string | null;
}

interface Booking {
  totalAmount: number;
  createdAt: string;
}

interface AnalyticsChartsProps {
  roomBlocks: RoomBlock[];
  guests: Guest[];
  bookings: Booking[];
  eventColor?: string;
}

const COLORS = ["#ff6b35", "#0066cc", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export function AnalyticsCharts({
  roomBlocks,
  guests,
  bookings,
  eventColor = "#ff6b35",
}: AnalyticsChartsProps) {
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  // Room occupancy data
  const roomData = roomBlocks.map((room) => ({
    name: room.roomType.length > 10 ? room.roomType.slice(0, 10) + "..." : room.roomType,
    fullName: room.roomType,
    booked: room.bookedQty,
    available: room.totalQty - room.bookedQty,
    total: room.totalQty,
    revenue: room.bookedQty * room.rate,
    rate: room.rate,
  }));

  // Guest status breakdown
  const statusCounts = guests.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Guest groups breakdown
  const groupCounts = guests.reduce((acc, g) => {
    const group = g.group || "Unassigned";
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const groupData = Object.entries(groupCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Booking timeline - group by date
  const bookingsByDate = bookings.reduce((acc, b) => {
    const date = new Date(b.createdAt).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = { date, bookings: 0, revenue: 0 };
    }
    acc[date].bookings += 1;
    acc[date].revenue += b.totalAmount;
    return acc;
  }, {} as Record<string, { date: string; bookings: number; revenue: number }>);

  const timelineData = Object.values(bookingsByDate).slice(-14);

  // Revenue by room type
  const revenueData = roomBlocks.map((room) => ({
    name: room.roomType.length > 12 ? room.roomType.slice(0, 12) + "..." : room.roomType,
    revenue: room.bookedQty * room.rate,
    potential: room.totalQty * room.rate,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Room Occupancy Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-zinc-100">Room Occupancy by Type</CardTitle>
        </CardHeader>
        <CardContent>
          {roomData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roomData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#3f3f46' : '#e5e7eb', color: isDark ? '#fafafa' : undefined, borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="booked" stackId="a" fill={eventColor} name="Booked" radius={[0, 0, 0, 0]} />
                <Bar dataKey="available" stackId="a" fill="#e5e7eb" name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No room data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Status Pie Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-zinc-100">Guest Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#3f3f46' : '#e5e7eb', color: isDark ? '#fafafa' : undefined, borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No guest data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Timeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-zinc-100">Booking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={eventColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={eventColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#3f3f46' : '#e5e7eb', color: isDark ? '#fafafa' : undefined, borderRadius: '8px', fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke={eventColor}
                  strokeWidth={2}
                  fill="url(#colorBookings)"
                  name="Bookings"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No booking data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Room Type */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-zinc-100">Revenue by Room Type</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} width={55} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#3f3f46' : '#e5e7eb', color: isDark ? '#fafafa' : undefined, borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="revenue" fill={eventColor} name="Earned" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="potential" fill="#e5e7eb" name="Potential" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Groups */}
      {groupData.length > 1 && (
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-zinc-100">Guests by Group</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={groupData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#f0f0f0"} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#3f3f46' : '#e5e7eb', color: isDark ? '#fafafa' : undefined, borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#0066cc" name="Guests" radius={[4, 4, 0, 0]}>
                  {groupData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
