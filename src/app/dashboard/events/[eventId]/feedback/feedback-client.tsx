"use client";

import { Star, MessageSquare, Copy, Check, TrendingUp, TrendingDown, Minus, Download, SmilePlus, Frown, Meh } from "lucide-react";
import { useState, useMemo } from "react";

interface FeedbackItem {
  id: string;
  guestName: string;
  rating: number;
  stayRating: number | null;
  eventRating: number | null;
  comment: string | null;
  createdAt: string;
}

interface FeedbackClientProps {
  eventName: string;
  feedbackUrl: string;
  feedbacks: FeedbackItem[];
  stats: {
    avgRating: number;
    avgStay: number;
    avgEvent: number;
    total: number;
  };
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

function getSentiment(rating: number): { label: string; color: string; icon: React.ElementType; bg: string } {
  if (rating >= 4) return { label: "Positive", color: "text-green-600 dark:text-green-400", icon: SmilePlus, bg: "bg-green-50 dark:bg-green-900/20" };
  if (rating >= 3) return { label: "Neutral", color: "text-amber-600 dark:text-amber-400", icon: Meh, bg: "bg-amber-50 dark:bg-amber-900/20" };
  return { label: "Negative", color: "text-red-600 dark:text-red-400", icon: Frown, bg: "bg-red-50 dark:bg-red-900/20" };
}

function SentimentBadge({ rating }: { rating: number }) {
  const s = getSentiment(rating);
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

export function FeedbackClient({
  eventName,
  feedbackUrl,
  feedbacks,
  stats,
}: FeedbackClientProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${feedbackUrl}`
    : feedbackUrl;

  const sentimentBreakdown = useMemo(() => {
    const positive = feedbacks.filter((f) => f.rating >= 4).length;
    const neutral = feedbacks.filter((f) => f.rating === 3).length;
    const negative = feedbacks.filter((f) => f.rating <= 2).length;
    const total = feedbacks.length || 1;
    return {
      positive, neutral, negative,
      positivePercent: Math.round((positive / total) * 100),
      neutralPercent: Math.round((neutral / total) * 100),
      negativePercent: Math.round((negative / total) * 100),
    };
  }, [feedbacks]);

  const ratingTrend = useMemo(() => {
    if (feedbacks.length < 2) return 0;
    const sorted = [...feedbacks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const half = Math.ceil(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((s, f) => s + f.rating, 0) / half;
    const secondHalf = sorted.slice(half).reduce((s, f) => s + f.rating, 0) / (sorted.length - half);
    return secondHalf - firstHalf;
  }, [feedbacks]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportFeedbackCSV = () => {
    const headers = ["Guest Name", "Overall Rating", "Stay Rating", "Event Rating", "Comment", "Sentiment", "Date"];
    const rows = feedbacks.map((f) => [
      f.guestName,
      f.rating.toString(),
      f.stayRating?.toString() || "",
      f.eventRating?.toString() || "",
      f.comment || "",
      getSentiment(f.rating).label,
      new Date(f.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-${eventName.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Guest Feedback
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {stats.total} responses for {eventName}
          </p>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Share Feedback Form
            </>
          )}
        </button>
        {feedbacks.length > 0 && (
          <button
            onClick={exportFeedbackCSV}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-5 text-center">
          <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-200">
            {stats.avgRating.toFixed(1)}
          </p>
          <Stars rating={Math.round(stats.avgRating)} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Overall Rating
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-5 text-center">
          <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-200">
            {stats.avgStay > 0 ? stats.avgStay.toFixed(1) : "—"}
          </p>
          <Stars rating={Math.round(stats.avgStay)} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Stay Rating
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-5 text-center">
          <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-200">
            {stats.avgEvent > 0 ? stats.avgEvent.toFixed(1) : "—"}
          </p>
          <Stars rating={Math.round(stats.avgEvent)} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Event Rating
          </p>
        </div>
      </div>

      {/* Sentiment Analysis Panel */}
      {feedbacks.length > 0 && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Sentiment Analysis</h3>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {ratingTrend > 0.1 ? (
                <><TrendingUp className="w-3.5 h-3.5 text-green-500" /> Improving</>
              ) : ratingTrend < -0.1 ? (
                <><TrendingDown className="w-3.5 h-3.5 text-red-500" /> Declining</>
              ) : (
                <><Minus className="w-3.5 h-3.5" /> Stable</>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><SmilePlus className="w-3 h-3" /> Positive (4-5★)</span>
                <span className="text-zinc-500">{sentimentBreakdown.positive} ({sentimentBreakdown.positivePercent}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${sentimentBreakdown.positivePercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><Meh className="w-3 h-3" /> Neutral (3★)</span>
                <span className="text-zinc-500">{sentimentBreakdown.neutral} ({sentimentBreakdown.neutralPercent}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${sentimentBreakdown.neutralPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><Frown className="w-3 h-3" /> Negative (1-2★)</span>
                <span className="text-zinc-500">{sentimentBreakdown.negative} ({sentimentBreakdown.negativePercent}%)</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${sentimentBreakdown.negativePercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
          <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            No feedback yet
          </p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            Share the feedback form with your guests
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <div
              key={f.id}
              className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {f.guestName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Stars rating={f.rating} />
                    <SentimentBadge rating={f.rating} />
                  </div>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(f.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {f.comment && (
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  &ldquo;{f.comment}&rdquo;
                </p>
              )}
              <div className="flex gap-4 mt-3">
                {f.stayRating && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Stay: {f.stayRating}/5
                  </span>
                )}
                {f.eventRating && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Event: {f.eventRating}/5
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
