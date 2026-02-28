"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calculator,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CostEstimate {
  rooms: number;
  food: number;
  catering: number;
  addons: number;
  total: number;
  perPax?: number;
  nights?: number;
  estimatedRooms?: number;
}

interface DynamicPaxManagerProps {
  eventId: string;
  currentPax: number;
  onPaxChange?: (newPax: number) => void;
}

export function DynamicPaxManager({
  eventId,
  currentPax,
  onPaxChange,
}: DynamicPaxManagerProps) {
  const [pax, setPax] = useState(currentPax);
  const [inputPax, setInputPax] = useState(currentPax.toString());
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // Calculate estimate for given pax count
  const calculateEstimate = useCallback(async (paxCount: number) => {
    if (paxCount < 1) return;
    
    setCalculating(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/pax?newPax=${paxCount}`);
      if (res.ok) {
        const data = await res.json();
        if (data.costEstimates) {
          setEstimate(data.costEstimates);
        } else {
          setError("No cost data returned");
        }
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to calculate estimate");
      }
    } catch (err) {
      console.error(err);
      setError("Network error - please try again");
    } finally {
      setCalculating(false);
    }
  }, [eventId]);

  // Load initial estimate on mount
  useEffect(() => {
    calculateEstimate(currentPax);
  }, [currentPax, calculateEstimate]);

  // Update pax count on server
  const handleUpdatePax = async () => {
    const newPax = parseInt(inputPax);
    if (isNaN(newPax) || newPax < 1) {
      showToast("Please enter a valid pax count");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/pax`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedPax: newPax }),
      });

      if (res.ok) {
        const data = await res.json();
        setPax(newPax);
        setEstimate(data.costEstimates);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        showToast("Pax count updated successfully");
        onPaxChange?.(newPax);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to update pax count");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputPax(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      calculateEstimate(num);
    }
  };

  const paxDiff = parseInt(inputPax) - pax;
  const isPaxChanged = paxDiff !== 0 && !isNaN(parseInt(inputPax));

  // Quick adjust buttons
  const quickAdjust = (delta: number) => {
    const newValue = Math.max(1, parseInt(inputPax || "0") + delta);
    handleInputChange(newValue.toString());
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Dynamic Pax Management</CardTitle>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                Adjust guest count • Pricing auto-updates
              </p>
            </div>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Saved
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Current Pax Display */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase mb-1">Current Pax Count</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{pax}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase mb-1">Last Updated</p>
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>

        {/* Pax Input */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2 block">
            Update Expected Guests
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickAdjust(-10)}
                className="px-3"
              >
                -10
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickAdjust(-1)}
                className="px-3"
              >
                -1
              </Button>
              <Input
                type="number"
                value={inputPax}
                onChange={(e) => handleInputChange(e.target.value)}
                min={1}
                className="text-center font-semibold text-lg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickAdjust(1)}
                className="px-3"
              >
                +1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickAdjust(10)}
                className="px-3"
              >
                +10
              </Button>
            </div>
          </div>

          {/* Change indicator */}
          {isPaxChanged && (
            <div className={`flex items-center gap-2 mt-3 text-sm ${paxDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {paxDiff > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {paxDiff > 0 ? "+" : ""}{paxDiff} guests ({paxDiff > 0 ? "increase" : "decrease"})
              </span>
            </div>
          )}
        </div>

        {/* Cost Estimate */}
        {calculating ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Calculating estimate...
          </div>
        ) : estimate ? (
          <div className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden mb-6">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm">Estimated Cost Breakdown</h4>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Room Costs</span>
                <span className="font-medium">{formatCurrency(estimate.rooms)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">F&B / Catering</span>
                <span className="font-medium">{formatCurrency(estimate.food + estimate.catering)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-zinc-400">Add-ons & Services</span>
                <span className="font-medium">{formatCurrency(estimate.addons)}</span>
              </div>
              <div className="border-t dark:border-zinc-800 pt-3 flex justify-between">
                <span className="font-semibold">Total Estimate</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(estimate.total)}</span>
              </div>
            </div>

            {/* Per-person cost */}
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 dark:text-blue-400 font-medium">Cost per person</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(Math.round(estimate.total / parseInt(inputPax || "1")))}
                </span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Error loading estimate
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => calculateEstimate(parseInt(inputPax) || currentPax)}
              className="shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                No estimate available
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Click Recalculate to see cost projections
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => calculateEstimate(parseInt(inputPax))}
            disabled={calculating || !inputPax}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
          <Button
            onClick={handleUpdatePax}
            disabled={loading || !isPaxChanged}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center mt-4">
          💡 Pricing auto-adjusts based on room requirements, F&B plans, and add-ons
        </p>
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
