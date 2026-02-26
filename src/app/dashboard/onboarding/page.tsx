"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Upload, FileText, Image, Check, Loader2, Zap, FileCheck, ArrowLeft, ArrowRight, Pencil, Plus, Trash2, Save, Building2, BookTemplate, Hotel, AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import Link from "next/link";

// Offline detection hook
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}

// Auto-save draft to localStorage
function useDraftPersistence(parsedData: ParsedEventData | null, setParsedData: (data: ParsedEventData | null) => void) {
  const STORAGE_KEY = 'event-draft';
  const [hasDraft, setHasDraft] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          setHasDraft(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Failed to check draft:', e);
    }
  }, []);

  // Save draft when data changes
  useEffect(() => {
    if (parsedData && (parsedData.invite?.eventName || parsedData.contract?.venue)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: parsedData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }
  }, [parsedData]);

  const restoreDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setParsedData(parsed.data);
        return true;
      }
    } catch (e) {
      console.warn('Failed to restore draft:', e);
    }
    return false;
  }, [setParsedData]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
  }, []);

  return { hasDraft, restoreDraft, clearDraft };
}

// Validation helper for event data
function validateEventData(data: ParsedEventData | null): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data) {
    errors.push("No event data to validate");
    return { isValid: false, errors };
  }

  // Check venue
  if (!data.contract?.venue || data.contract.venue === "Unknown Venue") {
    errors.push("Venue name is required");
  }

  // Check event name
  if (!data.invite?.eventName && !data.contract?.eventName) {
    errors.push("Event name is required");
  }

  // Check dates
  if (!data.contract?.checkIn || !data.contract?.checkOut) {
    errors.push("Check-in and check-out dates are required");
  } else {
    const checkIn = new Date(data.contract.checkIn);
    const checkOut = new Date(data.contract.checkOut);
    if (checkOut <= checkIn) {
      errors.push("Check-out date must be after check-in date");
    }
  }

  // Check rooms
  if (!data.contract?.rooms || data.contract.rooms.length === 0) {
    errors.push("At least one room block is required");
  } else {
    data.contract.rooms.forEach((room, idx) => {
      if (!room.roomType) errors.push(`Room #${idx + 1}: Room type is required`);
      if (!room.rate || room.rate <= 0) errors.push(`Room #${idx + 1}: Valid rate is required`);
      if (!room.quantity || room.quantity <= 0) errors.push(`Room #${idx + 1}: Quantity must be at least 1`);
    });
  }

  return { isValid: errors.length === 0, errors };
}

// Contract Template Library - Pre-made sample contracts for instant demos
const CONTRACT_TEMPLATES = [
  {
    id: "taj-udaipur",
    name: "Taj Lake Palace, Udaipur",
    type: "Destination Wedding",
    icon: "🏰",
    description: "Luxury wedding on Lake Pichola",
    color: "#8B1A4A",
    accentColor: "#D4A574",
    data: {
      invite: { eventName: "Royal Lakeside Wedding", eventType: "wedding", primaryColor: "#8B1A4A", secondaryColor: "#FFF5F5", accentColor: "#D4A574", description: "An elegant celebration on the serene waters of Lake Pichola" },
      contract: {
        venue: "Taj Lake Palace", location: "Udaipur, Rajasthan", checkIn: "2026-04-15", checkOut: "2026-04-18",
        rooms: [
          { roomType: "Palace Room Lake View", rate: 45000, quantity: 30, floor: "1-2", wing: "Heritage" },
          { roomType: "Luxury Suite", rate: 75000, quantity: 10, floor: "2", wing: "Royal" },
          { roomType: "Grand Presidential Suite", rate: 150000, quantity: 2, floor: "3", wing: "Royal" },
        ],
        addOns: [
          { name: "Airport Transfer (Luxury Sedan)", isIncluded: false, price: 3500 },
          { name: "Boat Arrival Experience", isIncluded: true, price: 0 },
          { name: "Welcome Drink & Garland", isIncluded: true, price: 0 },
          { name: "Spa Package (60 min)", isIncluded: false, price: 8000 },
        ],
        attritionRules: [
          { releaseDate: "2026-03-15", releasePercent: 30, description: "30 days before: 30% rooms releasable" },
          { releaseDate: "2026-04-01", releasePercent: 15, description: "14 days before: 15% rooms releasable" },
        ],
        confidenceScore: 95,
      }
    }
  },
  {
    id: "marriott-bangalore",
    name: "Marriott Convention Centre, Bangalore",
    type: "MICE Conference",
    icon: "🎯",
    description: "Tech summit for 500+ delegates",
    color: "#1E3A5F",
    accentColor: "#3B82F6",
    data: {
      invite: { eventName: "TechSummit India 2026", eventType: "conference", primaryColor: "#1E3A5F", secondaryColor: "#F0F9FF", accentColor: "#3B82F6", description: "India's premier technology conference bringing together 500+ tech leaders" },
      contract: {
        venue: "JW Marriott Convention Centre", location: "Bangalore, Karnataka", checkIn: "2026-05-20", checkOut: "2026-05-23",
        rooms: [
          { roomType: "Deluxe Room", rate: 12000, quantity: 100, floor: "4-8", wing: "Tower A" },
          { roomType: "Executive Suite", rate: 22000, quantity: 20, floor: "9-10", wing: "Tower A" },
          { roomType: "Club Room", rate: 18000, quantity: 30, floor: "11-12", wing: "Tower B" },
        ],
        addOns: [
          { name: "Conference Kit & Badge", isIncluded: true, price: 0 },
          { name: "Full Day Catering", isIncluded: true, price: 0 },
          { name: "Airport Pickup (Shared)", isIncluded: false, price: 1500 },
          { name: "Networking Dinner Pass", isIncluded: false, price: 4500 },
        ],
        attritionRules: [
          { releaseDate: "2026-04-20", releasePercent: 40, description: "30 days before: 40% rooms releasable" },
          { releaseDate: "2026-05-10", releasePercent: 20, description: "10 days before: 20% rooms releasable" },
        ],
        confidenceScore: 92,
      }
    }
  },
  {
    id: "itc-grand-chola",
    name: "ITC Grand Chola, Chennai",
    type: "Corporate Retreat",
    icon: "🏢",
    description: "Annual leadership summit",
    color: "#4A1942",
    accentColor: "#C49B66",
    data: {
      invite: { eventName: "Annual Leadership Summit", eventType: "corporate", primaryColor: "#4A1942", secondaryColor: "#FDF8F3", accentColor: "#C49B66", description: "Empowering leaders for the future - Annual offsite & strategy meet" },
      contract: {
        venue: "ITC Grand Chola", location: "Chennai, Tamil Nadu", checkIn: "2026-06-10", checkOut: "2026-06-12",
        rooms: [
          { roomType: "Tower Room", rate: 14000, quantity: 50, floor: "5-10", wing: "Tower" },
          { roomType: "Club Room", rate: 20000, quantity: 25, floor: "11-14", wing: "Tower" },
          { roomType: "Grand Chola Suite", rate: 55000, quantity: 5, floor: "15", wing: "Premier" },
        ],
        addOns: [
          { name: "Executive Boardroom (half day)", isIncluded: true, price: 0 },
          { name: "Business Centre Access", isIncluded: true, price: 0 },
          { name: "Team Dinner at Dakshin", isIncluded: false, price: 3500 },
          { name: "Golf Session", isIncluded: false, price: 7500 },
        ],
        attritionRules: [
          { releaseDate: "2026-05-25", releasePercent: 25, description: "15 days before: 25% rooms releasable" },
        ],
        confidenceScore: 88,
      }
    }
  },
  {
    id: "oberoi-amarvilas",
    name: "Oberoi Amarvilas, Agra",
    type: "Anniversary Celebration",
    icon: "💎",
    description: "Golden anniversary at Taj view",
    color: "#B8860B",
    accentColor: "#FFD700",
    data: {
      invite: { eventName: "Golden Anniversary Celebration", eventType: "anniversary", primaryColor: "#B8860B", secondaryColor: "#FFFEF0", accentColor: "#FFD700", description: "Celebrating 50 glorious years with a view of the Taj Mahal" },
      contract: {
        venue: "The Oberoi Amarvilas", location: "Agra, Uttar Pradesh", checkIn: "2026-03-20", checkOut: "2026-03-22",
        rooms: [
          { roomType: "Premier Room Taj View", rate: 48000, quantity: 15, floor: "1-2", wing: "Main" },
          { roomType: "Luxury Suite Taj View", rate: 85000, quantity: 5, floor: "2", wing: "Suite" },
          { roomType: "Kohinoor Suite", rate: 250000, quantity: 1, floor: "3", wing: "Royal" },
        ],
        addOns: [
          { name: "Champagne Welcome", isIncluded: true, price: 0 },
          { name: "Sunrise Taj Visit", isIncluded: false, price: 5000 },
          { name: "Private Dinner at Bellevue", isIncluded: false, price: 12000 },
          { name: "Couple Spa Treatment", isIncluded: false, price: 15000 },
        ],
        attritionRules: [
          { releaseDate: "2026-03-05", releasePercent: 20, description: "15 days before: 20% rooms releasable" },
        ],
        confidenceScore: 96,
      }
    }
  },
  {
    id: "budget-goa",
    name: "La Calypso Resort, Goa",
    type: "College Reunion",
    icon: "🏖️",
    description: "10-year reunion by the beach",
    color: "#0891B2",
    accentColor: "#06B6D4",
    data: {
      invite: { eventName: "Class of 2016 Reunion", eventType: "event", primaryColor: "#0891B2", secondaryColor: "#F0FDFF", accentColor: "#06B6D4", description: "10 years later - reconnecting by the beach!" },
      contract: {
        venue: "La Calypso Beach Resort", location: "Baga, Goa", checkIn: "2026-12-27", checkOut: "2026-12-30",
        rooms: [
          { roomType: "Standard Room", rate: 4500, quantity: 40, floor: "Ground", wing: "Beach" },
          { roomType: "Sea View Room", rate: 6500, quantity: 20, floor: "1", wing: "Beach" },
          { roomType: "Family Suite", rate: 9000, quantity: 10, floor: "2", wing: "Main" },
        ],
        addOns: [
          { name: "Beach Party Pass", isIncluded: true, price: 0 },
          { name: "Breakfast Buffet", isIncluded: true, price: 0 },
          { name: "Water Sports Package", isIncluded: false, price: 2500 },
          { name: "North Goa Tour", isIncluded: false, price: 1500 },
        ],
        attritionRules: [
          { releaseDate: "2026-12-15", releasePercent: 50, description: "12 days before: 50% rooms releasable" },
        ],
        confidenceScore: 90,
      }
    }
  },
];

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

interface EventService {
  name: string;
  price?: number;
  description?: string;
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
    description?: string;
  };
  contract?: {
    venue?: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
    eventName?: string;
    eventType?: string;
    clientName?: string;
    confidenceScore?: number;
    extractionWarnings?: string[];
    rooms?: RoomBlock[];
    addOns?: AddOn[];
    eventServices?: EventService[];
    attritionRules?: AttritionRule[];
  };
}

// Auto-generate event description from parsed data
function generateEventDescription(data: ParsedEventData): string {
  const eventName = data.invite?.eventName || data.contract?.eventName || "Event";
  const eventType = data.invite?.eventType || data.contract?.eventType || "event";
  const venue = data.contract?.venue || "";
  const location = data.contract?.location || "";
  const checkIn = data.contract?.checkIn;
  const checkOut = data.contract?.checkOut;
  
  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const totalRooms = data.contract?.rooms?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;
  const lowestRate = data.contract?.rooms && data.contract.rooms.length > 0
    ? Math.min(...data.contract.rooms.map(r => r.rate || 0).filter(r => r > 0))
    : 0;
  
  const typeLabels: Record<string, string> = {
    wedding: "a beautiful wedding celebration",
    conference: "an inspiring conference",
    corporate: "an exclusive corporate event",
    birthday: "a memorable birthday celebration",
    anniversary: "a special anniversary celebration",
    seminar: "an engaging seminar",
    gala: "an elegant gala evening",
    event: "an unforgettable event"
  };
  
  const typeDesc = typeLabels[eventType.toLowerCase()] || typeLabels.event;
  
  let desc = `Join us for ${typeDesc}`;
  if (venue && venue !== "Unknown Venue") desc += ` at ${venue}`;
  if (location && location !== "Unknown Location") desc += `, ${location}`;
  desc += ".";
  
  if (nights > 0) {
    desc += ` Experience ${nights} night${nights > 1 ? 's' : ''} of celebration`;
    if (totalRooms > 0 && lowestRate > 0) {
      desc += ` with rooms starting at ₹${lowestRate.toLocaleString('en-IN')}/night`;
    }
    desc += ".";
  }
  
  return desc;
}

// Field-level confidence indicator component
// Shows a colored dot and tooltip based on confidence level
const FieldConfidence = ({ 
  hasValue, 
  isFromOCR = false, 
  fieldName 
}: { 
  hasValue: boolean; 
  isFromOCR?: boolean; 
  fieldName: string;
}) => {
  // Determine confidence: green if has valid value, yellow if OCR-extracted, red if missing
  const confidence = hasValue ? (isFromOCR ? 'medium' : 'high') : 'low';
  
  const colors = {
    high: 'bg-emerald-500',
    medium: 'bg-amber-500', 
    low: 'bg-red-400'
  };
  
  const tooltips = {
    high: `${fieldName}: Extracted with high confidence`,
    medium: `${fieldName}: OCR-extracted, please verify`,
    low: `${fieldName}: Not found, please enter manually`
  };
  
  return (
    <span 
      className={`inline-block w-1.5 h-1.5 rounded-full ${colors[confidence]} ml-1.5`}
      title={tooltips[confidence]}
    />
  );
};

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
  const [processingMessage, setProcessingMessage] = useState("");
  const [contractPreview, setContractPreview] = useState<string | null>(null);
  const [invitePreview, setInvitePreview] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Online status detection
  const isOnline = useOnlineStatus();
  
  // Draft persistence
  const { hasDraft, restoreDraft, clearDraft } = useDraftPersistence(parsedData, setParsedData);

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (restoreDraft()) {
      setStep("review");
      toast({
        title: "Draft Restored",
        description: "Your previous work has been restored. You can continue editing.",
      });
    }
  };
  
  // Load a contract template
  const loadTemplate = (templateId: string) => {
    const template = CONTRACT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setStep("processing");
      setProcessingMessage("Loading template: " + template.name);
      
      // Simulate processing delay for effect
      setTimeout(() => {
        setParsedData(template.data as ParsedEventData);
        setStep("review");
        toast({ 
          title: "Template Loaded", 
          description: `"${template.name}" sample contract loaded successfully.` 
        });
      }, 1500);
    }
    setShowTemplates(false);
  };
  
  // Generate preview URL when file is selected
  const handleContractFile = (file: File | null) => {
    setContractFile(file);
    if (file && file.type.startsWith('image/')) {
      setContractPreview(URL.createObjectURL(file));
    } else {
      setContractPreview(null);
    }
  };
  
  const handleInviteFile = (file: File | null) => {
    setInviteFile(file);
    if (file && (file.type.startsWith('image/') || file.type.includes('png') || file.type.includes('jpg') || file.type.includes('jpeg'))) {
      setInvitePreview(URL.createObjectURL(file));
    } else {
      setInvitePreview(null);
    }
  };

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

  // Helper to update event services
  const updateEventService = (index: number, field: keyof EventService, value: string | number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.eventServices) return prev;
      const eventServices = [...prev.contract.eventServices];
      eventServices[index] = { ...eventServices[index], [field]: value };
      return { ...prev, contract: { ...prev.contract, eventServices } };
    });
  };

  const addEventService = () => {
    setParsedData((prev) => {
      if (!prev) return prev;
      const eventServices = [...(prev.contract?.eventServices || []), { name: "New Service", price: 0, description: "" }];
      return { ...prev, contract: { ...prev.contract, eventServices } };
    });
  };

  const removeEventService = (index: number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.eventServices) return prev;
      const eventServices = prev.contract.eventServices.filter((_, i) => i !== index);
      return { ...prev, contract: { ...prev.contract, eventServices } };
    });
  };

  // Move an add-on to event services
  const moveAddOnToEventService = (index: number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.addOns) return prev;
      const addon = prev.contract.addOns[index];
      const addOns = prev.contract.addOns.filter((_, i) => i !== index);
      const eventServices = [...(prev.contract.eventServices || []), { name: addon.name, price: addon.price || 0, description: "" }];
      return { ...prev, contract: { ...prev.contract, addOns, eventServices } };
    });
  };

  // Move an event service to guest add-ons
  const moveEventServiceToAddOn = (index: number) => {
    setParsedData((prev) => {
      if (!prev?.contract?.eventServices) return prev;
      const service = prev.contract.eventServices[index];
      const eventServices = prev.contract.eventServices.filter((_, i) => i !== index);
      const addOns = [...(prev.contract.addOns || []), { name: service.name, price: service.price || 0, isIncluded: false }];
      return { ...prev, contract: { ...prev.contract, addOns, eventServices } };
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
    
    // Check online status
    if (!navigator.onLine) {
      toast({ title: "You're Offline", description: "Please connect to the internet to parse documents.", variant: "destructive" });
      return;
    }
    
    setStep("processing");
    setError("");

    // Show progressive processing messages
    const messages = [
      "Reading document structure...",
      "Extracting venue and location...",
      "Identifying room blocks and rates...",
      "Parsing check-in/check-out dates...",
      "Detecting theme colors...",
      "Analyzing attrition policies...",
      "Finalizing extraction..."
    ];
    let msgIndex = 0;
    setProcessingMessage(messages[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setProcessingMessage(messages[msgIndex]);
    }, 1200);

    try {
      const formData = new FormData();
      if (contractFile) formData.append("contract", contractFile);
      if (inviteFile) formData.append("invite", inviteFile);

      const res = await fetch("/api/ai/parse", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(msgInterval);

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
    // Check online status first
    if (!navigator.onLine) {
      toast({ title: "You're Offline", description: "Please connect to the internet to publish your event.", variant: "destructive" });
      return;
    }
    
    // Validate data before publishing
    const validation = validateEventData(parsedData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({ 
        title: "Validation Failed", 
        description: `Please fix ${validation.errors.length} issue${validation.errors.length > 1 ? 's' : ''} before publishing.`, 
        variant: "destructive" 
      });
      return;
    }
    setValidationErrors([]);
    
    setStep("processing");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });

      if (!res.ok) throw new Error("Failed to create event");

      const event = await res.json();
      
      // Clear the saved draft on successful publish
      clearDraft();
      
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
          {/* Offline Banner */}
          {!isOnline && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">You're offline</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Connect to the internet to parse documents</p>
              </div>
            </div>
          )}
          
          {/* Draft Restore Banner */}
          {hasDraft && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Resume your work?</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">You have an unsaved event draft</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRestoreDraft} size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                  Restore Draft
                </Button>
                <Button onClick={clearDraft} size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800">
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-5 rounded-xl transition-all ${isDragging ? 'border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) { if (f.size > 10 * 1024 * 1024) { alert("File too large. Max 10MB."); return; } const name = f.name.toLowerCase(); const isInvite = name.includes('invite') || name.includes('invitation') || name.includes('card') || name.includes('wedding') || (!f.type.includes('pdf') && f.type.startsWith('image/')); if (isInvite) { handleInviteFile(f); } else { handleContractFile(f); } } }}
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
                    <div className="flex items-center gap-3">
                      {contractPreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={contractPreview} alt="Contract preview" className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      <div className="text-left">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400 block truncate max-w-[150px]">{contractFile.name}</span>
                        <span className="text-xs text-blue-500 dark:text-blue-500 mt-0.5 block">Click to change file</span>
                      </div>
                    </div>
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
                      handleContractFile(file);
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
                    <div className="flex items-center gap-3">
                      {invitePreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={invitePreview} alt="Invite preview" className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                          <Check className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      )}
                      <div className="text-left">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400 block truncate max-w-[150px]">{inviteFile.name}</span>
                        <span className="text-xs text-purple-500 dark:text-purple-500 mt-0.5 block">Click to change file</span>
                      </div>
                    </div>
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
                      handleInviteFile(file);
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

          {/* Template Library Toggle */}
          <div className="text-center">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 underline underline-offset-4 transition-colors"
            >
              {showTemplates ? 'Hide sample contracts' : 'Or choose from sample contracts →'}
            </button>
          </div>

          {/* Template Library */}
          {showTemplates && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <BookTemplate className="h-3.5 w-3.5" />
                <span>Sample Contract Templates — Click to load instantly</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CONTRACT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className="group text-left p-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 truncate">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {template.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
                            {template.type}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {template.data.contract.rooms.length} room types
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
              {processingMessage || "Extracting room blocks, rates, dates, theme colors, and attrition rules..."}
            </p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-4">
              This usually takes 5-15 seconds depending on document complexity
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === "review" && parsedData && (
        <div className="space-y-5">
          {/* Validation Errors Banner */}
          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                    Please fix the following issues before publishing:
                  </p>
                  <ul className="space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
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

          {/* Extraction Confidence Score */}
          {parsedData.contract?.confidenceScore !== undefined && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              parsedData.contract.confidenceScore >= 80 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40'
                : parsedData.contract.confidenceScore >= 50
                ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40'
                : 'bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${
                  parsedData.contract.confidenceScore >= 80 
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : parsedData.contract.confidenceScore >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {parsedData.contract.confidenceScore}%
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    parsedData.contract.confidenceScore >= 80 
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : parsedData.contract.confidenceScore >= 50
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    Extraction Confidence
                  </p>
                  {parsedData.contract.extractionWarnings && parsedData.contract.extractionWarnings.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                      {parsedData.contract.extractionWarnings.slice(0, 2).join(' • ')}
                      {parsedData.contract.extractionWarnings.length > 2 && ` (+${parsedData.contract.extractionWarnings.length - 2} more)`}
                    </p>
                  )}
                </div>
              </div>
              {parsedData.contract.confidenceScore < 80 && !isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                >
                  <Pencil className="h-3 w-3" /> Review & Fix
                </Button>
              )}
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
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
                    Event Name
                    <FieldConfidence hasValue={!!(parsedData.invite?.eventName || parsedData.contract?.eventName)} fieldName="Event Name" />
                  </label>
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
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
                    Type
                    <FieldConfidence hasValue={!!(parsedData.invite?.eventType || parsedData.contract?.eventType)} fieldName="Event Type" />
                  </label>
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
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
                    Venue
                    <FieldConfidence hasValue={!!parsedData.contract?.venue} isFromOCR={true} fieldName="Venue" />
                  </label>
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
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
                    Location
                    <FieldConfidence hasValue={!!parsedData.contract?.location} isFromOCR={true} fieldName="Location" />
                  </label>
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
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
                    Check-in
                    <FieldConfidence hasValue={!!parsedData.contract?.checkIn} isFromOCR={true} fieldName="Check-in Date" />
                  </label>
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
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
                    Check-out
                    <FieldConfidence hasValue={!!parsedData.contract?.checkOut} isFromOCR={true} fieldName="Check-out Date" />
                  </label>
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
              
              {/* Event Description */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Event Description</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const autoDesc = generateEventDescription(parsedData);
                        setParsedData((prev) => prev ? { 
                          ...prev, 
                          invite: { ...prev.invite, description: autoDesc } 
                        } : prev);
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-generate
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    className="w-full text-sm text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none"
                    rows={3}
                    placeholder="Describe your event for guests..."
                    value={parsedData.invite?.description || ""}
                    onChange={(e) => updateInvite("description", e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-zinc-300">
                    {parsedData.invite?.description || <span className="text-gray-300 italic">No description - click Edit to add one</span>}
                  </p>
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

          {/* Guest Add-Ons Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-800/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Guest Add-Ons</CardTitle>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Guests can select & pay</p>
                  </div>
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
                        <button
                          onClick={() => moveAddOnToEventService(i)}
                          className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors shrink-0"
                          title="Move to Event Services"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
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

          {/* Event Services Card (Organizer Pays) */}
          {((parsedData.contract?.eventServices && parsedData.contract.eventServices.length > 0) || isEditing) && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b border-purple-100 dark:border-purple-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Event Services</CardTitle>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Paid by event organizer</p>
                    </div>
                  </div>
                  {isEditing && (
                    <Button onClick={addEventService} variant="outline" size="sm" className="gap-1 h-7 text-xs">
                      <Plus className="h-3 w-3" /> Add Service
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {parsedData.contract?.eventServices?.map((service, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-800/50 hover:bg-gray-100/70 dark:hover:bg-zinc-700/50 transition-colors gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => moveEventServiceToAddOn(i)}
                            className="p-1 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors shrink-0"
                            title="Move to Guest Add-Ons"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <input
                            className="flex-1 min-w-0 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                            value={service.name}
                            onChange={(e) => updateEventService(i, "name", e.target.value)}
                            placeholder="Service name"
                          />
                          <input
                            type="number"
                            className="w-24 text-sm text-right text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                            value={service.price || 0}
                            onChange={(e) => updateEventService(i, "price", parseInt(e.target.value) || 0)}
                            placeholder="Price"
                          />
                          <button
                            onClick={() => removeEventService(i)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                            title="Remove service"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{service.name}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">₹{service.price?.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  ))}
                  {(!parsedData.contract?.eventServices || parsedData.contract.eventServices.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-2">No event services extracted. Click "Add Service" to add.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
