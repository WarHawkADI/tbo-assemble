"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
  Award,
  FileText,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
}

interface RFP {
  id: string;
  vendorId: string;
  vendor: Vendor;
  quotedAmount: number;
  roomRate: number | null;
  foodRate: number | null;
  venueRate: number | null;
  additionalCosts: number | null;
  validUntil: string | null;
  status: string;
  notes: string | null;
  responseDate: string | null;
  createdAt: string;
}

interface RFPDashboardProps {
  eventId: string;
  initialRfps: RFP[];
}

export function RFPDashboard({ eventId, initialRfps }: RFPDashboardProps) {
  const [rfps, setRfps] = useState<RFP[]>(initialRfps);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Form states
  const [rfpForm, setRfpForm] = useState({
    vendorId: "",
    quotedAmount: "",
    roomRate: "",
    foodRate: "",
    venueRate: "",
    additionalCosts: "",
    validUntil: "",
    notes: "",
  });

  const [vendorForm, setVendorForm] = useState({
    name: "",
    email: "",
    phone: "",
    contactPerson: "",
    address: "",
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // Fetch vendors
  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => setVendors(data))
      .catch(console.error);
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm),
      });

      if (res.ok) {
        const newVendor = await res.json();
        setVendors([newVendor, ...vendors]);
        setVendorForm({ name: "", email: "", phone: "", contactPerson: "", address: "" });
        setShowVendorForm(false);
        showToast("Vendor added successfully");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add vendor");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRfp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfpForm.vendorId || !rfpForm.quotedAmount) return;

    setLoading(true);
    try {
      const res = await fetch("/api/rfp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          vendorId: rfpForm.vendorId,
          quotedAmount: parseFloat(rfpForm.quotedAmount),
          roomRate: rfpForm.roomRate ? parseFloat(rfpForm.roomRate) : null,
          foodRate: rfpForm.foodRate ? parseFloat(rfpForm.foodRate) : null,
          venueRate: rfpForm.venueRate ? parseFloat(rfpForm.venueRate) : null,
          additionalCosts: rfpForm.additionalCosts ? parseFloat(rfpForm.additionalCosts) : null,
          validUntil: rfpForm.validUntil || null,
          notes: rfpForm.notes || null,
        }),
      });

      if (res.ok) {
        const newRfp = await res.json();
        setRfps([newRfp, ...rfps]);
        setRfpForm({
          vendorId: "",
          quotedAmount: "",
          roomRate: "",
          foodRate: "",
          venueRate: "",
          additionalCosts: "",
          validUntil: "",
          notes: "",
        });
        setShowAddForm(false);
        showToast("RFP added successfully");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add RFP");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to add RFP");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (rfpId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/rfp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rfpId, status: newStatus }),
      });

      if (res.ok) {
        const updatedRfp = await res.json();
        setRfps(rfps.map((r) => (r.id === rfpId ? updatedRfp : r)));
        showToast(`Status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRfp = async (rfpId: string) => {
    if (!confirm("Are you sure you want to delete this RFP?")) return;

    try {
      const res = await fetch(`/api/rfp?id=${rfpId}`, { method: "DELETE" });
      if (res.ok) {
        setRfps(rfps.filter((r) => r.id !== rfpId));
        showToast("RFP deleted");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Find the best quote (lowest amount among pending/accepted)
  const activeRfps = rfps.filter((r) => r.status !== "rejected");
  const bestQuote = activeRfps.length > 0
    ? activeRfps.reduce((best, curr) => (curr.quotedAmount < best.quotedAmount ? curr : best))
    : null;

  const avgQuote = activeRfps.length > 0
    ? activeRfps.reduce((sum, r) => sum + r.quotedAmount, 0) / activeRfps.length
    : 0;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "success" as const;
      case "rejected":
        return "destructive" as const;
      case "negotiating":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Total Quotes</p>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{rfps.length}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Best Quote</p>
              <Award className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {bestQuote ? formatCurrency(bestQuote.quotedAmount) : "-"}
            </p>
            {bestQuote && (
              <p className="text-xs text-gray-400 mt-1">{bestQuote.vendor.name}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Average Quote</p>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{avgQuote > 0 ? formatCurrency(avgQuote) : "-"}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">Potential Savings</p>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {bestQuote && avgQuote > 0 ? formatCurrency(avgQuote - bestQuote.quotedAmount) : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => setShowVendorForm(true)} variant="outline" className="gap-1.5">
          <Building2 className="h-4 w-4" /> Add Vendor
        </Button>
        <Button onClick={() => setShowAddForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Request Quote
        </Button>
      </div>

      {/* Add Vendor Form */}
      {showVendorForm && (
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Add New Vendor</CardTitle>
              <button onClick={() => setShowVendorForm(false)} className="text-gray-400 hover:text-gray-600" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Vendor / Hotel Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    placeholder="e.g., Taj Hotels"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Contact Person</label>
                  <Input
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    placeholder="Sales Manager Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder="sales@hotel.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Phone</label>
                  <Input
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowVendorForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !vendorForm.name.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Vendor
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add RFP Form */}
      {showAddForm && (
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Request Quote (RFP)</CardTitle>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600" title="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddRfp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Select Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rfpForm.vendorId}
                    onChange={(e) => setRfpForm({ ...rfpForm, vendorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm"
                    required
                    title="Select vendor for RFP"
                  >
                    <option value="">Choose vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">
                    Total Quoted Amount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={rfpForm.quotedAmount}
                    onChange={(e) => setRfpForm({ ...rfpForm, quotedAmount: e.target.value })}
                    placeholder="₹ Total quote"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Room Rate (per night)</label>
                  <Input
                    type="number"
                    value={rfpForm.roomRate}
                    onChange={(e) => setRfpForm({ ...rfpForm, roomRate: e.target.value })}
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">F&B Rate (per pax)</label>
                  <Input
                    type="number"
                    value={rfpForm.foodRate}
                    onChange={(e) => setRfpForm({ ...rfpForm, foodRate: e.target.value })}
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Venue Rate</label>
                  <Input
                    type="number"
                    value={rfpForm.venueRate}
                    onChange={(e) => setRfpForm({ ...rfpForm, venueRate: e.target.value })}
                    placeholder="₹"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Valid Until</label>
                  <Input
                    type="date"
                    value={rfpForm.validUntil}
                    onChange={(e) => setRfpForm({ ...rfpForm, validUntil: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5 block">Notes</label>
                <textarea
                  value={rfpForm.notes}
                  onChange={(e) => setRfpForm({ ...rfpForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-sm h-20"
                  placeholder="Additional notes or terms..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !rfpForm.vendorId || !rfpForm.quotedAmount}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Quote
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* RFP Comparison Table */}
      {rfps.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-1">No quotes yet</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Add vendors and request quotes to compare pricing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quote Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-zinc-800">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-500 dark:text-zinc-400">Vendor</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-zinc-400">Total Quote</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-zinc-400">Room Rate</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-zinc-400">F&B Rate</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-zinc-400">Valid Until</th>
                    <th className="text-center p-3 font-medium text-gray-500 dark:text-zinc-400">Status</th>
                    <th className="text-right p-3 font-medium text-gray-500 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rfps.map((rfp) => (
                    <tr
                      key={rfp.id}
                      className={`border-t hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors ${
                        bestQuote?.id === rfp.id ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {bestQuote?.id === rfp.id && (
                            <Award className="h-4 w-4 text-emerald-500" />
                          )}
                          <div>
                            <p className="font-medium">{rfp.vendor.name}</p>
                            {rfp.vendor.contactPerson && (
                              <p className="text-xs text-gray-400">{rfp.vendor.contactPerson}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(rfp.quotedAmount)}
                      </td>
                      <td className="p-3 text-right text-gray-500 dark:text-zinc-400">
                        {rfp.roomRate ? formatCurrency(rfp.roomRate) : "-"}
                      </td>
                      <td className="p-3 text-right text-gray-500 dark:text-zinc-400">
                        {rfp.foodRate ? formatCurrency(rfp.foodRate) : "-"}
                      </td>
                      <td className="p-3 text-right text-gray-500 dark:text-zinc-400">
                        {rfp.validUntil ? (
                          <span className={new Date(rfp.validUntil) < new Date() ? "text-red-500" : ""}>
                            {new Date(rfp.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={getStatusVariant(rfp.status)}>{rfp.status}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <select
                            value={rfp.status}
                            onChange={(e) => handleStatusChange(rfp.id, e.target.value)}
                            className="text-xs border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-900"
                            title="Change RFP status"
                          >
                            <option value="pending">Pending</option>
                            <option value="negotiating">Negotiating</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleDeleteRfp(rfp.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Delete RFP"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
