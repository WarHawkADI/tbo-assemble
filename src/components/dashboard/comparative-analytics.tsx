"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, Bed, DollarSign } from "lucide-react";

interface EventComparison {
  id: string;
  name: string;
  totalGuests: number;
  confirmedGuests: number;
  totalRooms: number;
  bookedRooms: number;
  revenue: number;
  occupancy: number;
  conversionRate: number;
}

interface ComparativeAnalyticsProps {
  events: EventComparison[];
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316",
];

export function ComparativeAnalytics({ events }: ComparativeAnalyticsProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [metric, setMetric] = useState<"guests" | "rooms" | "revenue" | "occupancy">("guests");

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">No events to compare</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Create multiple events to see comparative analytics
        </p>
      </div>
    );
  }

  const barData = events.map((e) => ({
    name: e.name.length > 15 ? e.name.slice(0, 15) + "…" : e.name,
    guests: e.totalGuests,
    confirmed: e.confirmedGuests,
    rooms: e.totalRooms,
    booked: e.bookedRooms,
    revenue: e.revenue,
    occupancy: e.occupancy,
  }));

  const pieData = events.map((e, i) => ({
    name: e.name.length > 15 ? e.name.slice(0, 15) + "…" : e.name,
    value: metric === "guests"
      ? e.totalGuests
      : metric === "rooms"
      ? e.totalRooms
      : metric === "revenue"
      ? e.revenue
      : e.occupancy,
    color: COLORS[i % COLORS.length],
  }));

  // Summary stats
  const totalGuests = events.reduce((s, e) => s + e.totalGuests, 0);
  const totalRevenue = events.reduce((s, e) => s + e.revenue, 0);
  const avgOccupancy = events.reduce((s, e) => s + e.occupancy, 0) / events.length;
  const avgConversion = events.reduce((s, e) => s + e.conversionRate, 0) / events.length;

  const stats = [
    { label: "Total Guests", value: totalGuests.toLocaleString(), icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-green-600 dark:text-green-400" },
    { label: "Avg Occupancy", value: `${avgOccupancy.toFixed(0)}%`, icon: Bed, color: "text-amber-600 dark:text-amber-400" },
    { label: "Avg Conversion", value: `${avgConversion.toFixed(0)}%`, icon: TrendingUp, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Metric Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["guests", "rooms", "revenue", "occupancy"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              metric === m
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Event Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e5e7eb"} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : undefined }} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? '#a1a1aa' : undefined }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                  fontSize: "12px",
                  backgroundColor: isDark ? '#18181b' : '#fff',
                  color: isDark ? '#fafafa' : undefined,
                }}
              />
              <Legend />
              {metric === "guests" && (
                <>
                  <Bar dataKey="guests" fill="#93C5FD" name="Total Guests" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmed" fill="#3B82F6" name="Confirmed" radius={[4, 4, 0, 0]} />
                </>
              )}
              {metric === "rooms" && (
                <>
                  <Bar dataKey="rooms" fill="#6EE7B7" name="Total Rooms" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="booked" fill="#10B981" name="Booked" radius={[4, 4, 0, 0]} />
                </>
              )}
              {metric === "revenue" && (
                <Bar dataKey="revenue" fill="#F59E0B" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
              )}
              {metric === "occupancy" && (
                <Bar dataKey="occupancy" fill="#8B5CF6" name="Occupancy %" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
            Distribution by {metric}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                  fontSize: "12px",
                  backgroundColor: isDark ? '#18181b' : '#fff',
                  color: isDark ? '#fafafa' : undefined,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
