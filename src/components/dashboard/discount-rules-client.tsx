"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Percent, Plus, Loader2 } from "lucide-react";

interface DiscountRule {
  id: string;
  minRooms: number;
  discountPct: number;
  description: string | null;
  isActive: boolean;
}

interface DiscountRulesClientProps {
  eventId: string;
  initialRules: DiscountRule[];
}

export function DiscountRulesClient({ eventId, initialRules }: DiscountRulesClientProps) {
  const [rules, setRules] = useState<DiscountRule[]>(initialRules);
  const [minRooms, setMinRooms] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minRooms || !discountPct) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minRooms: parseInt(minRooms),
          discountPct: parseInt(discountPct),
          description: description || null,
        }),
      });
      if (res.ok) {
        const newRule = await res.json();
        setRules((prev) => [...prev, newRule]);
        setMinRooms("");
        setDiscountPct("");
        setDescription("");
        showToast("Discount rule created successfully");
      } else {
        showToast("Failed to create discount rule");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b border-violet-100 dark:border-violet-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <Percent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Discount Rules</CardTitle>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Volume-based discounts for group bookings</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {/* Existing Rules */}
          {rules.length > 0 ? (
            <div className="space-y-2 mb-5">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
                      <Percent className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        Book {rule.minRooms}+ rooms &rarr; {rule.discountPct}% off
                      </p>
                      {rule.description && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{rule.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={rule.isActive ? "success" : "secondary"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 mb-5">
              <Percent className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-zinc-400">No discount rules configured</p>
            </div>
          )}

          {/* Add New Rule Form */}
          <div className="border-t border-gray-100 dark:border-zinc-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Add New Rule
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Min Rooms</label>
                <input
                  type="number"
                  min="1"
                  value={minRooms}
                  onChange={(e) => setMinRooms(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Discount %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div className="flex-[2] min-w-[200px]">
                <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Early bird group discount"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <Button type="submit" disabled={saving || !minRooms || !discountPct} size="sm" className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Rule
              </Button>
            </form>
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
