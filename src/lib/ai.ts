/**
 * AI / Parsing Interfaces & Demo Data
 *
 * The actual parsing logic lives in ./local-parser.ts (regex + pdf-parse, no API key needed).
 * This file exports shared TypeScript interfaces and the demo/fallback data.
 */

export interface ParsedContract {
  // ── Core ────────────────────────────────────────────────────────────────────
  venue: string;
  location: string;
  checkIn: string;
  checkOut: string;
  eventName: string;
  eventType: string;
  clientName: string;

  // ── Extraction confidence (0-100) ────────────────────────────────────────────
  confidenceScore?: number;
  extractionWarnings?: string[];

  // ── Contract metadata ────────────────────────────────────────────────────────
  contractNo?: string;
  issueDate?: string;
  validUntil?: string;
  groupCode?: string;
  gstin?: string;

  // ── Headcount & duration ──────────────────────────────────────────────────────
  expectedGuests?: number;
  nights?: number;

  // ── Financial ────────────────────────────────────────────────────────────────
  totalAmount?: number;
  currency?: string;
  taxInfo?: string;
  paymentTerms?: string;

  // ── Contacts ─────────────────────────────────────────────────────────────────
  hotelContact?: { name?: string; phone?: string; email?: string };
  agentContact?: { name?: string; phone?: string; email?: string };
  signatories?: string[];

  // ── Policies ─────────────────────────────────────────────────────────────────
  earlyCheckIn?: string;
  lateCheckOut?: string;

  // ── Structured arrays ────────────────────────────────────────────────────────
  rooms: {
    roomType: string;
    rate: number;
    quantity: number;
    floor?: string;
    wing?: string;
    hotelName?: string;
  }[];
  /** Guest-level add-ons that individual guests can select and pay for */
  addOns: {
    name: string;
    price: number;
    isIncluded: boolean;
  }[];
  /** Event-level services paid by the organizer (banquet, catering, AV, etc.) */
  eventServices: {
    name: string;
    price: number;
    description?: string;
  }[];
  attritionRules: {
    releaseDate: string;
    releasePercent: number;
    description: string;
  }[];
}

export interface ParsedInvite {
  eventName: string;
  eventType: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  // Optional enriched fields extracted from the invite document
  venue?: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  agentContact?: { name?: string; phone?: string; email?: string };
}

export function getDemoContractData(): ParsedContract {
  return {
    venue: "JW Marriott Mussoorie Walnut Grove",
    location: "Mussoorie, Uttarakhand",
    checkIn: "2026-06-15",
    checkOut: "2026-06-18",
    eventName: "Infosys Annual Leadership Summit 2026",
    eventType: "conference",
    clientName: "Infosys Limited",
    rooms: [
      { roomType: "Superior Room", rate: 9500, quantity: 60, floor: "1-3", wing: "Valley View", hotelName: "JW Marriott Mussoorie Walnut Grove" },
      { roomType: "Executive Suite", rate: 18000, quantity: 20, floor: "4-5", wing: "Mountain View", hotelName: "JW Marriott Mussoorie Walnut Grove" },
      { roomType: "Presidential Suite", rate: 55000, quantity: 5, floor: "6", wing: "Penthouse Level", hotelName: "JW Marriott Mussoorie Walnut Grove" },
    ],
    addOns: [
      { name: "Airport Transfer (Dehradun)", price: 2500, isIncluded: false },
      { name: "Executive Lunch Box", price: 0, isIncluded: true },
      { name: "High-Speed Wi-Fi Premium", price: 0, isIncluded: true },
      { name: "Spa & Wellness Session", price: 4000, isIncluded: false },
      { name: "Adventure Activity Package", price: 3500, isIncluded: false },
    ],
    eventServices: [
      { name: "Conference Hall Rental", price: 180000, description: "Grand Ballroom - 3 days" },
      { name: "Full Board Catering", price: 320000, description: "Breakfast, lunch, dinner for 85 attendees" },
      { name: "Audio/Visual & Staging", price: 95000, description: "Projectors, mic systems, LED screens, podium" },
      { name: "Team Building Facilitation", price: 65000, description: "Outdoor activities and workshop coordination" },
    ],
    attritionRules: [
      { releaseDate: "2026-05-15", releasePercent: 25, description: "Release 25% of unsold rooms 30 days prior" },
      { releaseDate: "2026-06-01", releasePercent: 50, description: "Release 50% of remaining unsold rooms 14 days prior" },
      { releaseDate: "2026-06-08", releasePercent: 100, description: "Release all unsold rooms 7 days prior" },
    ],
  };
}

export function getDemoInviteData(): ParsedInvite {
  return {
    eventName: "Infosys Annual Leadership Summit 2026",
    eventType: "conference",
    primaryColor: "#007CC3",
    secondaryColor: "#F0F8FF",
    accentColor: "#00A76F",
    description:
      "Join us for the annual Infosys Leadership Summit 2026, a three-day strategic offsite at JW Marriott Mussoorie, bringing together top executives to shape the future of digital transformation.",
  };
}
