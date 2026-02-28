"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Loader2,
  Users,
  Trash2,
  Crown,
  UserPlus,
  Search,
  BedDouble,
} from "lucide-react";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface RoomOccupant {
  id: string;
  bookingId: string;
  guestId: string;
  guest: Guest;
  isPrimary: boolean;
}

interface Booking {
  id: string;
  guestName: string;
  roomType: string;
  roomNumber: string | null;
  status: string;
  occupants: RoomOccupant[];
}

interface RoomOccupantsManagerProps {
  booking: Booking;
  availableGuests: Guest[];
  onUpdate?: () => void;
}

export function RoomOccupantsManager({
  booking,
  availableGuests,
  onUpdate,
}: RoomOccupantsManagerProps) {
  const [occupants, setOccupants] = useState<RoomOccupant[]>(booking.occupants || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // Filter guests that are not already in this room
  const occupantIds = occupants.map((o) => o.guestId);
  const filteredGuests = availableGuests.filter(
    (g) => !occupantIds.includes(g.id) && 
           (g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.phone?.includes(searchTerm))
  );

  const handleAddOccupant = async (guestId: string, isPrimary: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/room-occupants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          guestId,
          isPrimary,
        }),
      });

      if (res.ok) {
        const newOccupant = await res.json();
        setOccupants([...occupants, newOccupant]);
        showToast("Guest added to room");
        onUpdate?.();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add guest");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to add guest");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOccupant = async (occupantId: string) => {
    if (!confirm("Remove this guest from the room?")) return;

    try {
      const res = await fetch(`/api/room-occupants?id=${occupantId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOccupants(occupants.filter((o) => o.id !== occupantId));
        showToast("Guest removed from room");
        onUpdate?.();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetPrimary = async (occupantId: string) => {
    try {
      const res = await fetch("/api/room-occupants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: occupantId, isPrimary: true }),
      });

      if (res.ok) {
        // Update local state - only one can be primary
        setOccupants(
          occupants.map((o) => ({
            ...o,
            isPrimary: o.id === occupantId,
          }))
        );
        showToast("Primary guest updated");
        onUpdate?.();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getRoomCapacity = (roomType: string): number => {
    const type = roomType.toLowerCase();
    if (type.includes("single")) return 1;
    if (type.includes("double") || type.includes("twin")) return 2;
    if (type.includes("triple")) return 3;
    if (type.includes("quad") || type.includes("family")) return 4;
    if (type.includes("suite") || type.includes("presidential")) return 4;
    return 2; // Default
  };

  const capacity = getRoomCapacity(booking.roomType);
  const canAddMore = occupants.length < capacity;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BedDouble className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {booking.roomNumber ? `Room ${booking.roomNumber}` : booking.roomType}
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                {booking.roomType} • {occupants.length} / {capacity} occupants
              </p>
            </div>
          </div>
          {canAddMore && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Add Guest
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Add Guest Form */}
        {showAddForm && (
          <div className="p-4 border-b bg-blue-50/50 dark:bg-blue-900/10">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guests by name, email, or phone..."
                className="pl-9"
              />
            </div>

            {filteredGuests.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                {searchTerm ? "No matching guests found" : "All guests already assigned"}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredGuests.slice(0, 10).map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium">
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{guest.name}</p>
                        <p className="text-xs text-gray-400">
                          {guest.email || guest.phone || "No contact info"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddOccupant(guest.id)}
                      disabled={loading}
                      className="h-8"
                    >
                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Occupants List */}
        {occupants.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-10 w-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No guests assigned to this room yet</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-zinc-800">
            {occupants.map((occupant) => (
              <div
                key={occupant.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {occupant.guest.name.charAt(0).toUpperCase()}
                    </div>
                    {occupant.isPrimary && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                      {occupant.guest.name}
                      {occupant.isPrimary && (
                        <span className="text-[10px] uppercase font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {occupant.guest.email || occupant.guest.phone || "No contact"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!occupant.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(occupant.id)}
                      className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                      title="Set as primary guest"
                    >
                      <Crown className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveOccupant(occupant.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                    title="Remove from room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Capacity indicator */}
        <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
            <span>Room capacity</span>
            <span className={occupants.length >= capacity ? "text-amber-500 font-medium" : ""}>
              {occupants.length} / {capacity} guests
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
                occupants.length >= capacity ? "bg-amber-500" : "bg-blue-500"
              }`}
              style={{ width: `${(occupants.length / capacity) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </Card>
  );
}

// Wrapper component for managing all bookings' room occupants
interface RoomOccupantsGridProps {
  bookings: Booking[];
  guests: Guest[];
  onRefresh?: () => void;
}

export function RoomOccupantsGrid({
  bookings,
  guests,
  onRefresh,
}: RoomOccupantsGridProps) {
  if (bookings.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <BedDouble className="h-12 w-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-1">
            No room bookings yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Bookings with room assignments will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookings.map((booking) => (
        <RoomOccupantsManager
          key={booking.id}
          booking={booking}
          availableGuests={guests}
          onUpdate={onRefresh}
        />
      ))}
    </div>
  );
}
