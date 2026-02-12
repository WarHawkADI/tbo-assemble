"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Upload,
  Download,
  X,
  Search,
  Filter,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  group: string | null;
  status: string;
  proximityRequest: string | null;
  notes: string | null;
  allocatedFloor: string | null;
  allocatedRoom: string | null;
  bookings: {
    roomBlock: { roomType: string } | null;
  }[];
}

interface GuestManagementProps {
  eventId: string;
  initialGuests: Guest[];
  eventName: string;
}

export function GuestManagement({ eventId, initialGuests }: GuestManagementProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported?: number; failed?: number } | null>(null);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    group: "",
    proximityRequest: "",
    notes: "",
  });

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...formData }),
      });

      if (res.ok) {
        const newGuest = await res.json();
        setGuests([{ ...newGuest, bookings: [] }, ...guests]);
        setFormData({ name: "", email: "", phone: "", group: "", proximityRequest: "", notes: "" });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error adding guest:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) return;

    try {
      const res = await fetch(`/api/guests?id=${guestId}`, { method: "DELETE" });
      if (res.ok) {
        setGuests(guests.filter((g) => g.id !== guestId));
        showToast("Guest deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting guest:", error);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        alert("CSV file must have at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const guestsData = lines.slice(1).map((line) => {
        const values = line.match(/("([^"]*)"|[^,]*)/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) || [];
        const guest: Record<string, string> = {};
        headers.forEach((h, i) => {
          guest[h] = values[i] || "";
        });
        return guest;
      });

      const res = await fetch("/api/guests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, guests: guestsData }),
      });

      if (res.ok) {
        const result = await res.json();
        setImportResult({ imported: result.imported, failed: result.failed });

        // Refresh guest list
        const refreshRes = await fetch(`/api/guests?eventId=${eventId}`);
        if (refreshRes.ok) {
          const refreshedGuests = await refreshRes.json();
          setGuests(refreshedGuests);
        }
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/guests/import?eventId=${eventId}`);
      if (!res.ok) throw new Error("Export failed");
      const csvContent = await res.text();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guests-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  // Filter guests
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      !searchTerm ||
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.group?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group guests
  const groups = new Map<string, Guest[]>();
  for (const guest of filteredGuests) {
    const group = guest.group || "Unassigned";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(guest);
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success" as const;
      case "invited":
        return "warning" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const confirmed = guests.filter((g) => g.status === "confirmed").length;
  const invited = guests.filter((g) => g.status === "invited").length;
  const cancelled = guests.filter((g) => g.status === "cancelled").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Total Guests</p>
            <p className="text-2xl font-bold mt-1">{guests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Confirmed</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{confirmed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Invited</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{invited}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-zinc-400">Cancelled</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
            aria-label="Filter guests by status"
            className="text-sm border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35]"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="invited">Invited</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" /> Add Guest
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
            title="Import CSV file"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Successfully imported <strong>{importResult.imported}</strong> guests.
            {importResult.failed ? ` ${importResult.failed} rows failed.` : ""}
          </p>
          <button
            onClick={() => setImportResult(null)}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Guest Form */}
      {showAddForm && (
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Add New Guest</CardTitle>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                title="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Guest name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="guest@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Phone</label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Group</label>
                  <Input
                    placeholder="e.g., Bride's Family, VIP"
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Proximity Request
                  </label>
                  <Input
                    placeholder="e.g., Near elevator, Same floor as..."
                    value={formData.proximityRequest}
                    onChange={(e) => setFormData({ ...formData, proximityRequest: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Notes</label>
                  <Input
                    placeholder="Special requirements"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.name.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Guest
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Guest List */}
      {filteredGuests.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <UserPlus className="h-12 w-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-1">
              {guests.length === 0 ? "No guests yet" : "No guests match your filters"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {guests.length === 0
                ? "Add guests manually or import from CSV."
                : "Try adjusting your search or filter criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(groups.entries()).map(([groupName, groupGuests]) => (
          <Card key={groupName} className="mb-4 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {groupName}
                <Badge variant="secondary">{groupGuests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-zinc-400">Name</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-zinc-400">Contact</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-zinc-400">Room</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-zinc-400">Proximity</th>
                      <th className="text-left p-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
                      <th className="text-right p-3 font-medium text-gray-500 dark:text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupGuests.map((guest) => (
                      <tr key={guest.id} className="border-t hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="p-3 font-medium">{guest.name}</td>
                        <td className="p-3 text-gray-500 dark:text-zinc-400">
                          {guest.email || guest.phone || "-"}
                        </td>
                        <td className="p-3 text-gray-500 dark:text-zinc-400">
                          {guest.bookings[0]?.roomBlock?.roomType || (
                            <span className="text-gray-400 dark:text-zinc-500">Not booked</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 dark:text-zinc-400">{guest.proximityRequest || "-"}</td>
                        <td className="p-3">
                          <Badge variant={statusVariant(guest.status)}>{guest.status}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="text-gray-400 dark:text-zinc-500 hover:text-red-600 transition-colors p-1"
                            title="Delete guest"
                            aria-label={`Delete guest ${guest.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
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
