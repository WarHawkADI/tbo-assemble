"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Clock, Users, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AISuggestion {
  id: string;
  type: "opportunity" | "alert" | "insight" | "action";
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  priority: "high" | "medium" | "low";
}

interface AISuggestionsBannerProps {
  eventData?: {
    bookedRooms: number;
    totalRooms: number;
    guestCount: number;
    confirmedGuests: number;
    daysUntilEvent: number;
    revenue: number;
    occupancyRate: number;
  };
  onDismiss?: (id: string) => void;
}

const typeIcons = {
  opportunity: TrendingUp,
  alert: AlertTriangle,
  insight: Lightbulb,
  action: Zap,
};

const typeColors = {
  opportunity: "from-emerald-500 to-teal-600",
  alert: "from-amber-500 to-orange-600",
  insight: "from-blue-500 to-indigo-600",
  action: "from-purple-500 to-violet-600",
};

const typeBgColors = {
  opportunity: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  alert: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  insight: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  action: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
};

export function AISuggestionsBanner({ eventData, onDismiss }: AISuggestionsBannerProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Generate contextual suggestions based on event data
  useEffect(() => {
    if (!eventData) {
      // Default demo suggestions
      setSuggestions([
        {
          id: "demo-1",
          type: "insight",
          title: "Smart Room Allocation",
          description: "Our AI can automatically assign rooms based on guest preferences and proximity requests.",
          action: { label: "Try Auto-Allocate" },
          priority: "medium",
        },
        {
          id: "demo-2",
          type: "opportunity",
          title: "Boost Conversions",
          description: "Send personalized reminders to 12 guests who haven't completed their bookings.",
          action: { label: "Send Nudges" },
          priority: "high",
        },
      ]);
      return;
    }

    const newSuggestions: AISuggestion[] = [];

    // Low occupancy alert
    if (eventData.occupancyRate < 50 && eventData.daysUntilEvent > 7) {
      newSuggestions.push({
        id: "low-occupancy",
        type: "alert",
        title: `Only ${eventData.occupancyRate}% rooms booked`,
        description: `With ${eventData.daysUntilEvent} days left, consider sending reminder emails or offering early-bird discounts.`,
        action: { label: "Send Reminders" },
        priority: "high",
      });
    }

    // High demand opportunity
    if (eventData.occupancyRate > 80) {
      newSuggestions.push({
        id: "high-demand",
        type: "opportunity",
        title: "High demand detected!",
        description: "Consider adding more room blocks or enabling waitlist to capture overflow interest.",
        action: { label: "Manage Waitlist" },
        priority: "medium",
      });
    }

    // Unconfirmed guests
    const unconfirmedRate = eventData.guestCount > 0 
      ? ((eventData.guestCount - eventData.confirmedGuests) / eventData.guestCount) * 100 
      : 0;
    if (unconfirmedRate > 30) {
      newSuggestions.push({
        id: "unconfirmed",
        type: "action",
        title: `${Math.round(unconfirmedRate)}% guests not confirmed`,
        description: "Send personalized WhatsApp nudges to increase confirmation rate.",
        action: { label: "Send Nudges" },
        priority: "high",
      });
    }

    // Event approaching insight
    if (eventData.daysUntilEvent <= 3 && eventData.daysUntilEvent > 0) {
      newSuggestions.push({
        id: "event-soon",
        type: "insight",
        title: "Event in " + eventData.daysUntilEvent + " days!",
        description: "Generate and share the rooming list with the hotel for final preparations.",
        action: { label: "Export Rooming List" },
        priority: "high",
      });
    }

    // Revenue insight
    if (eventData.revenue > 0) {
      newSuggestions.push({
        id: "revenue-insight",
        type: "insight",
        title: "Revenue tracking",
        description: `₹${eventData.revenue.toLocaleString("en-IN")} collected so far. Track payments and pending amounts in the analytics dashboard.`,
        action: { label: "View Analytics" },
        priority: "low",
      });
    }

    setSuggestions(newSuggestions);
  }, [eventData]);

  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id));

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    onDismiss?.(id);
  };

  if (visibleSuggestions.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            AI Suggestions
          </span>
          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
            {visibleSuggestions.length} new
          </span>
        </div>
        <span className="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-zinc-400 transition-colors">
          {isExpanded ? "Hide" : "Show"}
        </span>
      </button>

      {/* Suggestions */}
      {isExpanded && (
        <div className="space-y-2">
          {visibleSuggestions.slice(0, 3).map((suggestion) => {
            const Icon = typeIcons[suggestion.type];
            return (
              <div
                key={suggestion.id}
                className={`relative rounded-xl border p-4 transition-all hover:shadow-sm ${typeBgColors[suggestion.type]}`}
              >
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                  title="Dismiss suggestion"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${typeColors[suggestion.type]} text-white shadow-sm shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-0.5">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                      {suggestion.description}
                    </p>
                    {suggestion.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 px-2 text-xs gap-1"
                        onClick={suggestion.action.onClick}
                      >
                        {suggestion.action.label}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
