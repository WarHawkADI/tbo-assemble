"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  X,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  Coffee,
  Utensils,
  Mic,
  PartyPopper,
  Users,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  type: string;
  venue: string | null;
  cost: number | null;
  paxCount: number | null;
  order: number;
}

interface EventScheduleProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
}

const scheduleTypes = [
  { value: "session", label: "Session", icon: Mic, color: "bg-blue-500" },
  { value: "meal", label: "Meal", icon: Utensils, color: "bg-orange-500" },
  { value: "break", label: "Break", icon: Coffee, color: "bg-gray-500" },
  { value: "networking", label: "Networking", icon: Users, color: "bg-purple-500" },
  { value: "entertainment", label: "Entertainment", icon: PartyPopper, color: "bg-pink-500" },
  { value: "other", label: "Other", icon: Calendar, color: "bg-zinc-500" },
];

export function EventSchedule({
  eventId,
  eventStartDate,
  eventEndDate,
}: EventScheduleProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [selectedDate, setSelectedDate] = useState(eventStartDate);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: eventStartDate,
    startTime: "09:00",
    endTime: "10:00",
    type: "session",
    venue: "",
    cost: "",
    paxCount: "",
  });

  // Generate list of dates for the event
  const eventDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(eventStartDate);
    const end = new Date(eventEndDate);
    const current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [eventStartDate, eventEndDate]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // Fetch schedule items
  useEffect(() => {
    setLoading(true);
    fetch(`/api/schedule?eventId=${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [eventId]);

  // Filter items for selected date
  const itemsForDate = items
    .filter((item) => {
      // Handle both ISO datetime strings and date-only strings
      const itemDate = typeof item.date === "string" 
        ? item.date.split("T")[0] 
        : new Date(item.date).toISOString().split("T")[0];
      return itemDate === selectedDate;
    })
    .sort((a, b) => {
      // Sort by startTime, then by order
      const timeCompare = a.startTime.localeCompare(b.startTime);
      return timeCompare !== 0 ? timeCompare : a.order - b.order;
    });

  const totalCostForDate = itemsForDate.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalEventCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      date: selectedDate,
      startTime: "09:00",
      endTime: "10:00",
      type: "session",
      venue: "",
      cost: "",
      paxCount: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    const payload = {
      eventId,
      title: form.title,
      description: form.description || null,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime || null,
      type: form.type,
      venue: form.venue || null,
      cost: form.cost ? parseFloat(form.cost) : null,
      paxCount: form.paxCount ? parseInt(form.paxCount) : null,
      order: itemsForDate.length,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...payload, id: editingId } : payload;

      const res = await fetch("/api/schedule", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const savedItem = await res.json();

        if (editingId) {
          setItems(items.map((i) => (i.id === editingId ? savedItem : i)));
          showToast("Schedule item updated");
        } else {
          setItems([...items, savedItem]);
          showToast("Schedule item added");
        }

        setShowForm(false);
        resetForm();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to save schedule item");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setForm({
      title: item.title,
      description: item.description || "",
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime || "",
      type: item.type,
      venue: item.venue || "",
      cost: item.cost?.toString() || "",
      paxCount: item.paxCount?.toString() || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Delete this schedule item?")) return;

    try {
      const res = await fetch(`/api/schedule?id=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        setItems(items.filter((i) => i.id !== itemId));
        showToast("Item deleted");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getTypeConfig = (type: string) => {
    return scheduleTypes.find((t) => t.value === type) || scheduleTypes[5];
  };

  const navigateDate = (direction: "prev" | "next") => {
    const currentIndex = eventDates.indexOf(selectedDate);
    if (direction === "prev" && currentIndex > 0) {
      setSelectedDate(eventDates[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < eventDates.length - 1) {
      setSelectedDate(eventDates[currentIndex + 1]);
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Event Days</p>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{eventDates.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Total Sessions</p>
              <Mic className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Schedule Cost</p>
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalEventCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("prev")}
            disabled={eventDates.indexOf(selectedDate) === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-1">
            {eventDates.map((date, i) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedDate === date
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
              >
                Day {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate("next")}
            disabled={eventDates.indexOf(selectedDate) === eventDates.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Selected Date Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {new Date(selectedDate).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {itemsForDate.length} items • {formatCurrency(totalCostForDate)} budget
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {editingId ? "Edit Schedule Item" : "Add Schedule Item"}
              </CardTitle>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
                title="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Keynote Address, Lunch Break"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {scheduleTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setForm({ ...form, type: type.value })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            form.type === type.value
                              ? `${type.color} text-white`
                              : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Date</label>
                  <select
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm"
                    title="Select event date"
                  >
                    {eventDates.map((date, i) => (
                      <option key={date} value={date}>
                        Day {i + 1} - {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Start Time</label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">End Time</label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Venue / Location</label>
                  <Input
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g., Ballroom A, Conference Hall 2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Cost (₹)</label>
                  <Input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Pax Count</label>
                  <Input
                    type="number"
                    value={form.paxCount}
                    onChange={(e) => setForm({ ...form, paxCount: e.target.value })}
                    placeholder="Expected attendees"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm h-20"
                    placeholder="Additional details..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !form.title.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? "Update" : "Add"} Item
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {loading && items.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : itemsForDate.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-1">No items scheduled</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Add sessions, meals, and activities for this day.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {itemsForDate.map((item) => {
            const typeConfig = getTypeConfig(item.type);
            const Icon = typeConfig.icon;

            return (
              <Card
                key={item.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex">
                  {/* Color bar */}
                  <div className={`w-1.5 ${typeConfig.color}`} />

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeConfig.color} text-white shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-zinc-100">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{item.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {item.startTime}
                              {item.endTime && ` - ${item.endTime}`}
                            </span>
                            {item.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {item.venue}
                              </span>
                            )}
                            {item.paxCount && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {item.paxCount} pax
                              </span>
                            )}
                            {item.cost !== null && item.cost > 0 && (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {formatCurrency(item.cost)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
