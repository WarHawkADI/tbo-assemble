"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Loader2,
  Printer,
  Mail,
  Copy,
  CheckCircle,
} from "lucide-react";

interface QuoteDownloadProps {
  eventId: string;
  eventName: string;
  variant?: "button" | "icon" | "full";
}

export function QuoteDownload({
  eventId,
  eventName,
  variant = "button",
}: QuoteDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/quote`);
      if (!res.ok) throw new Error("Failed to generate quote");

      const html = await res.text();

      // Create a new window with the quote HTML for printing/saving as PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Auto-trigger print dialog for PDF save
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const quoteUrl = `${window.location.origin}/api/events/${eventId}/quote`;
    await navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
        title="Download Quote PDF"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </button>
    );
  }

  if (variant === "full") {
    return (
      <div className="p-4 border border-gray-100 dark:border-zinc-800 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-zinc-800/50 dark:to-zinc-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-zinc-100">Event Quote</h4>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Generate & share with clients
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              handleDownload();
            }}
            disabled={loading}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleCopyLink}
            className="flex-1 gap-2 text-sm"
            size="sm"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const subject = encodeURIComponent(`Quote for ${eventName}`);
              const body = encodeURIComponent(
                `Please find the event quote here: ${window.location.origin}/api/events/${eventId}/quote`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="flex-1 gap-2 text-sm"
            size="sm"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
        </div>
      </div>
    );
  }

  // Default button variant
  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Download Quote
    </Button>
  );
}

// Embeddable quote preview component
interface QuotePreviewProps {
  eventId: string;
}

export function QuotePreview({ eventId }: QuotePreviewProps) {
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/quote`);
      if (res.ok) {
        const content = await res.text();
        setHtml(content);
        setShowPreview(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!showPreview) {
    return (
      <Button
        variant="ghost"
        onClick={loadPreview}
        disabled={loading}
        className="gap-2 text-sm"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Preview Quote
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Quote Preview</h3>
          <div className="flex items-center gap-2">
            <QuoteDownload eventId={eventId} eventName="" variant="button" />
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {html && (
            <iframe
              srcDoc={html}
              className="w-full h-[70vh] border rounded-lg"
              title="Quote Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
