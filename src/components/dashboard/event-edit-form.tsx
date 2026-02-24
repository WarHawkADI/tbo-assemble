"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, X, Save, Loader2 } from "lucide-react";

interface EventEditFormProps {
  eventId: string;
  initialData: {
    name: string;
    venue: string;
    location: string;
    checkIn: string;
    checkOut: string;
    type: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

export function EventEditForm({ eventId, initialData }: EventEditFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [formData, setFormData] = useState({
    name: initialData.name,
    venue: initialData.venue,
    location: initialData.location,
    checkIn: initialData.checkIn.slice(0, 10),
    checkOut: initialData.checkOut.slice(0, 10),
    type: initialData.type,
    primaryColor: initialData.primaryColor,
    secondaryColor: initialData.secondaryColor,
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSave = async () => {
    // Validate check-out is after check-in
    if (formData.checkOut <= formData.checkIn) {
      showToast("Check-out date must be after check-in date");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          checkIn: new Date(formData.checkIn).toISOString(),
          checkOut: new Date(formData.checkOut).toISOString(),
        }),
      });
      if (res.ok) {
        showToast("Event updated successfully");
        setEditing(false);
        router.refresh();
      } else {
        showToast("Failed to update event");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: initialData.name,
      venue: initialData.venue,
      location: initialData.location,
      checkIn: initialData.checkIn.slice(0, 10),
      checkOut: initialData.checkOut.slice(0, 10),
      type: initialData.type,
      primaryColor: initialData.primaryColor,
      secondaryColor: initialData.secondaryColor,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setEditing(true)}
        aria-label="Edit event details"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit Event
      </Button>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-lg mb-6 animate-fade-in">
        <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-500" /> Edit Event Details
            </CardTitle>
            <button
              onClick={handleCancel}
              className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
              title="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Event Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Event name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="wedding">Wedding</option>
                <option value="conference">Conference</option>
                <option value="corporate">Corporate</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Venue
              </label>
              <Input
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Venue"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Check-In Date
              </label>
              <Input
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Check-Out Date
              </label>
              <Input
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Primary Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#ff6b35"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#1a1a2e"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </>
  );
}
