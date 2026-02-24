"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Upload, FileText, Image, Check, Loader2, Zap, FileCheck, ArrowLeft, Pencil, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import Link from "next/link";

interface RoomBlock {
  roomType: string;
  rate?: number;
  quantity?: number;
  floor?: string;
  wing?: string;
}

interface AddOn {
  name: string;
  isIncluded?: boolean;
  price?: number;
}

interface AttritionRule {
  releaseDate: string;
  releasePercent: number;
  description: string;
}

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
    eventName?: string;
    eventType?: string;
    clientName?: string;
    rooms?: RoomBlock[];
    addOns?: AddOn[];
    attritionRules?: AttritionRule[];
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"upload" | "processing" | "review" | "done">("upload");
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [inviteFile, setInviteFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEventData | null>(null);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Helper to update a top-level invite field
  const updateInvite = (field: string, value: string) => {
    setParsedData((prev) => prev ? { ...prev, invite: { ...prev.invite, [field]: value } } : prev);
  };

  // Helper to update a top-level contract field
  const updateContract = (field: string, value: string) => {
    setParsedData((prev) => prev ? { ...prev, contract: { ...prev.contract, [field]: value } } : prev);
  };

  // Helper to update a specific room field
  const updateRoom = (index: number, field: keyof RoomBlock, value: string | number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.rooms) return prev;
      const rooms = [...prev.contract.rooms];
      rooms[index] = { ...rooms[index], [field]: value };
      return { ...prev, contract: { ...prev.contract, rooms } };
    });
  };

  const addRoom = () => {
    setParsedData((prev) => {
      if (!prev) return prev;
      const rooms = [...(prev.contract?.rooms || []), { roomType: "New Room", rate: 0, quantity: 1, floor: "", wing: "" }];
      return { ...prev, contract: { ...prev.contract, rooms } };
    });
  };

  const removeRoom = (index: number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.rooms) return prev;
      const rooms = prev.contract.rooms.filter((_, i) => i !== index);
      return { ...prev, contract: { ...prev.contract, rooms } };
    });
  };

  // Helper to update a specific add-on field
  const updateAddOn = (index: number, field: keyof AddOn, value: string | number | boolean) => {
    setParsedData((prev) => {
      if (!prev?.contract?.addOns) return prev;
      const addOns = [...prev.contract.addOns];
      addOns[index] = { ...addOns[index], [field]: value };
      return { ...prev, contract: { ...prev.contract, addOns } };
    });
  };

  const addAddOn = () => {
    setParsedData((prev) => {
      if (!prev) return prev;
      const addOns = [...(prev.contract?.addOns || []), { name: "New Add-On", isIncluded: false, price: 0 }];
      return { ...prev, contract: { ...prev.contract, addOns } };
    });
  };

  const removeAddOn = (index: number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.addOns) return prev;
      const addOns = prev.contract.addOns.filter((_, i) => i !== index);
      return { ...prev, contract: { ...prev.contract, addOns } };
    });
  };

  // Helper to update attrition rules
  const updateAttrition = (index: number, field: keyof AttritionRule, value: string | number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.attritionRules) return prev;
      const rules = [...prev.contract.attritionRules];
      rules[index] = { ...rules[index], [field]: value };
      return { ...prev, contract: { ...prev.contract, attritionRules: rules } };
    });
  };

  const addAttrition = () => {
    setParsedData((prev) => {
      if (!prev) return prev;
      const rules = [...(prev.contract?.attritionRules || []), { releaseDate: "", releasePercent: 0, description: "" }];
      return { ...prev, contract: { ...prev.contract, attritionRules: rules } };
    });
  };

  const removeAttrition = (index: number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.attritionRules) return prev;
      const rules = prev.contract.attritionRules.filter((_, i) => i !== index);
      return { ...prev, contract: { ...prev.contract, attritionRules: rules } };
    });
  };

  const handleProcess = async () => {
    if (!contractFile && !inviteFile) {
      toast({ title: "No documents", description: "Please upload at least one document before parsing.", variant: "destructive" });
      return;
    }
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

      const data = await res.json();

      if (!res.ok) {
        // Validation failed — show toast popup, go back to upload
        const errMsg = data.contractError || data.inviteError || data.error || "Failed to parse documents.";
        toast({ title: "Invalid Document", description: errMsg, variant: "destructive" });
        setStep("upload");
        return;
      }

      // Partial success: one file parsed, one failed
      if (data.contractError || data.inviteError) {
        const warnings: string[] = [];
        if (data.contractError) warnings.push(data.contractError);
        if (data.inviteError) warnings.push(data.inviteError);
        toast({ title: "Partial Extraction", description: warnings.join(" "), variant: "default" });
      }

      // Extra safety: only proceed if we have real useful data
      const hasContract = data.contract && data.contract.venue && data.contract.venue !== "Unknown Venue";
      const hasInvite = data.invite && data.invite.eventName;
      if (!hasContract && !hasInvite) {
        toast({ title: "Invalid Document", description: "No meaningful event data found in the uploaded files. Please upload a valid hotel contract or event invitation.", variant: "destructive" });
        setStep("upload");
        return;
      }

      setParsedData(data);
      setStep("review");
    } catch (err) {
      console.error(err);
      toast({ title: "Processing Error", description: "Error processing files. Please check your documents and try again.", variant: "destructive" });
      setStep("upload");
    }
  };

  const handleDemo = async () => {
    setStep("processing");
    setError("");
    try {
      const res = await fetch("/api/ai/parse?demo=true", { method: "POST" });
      const data = await res.json();
      setParsedData(data);
      setStep("review");
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load demo data.", variant: "destructive" });
      setStep("upload");
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
      toast({ title: "Publish Failed", description: "Failed to create event. Please try again.", variant: "destructive" });
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
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) { if (f.size > 10 * 1024 * 1024) { alert("File too large. Max 10MB."); return; } const name = f.name.toLowerCase(); const isInvite = name.includes('invite') || name.includes('invitation') || name.includes('card') || name.includes('wedding') || (!f.type.includes('pdf') && f.type.startsWith('image/')); if (isInvite) { setInviteFile(f); } else { setContractFile(f); } } }}
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
                      <span className="text-xs text-gray-400 dark:text-zinc-500 mt-1">PDF, PNG, JPG, WebP accepted</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
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
            <Button onClick={handleProcess} className="flex-1 gap-2" size="lg" disabled={!contractFile && !inviteFile}>
              <Sparkles className="h-4 w-4" /> Parse Documents
            </Button>
            <Button
              onClick={handleDemo}
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
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Powered by AI</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Our AI engine intelligently extracts room blocks, negotiated rates, event dates, attrition schedules, and theme colors from your uploaded documents. Upload your hotel contract and event invitation, or click &quot;Use Demo Data&quot; to see a sample event.
                </p>
              </div>
            </div>
          </div>
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
          {/* Edit Toggle Banner */}
          {!isEditing && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Fields incorrect or missing? You can edit everything before publishing.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0 ml-3"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Fields
              </Button>
            </div>
          )}
          {isEditing && (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-xl px-4 py-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Edit mode:</span> Modify any field, add or remove items. Click &ldquo;Done Editing&rdquo; when finished.
              </p>
              <Button
                onClick={() => setIsEditing(false)}
                size="sm"
                className="gap-1.5 shrink-0 ml-3"
              >
                <Save className="h-3.5 w-3.5" /> Done Editing
              </Button>
            </div>
          )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Event Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Event Name</label>
                  {isEditing ? (
                    <input
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.invite?.eventName || parsedData.contract?.eventName || ""}
                      onChange={(e) => {
                        if (parsedData.invite) updateInvite("eventName", e.target.value);
                        else updateContract("eventName", e.target.value);
                      }}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.invite?.eventName || parsedData.contract?.eventName || <span className="text-gray-300 italic">Not extracted</span>}</p>
                  )}
                </div>
                {/* Event Type */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Type</label>
                  {isEditing ? (
                    <select
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.invite?.eventType || parsedData.contract?.eventType || "event"}
                      onChange={(e) => {
                        if (parsedData.invite) updateInvite("eventType", e.target.value);
                        else updateContract("eventType", e.target.value);
                      }}
                    >
                      <option value="wedding">Wedding</option>
                      <option value="conference">Conference</option>
                      <option value="corporate">Corporate</option>
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="reunion">Reunion</option>
                      <option value="seminar">Seminar</option>
                      <option value="gala">Gala</option>
                      <option value="event">Other Event</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 capitalize">{parsedData.invite?.eventType || parsedData.contract?.eventType || <span className="text-gray-300 italic">Not extracted</span>}</p>
                  )}
                </div>
                {/* Venue */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Venue</label>
                  {isEditing ? (
                    <input
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.contract?.venue || ""}
                      onChange={(e) => updateContract("venue", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.venue || <span className="text-gray-300 italic">Not extracted</span>}</p>
                  )}
                </div>
                {/* Location */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Location</label>
                  {isEditing ? (
                    <input
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.contract?.location || ""}
                      onChange={(e) => updateContract("location", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.location || <span className="text-gray-300 italic">Not extracted</span>}</p>
                  )}
                </div>
                {/* Check-in */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Check-in</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.contract?.checkIn || ""}
                      onChange={(e) => updateContract("checkIn", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.checkIn || <span className="text-gray-300 italic">Not extracted</span>}</p>
                  )}
                </div>
                {/* Check-out */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Check-out</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.contract?.checkOut || ""}
                      onChange={(e) => updateContract("checkOut", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.checkOut || <span className="text-gray-300 italic">Not extracted</span>}</p>
                  )}
                </div>
                {/* Client / Organizer */}
                {(parsedData.contract?.clientName || isEditing) && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Client / Organizer</label>
                  {isEditing ? (
                    <input
                      className="w-full text-sm font-semibold text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                      value={parsedData.contract?.clientName || ""}
                      onChange={(e) => updateContract("clientName", e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{parsedData.contract?.clientName}</p>
                  )}
                </div>
                )}
              </div>
              {/* Theme Palette */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-700">
                <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-2 block">Theme Palette</label>
                <div className="flex gap-3 flex-wrap">
                  {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key, i) => {
                    const colorVal = parsedData.invite?.[key] || "#888888";
                    const label = ["Primary", "Secondary", "Accent"][i];
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {isEditing ? (
                          <label className="relative cursor-pointer group">
                            <div
                              className="h-10 w-10 rounded-xl shadow-sm border-2 border-gray-200 dark:border-zinc-600 group-hover:border-orange-400 transition-colors"
                              style={{ backgroundColor: colorVal }}
                            />
                            <input
                              type="color"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              value={colorVal}
                              onChange={(e) => updateInvite(key, e.target.value)}
                            />
                          </label>
                        ) : (
                          <div
                            className="h-10 w-10 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700"
                            style={{ backgroundColor: colorVal }}
                          />
                        )}
                        <div className="flex flex-col">
                          {isEditing && <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase">{label}</span>}
                          <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{colorVal}</span>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                    {parsedData.contract?.rooms?.length || 0} types
                  </span>
                  {isEditing && (
                    <Button onClick={addRoom} variant="outline" size="sm" className="gap-1 h-7 text-xs">
                      <Plus className="h-3 w-3" /> Add Room
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-zinc-800/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Room Type</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Rate/Night</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Qty</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">{isEditing ? "Floor" : "Floor/Wing"}</th>
                      {isEditing && <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Wing</th>}
                      {isEditing && <th className="px-3 py-3" />}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.contract?.rooms?.map((room, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-5 py-2">
                          {isEditing ? (
                            <input
                              className="w-full text-sm font-medium text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                              value={room.roomType}
                              onChange={(e) => updateRoom(i, "roomType", e.target.value)}
                            />
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-zinc-100">{room.roomType}</span>
                          )}
                        </td>
                        <td className="px-5 py-2">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-24 text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                              value={room.rate || 0}
                              onChange={(e) => updateRoom(i, "rate", parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-zinc-300">₹{room.rate?.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-5 py-2">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-16 text-sm text-center text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                              value={room.quantity || 0}
                              onChange={(e) => updateRoom(i, "quantity", parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {room.quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2">
                          {isEditing ? (
                            <input
                              className="w-full text-sm text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                              value={room.floor || ""}
                              placeholder="e.g. Floor 2"
                              onChange={(e) => updateRoom(i, "floor", e.target.value)}
                            />
                          ) : (
                            <span className="text-gray-500 dark:text-zinc-400">{room.floor || "—"} / {room.wing || "—"}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td className="px-5 py-2">
                            <input
                              className="w-full text-sm text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                              value={room.wing || ""}
                              placeholder="e.g. East"
                              onChange={(e) => updateRoom(i, "wing", e.target.value)}
                            />
                          </td>
                        )}
                        {isEditing && (
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeRoom(i)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              title="Remove room"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Add-Ons & Inclusions</CardTitle>
                </div>
                {isEditing && (
                  <Button onClick={addAddOn} variant="outline" size="sm" className="gap-1 h-7 text-xs">
                    <Plus className="h-3 w-3" /> Add Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {parsedData.contract?.addOns?.map((addon, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-800/50 hover:bg-gray-100/70 dark:hover:bg-zinc-700/50 transition-colors gap-2">
                    {isEditing ? (
                      <>
                        <input
                          className="flex-1 min-w-0 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                          value={addon.name}
                          onChange={(e) => updateAddOn(i, "name", e.target.value)}
                        />
                        <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addon.isIncluded || false}
                            onChange={(e) => {
                              updateAddOn(i, "isIncluded", e.target.checked);
                              if (e.target.checked) updateAddOn(i, "price", 0);
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400/50"
                          />
                          <span className="text-xs text-gray-500 dark:text-zinc-400">Free</span>
                        </label>
                        {!addon.isIncluded && (
                          <input
                            type="number"
                            className="w-20 text-sm text-right text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                            value={addon.price || 0}
                            onChange={(e) => updateAddOn(i, "price", parseInt(e.target.value) || 0)}
                          />
                        )}
                        <button
                          onClick={() => removeAddOn(i)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                          title="Remove add-on"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{addon.name}</span>
                        {addon.isIncluded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-full">
                            <Check className="h-3 w-3" /> Included
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">₹{addon.price?.toLocaleString()}</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attrition Rules Card */}
          {((parsedData.contract?.attritionRules && parsedData.contract.attritionRules.length > 0) || isEditing) && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-b border-red-100 dark:border-red-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-sm">
                      <Zap className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Attrition Rules</CardTitle>
                  </div>
                  {isEditing && (
                    <Button onClick={addAttrition} variant="outline" size="sm" className="gap-1 h-7 text-xs">
                      <Plus className="h-3 w-3" /> Add Rule
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {parsedData.contract?.attritionRules?.map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-800/50">
                      {isEditing ? (
                        <>
                          <input
                            type="date"
                            className="text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                            value={rule.releaseDate}
                            onChange={(e) => updateAttrition(i, "releaseDate", e.target.value)}
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="w-16 text-sm text-center text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                              value={rule.releasePercent}
                              onChange={(e) => updateAttrition(i, "releasePercent", parseInt(e.target.value) || 0)}
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                          <input
                            className="flex-1 min-w-0 text-sm text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                            value={rule.description}
                            placeholder="Description"
                            onChange={(e) => updateAttrition(i, "description", e.target.value)}
                          />
                          <button
                            onClick={() => removeAttrition(i)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                            title="Remove rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center justify-center h-7 min-w-[3rem] px-2 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold">
                            {rule.releasePercent}%
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{rule.releaseDate}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{rule.description}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error if any */}
          {error && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePublish} className="flex-1 gap-2" size="lg" disabled={isEditing}>
              <Check className="h-4 w-4" /> Approve & Publish Event
            </Button>
            <Button onClick={() => { setStep("upload"); setIsEditing(false); }} variant="outline" size="lg" className="px-6">
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
