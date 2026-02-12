"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Upload, FileText, Image, Check, Loader2, Zap, FileCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParsedEventData {
  invite?: {
    eventName?: string;
    eventType?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  contract?: {
    venue?: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
    rooms?: Array<{
      roomType: string;
      rate?: number;
      quantity?: number;
      floor?: string;
      wing?: string;
    }>;
    addOns?: Array<{
      name: string;
      isIncluded?: boolean;
      price?: number;
    }>;
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "processing" | "review" | "done">("upload");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [inviteFile, setInviteFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEventData | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleProcess = async () => {
    setStep("processing");
    setError("");

    try {
      const formData = new FormData();
      if (contractFile) formData.append("contract", contractFile);
      if (inviteFile) formData.append("invite", inviteFile);

      const res = await fetch("/api/ai/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to parse documents");

      const data = await res.json();
      setParsedData(data);
      setStep("review");
    } catch (err) {
      console.error(err);
      setError("Error processing files. Using demo data...");
      // Fallback: fetch demo data
      const res = await fetch("/api/ai/parse", { method: "POST" });
      const data = await res.json();
      setParsedData(data);
      setStep("review");
    }
  };

  const handlePublish = async () => {
    setStep("processing");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!res.ok) throw new Error("Failed to create event");

      const event = await res.json();
      setStep("done");
      setTimeout(() => {
        router.push(`/dashboard/events/${event.id}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to create event");
      setStep("review");
    }
  };

  const steps = [
    { label: "Upload", icon: Upload },
    { label: "AI Processing", icon: Zap },
    { label: "Review", icon: FileCheck },
    { label: "Published", icon: Check },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors mb-4 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-md shadow-orange-200/50">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight">AI Event Setup</h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Create your event in 60 seconds</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-lg">
          Upload your hotel contract and event invitation. Our AI will extract all the details and generate a beautiful microsite automatically.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 p-4 shadow-sm">
        {steps.map((s, idx) => {
          const stepIdx = ["upload", "processing", "review", "done"].indexOf(step);
          const isActive = idx === stepIdx;
          const isDone = idx < stepIdx;
          const StepIcon = s.icon;
          return (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    isDone
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/30"
                      : isActive
                      ? "bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-md shadow-orange-200/50 dark:shadow-orange-900/30"
                      : "bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500"
                  }`}
                >
                  {isDone ? <Check className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? "text-[#ff6b35]" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 mx-4 rounded-full transition-colors ${
                  idx < stepIdx ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gray-100 dark:bg-zinc-700"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <div className="space-y-5">
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-5 rounded-xl transition-all ${isDragging ? 'border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) { if (f.size > 10 * 1024 * 1024) { alert("File too large. Max 10MB."); return; } if (f.type === 'application/pdf') { setContractFile(f); } else { setInviteFile(f); } } }}
          >
            {/* Contract Upload */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-800/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Hotel Contract</CardTitle>
                    <CardDescription className="text-xs">PDF or image of venue agreement</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  contractFile 
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/30" 
                    : "border-gray-200 dark:border-zinc-600 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
                }`}>
                  {contractFile ? (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-2">
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">{contractFile.name}</span>
                      <span className="text-xs text-blue-500 dark:text-blue-500 mt-1">Click to change file</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300 dark:text-zinc-600 mb-2" />
                      <span className="text-sm text-gray-500 dark:text-zinc-400">Drop file or click to upload</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500 mt-1">PDF, PNG, JPG accepted</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > 10 * 1024 * 1024) { alert("File too large. Max 10MB."); return; }
                      setContractFile(file);
                    }}
                  />
                </label>
              </CardContent>
            </Card>

            {/* Invite Upload */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-b border-purple-100 dark:border-purple-800/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md">
                    <Image className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Event Invitation</CardTitle>
                    <CardDescription className="text-xs">Image for theme & color extraction</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  inviteFile 
                    ? "border-purple-400 bg-purple-50/50 dark:bg-purple-950/30" 
                    : "border-gray-200 dark:border-zinc-600 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20"
                }`}>
                  {inviteFile ? (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 mb-2">
                        <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-400">{inviteFile.name}</span>
                      <span className="text-xs text-purple-500 dark:text-purple-500 mt-1">Click to change file</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-300 dark:text-zinc-600 mb-2" />
                      <span className="text-sm text-gray-500 dark:text-zinc-400">Drop file or click to upload</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500 mt-1">PNG, JPG, WebP accepted</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > 10 * 1024 * 1024) { alert("File too large. Max 10MB."); return; }
                      setInviteFile(file);
                    }}
                  />
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleProcess} className="flex-1 gap-2" size="lg">
              <Sparkles className="h-4 w-4" /> Process with AI
            </Button>
            <Button
              onClick={handleProcess}
              variant="outline"
              size="lg"
              className="px-6"
            >
              Use Demo Data
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/40 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">How it works</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Our AI extracts room blocks, rates, dates, attrition rules from contracts, and theme colors from invitations. No files? Click "Use Demo Data" to see a sample event.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Processing Step */}
      {step === "processing" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <div className="relative inline-flex">
              <div className="absolute inset-0 rounded-full bg-orange-200/50 animate-ping" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-lg shadow-orange-200/50 mx-auto">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mt-6 mb-2">AI is analyzing your documents</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
              Extracting room blocks, rates, dates, theme colors, and attrition rules. This usually takes a few seconds.
            </p>
            <div className="flex justify-center gap-1 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === "review" && parsedData && (
        <div className="space-y-5">
          {/* Event Details Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-gray-100 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] text-white shadow-sm">
                  <FileCheck className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Event Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Event Name</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.invite?.eventName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Type</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 capitalize">{parsedData.invite?.eventType}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Venue</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.venue}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Location</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.location}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Check-in</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.checkIn}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Check-out</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.checkOut}</p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-700">
                <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-2 block">Theme Palette</label>
                <div className="flex gap-3">
                  {[parsedData.invite?.primaryColor, parsedData.invite?.secondaryColor, parsedData.invite?.accentColor].filter(Boolean).map(
                    (c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="h-10 w-10 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700"
                          style={{ backgroundColor: c }}
                        />
                        <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{c}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Blocks Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                    <FileText className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Room Blocks</CardTitle>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                  {parsedData.contract?.rooms?.length || 0} types
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-zinc-800/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Room Type</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Rate/Night</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Qty</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Floor/Wing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.contract?.rooms?.map((room: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-zinc-100">{room.roomType}</td>
                        <td className="px-5 py-3 text-gray-700 dark:text-zinc-300">₹{room.rate?.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {room.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-zinc-400">{room.floor || "—"} / {room.wing || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Add-Ons Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">Add-Ons & Inclusions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {parsedData.contract?.addOns?.map((addon: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-800/50 hover:bg-gray-100/70 dark:hover:bg-zinc-700/50 transition-colors">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{addon.name}</span>
                    {addon.isIncluded ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-full">
                        <Check className="h-3 w-3" /> Included
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">₹{addon.price?.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePublish} className="flex-1 gap-2" size="lg">
              <Check className="h-4 w-4" /> Approve & Publish Event
            </Button>
            <Button onClick={() => setStep("upload")} variant="outline" size="lg" className="px-6">
              Re-upload
            </Button>
          </div>
        </div>
      )}

      {/* Done Step */}
      {step === "done" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-200/50 animate-ping" />
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <Check className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Event Published!</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
              Your event microsite is now live and ready to accept bookings. Redirecting to your dashboard...
            </p>
            <div className="flex justify-center gap-1 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-6 rounded-full bg-emerald-400"
                  style={{ opacity: 0.4 + (i * 0.3) }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
