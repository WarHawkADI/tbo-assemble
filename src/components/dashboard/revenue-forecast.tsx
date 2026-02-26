"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, AlertTriangle, Target, Sparkles } from "lucide-react";

interface RevenueForecastProps {
  currentRevenue: number;
  targetRevenue: number;
  daysRemaining: number;
  dailyBookings: { date: string; revenue: number }[];
  historicalAverage?: number;
}

export function RevenueForecast({
  currentRevenue,
  targetRevenue,
  daysRemaining,
  dailyBookings,
  historicalAverage = 0,
}: RevenueForecastProps) {
  // Calculate forecast data
  const { forecastData, projectedRevenue, confidence, trend } = useMemo(() => {
    // Calculate average daily revenue from recent bookings
    const recentDays = dailyBookings.slice(-7);
    const avgDaily = recentDays.length > 0
      ? recentDays.reduce((sum, d) => sum + d.revenue, 0) / recentDays.length
      : historicalAverage;

    // Project forward
    const projected = currentRevenue + (avgDaily * daysRemaining);
    
    // Calculate trend (comparing last 3 days to previous 3 days)
    let trendDirection: "up" | "down" | "stable" = "stable";
    if (recentDays.length >= 6) {
      const recent3 = recentDays.slice(-3).reduce((s, d) => s + d.revenue, 0);
      const prev3 = recentDays.slice(-6, -3).reduce((s, d) => s + d.revenue, 0);
      if (recent3 > prev3 * 1.1) trendDirection = "up";
      else if (recent3 < prev3 * 0.9) trendDirection = "down";
    }

    // Calculate confidence based on data points and variance
    const variance = recentDays.length > 1
      ? Math.sqrt(recentDays.reduce((s, d) => s + Math.pow(d.revenue - avgDaily, 2), 0) / recentDays.length) / (avgDaily || 1)
      : 1;
    const confidenceScore = Math.max(0, Math.min(100, 100 - (variance * 100)));

    // Generate forecast line data
    const today = new Date();
    const forecast: { date: string; actual?: number; forecast?: number }[] = [];
    
    // Add historical data
    dailyBookings.forEach((d) => {
      forecast.push({ date: d.date, actual: d.revenue });
    });

    // Add forecast data points
    let runningTotal = currentRevenue;
    for (let i = 1; i <= Math.min(daysRemaining, 14); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      runningTotal += avgDaily;
      forecast.push({ date: dateStr, forecast: avgDaily });
    }

    return {
      forecastData: forecast,
      projectedRevenue: projected,
      confidence: confidenceScore,
      trend: trendDirection,
    };
  }, [currentRevenue, daysRemaining, dailyBookings, historicalAverage]);

  // Calculate achievement percentage
  const achievementPct = targetRevenue > 0 ? (currentRevenue / targetRevenue) * 100 : 0;
  const projectedPct = targetRevenue > 0 ? (projectedRevenue / targetRevenue) * 100 : 0;
  const willMeetTarget = projectedRevenue >= targetRevenue;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
            <Target className="h-3.5 w-3.5" />
            Current Revenue
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">
            ₹{(currentRevenue / 100000).toFixed(2)}L
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {achievementPct.toFixed(0)}% of target
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Projected
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-zinc-100">
            ₹{(projectedRevenue / 100000).toFixed(2)}L
          </p>
          <p className={`text-xs ${willMeetTarget ? 'text-emerald-500' : 'text-amber-500'}`}>
            {projectedPct.toFixed(0)}% of target
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
            <TrendingUp className={`h-3.5 w-3.5 ${
              trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`} />
            Trend
          </div>
          <p className={`text-xl font-bold ${
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
            trend === 'down' ? 'text-red-600 dark:text-red-400' : 
            'text-gray-600 dark:text-zinc-300'
          }`}>
            {trend === 'up' ? '↑ Growing' : trend === 'down' ? '↓ Declining' : '→ Stable'}
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            vs previous period
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            AI Confidence
          </div>
          <p className={`text-xl font-bold ${
            confidence >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
            confidence >= 40 ? 'text-amber-600 dark:text-amber-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {confidence.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {daysRemaining} days remaining
          </p>
        </div>
      </div>

      {/* Forecast Badge */}
      <div className={`rounded-xl p-4 border ${
        willMeetTarget 
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          {willMeetTarget ? (
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          )}
          <div>
            <p className={`font-semibold ${
              willMeetTarget 
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}>
              {willMeetTarget 
                ? "On track to exceed target!" 
                : "Target may not be met at current pace"
              }
            </p>
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              {willMeetTarget 
                ? `Projected to exceed by ₹${((projectedRevenue - targetRevenue) / 1000).toFixed(0)}K`
                : `Gap of ₹${((targetRevenue - projectedRevenue) / 1000).toFixed(0)}K — consider promotional offers`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {forecastData.length > 0 && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-700">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-4">
            Revenue Timeline & Forecast
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${(typeof value === 'number' ? value : 0).toLocaleString('en-IN')}`, '']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#3B82F6"
                  fill="url(#actualGradient)"
                  name="Actual"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  fill="url(#forecastGradient)"
                  name="Forecast"
                />
                <ReferenceLine 
                  y={targetRevenue / (forecastData.length || 1)} 
                  stroke="#EF4444" 
                  strokeDasharray="3 3"
                  label={{ value: 'Target', fontSize: 10, fill: '#EF4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
