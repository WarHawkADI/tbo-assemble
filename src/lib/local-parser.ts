/**
 * Local Document Parser — No OpenAI Required
 *
 * Extracts structured hotel contract data from PDFs using pdf-parse + regex.
 * Extracts dominant colors from images using sharp.
 * Validates documents before parsing — refuses irrelevant uploads.
 */

import type { ParsedContract, ParsedInvite } from "./ai";

// ─── PDF Text Extraction ──────────────────────────────────────────────────────

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Import the internal module directly to avoid pdf-parse's index.js self-test
  // which tries to read test/data/05-versions-space.pdf and fails in bundled environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
  const data = await pdfParse(buffer);
  return data.text || "";
}

// ─── Validation ───────────────────────────────────────────────────────────────

const CONTRACT_KEYWORDS = [
  // Venue/property
  "hotel",
  "resort",
  "palace",
  "inn",
  "lodge",
  "retreat",
  "accommodation",
  "property",
  // Booking terms
  "room",
  "rate",
  "tariff",
  "per night",
  "check-in",
  "check-out",
  "checkout",
  "checkin",
  "booking",
  "reservation",
  "occupancy",
  "block",
  "allocation",
  "inventory",
  // Financial
  "price",
  "cost",
  "total",
  "payment",
  "deposit",
  "advance",
  "invoice",
  "gst",
  "tax",
  // Room types
  "deluxe",
  "suite",
  "standard",
  "premium",
  "executive",
  "royal",
  "presidential",
  "superior",
  "villa",
  "cottage",
  "twin",
  "double",
  "single",
  // Services
  "guest",
  "night",
  "stay",
  "arrival",
  "departure",
  "amenities",
  "breakfast",
  "transfer",
  "spa",
  "wifi",
  "laundry",
  // Event
  "conference",
  "banquet",
  "ballroom",
  "venue",
  "event",
  "wedding",
  "mice",
  "group",
  // Contract language
  "agreement",
  "contract",
  "terms",
  "conditions",
  "policy",
  "clause",
  // Attrition
  "attrition",
  "cancellation",
  "penalty",
  "release",
  "deadline",
  "complimentary",
  "included",
  "inclusions",
];

const INVITE_KEYWORDS = [
  "wedding",
  "ceremony",
  "celebration",
  "invite",
  "invitation",
  "cordially",
  "pleasure",
  "honour",
  "honor",
  "request",
  "presence",
  "reception",
  "rsvp",
  "marriage",
  "engagement",
  "anniversary",
  "conference",
  "summit",
  "seminar",
  "workshop",
  "launch",
  "gala",
  "dinner",
  "cocktail",
  "event",
  "offsite",
  "retreat",
  "meetup",
  "reunion",
  "party",
  "festival",
  "concert",
  "date",
  "venue",
  "time",
  "join",
  "attend",
  "save the date",
  "together",
  "family",
  "friends",
  "guest",
];

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  matchedKeywords: string[];
  error?: string;
}

export function validateContractText(text: string): ValidationResult {
  if (!text || text.trim().length < 30) {
    return {
      isValid: false,
      confidence: 0,
      matchedKeywords: [],
      error:
        "Could not extract readable text from this file. If this is a scanned document or image, please upload a text-based PDF instead.",
    };
  }

  const lower = text.toLowerCase();
  const matched = CONTRACT_KEYWORDS.filter((kw) => lower.includes(kw));
  const confidence = matched.length / CONTRACT_KEYWORDS.length;

  if (matched.length < 4) {
    return {
      isValid: false,
      confidence,
      matchedKeywords: matched,
      error:
        matched.length === 0
          ? "This document does not appear to be a hotel contract. No hotel, booking, or accommodation-related terms were found. Please upload a valid hotel group booking contract."
          : `This document has very few hotel/booking-related terms (found: ${matched.join(", ")}). It does not appear to be a hotel contract. Please upload a valid hotel group booking contract.`,
    };
  }

  return { isValid: true, confidence, matchedKeywords: matched };
}

export function validateInviteText(text: string): ValidationResult {
  if (!text || text.trim().length < 10) {
    return {
      isValid: false,
      confidence: 0,
      matchedKeywords: [],
      error:
        "Could not extract readable text from this file.",
    };
  }

  const lower = text.toLowerCase();
  const matched = INVITE_KEYWORDS.filter((kw) => lower.includes(kw));
  const confidence = matched.length / INVITE_KEYWORDS.length;

  if (matched.length < 2) {
    return {
      isValid: false,
      confidence,
      matchedKeywords: matched,
      error:
        "This document does not appear to be an event invitation. No event-related terms were found. Please upload a valid wedding invitation, conference flyer, or event document.",
    };
  }

  return { isValid: true, confidence, matchedKeywords: matched };
}

// ─── Contract Data Extraction (Regex-based) ───────────────────────────────────

/**
 * Extract a venue/hotel name from text.
 * Looks for patterns like "Hotel Grand Hyatt", "The Taj Palace", etc.
 */
function extractVenue(text: string): string {
  // Look for full property name patterns like "Grand Hyatt Resort & Spa" or "Taj Lake Palace"
  // Use [^\S\n]+ instead of \s+ to avoid matching across newlines
  const fullNamePatterns = [
    // "Grand Hyatt Resort\n& Spa" — allow ONE line break before "&"
    /(?:The[^\S\n]+)?([A-Z][A-Za-z]+(?:[^\S\n]+(?:[A-Z&][A-Za-z]*|the|of|de|le|la)){1,8}(?:[^\S\n]*(?:Hotel|Resort|Palace|Inn|Lodge|Retreat|Spa|Suites|Mansion|Manor))(?:\s*&\s*[A-Za-z]+)?)/g,
    /(?:property|venue|hotel)\s*[:–—-]\s*([^\n]{5,80})/gi,
  ];

  const candidates: string[] = [];
  for (const pattern of fullNamePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim().replace(/[,.]$/, "");
      // Skip if it looks like a file path or URL
      if (name.includes("/") || name.includes("\\") || name.includes("http")) continue;
      if (name.length < 5) continue;
      const cleaned = name.replace(/\s*\n\s*/g, ' ').trim();
      if (cleaned.length < 5) continue;
      candidates.push(cleaned);
    }
  }

  // Return the longest candidate (most complete name)
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.length - a.length)[0].substring(0, 100);
  }

  return "";
}

/**
 * Extract location / city from text.
 */
function extractLocation(text: string): string {
  const labelPatterns = [
    /(?:location|city|address|place)\s*[:–—-]\s*(.+)/i,
    /(?:in|at)\s+([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?(?:,\s*[A-Z][a-z]+)?)/,
  ];

  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/[.]$/, "").substring(0, 80);
    }
  }

  // Indian cities
  const cities = [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Bangalore",
    "Chennai",
    "Hyderabad",
    "Kolkata",
    "Pune",
    "Jaipur",
    "Udaipur",
    "Goa",
    "Shimla",
    "Agra",
    "Lucknow",
    "Ahmedabad",
    "Kochi",
    "Thiruvananthapuram",
    "Chandigarh",
    "Manali",
    "Rishikesh",
    "Varanasi",
    "Jodhpur",
    "Mussoorie",
    "Darjeeling",
    "Ooty",
    "Coorg",
    "Munnar",
    "Amritsar",
    "Bhopal",
    "Indore",
    "Nagpur",
    "Surat",
    "Rajasthan",
    "Kerala",
    "Gujarat",
    "Maharashtra",
    "Karnataka",
    "Tamil Nadu",
    "Dubai",
    "Singapore",
    "Bangkok",
    "London",
    "New York",
    "Paris",
    "Bali",
    "Maldives",
    "Sri Lanka",
    "Mauritius",
    "Thailand",
  ];

  for (const city of cities) {
    const idx = text.indexOf(city);
    if (idx !== -1) {
      // Try to get state/country after it
      const after = text.substring(idx, idx + 50);
      const withState = after.match(
        new RegExp(`(${city}(?:,\\s*[A-Za-z\\s]+)?)`)
      );
      if (withState?.[1]) {
        return withState[1]
          .trim()
          .replace(/[.]$/, "")
          .substring(0, 80);
      }
      return city;
    }
  }

  return "";
}

/** Extract dates from text. Returns [checkIn, checkOut] as YYYY-MM-DD strings. */
function extractDates(text: string): [string, string] {
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  const parsed: string[] = [];

  // Pattern: April 10, 2026 / 10 April 2026 / Apr 10, 2026
  const longDatePattern =
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/gi;
  const longDatePattern2 =
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/gi;

  let m;
  while ((m = longDatePattern.exec(text)) !== null) {
    const day = m[1].padStart(2, "0");
    const month = months[m[2].toLowerCase()];
    const year = m[3];
    if (month) parsed.push(`${year}-${month}-${day}`);
  }
  while ((m = longDatePattern2.exec(text)) !== null) {
    const month = months[m[1].toLowerCase()];
    const day = m[2].padStart(2, "0");
    const year = m[3];
    if (month) parsed.push(`${year}-${month}-${day}`);
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const numericPattern = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g;
  while ((m = numericPattern.exec(text)) !== null) {
    const a = parseInt(m[1]);
    const b = parseInt(m[2]);
    const year = m[3];
    // Heuristic: if first number > 12, it's DD/MM. Otherwise ambiguous, assume DD/MM (Indian format)
    if (a <= 31 && b <= 12) {
      parsed.push(`${year}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`);
    } else if (b <= 31 && a <= 12) {
      parsed.push(`${year}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`);
    }
  }

  // Pattern: YYYY-MM-DD (ISO)
  const isoPattern = /(\d{4})-(\d{2})-(\d{2})/g;
  while ((m = isoPattern.exec(text)) !== null) {
    const candidate = `${m[1]}-${m[2]}-${m[3]}`;
    if (!parsed.includes(candidate)) parsed.push(candidate);
  }

  // Deduplicate and sort
  const unique = [...new Set(parsed)].sort();

  // Try to find dates specifically labeled as check-in / check-out
  const lower = text.toLowerCase();
  let checkIn = "";
  let checkOut = "";

  // Look for labeled dates: "CHECK-IN DATE\nApril 10, 2026"
  const checkInMatch = lower.match(
    /(?:check[\s-]*in|arrival|start)\s*(?:date)?\s*[:–—-]?\s*(?:\n\s*)?([a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}-\d{2}-\d{2})/i
  );
  if (checkInMatch) {
    checkIn = normalizeDateString(checkInMatch[1].trim());
  }

  const checkOutMatch = lower.match(
    /(?:check[\s-]*out|departure|end)\s*(?:date)?\s*[:–—-]?\s*(?:\n\s*)?([a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}-\d{2}-\d{2})/i
  );
  if (checkOutMatch) {
    checkOut = normalizeDateString(checkOutMatch[1].trim());
  }

  if (checkIn && checkOut) return [checkIn, checkOut];
  if (checkIn && !checkOut && unique.length > 0) {
    // Use the latest date that's after checkIn as checkOut
    const later = unique.filter(d => d > checkIn);
    return [checkIn, later.length > 0 ? later[later.length - 1] : unique[unique.length - 1]];
  }

  // Fallback: use first and last dates, but skip dates that look like issue/contract dates
  // (usually the earliest date is the contract issue date, so prefer the 2nd and last)
  if (unique.length >= 3) {
    // Heuristic: skip earliest date(s) which are likely document metadata
    return [unique[unique.length - 2], unique[unique.length - 1]];
  } else if (unique.length >= 2) {
    return [unique[0], unique[unique.length - 1]];
  } else if (unique.length === 1) {
    const d = new Date(unique[0]);
    d.setDate(d.getDate() + 3);
    return [unique[0], d.toISOString().split("T")[0]];
  }

  return ["", ""];
}

/** Extract room types with rates and quantities from text. */
function extractRooms(
  text: string
): ParsedContract["rooms"] {
  const rooms: ParsedContract["rooms"] = [];

  // Compound room type names only — no bare words like "Deluxe" or "Suite" that would cause duplicates
  const roomTypeWords = [
    "Deluxe Room",
    "Standard Room",
    "Premium Suite",
    "Executive Suite",
    "Royal Suite",
    "Presidential Suite",
    "Superior Room",
    "Family Room",
    "Family Suite",
    "Luxury Suite",
    "Luxury Room",
    "Classic Room",
    "Junior Suite",
    "Grand Suite",
    "Honeymoon Suite",
    "Penthouse Suite",
    "Penthouse",
    "Villa",
    "Cottage",
    "Studio Room",
    "Studio",
    "Twin Room",
    "Double Room",
    "Single Room",
    "King Room",
    "Queen Room",
    "Club Room",
    "Garden Room",
    "Pool Villa",
    "Ocean Suite",
    "Lake View Room",
  ];

  const lower = text.toLowerCase();

  for (const roomType of roomTypeWords) {
    const roomLower = roomType.toLowerCase();
    const idx = lower.indexOf(roomLower);
    if (idx === -1) continue;

    // Already found this type? Skip
    if (rooms.some((r) => r.roomType.toLowerCase() === roomLower)) continue;

    // Get surrounding context (500 chars after the room type mention)
    const context = text.substring(idx, idx + 500);

    // Extract rate — look for ₹ or Rs or INR or $ followed by number
    let rate = 0;
    const rateMatch = context.match(/[₹$]\s*([\d,]+)/);
    if (rateMatch) {
      rate = parseInt(rateMatch[1].replace(/,/g, ""));
    } else {
      const rateMatch2 = context.match(
        /(?:rs\.?|inr|usd|rate|tariff|price)\s*:?\s*([\d,]+)/i
      );
      if (rateMatch2) {
        rate = parseInt(rateMatch2[1].replace(/,/g, ""));
      }
    }

    // Extract quantity
    let quantity = 0;
    const qtyMatch = context.match(
      /(?:qty|quantity|rooms?|units?|nos?\.?|count|block)\s*:?\s*(\d+)/i
    );
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
    } else {
      // Look for patterns like "30 rooms" or "x 15"
      const qtyMatch2 = context.match(/(\d+)\s*(?:rooms?|units?|nos?)/i);
      if (qtyMatch2) {
        quantity = parseInt(qtyMatch2[1]);
      }
    }

    // Extract floor
    let floor = "";
    const floorMatch = context.match(
      /(?:floor|level)\s*:?\s*([A-Za-z0-9\-–]+)/i
    );
    if (floorMatch) floor = floorMatch[1];

    // Extract wing
    let wing = "";
    const wingMatch = context.match(
      /(?:wing|tower|block|building)\s*:?\s*([A-Za-z\s]+?)(?:\s*[,.\n|]|$)/i
    );
    if (wingMatch) wing = wingMatch[1].trim();

    // Extract hotel name (for multi-property contracts)
    let hotelName = "";
    const hotelMatch = context.match(
      /(?:at|hotel|property)\s*:?\s*([A-Z][A-Za-z\s&']+(?:Hotel|Resort|Palace|Spa|Suites)?)/
    );
    if (hotelMatch) hotelName = hotelMatch[1].trim();

    rooms.push({
      roomType,
      rate: rate || 0,
      quantity: quantity || 1,
      floor: floor || undefined,
      wing: wing || undefined,
      hotelName: hotelName || undefined,
    });
  }

  // If no specific room types found, try generic row-based extraction
  // Pattern: something | ₹XX,XXX | XX rooms
  if (rooms.length === 0) {
    const rowPattern =
      /([A-Za-z][A-Za-z\s]+?)\s*(?:[|│┃,]|(?:[-–]\s*))\s*[₹$Rs.]?\s*([\d,]+)\s*(?:per\s*night|\/night|\/n)?\s*(?:[|│┃,]|(?:[-–]\s*))\s*(\d+)\s*(?:rooms?|units?|nos?)?/gi;
    let rowMatch;
    while ((rowMatch = rowPattern.exec(text)) !== null) {
      const name = rowMatch[1].trim();
      const rate = parseInt(rowMatch[2].replace(/,/g, ""));
      const qty = parseInt(rowMatch[3]);
      if (name.length > 2 && rate > 100 && qty > 0 && qty < 1000) {
        rooms.push({ roomType: name, rate, quantity: qty });
      }
    }
  }

  return rooms;
}

/** Extract add-ons and inclusions from text. */
function extractAddOns(
  text: string
): ParsedContract["addOns"] {
  const addOns: ParsedContract["addOns"] = [];
  const seen = new Set<string>();

  // Common add-on/inclusion keywords to search for
  const addOnPatterns = [
    { pattern: /airport\s*(?:pickup|transfer|drop|shuttle)/i, name: "Airport Transfer" },
    { pattern: /welcome\s*(?:dinner|drink|cocktail|reception)/i, name: "Welcome Dinner" },
    { pattern: /(?:mehendi|mehndi|henna)\s*(?:ceremony)?/i, name: "Mehendi Ceremony" },
    { pattern: /gala\s*(?:night|dinner|event)/i, name: "Gala Night" },
    { pattern: /spa\s*(?:package|treatment|session|credit)/i, name: "Spa Package" },
    { pattern: /breakfast/i, name: "Breakfast" },
    { pattern: /(?:wi-?fi|internet|wifi)/i, name: "Wi-Fi" },
    { pattern: /(?:gym|fitness)\s*(?:access)?/i, name: "Gym Access" },
    { pattern: /(?:pool|swimming)\s*(?:access)?/i, name: "Pool Access" },
    { pattern: /laundry/i, name: "Laundry Service" },
    { pattern: /parking/i, name: "Parking" },
    { pattern: /(?:city|sight-?seeing)\s*(?:tour)?/i, name: "City Tour" },
    { pattern: /photography/i, name: "Photography" },
    { pattern: /(?:dj|music|entertainment)/i, name: "Entertainment" },
    { pattern: /decoration/i, name: "Decoration" },
    { pattern: /catering/i, name: "Catering" },
    { pattern: /(?:mini-?bar|minibar)/i, name: "Mini Bar" },
    { pattern: /(?:room\s*service)/i, name: "Room Service" },
    { pattern: /(?:concierge)/i, name: "Concierge" },
    { pattern: /(?:babysitting|childcare|kids\s*club)/i, name: "Childcare" },
    { pattern: /(?:boat|yacht|cruise)\s*(?:ride|trip)?/i, name: "Boat Trip" },
    { pattern: /(?:sangeet|sangeeth)/i, name: "Sangeet Ceremony" },
    { pattern: /(?:haldi)/i, name: "Haldi Ceremony" },
    { pattern: /(?:cocktail)\s*(?:party|night|event)?/i, name: "Cocktail Party" },
  ];

  const lower = text.toLowerCase();

  for (const { pattern, name } of addOnPatterns) {
    const match = lower.match(pattern);
    if (match && !seen.has(name)) {
      seen.add(name);

      // Determine if complimentary or paid — use TIGHT context (only the line containing the match)
      const idx = lower.indexOf(match[0]);
      // Find the line boundaries around this match
      const lineStart = Math.max(0, lower.lastIndexOf('\n', idx));
      const lineEnd = lower.indexOf('\n', idx + match[0].length);
      const lineContext = lower.substring(lineStart, lineEnd > -1 ? lineEnd : idx + 200);

      const isIncluded =
        /complimentary|✓\s*complimentary|included|free|no\s*charge|inclusive|gratis|at no cost/i.test(
          lineContext
        ) && !/\d{3,}/.test(lineContext.replace(match[0], '')); // Not included if there's a price on the same line

      // Try to find a price
      let price = 0;
      if (!isIncluded) {
        const priceMatch = lineContext.match(
          /[₹$]\s*([\d,]+)|(?:rs\.?|inr)\s*([\d,]+)/i
        );
        if (priceMatch) {
          price = parseInt(
            (priceMatch[1] || priceMatch[2]).replace(/,/g, "")
          );
        }
      }

      addOns.push({ name, price: isIncluded ? 0 : price, isIncluded });
    }
  }

  return addOns;
}

/** Extract attrition/cancellation rules from text. */
function extractAttritionRules(
  text: string
): ParsedContract["attritionRules"] {
  const rules: ParsedContract["attritionRules"] = [];

  // Look for the attrition/release section
  const attritionIdx = text.toLowerCase().search(/attrition|release\s*schedule|cancellation\s*policy/);
  const searchText = attritionIdx >= 0 ? text.substring(attritionIdx) : text;

  // Pattern 1: "March 10, 2026 30% Release" — date followed by percentage (our demo format)
  const dateThenPercent =
    /((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})\s*(?:[^\n]*?)(\d+)\s*%\s*(?:release|cancel)/gi;
  let m;
  while ((m = dateThenPercent.exec(searchText)) !== null) {
    const dateStr = m[1];
    const percent = parseInt(m[2]);
    // Get the next line as description
    const afterMatch = searchText.substring(m.index + m[0].length, m.index + m[0].length + 200);
    const descLine = afterMatch.match(/[^\n]*(?:release|cancel|unsold|rooms|inventory|prior|check)[^\n]*/i);
    rules.push({
      releaseDate: normalizeDateString(dateStr),
      releasePercent: percent,
      description: descLine ? descLine[0].trim().substring(0, 200) : `Release ${percent}% of rooms`,
    });
  }

  // Pattern 2: "30% ... March 10, 2026" — percentage followed by date
  if (rules.length === 0) {
    const percentThenDate =
      /(\d+)\s*%\s*(?:.*?)((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})/gi;
    while ((m = percentThenDate.exec(searchText)) !== null) {
      rules.push({
        releaseDate: normalizeDateString(m[2]),
        releasePercent: parseInt(m[1]),
        description: m[0].trim().substring(0, 200),
      });
    }
  }

  // Pattern 3: "X days before" patterns
  if (rules.length === 0) {
    const daysBeforePattern =
      /(\d+)\s*days?\s*(?:before|prior|ahead).*?(\d+)\s*%/gi;
    while ((m = daysBeforePattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[2]),
        description: `Release ${parseInt(m[2])}% of rooms ${parseInt(m[1])} days prior to check-in`,
      });
    }
  }

  return rules;
}

/** Try to normalize various date string formats to YYYY-MM-DD */
function normalizeDateString(dateStr: string): string {
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  // ISO format
  const iso = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  // Month name formats
  const named = dateStr.match(
    /(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})/i
  );
  if (named) {
    return `${named[3]}-${months[named[2].toLowerCase()]}-${named[1].padStart(2, "0")}`;
  }

  const named2 = dateStr.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s*(\d{1,2}),?\s*(\d{4})/i
  );
  if (named2) {
    return `${named2[3]}-${months[named2[1].toLowerCase()]}-${named2[2].padStart(2, "0")}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const numeric = dateStr.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (numeric) {
    const a = parseInt(numeric[1]);
    const b = parseInt(numeric[2]);
    if (a <= 31 && b <= 12) {
      return `${numeric[3]}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    }
  }

  return dateStr;
}

// ─── Event Invitation Parsing ─────────────────────────────────────────────────

const EVENT_TYPES = [
  { pattern: /wedding|marriage|shaadi|vivah|nikah/i, type: "wedding" },
  { pattern: /conference|summit|seminar|symposium/i, type: "conference" },
  { pattern: /corporate|offsite|retreat|team.?building/i, type: "corporate" },
  { pattern: /product\s*launch|launch\s*event/i, type: "product-launch" },
  { pattern: /gala|dinner|cocktail|reception/i, type: "gala" },
  { pattern: /reunion|get.?together|meetup/i, type: "reunion" },
  { pattern: /engagement|ring\s*ceremony|roka|sagai/i, type: "engagement" },
  { pattern: /birthday|bday/i, type: "birthday" },
  { pattern: /anniversary/i, type: "anniversary" },
];

function detectEventType(text: string): string {
  for (const { pattern, type } of EVENT_TYPES) {
    if (pattern.test(text)) return type;
  }
  return "event";
}

function extractEventName(text: string, eventType: string): string {
  // Try explicit patterns
  const namePatterns = [
    /(?:event|function|ceremony)\s*(?:name)?\s*[:–—-]\s*(.+)/i,
    /(?:the\s+)?([A-Z][a-z]+(?:\s*[-&]\s*[A-Z][a-z]+)?\s+(?:Wedding|Marriage|Conference|Summit|Gala|Celebration|Ceremony|Reception|Launch|Reunion))/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().substring(0, 100);
  }

  // For weddings, try to find two family names
  if (eventType === "wedding") {
    // Pattern: "Sharma & Patel" or "Sharma-Patel" or "Rajeev weds Priya"
    const familyPattern = text.match(
      /([A-Z][a-z]+)\s*(?:&|and|-|weds|❤)\s*([A-Z][a-z]+)/
    );
    if (familyPattern) {
      return `The ${familyPattern[1]}-${familyPattern[2]} Wedding`;
    }
  }

  // Fallback: use first significant capitalized phrase
  const titleMatch = text.match(/^([A-Z][A-Za-z\s&'\-]{5,60})$/m);
  if (titleMatch) return titleMatch[1].trim();

  return "";
}

// ─── Color Extraction from Images ─────────────────────────────────────────────

export async function extractColorsFromImage(
  buffer: Buffer
): Promise<{ primary: string; secondary: string; accent: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const { dominant } = await sharp(buffer).stats();

    // Dominant color
    const primary = rgbToHex(dominant.r, dominant.g, dominant.b);

    // Generate harmonious secondary and accent
    // Secondary: lighter version
    const secondary = rgbToHex(
      Math.min(255, dominant.r + 100),
      Math.min(255, dominant.g + 100),
      Math.min(255, dominant.b + 100)
    );

    // Accent: complementary-ish shift
    const accent = rgbToHex(
      Math.min(255, Math.abs(dominant.r - 40) + 80),
      Math.min(255, Math.abs(dominant.g - 20) + 60),
      Math.min(255, Math.abs(dominant.b + 30))
    );

    return { primary, secondary, accent };
  } catch (error) {
    console.error("Color extraction error:", error);
    return { primary: "#4F46E5", secondary: "#EEF2FF", accent: "#818CF8" };
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ─── Main Parse Functions ─────────────────────────────────────────────────────

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validation?: ValidationResult;
}

/**
 * Parse a hotel contract from a PDF buffer.
 * Returns structured data or a validation error.
 */
export async function parseContractLocally(
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult<ParsedContract>> {
  // Only PDFs can be text-parsed locally
  if (!mimeType.includes("pdf")) {
    return {
      success: false,
      error:
        "Contract parsing requires a text-based PDF file. Please upload a PDF version of the hotel contract for best results.",
    };
  }

  let text: string;
  try {
    text = await extractTextFromPDF(buffer);
  } catch (err) {
    console.error("PDF extraction error:", err);
    return {
      success: false,
      error:
        "Failed to extract text from this PDF. The file may be corrupted, password-protected, or contain only scanned images.",
    };
  }

  // Validate content
  const validation = validateContractText(text);
  if (!validation.isValid) {
    return { success: false, error: validation.error, validation };
  }

  // Extract structured data
  const venue = extractVenue(text);
  const location = extractLocation(text);
  const [checkIn, checkOut] = extractDates(text);
  const rooms = extractRooms(text);
  const addOns = extractAddOns(text);
  const attritionRules = extractAttritionRules(text);

  const data: ParsedContract = {
    venue: venue || "Unknown Venue",
    location: location || "Unknown Location",
    checkIn: checkIn || "",
    checkOut: checkOut || "",
    rooms: rooms.length > 0 ? rooms : [{ roomType: "Standard Room", rate: 0, quantity: 1 }],
    addOns,
    attritionRules,
  };

  return { success: true, data, validation };
}

/**
 * Parse an event invitation from a PDF buffer or image buffer.
 * Returns structured data or a validation error.
 */
export async function parseInviteLocally(
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult<ParsedInvite>> {
  let text = "";
  let colors = { primary: "#4F46E5", secondary: "#EEF2FF", accent: "#818CF8" };

  if (mimeType.includes("pdf")) {
    // Extract text from PDF
    try {
      text = await extractTextFromPDF(buffer);
    } catch (err) {
      console.error("PDF invite extraction error:", err);
      return {
        success: false,
        error: "Failed to extract text from this PDF.",
      };
    }

    // Validate
    const validation = validateInviteText(text);
    if (!validation.isValid) {
      return { success: false, error: validation.error, validation };
    }
  } else if (
    mimeType.includes("image") ||
    mimeType.includes("png") ||
    mimeType.includes("jpg") ||
    mimeType.includes("jpeg") ||
    mimeType.includes("webp")
  ) {
    // Extract colors from image
    colors = await extractColorsFromImage(buffer);
    // We can't extract text from images without OCR
    // Return with extracted colors but minimal text info
  } else {
    return {
      success: false,
      error: `Unsupported file type: ${mimeType}. Please upload a PDF or image file.`,
    };
  }

  // Detect event type and name from text
  const eventType = text ? detectEventType(text) : "event";
  const eventName = text ? extractEventName(text, eventType) : "";

  // If text available, try to extract colors
  if (text) {
    // First check for hex codes
    const hexColors = text.match(/#[0-9A-Fa-f]{6}/g);
    if (hexColors && hexColors.length >= 1) colors.primary = hexColors[0];
    if (hexColors && hexColors.length >= 2) colors.secondary = hexColors[1];
    if (hexColors && hexColors.length >= 3) colors.accent = hexColors[2];

    // If no hex codes, look for named colors in the text
    if (!hexColors || hexColors.length === 0) {
      const namedColorMap: Record<string, string> = {
        "rose gold": "#B76E79",
        "navy blue": "#001F5B",
        "royal blue": "#2E3B8C",
        "sky blue": "#87CEEB",
        "baby blue": "#89CFF0",
        "teal": "#008080",
        "turquoise": "#40E0D0",
        "maroon": "#800000",
        "burgundy": "#800020",
        "crimson": "#DC143C",
        "scarlet": "#FF2400",
        "ivory": "#FFFFF0",
        "cream": "#FFFDD0",
        "champagne": "#F7E7CE",
        "gold": "#D4AF37",
        "golden": "#DAA520",
        "silver": "#C0C0C0",
        "copper": "#B87333",
        "bronze": "#CD7F32",
        "blush": "#DE5D83",
        "peach": "#FFCBA4",
        "coral": "#FF7F50",
        "salmon": "#FA8072",
        "mauve": "#E0B0FF",
        "lavender": "#E6E6FA",
        "lilac": "#C8A2C8",
        "plum": "#8E4585",
        "purple": "#800080",
        "wine": "#722F37",
        "sage": "#B2AC88",
        "mint": "#98FB98",
        "emerald": "#50C878",
        "forest green": "#228B22",
        "olive": "#808000",
        "charcoal": "#36454F",
        "slate": "#708090",
        "dusty rose": "#DCAE96",
        "magenta": "#FF00FF",
        "fuchsia": "#FF00FF",
        "white": "#FFFFFF",
        "black": "#000000",
        "red": "#FF0000",
        "blue": "#0000FF",
        "green": "#008000",
        "pink": "#FFC0CB",
        "orange": "#FFA500",
        "yellow": "#FFD700",
      };

      const textLower = text.toLowerCase();
      const foundColors: string[] = [];

      // Sort by key length descending so "rose gold" matches before "gold"
      const sortedNames = Object.keys(namedColorMap).sort(
        (a, b) => b.length - a.length
      );
      for (const name of sortedNames) {
        if (textLower.includes(name) && foundColors.length < 3) {
          foundColors.push(namedColorMap[name]);
        }
      }
      if (foundColors.length >= 1) colors.primary = foundColors[0];
      if (foundColors.length >= 2) colors.secondary = foundColors[1];
      if (foundColors.length >= 3) colors.accent = foundColors[2];
    }
  }

  // If we got colors from image but no text, still return success with colors
  const data: ParsedInvite = {
    eventName: eventName || "",
    eventType: eventType || "event",
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    description: text
      ? `Event details extracted from uploaded document.`
      : "Colors extracted from uploaded image. Please enter event name and type manually.",
  };

  return { success: true, data };
}
