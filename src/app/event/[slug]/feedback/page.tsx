"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, Send, CheckCircle, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function FeedbackFormPage() {
  const params = useParams<{ slug: string }>();
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [stayRating, setStayRating] = useState(0);
  const [eventRating, setEventRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetch(`/api/events/search?q=${encodeURIComponent(params.slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load event");
        return res.json();
      })
      .then((data: { id: string; name: string; slug: string }[]) => {
        const event = Array.isArray(data) ? data.find((e) => e.slug === params.slug) : null;
        if (event) {
          setEventId(event.id);
          setEventName(event.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rating) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name,
          guestEmail: email || null,
          rating,
          stayRating: stayRating || null,
          eventRating: eventRating || null,
          comment: comment || null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      alert("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-950 dark:to-zinc-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-950 dark:to-zinc-900 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
            Thank You!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your feedback for <strong>{eventName}</strong> has been submitted.
            We appreciate your time!
          </p>
          <Link
            href={`/event/${params.slug}`}
            className="inline-block mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-zinc-950 dark:to-zinc-900 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            Share Your Experience
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            How was your stay at <strong>{eventName}</strong>?
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@email.com"
            />
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Overall Experience *
            </label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          {/* Stay Rating */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Hotel Stay
            </label>
            <StarInput value={stayRating} onChange={setStayRating} />
          </div>

          {/* Event Rating */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Event Quality
            </label>
            <StarInput value={eventRating} onChange={setEventRating} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell us about your experience..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name || !rating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
          {value}/5
        </span>
      )}
    </div>
  );
}
