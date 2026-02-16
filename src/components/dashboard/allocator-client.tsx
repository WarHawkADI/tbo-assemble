"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, User, MapPin, ArrowRight, Users, Save, X, Sparkles, Loader2, Download } from "lucide-react";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group: string | null;
  status: string;
  proximityRequest: string | null;
  allocatedFloor: string | null;
  allocatedWing: string | null;
  allocatedRoom: string | null;
}

interface RoomBlock {
  id: string;
  roomType: string;
  floor: string | null;
  wing: string | null;
  totalQty: number;
  bookedQty: number;
}

interface AllocatorClientProps {
  guests: Guest[];
  roomBlocks: RoomBlock[];
  eventId: string;
}

interface FloorWing {
  floor: string;
  wing: string;
  rooms: RoomBlock[];
  guests: Guest[];
  capacity: number;
}

export default function AllocatorClient({ guests, roomBlocks, eventId }: AllocatorClientProps) {
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const [allocations, setAllocations] = useState<Record<string, { floor: string; wing: string }>>(() => {
    const init: Record<string, { floor: string; wing: string }> = {};
    for (const g of guests) {
      if (g.allocatedFloor && g.allocatedWing) {
        init[g.id] = { floor: g.allocatedFloor, wing: g.allocatedWing };
      }
    }
    return init;
  });

  const [draggedGuest, setDraggedGuest] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoAllocating, setAutoAllocating] = useState(false);

  const handleExportRoomingList = () => {
    const headers = ["Guest Name", "Email", "Phone", "Group", "Room Type", "Floor", "Wing", "Room Number", "Status"];
    const rows = guests.map((g) => {
      const alloc = allocations[g.id];
      const floor = alloc?.floor || g.allocatedFloor || "";
      const wing = alloc?.wing || g.allocatedWing || "";
      // Find matching room type from floor/wing
      const matchingRoom = roomBlocks.find(
        (r) => (r.floor || "1") === floor && (r.wing || "Main") === wing
      );
      return [
        g.name,
        g.email || "",
        g.phone || "",
        g.group || "",
        matchingRoom?.roomType || "",
        floor,
        wing,
        g.allocatedRoom || "",
        g.status,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooming-list-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Rooming list exported");
  };

  // Build floor/wing map
  const floorWingMap = new Map<string, FloorWing>();
  for (const room of roomBlocks) {
    const floor = room.floor || "1";
    const wing = room.wing || "Main";
    const key = `${floor}-${wing}`;
    if (!floorWingMap.has(key)) {
      floorWingMap.set(key, { floor, wing, rooms: [], guests: [], capacity: 0 });
    }
    const fw = floorWingMap.get(key)!;
    fw.rooms.push(room);
    fw.capacity += room.totalQty;
  }

  // Assign guests to their allocated floor/wing
  for (const guest of guests) {
    const alloc = allocations[guest.id];
    if (alloc) {
      const key = `${alloc.floor}-${alloc.wing}`;
      const fw = floorWingMap.get(key);
      if (fw) fw.guests.push(guest);
    }
  }

  const unallocatedGuests = guests.filter((g) => !allocations[g.id]);
  const floorWings = Array.from(floorWingMap.values()).sort((a, b) => a.floor.localeCompare(b.floor));

  const handleDragStart = (guestId: string) => {
    setDraggedGuest(guestId);
  };

  const handleDrop = (floor: string, wing: string) => {
    if (draggedGuest) {
      setAllocations((prev) => ({
        ...prev,
        [draggedGuest]: { floor, wing },
      }));
      setDraggedGuest(null);
    }
  };

  const handleRemoveAllocation = (guestId: string) => {
    setAllocations((prev) => {
      const next = { ...prev };
      delete next[guestId];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      if (res.ok) {
        showToast("Allocations saved successfully");
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleAutoAllocate = async () => {
    setAutoAllocating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/auto-allocate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.allocations) {
        setAllocations(data.allocations);
      }
    } catch (e) {
      console.error(e);
    }
    setAutoAllocating(false);
  };

  const GROUP_COLOR_PALETTES = [
    "bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 text-pink-800 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/40",
    "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/40",
    "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40",
    "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/40",
    "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/40",
    "bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 text-cyan-800 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/40",
  ];

  function getGroupColor(group: string): string {
    let hash = 0;
    for (let i = 0; i < group.length; i++) hash = group.charCodeAt(i) + ((hash << 5) - hash);
    return GROUP_COLOR_PALETTES[Math.abs(hash) % GROUP_COLOR_PALETTES.length];
  }

  const getGroupStyle = (group: string | null) =>
    group ? getGroupColor(group) : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-zinc-800 dark:to-zinc-800 text-gray-800 dark:text-zinc-300 border-gray-200/80 dark:border-zinc-700/80";

  return (
    <div className="animate-fade-in">
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end mb-6 gap-2 sm:gap-3">
        <Button
          onClick={handleExportRoomingList}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Rooming List
        </Button>
        <Button
          onClick={handleAutoAllocate}
          disabled={autoAllocating || unallocatedGuests.length === 0}
          variant="outline"
          className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30"
        >
          {autoAllocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {autoAllocating ? "AI Allocating..." : "AI Auto-Allocate"}
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Allocations"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Unallocated Guests Panel */}
        <div className="col-span-1">
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-gray-100 dark:border-zinc-700 pb-3">
              <CardTitle className="text-sm font-semibold dark:text-zinc-100">
                Unallocated Guests ({unallocatedGuests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              {unallocatedGuests.map((guest) => (
                <div
                  key={guest.id}
                  draggable
                  onDragStart={() => handleDragStart(guest.id)}
                  className={`p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:scale-[1.02] ${getGroupStyle(guest.group)}`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 opacity-40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{guest.name}</p>
                      <p className="text-[10px] opacity-60">{guest.group || "No group"}</p>
                    </div>
                  </div>
                  {guest.proximityRequest && (
                    <p className="text-[10px] mt-1.5 flex items-center gap-1 opacity-70 bg-white/50 dark:bg-zinc-900/50 rounded px-1.5 py-0.5">
                      <MapPin className="h-2.5 w-2.5" /> Near: {guest.proximityRequest}
                    </p>
                  )}
                </div>
              ))}
              {unallocatedGuests.length === 0 && (
                <div className="text-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mx-auto mb-2">
                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">All guests allocated!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Floor Plan */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {floorWings.map((fw) => (
            <Card
              key={`${fw.floor}-${fw.wing}`}
              className={`border-0 shadow-sm transition-all ${
                draggedGuest ? "ring-2 ring-[#ff6b35] ring-offset-2 dark:ring-offset-zinc-900 bg-orange-50/30 dark:bg-orange-950/20" : ""
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(fw.floor, fw.wing)}
            >
              <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-gray-100 dark:border-zinc-700 pb-3">
                <CardTitle className="text-sm font-semibold dark:text-zinc-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white text-[10px] font-bold">
                      {fw.floor}
                    </span>
                    {fw.wing} Wing
                  </span>
                  <Badge variant={fw.guests.length >= fw.capacity ? "success" : "secondary"}>
                    {fw.guests.length}/{fw.capacity}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="min-h-[100px] space-y-2">
                  {fw.guests.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${getGroupStyle(guest.group)}`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="font-semibold">{guest.name}</span>
                        {guest.group && (
                          <span className="opacity-50 text-[10px]">({guest.group})</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAllocation(guest.id)}
                        title="Remove allocation"
                        aria-label={`Remove allocation for ${guest.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {fw.guests.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-gray-400 dark:text-zinc-500 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50">
                      <span>Drop guests here</span>
                    </div>
                  )}
                </div>
                {/* Room types */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
                  {fw.rooms.map((room) => (
                    <p key={room.id} className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-zinc-600"></span>
                      {room.roomType} × {room.totalQty}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Proximity Requests */}
      {guests.some((g) => g.proximityRequest) && (
        <Card className="mt-6 border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-purple-100 dark:border-purple-800/40">
            <CardTitle className="text-sm flex items-center gap-2 font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              Proximity Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {guests
                .filter((g) => g.proximityRequest)
                .map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center gap-3 text-sm p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-100 dark:border-purple-800/40"
                  >
                    <span className="font-semibold text-purple-900 dark:text-purple-300">{guest.name}</span>
                    <ArrowRight className="h-3 w-3 text-purple-400" />
                    <span className="text-purple-700 dark:text-purple-400">Near: {guest.proximityRequest}</span>
                    {allocations[guest.id] && (
                      <Badge variant="success" className="ml-auto">
                        Floor {allocations[guest.id].floor} • {allocations[guest.id].wing}
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
