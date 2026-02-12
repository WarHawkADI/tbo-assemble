"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, QrCode, Printer } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface EventOverviewActionsProps {
  slug: string;
  eventId: string;
  currentStatus?: string;
}

export function EventOverviewActions({ slug, eventId, currentStatus = "active" }: EventOverviewActionsProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/event/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportRoomingList = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rooming-list`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rooming-list.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  const openQrBatchPrint = () => {
    window.open(`/api/events/${eventId}/qr-batch`, "_blank");
  };

  const nextStatus = currentStatus === "draft" ? "active" : currentStatus === "active" ? "completed" : currentStatus === "completed" ? "active" : null;
  const nextStatusLabel = currentStatus === "draft" ? "Activate" : currentStatus === "active" ? "Complete" : currentStatus === "completed" ? "Reactivate" : null;
  const nextStatusColor = currentStatus === "draft" ? "text-green-600" : currentStatus === "active" ? "text-blue-600" : "text-amber-600";

  const changeStatus = async () => {
    if (!nextStatus) return;
    if (!confirm(`Change event status to "${nextStatus}"?`)) return;
    setStatusChanging(true);
    try {
      await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
    setStatusChanging(false);
  };

  return (
    <>
      <ThemeToggle />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={copyLink}
        aria-label="Copy event microsite link"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-600" /> Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={exportRoomingList}
        disabled={exporting}
        aria-label="Export rooming list as CSV"
      >
        <Download className="h-3.5 w-3.5" />
        {exporting ? "Exporting..." : "Rooming List"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={openQrBatchPrint}
        aria-label="Print all QR codes"
      >
        <QrCode className="h-3.5 w-3.5" /> QR Batch
      </Button>
      {nextStatus && (
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${nextStatusColor}`}
          onClick={changeStatus}
          disabled={statusChanging}
          aria-label={`Change event status to ${nextStatus}`}
        >
          {statusChanging ? "..." : nextStatusLabel}
        </Button>
      )}
    </>
  );
}
