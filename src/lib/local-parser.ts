/**
 * Local Document Parser — No OpenAI Required
 *
 * Multi-strategy text extraction:
 *   1. pdf-parse for text-based PDFs (fast, handles 90% of cases)
 *   2. JPEG stream extraction + tesseract.js OCR for scanned PDFs
 *   3. Direct tesseract.js OCR for uploaded images (PNG/JPEG/WebP)
 *
 * Extraction pipeline:
 *   1. Normalize extracted text (whitespace, broken lines, PDF artifacts)
 *   2. Extract labeled key:value fields ("Hotel Name: Grand Horizon Hotel")
 *   3. Parse tabular data (services, room blocks, charges)
 *   4. Regex-based extraction for venue, location, dates, rooms, add-ons, attrition
 *
 * Designed to handle messy real-world PDFs: broken table formatting,
 * inconsistent whitespace, multi-line fields, and varied naming conventions.
 */

import type { ParsedContract, ParsedInvite } from "./ai";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
  jan: "01", feb: "02", mar: "03", apr: "04",
  jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/** Extract text from a text-based PDF using pdf-parse. */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Import the internal module directly to avoid pdf-parse's index.js self-test
  // which tries to read test/data/05-versions-space.pdf and fails in bundled environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    buf: Buffer
  ) => Promise<{ text: string; numpages: number }>;
  const data = await pdfParse(buffer);
  return data.text || "";
}

/**
 * Normalize messy PDF-extracted text by collapsing whitespace runs,
 * fixing broken lines, and removing common PDF artifacts.
 */
function normalizeText(raw: string): string {
  let text = raw
    // Replace form-feed / vertical-tab / page-break markers
    .replace(/[\f\v]/g, "\n")
    // Collapse multiple spaces/tabs into a single space (preserve newlines)
    .replace(/[^\S\n]+/g, " ")
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n")
    // Trim each line
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();

  // Insert spaces between letters and numbers to separate merged tokens
  text = text.replace(/([A-Za-z])(?=\d)/g, "$1 ");
  text = text.replace(/(\d)(?=[A-Za-z])/g, "$1 ");

  // Collapse spaced-out decorative text: "D A T E" → "DATE", "V E N U E" → "VENUE"
  // Detects runs of single characters separated by single spaces (3+ chars)
  text = text.replace(
    /\b([A-Za-z])( [A-Za-z]){2,}\b/g,
    (match) => match.replace(/ /g, "")
  );


  return text;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OCR SUPPORT (for scanned PDFs and image uploads)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract JPEG image buffers embedded in a PDF binary.
 * Scanned PDFs typically wrap JPEG images in PDF stream objects.
 * Searches for JPEG SOI (FFD8) and EOI (FFD9) markers in the raw bytes.
 */
function extractJPEGsFromPDFBuffer(buffer: Buffer): Buffer[] {
  const jpegs: Buffer[] = [];
  const SOI = Buffer.from([0xff, 0xd8]); // JPEG Start Of Image
  const EOI = Buffer.from([0xff, 0xd9]); // JPEG End Of Image

  let searchFrom = 0;
  while (searchFrom < buffer.length - 2) {
    const soiIdx = buffer.indexOf(SOI, searchFrom);
    if (soiIdx === -1) break;

    const eoiIdx = buffer.indexOf(EOI, soiIdx + 2);
    if (eoiIdx === -1) break;

    const jpegEnd = eoiIdx + 2;
    const jpegBuf = buffer.subarray(soiIdx, jpegEnd);

    // Only keep images > 10KB (skip thumbnails, icons, artifacts)
    if (jpegBuf.length > 10240) {
      jpegs.push(Buffer.from(jpegBuf));
    }

    searchFrom = jpegEnd;
  }

  return jpegs;
}

/**
 * Perform OCR on an image buffer using tesseract.js.
 * Preprocesses the image with sharp for better recognition.
 */
async function performOCR(imageBuffer: Buffer): Promise<string> {
  try {
    // Preprocess with sharp: grayscale + normalize + sharpen for better OCR
    let processedBuffer = imageBuffer;
    try {
      const sharp = (await import("sharp")).default;
      processedBuffer = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch {
      // If sharp preprocessing fails, use raw buffer
    }

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(processedBuffer);
    await worker.terminate();
    return text || "";
  } catch (err) {
    console.error("OCR error:", err);
    return "";
  }
}

/**
 * Extract text from a PDF with OCR fallback.
 * Tries pdf-parse first. If too little text is extracted (<50 chars),
 * attempts to OCR embedded JPEG images from the PDF.
 */
export async function extractTextWithOCRFallback(
  buffer: Buffer
): Promise<{ text: string; usedOCR: boolean }> {
  let text = "";

  // Strategy 1: pdf-parse (fast, handles text PDFs)
  // Some corrupted PDFs (bad XRef entries) fail on first parse but succeed on retry
  // after pdfjs-dist caches internal recovery data, so we attempt up to 2 tries.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      text = await extractTextFromPDF(buffer);
      break; // success
    } catch {
      // pdf-parse failed, retry once then fall through to OCR
    }
  }

  const normalizedText = normalizeText(text);

  // If we got reasonable text, use it
  if (normalizedText.length >= 50) {
    return { text: normalizedText, usedOCR: false };
  }

  // Strategy 2: Extract embedded JPEGs and OCR them
  const jpegs = extractJPEGsFromPDFBuffer(buffer);
  if (jpegs.length > 0) {
    const ocrTexts: string[] = [];
    // OCR up to 10 pages to avoid excessive processing
    for (const jpeg of jpegs.slice(0, 10)) {
      const ocrText = await performOCR(jpeg);
      if (ocrText.trim().length > 10) {
        ocrTexts.push(ocrText);
      }
    }
    if (ocrTexts.length > 0) {
      return { text: normalizeText(ocrTexts.join("\n\n")), usedOCR: true };
    }
  }

  // Return whatever we got from pdf-parse, even if minimal
  return { text: normalizedText, usedOCR: false };
}

/**
 * Perform OCR on a direct image upload (PNG/JPEG/WebP).
 */
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  return performOCR(buffer);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONTRACT_KEYWORDS = [
  // Venue/property
  "hotel", "resort", "palace", "inn", "lodge", "retreat", "accommodation", "property",
  // Booking terms
  "room", "rate", "tariff", "per night", "check-in", "check-out", "checkout", "checkin",
  "booking", "reservation", "occupancy", "block", "allocation", "inventory",
  // Financial
  "price", "cost", "total", "payment", "deposit", "advance", "invoice", "gst", "tax",
  "amount", "charge", "fee", "billing", "receipt",
  // Room types
  "deluxe", "suite", "standard", "premium", "executive", "royal", "presidential",
  "superior", "villa", "cottage", "twin", "double", "single",
  // Services
  "guest", "night", "stay", "arrival", "departure", "amenities", "breakfast",
  "transfer", "spa", "wifi", "laundry", "catering", "banquet",
  // Event
  "conference", "ballroom", "venue", "event", "wedding", "mice", "group",
  "corporate", "gala", "function",
  // Contract language
  "agreement", "contract", "terms", "conditions", "policy", "clause",
  "authorized", "signature", "signed", "client",
  // Attrition
  "attrition", "cancellation", "penalty", "release", "deadline",
  "complimentary", "included", "inclusions",
];

const INVITE_KEYWORDS = [
  "wedding", "ceremony", "celebration", "invite", "invitation",
  "cordially", "pleasure", "honour", "honor", "request", "presence",
  "reception", "rsvp", "marriage", "engagement", "anniversary",
  "conference", "summit", "seminar", "workshop", "launch", "gala",
  "dinner", "cocktail", "event", "offsite", "retreat", "meetup",
  "reunion", "party", "festival", "concert", "date", "venue", "time",
  "join", "attend", "save the date", "together", "family", "friends", "guest",
];

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  matchedKeywords: string[];
  error?: string;
}

export function validateContractText(text: string): ValidationResult {
  if (!text || text.trim().length < 20) {
    return {
      isValid: false,
      confidence: 0,
      matchedKeywords: [],
      error:
        "Could not extract readable text from this file. The file may be corrupted, password-protected, or contain only scanned images with no recognizable text.",
    };
  }

  const lower = text.toLowerCase();
  const matched = CONTRACT_KEYWORDS.filter((kw) => lower.includes(kw));
  const confidence = matched.length / CONTRACT_KEYWORDS.length;

  if (matched.length < 2) {
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
      error: "Could not extract readable text from this file.",
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

// ═══════════════════════════════════════════════════════════════════════════════
// LABELED FIELD EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract key:value pairs from structured text.
 * Handles formats like:
 *   "Hotel Name: Grand Horizon Hotel"
 *   "Hotel Name:\n Grand Horizon Hotel"
 *   "Address: 123 Ocean Drive, Mumbai, India"
 *
 * Returns a map of lowercase field names to their values.
 */
function extractLabeledFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};

  // Known header labels that appear WITHOUT a colon (common in HTML-to-PDF)
  const knownHeaderPattern =
    /^(?:event\s*name|event\s*type|check[\s-]*in\s*date|check[\s-]*out\s*date|arrival\s*date|departure\s*date|hotel\s*name|property\s*name|venue\s*name|venue|address|location|city|expected\s*guests?|client\s*name|company\s*name|duration|contract\s*(?:no|number)|date\s*of\s*issue|valid\s*until|coordinating\s*agent|phone|email|contact|description)$/i;

  // Normalize known header keys to standard names the downstream functions expect
  const normalizeHeaderKey = (key: string): string => {
    const k = key.toLowerCase().replace(/\s+/g, " ").trim();
    // "check-in date" / "check in date" → "check-in"
    if (/^check[\s-]*in\s*date$/.test(k)) return "check-in";
    if (/^check[\s-]*out\s*date$/.test(k)) return "check-out";
    if (/^arrival\s*date$/.test(k)) return "arrival";
    if (/^departure\s*date$/.test(k)) return "departure";
    return k;
  };

  // Process line-by-line to avoid cross-line matching issues
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Pattern 1: Match "Key: Value" — key is letters/spaces, colon, then value
    const match = line.match(/^([A-Za-z][A-Za-z\s/&()\-]{0,40}?)\s*[:–—]\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (key.length >= 2 && value.length >= 1 && value.length <= 200) {
        if (!fields[key]) {
          fields[key] = value;
        }
      }
    } else {
      // Pattern 2: Match "Key:" on this line, value on next line
      const keyOnly = line.match(/^([A-Za-z][A-Za-z\s/&()\-]{0,40}?)\s*[:–—]\s*$/);
      if (keyOnly && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.length >= 1 && nextLine.length <= 200) {
          const key = keyOnly[1].trim().toLowerCase();
          if (key.length >= 2 && !fields[key]) {
            fields[key] = nextLine;
          }
        }
      }
    }
  }

  // Pattern 3: Known headers WITHOUT colons ("EVENT NAME\nValue", "CHECK-IN DATE\nValue")
  // Common in HTML-to-PDF contracts and styled documents
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (knownHeaderPattern.test(line)) {
      const key = normalizeHeaderKey(line);
      if (!fields[key]) {
        const value = lines[i + 1].trim();
        // Value must exist, be reasonable length, and not itself be a known header
        if (
          value.length >= 1 &&
          value.length <= 200 &&
          !knownHeaderPattern.test(value)
        ) {
          fields[key] = value;
        }
      }
    }
  }

  return fields;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE PARSING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

interface TableRow {
  description: string;
  numbers: number[];
  rawLine: string;
}

/**
 * Parse tabular data from text.
 * Detects table sections by header keywords and extracts rows with
 * description + numbers. Handles space-separated, pipe-separated,
 * and tab-separated columns.
 *
 * Returns parsed rows with a description field and an array of numbers.
 */
export function parseTableRows(text: string): TableRow[] {
  const rows: TableRow[] = [];
  const lines = text.split("\n");

  // Find table header line indices — match lines containing column names
  const headerPattern =
    /(?:description|item|particular|service|room\s*type|category|accommodation)\s+.*?(?:qty|quantity|rate|amount|total|price|charge|cost|number|count|no\.?\s*of)/i;

  // Alternative: a line with 2+ of these keywords
  const altHeaderWords = ["description", "quantity", "rate", "amount", "total", "price", "charge", "qty", "unit"];

  let inTable = false;
  let blankLineCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect start of table
    if (!inTable) {
      // Primary header detection
      if (headerPattern.test(line)) {
        inTable = true;
        blankLineCount = 0;
        continue;
      }
      // Alternative: line contains 2+ header words
      const lowerLine = line.toLowerCase();
      const headerWordCount = altHeaderWords.filter((w) => lowerLine.includes(w)).length;
      if (headerWordCount >= 2) {
        inTable = true;
        blankLineCount = 0;
        continue;
      }
      continue;
    }

    // Detect end of table
    if (line.length === 0) {
      blankLineCount++;
      if (blankLineCount >= 2) {
        inTable = false;
      }
      continue;
    }
    blankLineCount = 0;

    // Stop if we hit a new section header or non-table content
    if (
      /^(?:terms|conditions|notes|signatures?|authorized|disclaimer|important|policy|clause|payment\s*terms)/i.test(
        line
      )
    ) {
      inTable = false;
      continue;
    }

    // Stop table at percentage-based statements (these are terms, not table data)
    // e.g. "50% advance payment required", "Cancellation within 30 days..."
    if (/^\d+\s*%\s*(?:advance|deposit|payment|cancellation|penalty|charge|fee)/i.test(line)) {
      inTable = false;
      continue;
    }
    if (/^(?:cancellation|cancel|no[- ]?show|force\s*majeure)/i.test(line)) {
      inTable = false;
      continue;
    }

    // Skip divider lines (----, ====, etc.)
    if (/^[-=_|+\s•]{3,}$/.test(line)) continue;

    // Try to parse this line as a table row
    // Pre-process: replace parenthetical descriptors like "(150 pax)" or "(incl. taxes)" with a
    // placeholder so their internal numbers don't get tokenized as column data.
    // We keep track of actual positions by working on a sanitized copy.
    const sanitizedLine = line.replace(/\(\s*\d+\s+[A-Za-z][A-Za-z .]+\)/g, (m) =>
      " ".repeat(m.length)
    );
    // Extract all number tokens from the sanitized line (numbers with optional commas and decimals)
    // Only match numbers preceded by whitespace/start-of-token (not letters or commas to avoid
    // mid-word or mid-number matches).
    let numberTokens = [...sanitizedLine.matchAll(/(?<![A-Za-z,])([\d,]+(?:\.\d{1,2})?)(?!\S|[A-Za-z])/g)];

    // Also try extracting numbers that are separated by at least one space from text
    // This handles "Deluxe Rooms 20 5,000 100,000"
    if (numberTokens.length === 0) continue;

    // Handle concatenated numbers like "1150,000150,000" or "205,000100,000"
    // (PDF table columns merged without space).
    // Strategy: try every possible split point where the suffix matches two comma-formatted numbers.
    // Prefer the split where qty × rate ≈ total (strongest signal for correct split).
    if (numberTokens.length === 1) {
      const rawNum = numberTokens[0][1]; // e.g., "1150,000150,000" or "205,000100,000"
      let bestQty = 0, bestRate = 0, bestTotal = 0, bestScore = -1, found = false;
      // Try all prefixes of length 1..5 as qty
      for (let qtyLen = 1; qtyLen <= 5 && qtyLen < rawNum.length - 6; qtyLen++) {
        const qtyStr = rawNum.substring(0, qtyLen);
        const rest = rawNum.substring(qtyLen);
        if (qtyStr.startsWith("0")) continue; // no leading zeros in qty
        // rest must match two comma-number groups
        const m = rest.match(/^(\d{1,4}(?:,\d{3})+)(\d{1,4}(?:,\d{3})+)$/);
        if (m) {
          const qty = parseInt(qtyStr);
          const rate = parseInt(m[1].replace(/,/g, ""));
          const total = parseInt(m[2].replace(/,/g, ""));
          if (qty > 0 && rate > 0 && total > 0) {
            // Score: perfect match = qty * rate === total
            const score = qty * rate === total ? 2 : (Math.abs(qty * rate - total) / total < 0.5 ? 1 : 0);
            if (score > bestScore) {
              bestScore = score; bestQty = qty; bestRate = rate; bestTotal = total; found = true;
            }
          }
        }
      }
      if (found) {
        numberTokens = [
          { 1: String(bestQty), index: numberTokens[0].index } as unknown as RegExpExecArray,
          { 1: String(bestRate), index: numberTokens[0].index! + 1 } as unknown as RegExpExecArray,
          { 1: String(bestTotal), index: numberTokens[0].index! + 2 } as unknown as RegExpExecArray,
        ];
      } else {
        // Pattern B: two large comma-formatted numbers only (no qty column)
        const concatB = rawNum.match(/^(\d{1,4}(?:,\d{3})+)(\d{1,4}(?:,\d{3})+)$/);
        if (concatB) {
          const n1 = parseInt(concatB[1].replace(/,/g, ""));
          const n2 = parseInt(concatB[2].replace(/,/g, ""));
          if (n1 > 0 && n2 > 0) {
            numberTokens = [
              { 1: String(n1), index: numberTokens[0].index } as unknown as RegExpExecArray,
              { 1: String(n2), index: numberTokens[0].index! + 1 } as unknown as RegExpExecArray,
            ];
          }
        }
      }
    }



    // Find where the first number starts
    const firstNumIdx = numberTokens[0].index!;
    let description = line.substring(0, firstNumIdx).trim();

    // Clean up description (remove trailing pipes, dashes, etc.)
    description = description.replace(/[|│┃\-–—]+$/, "").trim();

    // Skip rows with no meaningful description text
    if (description.length < 2) continue;

    // Filter out numbers that are part of the description (e.g., phone numbers, year references)
    const numbers = numberTokens
      .map((m) => parseFloat(m[1].replace(/,/g, "")))
      .filter((n) => n > 0);

    // Stop table at "Total Amount" rows — everything after is terms/conditions
    const isTotal = /^(?:total|sub\s*total|grand\s*total|net\s*total|gross\s*total)/i.test(
      description
    );

    if (isTotal) {
      inTable = false;
      continue;
    }

    // Only include rows with 2+ numbers (qty + rate at minimum) as real table data
    // Single-number rows in a table context are likely noise
    if (numbers.length >= 2) {
      rows.push({ description, numbers, rawLine: line });
    }
  }

  // ── Fallback: scan for ANY lines with format "Text Number Number Number" ──
  // Even without a header, extract lines that look like table rows
  if (rows.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 5) continue;

      // Match lines that start with text and end with 2+ numbers
      const tableRowMatch = trimmed.match(
        /^([A-Za-z][A-Za-z\s/&()\-]{2,60}?)\s+([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s*$/
      );
      if (tableRowMatch) {
        const desc = tableRowMatch[1].trim();
        const nums = [
          parseFloat(tableRowMatch[2].replace(/,/g, "")),
          parseFloat(tableRowMatch[3].replace(/,/g, "")),
          parseFloat(tableRowMatch[4].replace(/,/g, "")),
        ];
        if (!(/^(?:total|sub\s*total|grand\s*total)$/i.test(desc))) {
          rows.push({ description: desc, numbers: nums, rawLine: trimmed });
        }
      }

      // Also match "Text Number Number" (2 numbers)
      if (rows.length === 0) {
        const twoNumMatch = trimmed.match(
          /^([A-Za-z][A-Za-z\s/&()\-]{2,60}?)\s+([\d,]+(?:\.\d{1,2})?)\s+([\d,]+(?:\.\d{1,2})?)\s*$/
        );
        if (twoNumMatch) {
          const desc = twoNumMatch[1].trim();
          const nums = [
            parseFloat(twoNumMatch[2].replace(/,/g, "")),
            parseFloat(twoNumMatch[3].replace(/,/g, "")),
          ];
          if (!(/^(?:total|sub\s*total|grand\s*total)$/i.test(desc))) {
            rows.push({ description: desc, numbers: nums, rawLine: trimmed });
          }
        }
      }
    }
  }

  return rows;
}

/**
 * Interpret a table row's numbers based on expected column structure.
 * For hotel contracts, common column orders are:
 *   [qty, rate, total] or [rate, qty, total] or [qty, rate] or [rate, total]
 *
 * Heuristic: The largest number is likely the total (qty * rate).
 * A small number (<500) is likely the quantity.
 */
function interpretTableRow(numbers: number[]): { rate: number; quantity: number } {
  if (numbers.length === 0) return { rate: 0, quantity: 1 };

  if (numbers.length === 1) {
    // Single number: could be rate or total
    return { rate: numbers[0], quantity: 1 };
  }

  if (numbers.length === 2) {
    // Two numbers: [qty, rate] or [rate, total]
    const [a, b] = numbers;
    if (a < 500 && b >= 500) {
      // Guard against "205,000100,000" → [205, 100000] where "205" is really qty=20 + rate-prefix=5
      // If a > 100, is NOT a round number (a%10 != 0), and b is divisible by floor(a/10):
      if (a > 100 && a % 10 !== 0) {
        const likelyQty = Math.floor(a / 10);
        if (likelyQty >= 2 && b % likelyQty === 0) {
          const likelyRate = b / likelyQty;
          if (likelyRate >= 500 && likelyRate < b) {
            return { rate: likelyRate, quantity: likelyQty };
          }
        }
      }
      return { rate: b, quantity: a };
    }
    if (b < 500 && a >= 500) {
      return { rate: a, quantity: b };
    }
    // Both large — first is rate, second is total
    return { rate: a, quantity: 1 };
  }

  // 3+ numbers: typically [qty, rate, total]
  // Find likely quantity (smallest number, typically < 500)
  // Find likely total (largest number)
  // Rate = total / quantity, or the column between qty and total

  const sorted = [...numbers].sort((a, b) => a - b);
  const smallest = sorted[0];
  const largest = sorted[sorted.length - 1];

  // If smallest is < 500, it's likely the quantity
  if (smallest < 500 && smallest > 0) {
    // Rate is the number that when multiplied by qty ≈ total
    const expectedRate = largest / smallest;
    // Find the number closest to expectedRate
    const rateCandidate = numbers.find(
      (n) =>
        n !== smallest &&
        n !== largest &&
        Math.abs(n - expectedRate) / Math.max(expectedRate, 1) < 0.15
    );
    if (rateCandidate) {
      return { rate: rateCandidate, quantity: smallest };
    }
    // Otherwise, the middle number is the rate
    const middleNumbers = numbers.filter(
      (n) => n !== smallest && n !== largest
    );
    if (middleNumbers.length > 0) {
      return { rate: middleNumbers[0], quantity: smallest };
    }
    return { rate: largest, quantity: smallest };
  }

  // All numbers are large — first is likely rate
  return { rate: numbers[0], quantity: 1 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT DATA EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract a venue/hotel name from text.
 * Multi-strategy: labeled fields → contract preamble → pattern matching → proximity search.
 */
function extractVenue(
  text: string,
  fields: Record<string, string>
): string {
  const candidates: string[] = [];

  // Strategy 1: Labeled fields (highest confidence)
  const venueFieldKeys = [
    "hotel name", "property name", "venue name", "hotel", "property", "venue",
    "name of hotel", "name of the hotel", "name of property", "name of venue",
    "hotel/resort name", "resort name",
  ];
  for (const key of venueFieldKeys) {
    if (fields[key] && fields[key].length >= 3) {
      candidates.push(fields[key]);
    }
  }

  // Strategy 1b: Extend labeled-field venue names with next-line hotel suffixes.
  // Handles multi-line venue names like:
  //   "The Grand Hyatt"    (labeled field value)
  //   "Resort & Spa"       (continuation on next line)
  // → "The Grand Hyatt Resort & Spa"
  const hotelSuffixPattern =
    /(?:Hotel|Resort|Palace|Inn|Lodge|Retreat|Spa|Suites|Mansion|Manor|Club|Tower|Centre|Center|Plaza|Residency|Regency|Continental|International)(?:\s*&\s*[A-Za-z]+)?$/i;
  for (let i = 0; i < candidates.length; i++) {
    const name = candidates[i];
    if (hotelSuffixPattern.test(name)) continue; // already ends with hotel word
    const idx = text.indexOf(name);
    if (idx !== -1) {
      const afterName = text.substring(idx + name.length, idx + name.length + 100);
      const nextLineMatch = afterName.match(/^\s*\n\s*([^\n]{3,60})/);
      if (nextLineMatch) {
        const nextLine = nextLineMatch[1].trim();
        if (hotelSuffixPattern.test(nextLine)) {
          candidates[i] = `${name} ${nextLine}`.trim();
        }
      }
    }
  }

  // Strategy 2: Regex on labeled text patterns (in case extractLabeledFields missed some)
  const labelPatterns = [
    /(?:property\s*name|hotel\s*name|venue\s*name|name\s*of\s*(?:the\s*)?(?:hotel|property|venue))\s*[:–—-]\s*\n?\s*([^\n]{3,80})/gi,
    /(?:property|venue)\s*[:–—-]\s*\n?\s*([^\n]{3,80})/gi,
  ];
  for (const pattern of labelPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim().replace(/[,.]$/, "");
      if (name.length >= 3 && !name.includes("http")) candidates.push(name);
    }
  }

  // Strategy 3: "Between [Party A] and [Hotel Name]" — common contract opening
  const betweenMatch = text.match(
    /between\s+.{3,80}?\s+and\s+([A-Z][A-Za-z\s&']+?(?:Hotel|Resort|Palace|Inn|Lodge|Retreat|Spa|Suites|Mansion|Manor|Club|Tower|Centre|Center|Plaza|Residency|Regency|Continental|International)(?:\s*&\s*[A-Za-z]+)?)/i
  );
  if (betweenMatch?.[1]) {
    candidates.push(betweenMatch[1].trim());
  }

  // Strategy 4: Full property name patterns — capitalized words ending with hotel-type word
  const fullNamePatterns = [
    /(?:The[^\S\n]+)?([A-Z][A-Za-z']+(?:[^\S\n]+(?:[A-Z&][A-Za-z']*|the|of|de|le|la|at|by)){0,8}[^\S\n]+(?:Hotel|Resort|Palace|Inn|Lodge|Retreat|Spa|Suites|Mansion|Manor|Club|Tower|Centre|Center|Plaza|Residency|Regency|Continental|International)(?:\s*&\s*[A-Za-z]+)?)/g,
    // Branded chains
    /(?:The\s+)?((?:Taj|Oberoi|ITC|Marriott|Hilton|Hyatt|Radisson|Sheraton|Westin|JW|Ritz|Four\s*Seasons|Le\s*Meridien|Novotel|Accor|Crowne\s*Plaza|Holiday\s*Inn|Best\s*Western|Fairmont|Leela|Lalit|Trident|Vivanta|Park\s*Hyatt|Grand\s*Hyatt|Sofitel|Pullman|Mandarin|Peninsula|Shangri|Kempinski|St\.?\s*Regis)\s*[A-Za-z\s&']{0,60})/gi,
  ];
  for (const pattern of fullNamePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let name = match[1]
        .trim()
        .replace(/[,.]$/, "")
        .replace(/\s*\n\s*/g, " ")
        .trim();
      // Trim branded chain captures at common non-name words to prevent
      // "Taj Lake Palace rooms are subject to..." → "Taj Lake Palace"
      name = name
        .replace(
          /\s+(?:rooms?|is|are|was|were|has|have|had|will|would|shall|should|may|can|could|must|also|subject|under|provides?|offers?|includes?|features?|situated|located|near|with|from|this|that|which|where|when|being|been|for\s+(?:the|a)|at\s+(?:the|a)|of\s+(?:the|a))\b.*/i,
          ""
        )
        .trim();
      if (
        name.length >= 3 &&
        !name.includes("/") &&
        !name.includes("\\") &&
        !name.includes("http")
      ) {
        candidates.push(name);
      }
    }
  }

  // Strategy 5: Capitalized multi-word phrase near "hotel", "resort", etc.
  const hotelWords = [
    "hotel", "resort", "palace", "inn", "lodge", "retreat", "spa",
  ];
  const lower = text.toLowerCase();
  for (const hw of hotelWords) {
    let searchFrom = 0;
    let idx: number;
    while ((idx = lower.indexOf(hw, searchFrom)) !== -1) {
      searchFrom = idx + hw.length;
      const start = Math.max(0, idx - 80);
      const end = Math.min(text.length, idx + hw.length + 80);
      const window = text.substring(start, end);
      const capPhrase = window.match(
        /([A-Z][A-Za-z']+(?:[^\S\n]+(?:[A-Z&][A-Za-z']*|the|of|de|le|by|at)){1,6})/
      );
      if (capPhrase && capPhrase[1].length >= 5) {
        // Strip leading label words that get captured from PDF text
        const cleaned = capPhrase[1].trim()
          .replace(/^(?:VENUE|HOTEL|PROPERTY|RESORT|ADDRESS|LOCATION|NAME|EVENT|DATE|TYPE|CATEGORY)\s+/i, "")
          .trim();
        if (cleaned.length >= 5) candidates.push(cleaned);
      }
    }
  }

  if (candidates.length === 0) return "";

  // Deduplicate and rank candidates
  const unique = [...new Set(candidates.map((c) => c.replace(/\s+/g, " ")))];

  // Score each candidate: prefer names with hotel-type suffixes, moderate length,
  // and penalize very long generic captures
  const hotelSuffixes = /(?:Hotel|Resort|Palace|Inn|Lodge|Retreat|Spa|Suites|Mansion|Manor|Club|Tower|Centre|Center|Plaza|Residency|Regency)$/i;
  const scored = unique.map((name) => {
    let score = 0;
    // Ends with a hotel-type word → highest priority
    if (hotelSuffixes.test(name)) score += 50;
    // Contains a branded chain name → boost
    if (/Taj|Oberoi|ITC|Marriott|Hilton|Hyatt|Radisson|Sheraton|Westin|JW|Ritz|Four\s*Seasons|Le\s*Meridien|Leela|Lalit|Trident|Vivanta|Sofitel|Pullman|Kempinski|St\.?\s*Regis/i.test(name)) score += 30;
    // Reasonable length (10-60 chars) → good name
    if (name.length >= 10 && name.length <= 60) score += 20;
    // Very short (<10) → might be incomplete
    if (name.length < 10) score += 5;
    // Very long (>60) → likely over-captured
    if (name.length > 60) score -= 10;
    // From labeled fields (appears first in candidates) → boost
    if (candidates.indexOf(name) < 3) score += 10;
    return { name, score };
  });
  scored.sort((a, b) => b.score - a.score || b.name.length - a.name.length);
  return scored[0].name.substring(0, 100);
}

/**
 * Extract location / city from text.
 * Uses labeled fields, address patterns, "in/at City", and known city names.
 */
function extractLocation(
  text: string,
  fields: Record<string, string>
): string {
  /** Clean a raw location string: strip email addresses, URLs, and trailing OCR noise fragments */
  const cleanLocation = (raw: string): string => {
    return raw
      // Remove email addresses
      .replace(/\s*\S+@\S+\.\S+/g, "")
      // Remove URLs
      .replace(/\s*https?:\/\/\S+/gi, "")
      // Remove "Email:" / "Phone:" / "Contact:" labels and everything after
      .replace(/\s*(?:email|phone|tel|fax|contact|website|web)\s*[:]\s*.*/gi, "")
      // Remove trailing short OCR noise fragments (1-2 char junk at end)
      .replace(/\s+[a-zA-Z]{1,2}$/, "")
      .trim()
      .substring(0, 120);
  };

  // Strategy 1: Labeled fields – but skip bare street-number addresses that look
  // like a guest's home address rather than a venue location.
  // A "bare street address" has a leading number followed by a street name with no
  // comma-separated city/state component (e.g. "456 Maple Street" or "123 Oak Ave").
  const isBareStreetAddress = (s: string): boolean => {
    // Must start with a digit, have only one segment (no comma separating city), and
    // not contain any known city indicators.
    return /^\d+\s+[A-Za-z]/.test(s) && !s.includes(",") && s.split(" ").length <= 4;
  };

  /**
   * If the string looks like a full street address ("123 Street, City, Country"),
   * extract just the city portion (second-to-last comma segment, trimmed).
   */
  const extractCityFromAddress = (s: string): string | null => {
    if (!/^\d+\s+/.test(s)) return null; // must start with street number
    const parts = s.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length < 2) return null;
    // City is typically the second part (index 1), or second-to-last before country
    const cityCandidate = parts.length >= 3 ? parts[parts.length - 2] : parts[1];
    // Should be a plain word or two (not a street: no digits, reasonable length)
    if (/^\d/.test(cityCandidate) || cityCandidate.length > 40) return null;
    return cityCandidate;
  };

  const locationFieldKeys = [
    "hotel address", "venue address", "property address",
    "location", "city", "place", "situated at", "located at",
    "address",   // lowest priority – skip if it looks like a personal street address
  ];
  for (const key of locationFieldKeys) {
    if (fields[key] && fields[key].length >= 3) {
      const clean = cleanLocation(fields[key]);
      // Skip plain street addresses (e.g. "456 Maple Street") – no city component
      if ((key === "address" || key === "location") && isBareStreetAddress(clean)) {
        continue;
      }
      // If address is a full street address ("123 Blvd, City, Country"), extract just the city
      const cityFromAddr = extractCityFromAddress(clean);
      if (cityFromAddr) return cityFromAddr;
      return clean;
    }
  }

  // Strategy 2: Regex on labeled text
  const labelPatterns = [
    /(?:address|location|city|place|situated\s*(?:at|in)|located\s*(?:at|in))\s*[:–—-]\s*\n?\s*([^\n]{5,120})/i,
  ];
  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = cleanLocation(match[1].trim().replace(/[.]$/, ""));
      // If address is a full street address, extract just the city
      const cityFromAddr2 = extractCityFromAddress(candidate);
      if (cityFromAddr2) return cityFromAddr2;
      // Skip plain street addresses (e.g. "456 Maple Street") – no city component
      if (!isBareStreetAddress(candidate)) return candidate;
    }
  }
  // Strategy 3: "in [City]" or "at [City]" patterns
  const inAtMatch = text.match(
    /(?:\bin\b|\bat\b)\s+([A-Z][a-z]+(?:,\s*[A-Z][A-Za-z\s]+)?)/
  );
  if (inAtMatch?.[1] && inAtMatch[1].length > 2) {
    const loc = inAtMatch[1].trim().replace(/[.]$/, "");
    if (
      !/^(The|This|That|Which|Order|Any|Our|All|Its|Each|Some)$/i.test(loc)
    ) {
      return loc.substring(0, 80);
    }
  }

  // Strategy 4: Known cities & regions
  const cities = [
    "Mumbai", "Delhi", "New Delhi", "Bengaluru", "Bangalore", "Chennai",
    "Hyderabad", "Kolkata", "Pune", "Jaipur", "Udaipur", "Goa",
    "Shimla", "Agra", "Lucknow", "Ahmedabad", "Kochi", "Thiruvananthapuram",
    "Chandigarh", "Manali", "Rishikesh", "Varanasi", "Jodhpur", "Mussoorie",
    "Darjeeling", "Ooty", "Coorg", "Munnar", "Amritsar", "Bhopal",
    "Indore", "Nagpur", "Surat", "Navi Mumbai", "Gurugram", "Gurgaon",
    "Noida", "Dehradun", "Gangtok", "Leh", "Ladakh", "Kodaikanal",
    "Lonavala", "Mahabaleshwar", "Mount Abu", "Pushkar", "Ranthambore",
    "Jim Corbett", "Andaman", "Kovalam", "Varkala", "Alleppey", "Wayanad",
    "Rajasthan", "Kerala", "Gujarat", "Maharashtra", "Karnataka",
    "Tamil Nadu",
    "Dubai", "Abu Dhabi", "Singapore", "Bangkok", "Pattaya", "Phuket",
    "London", "New York", "Paris", "Bali", "Maldives", "Sri Lanka",
    "Mauritius", "Thailand", "Tokyo", "Hong Kong", "Sydney", "Melbourne",
    "Toronto", "Vancouver", "Los Angeles", "San Francisco", "Las Vegas",
    "Miami", "Barcelona", "Rome", "Venice", "Amsterdam", "Prague",
    "Istanbul", "Cairo", "Doha", "Muscat", "Colombo", "Kathmandu",
    "Kuala Lumpur", "Jakarta", "Ho Chi Minh", "Hanoi", "Seoul",
  ];

  for (const city of cities) {
    const idx = text.indexOf(city);
    if (idx !== -1) {
      const after = text.substring(idx, idx + 80);
      const withState = after.match(
        new RegExp(
          `(${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:,\\s*[A-Za-z\\s]+)?)`
        )
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

/**
 * Extract dates from text. Returns [checkIn, checkOut] as YYYY-MM-DD strings.
 * Handles: labeled dates, date ranges, named dates, numeric dates, ISO dates.
 */
function extractDates(
  text: string,
  fields: Record<string, string>
): [string, string] {
  const months = MONTHS;
  const monthNames = Object.keys(months).join("|");

  // ─── Strategy 1: Labeled fields (highest confidence) ───
  let checkIn = "";
  let checkOut = "";

  const checkInFieldKeys = [
    "check-in", "checkin", "check in", "check-in date", "checkin date", "check in date",
    "arrival", "arrival date", "start date",
  ];
  const checkOutFieldKeys = [
    "check-out", "checkout", "check out", "check-out date", "checkout date", "check out date",
    "departure", "departure date", "end date",
  ];

  for (const key of checkInFieldKeys) {
    if (fields[key]) {
      const parsed = parseDateFromString(fields[key], months);
      if (parsed) {
        checkIn = parsed;
        break;
      }
    }
  }
  for (const key of checkOutFieldKeys) {
    if (fields[key]) {
      const parsed = parseDateFromString(fields[key], months);
      if (parsed) {
        checkOut = parsed;
        break;
      }
    }
  }

  if (checkIn && checkOut) return [checkIn, checkOut];

  // ─── Strategy 2: Regex labeled dates in raw text ───
  // Handles: "Check-in: 14 August 2026", "Check-in:\n14 August 2026"
  // Supports BOTH "DD Month YYYY" and "Month DD, YYYY" formats
  const dateCapture = `(\\d{1,2}\\s+(?:${monthNames})\\s+\\d{4}|(?:${monthNames})\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{4}|\\d{4}-\\d{2}-\\d{2})`;

  if (!checkIn) {
    const checkInRegex = new RegExp(
      `(?:check[\\s-]*in|arrival|start)\\s*(?:date)?\\s*[:–—-]?\\s*\\n?\\s*${dateCapture}`,
      "i"
    );
    const checkInMatch = text.match(checkInRegex);
    if (checkInMatch) {
      checkIn = normalizeDateString(checkInMatch[1].trim());
    }
  }

  if (!checkOut) {
    const checkOutRegex = new RegExp(
      `(?:check[\\s-]*out|departure|end)\\s*(?:date)?\\s*[:–—-]?\\s*\\n?\\s*${dateCapture}`,
      "i"
    );
    const checkOutMatch = text.match(checkOutRegex);
    if (checkOutMatch) {
      checkOut = normalizeDateString(checkOutMatch[1].trim());
    }
  }

  if (checkIn && checkOut) return [checkIn, checkOut];

  // ─── Strategy 3: Collect all dates from text ───
  const parsed: string[] = [];
  let m;

  // Date ranges: "10-13 April 2026" or "April 10-13, 2026"
  const rangePattern1 = new RegExp(
    `(\\d{1,2})\\s*[-–—to]+\\s*(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})`,
    "gi"
  );
  const rangePattern2 = new RegExp(
    `(${monthNames})\\s+(\\d{1,2})\\s*[-–—to]+\\s*(\\d{1,2}),?\\s*(\\d{4})`,
    "gi"
  );
  while ((m = rangePattern1.exec(text)) !== null) {
    const month = months[m[3].toLowerCase()];
    if (month) {
      parsed.push(`${m[4]}-${month}-${m[1].padStart(2, "0")}`);
      parsed.push(`${m[4]}-${month}-${m[2].padStart(2, "0")}`);
    }
  }
  while ((m = rangePattern2.exec(text)) !== null) {
    const month = months[m[1].toLowerCase()];
    if (month) {
      parsed.push(`${m[4]}-${month}-${m[2].padStart(2, "0")}`);
      parsed.push(`${m[4]}-${month}-${m[3].padStart(2, "0")}`);
    }
  }

  // DD Month YYYY
  const longDatePattern = new RegExp(
    `(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})`,
    "gi"
  );
  while ((m = longDatePattern.exec(text)) !== null) {
    const day = m[1].padStart(2, "0");
    const month = months[m[2].toLowerCase()];
    if (month) parsed.push(`${m[3]}-${month}-${day}`);
  }

  // Month DD, YYYY
  const longDatePattern2 = new RegExp(
    `(${monthNames})\\s+(\\d{1,2}),?\\s+(\\d{4})`,
    "gi"
  );
  while ((m = longDatePattern2.exec(text)) !== null) {
    const month = months[m[1].toLowerCase()];
    const day = m[2].padStart(2, "0");
    if (month) parsed.push(`${m[3]}-${month}-${day}`);
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numericPattern = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g;
  while ((m = numericPattern.exec(text)) !== null) {
    const a = parseInt(m[1]);
    const b = parseInt(m[2]);
    const year = m[3];
    if (a <= 31 && b <= 12) {
      parsed.push(
        `${year}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`
      );
    } else if (b <= 31 && a <= 12) {
      parsed.push(
        `${year}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`
      );
    }
  }

  // YYYY-MM-DD (ISO)
  const isoPattern = /(\d{4})-(\d{2})-(\d{2})/g;
  while ((m = isoPattern.exec(text)) !== null) {
    const candidate = `${m[1]}-${m[2]}-${m[3]}`;
    if (!parsed.includes(candidate)) parsed.push(candidate);
  }

  // Deduplicate and sort
  const unique = [...new Set(parsed)].sort();

  // Fill in any missing check-in/check-out from collected dates
  if (checkIn && !checkOut && unique.length > 0) {
    const later = unique.filter((d) => d > checkIn);
    checkOut =
      later.length > 0 ? later[later.length - 1] : unique[unique.length - 1];
    return [checkIn, checkOut];
  }

  if (!checkIn && !checkOut) {
    // Use event date labeled field as fallback for check-in
    const eventDateKeys = ["event date", "date", "function date", "event"];
    for (const key of eventDateKeys) {
      if (fields[key]) {
        const parsed2 = parseDateFromString(fields[key], months);
        if (parsed2) {
          checkIn = parsed2;
          // Set checkout to day after
          const d = new Date(parsed2);
          d.setDate(d.getDate() + 1);
          checkOut = d.toISOString().split("T")[0];
          return [checkIn, checkOut];
        }
      }
    }

    // Fallback to collected dates
    if (unique.length >= 3) {
      return [unique[unique.length - 2], unique[unique.length - 1]];
    } else if (unique.length >= 2) {
      return [unique[0], unique[unique.length - 1]];
    } else if (unique.length === 1) {
      const d = new Date(unique[0]);
      d.setDate(d.getDate() + 3);
      return [unique[0], d.toISOString().split("T")[0]];
    }
  }

  return [checkIn || "", checkOut || ""];
}

/**
 * Try to parse a date string in various formats. Returns YYYY-MM-DD or null.
 */
function parseDateFromString(
  str: string,
  months: Record<string, string>
): string | null {
  str = str.trim();

  // ISO format: 2026-08-14
  const iso = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  // DD Month YYYY: "14 August 2026"
  const dmy = str.match(
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i
  );
  if (dmy) {
    const month = months[dmy[2].toLowerCase()];
    if (month) return `${dmy[3]}-${month}-${dmy[1].padStart(2, "0")}`;
  }

  // Month DD, YYYY: "August 14, 2026"
  const mdy = str.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (mdy) {
    const month = months[mdy[1].toLowerCase()];
    if (month) return `${mdy[3]}-${month}-${mdy[2].padStart(2, "0")}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const numeric = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (numeric) {
    const a = parseInt(numeric[1]);
    const b = parseInt(numeric[2]);
    if (a <= 31 && b <= 12) {
      return `${numeric[3]}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    }
    if (b <= 31 && a <= 12) {
      return `${numeric[3]}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
    }
  }

  return null;
}

/** Try to normalize various date string formats to YYYY-MM-DD */
function normalizeDateString(dateStr: string): string {
  const result = parseDateFromString(dateStr, MONTHS);
  return result || dateStr;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENDED CONTRACT FIELD EXTRACTORS
// ═══════════════════════════════════════════════════════════════════════════════

/** Extract contract / booking reference number. */
function extractContractNo(text: string, fields: Record<string, string>): string {
  for (const k of ["contract no", "contract number", "contract ref", "contract id", "booking ref", "booking no", "ref no", "reference no", "reference number", "voucher no"]) {
    if (fields[k]) return fields[k].trim();
  }
  const m = text.match(/(?:contract\s*(?:no\.?|number|#|ref(?:erence)?))\s*[:=]?\s*([A-Z0-9\-\/]+)/i);
  if (m) return m[1].trim();
  return "";
}

/** Extract contract issue date as YYYY-MM-DD. */
function extractIssueDate(text: string, fields: Record<string, string>): string {
  for (const k of ["date of issue", "issue date", "issued on", "issued date", "date issued", "date"]) {
    if (fields[k]) {
      const p = parseDateFromString(fields[k], MONTHS);
      if (p) return p;
    }
  }
  const m = text.match(/(?:date\s*of\s*issue|issued?\s*(?:on|date)?)\s*[:=]?\s*([\w\s,]+?\d{4})/i);
  if (m) { const p = parseDateFromString(m[1].trim(), MONTHS); if (p) return p; }
  return "";
}

/** Extract "valid until" date as YYYY-MM-DD. */
function extractValidUntil(text: string, fields: Record<string, string>): string {
  for (const k of ["valid until", "validity", "expiry date", "expiry", "valid through", "valid till", "offer valid"]) {
    if (fields[k]) {
      const p = parseDateFromString(fields[k], MONTHS);
      if (p) return p;
    }
  }
  const m = text.match(/(?:valid\s*(?:until|through|till|upto?)|expiry?)\s*[:=]?\s*([\w\s,]+?\d{4})/i);
  if (m) { const p = parseDateFromString(m[1].trim(), MONTHS); if (p) return p; }
  return "";
}

/** Extract expected / total guest count (takes upper bound of ranges). */
function extractExpectedGuests(text: string, fields: Record<string, string>): number {
  for (const k of ["expected guests", "guest count", "total guests", "number of guests", "no of guests", "no. of guests", "pax", "expected pax", "total pax", "attendees", "delegates"]) {
    if (fields[k]) {
      const fv = fields[k];
      // If the field has a range like "120 – 150", take the max (upper bound)
      const rangeM = fv.match(/(\d+)\s*[–\-to]+\s*(\d+)/);
      if (rangeM) { const n = parseInt(rangeM[2]); if (n > 0) return n; }
      // Otherwise parse the first run of digits only
      const firstNum = fv.match(/(\d+)/);
      if (firstNum) { const n = parseInt(firstNum[1]); if (n > 0) return n; }
    }
  }
  // Range "120 – 150 guests" → take max
  const range = text.match(/(\d+)\s*[–\-to–]+\s*(\d+)\s*(?:guests?|pax|person|people|attendee|delegate)/i);
  if (range) return parseInt(range[2]);
  // "150 pax" / "150 guests"
  const single = text.match(/(\d{2,4})\s*(?:guests?|pax|persons?|people|attendees?|delegates?)/i);
  if (single) { const n = parseInt(single[1]); if (n > 0 && n < 100000) return n; }
  return 0;
}

/** Extract number of nights ("3 Nights / 4 Days", "3-night block"). */
function extractNights(text: string, fields: Record<string, string>): number {
  for (const k of ["nights", "no of nights", "number of nights", "duration", "length of stay", "los"]) {
    if (fields[k]) {
      const m = fields[k].match(/(\d+)\s*nights?/i);
      if (m) return parseInt(m[1]);
      // Prefer nights from "X Days / Y Nights" format before bare integer parse
      const mDaysNights = fields[k].match(/\d+\s*days?\s*[\/\\]\s*(\d+)\s*nights?/i);
      if (mDaysNights) return parseInt(mDaysNights[1]);
      const n = parseInt(fields[k].replace(/[^\d]/g, ""));
      if (n > 0 && n < 90) return n;
    }
  }
  // "3 Nights / 4 Days" format
  const m = text.match(/(\d+)\s*nights?\s*(?:\/|\\)\s*\d+\s*days?/i);
  if (m) return parseInt(m[1]);
  // "4 Days / 3 Nights" reversed format
  const mReversed = text.match(/\d+\s*days?\s*(?:\/|\\)\s*(\d+)\s*nights?/i);
  if (mReversed) return parseInt(mReversed[1]);
  const m2 = text.match(/(\d+)-night\s*(?:block|stay|package)/i);
  if (m2) return parseInt(m2[1]);
  const m3 = text.match(/duration\s*[:=]?\s*(\d+)\s*nights?/i);
  if (m3) return parseInt(m3[1]);
  return 0;
}

/** Extract total contract value. */
function extractTotalAmount(text: string, fields: Record<string, string>): number {
  // Highest priority: "X-Night Block Value" / "X-Night Total Value" fields (actual totals, not per-night rates)
  for (const k of Object.keys(fields)) {
    if (/\d+[\s-]*night/.test(k) && /(?:block|total)\s*value|total\s*(?:block|amount)/.test(k)) {
      const n = parseInt(fields[k].replace(/[^0-9]/g, ""));
      if (n > 0) return n;
    }
  }
  // Also search text for "X-Night Block Value: amount" pattern
  const mMultiNight = text.match(/\d+[\s-]*night\s*(?:block\s*)?(?:value|total|amount)\s*[:=]?\s*[₹$€£]?\s*([\d,]+)/i);
  if (mMultiNight) return parseInt(mMultiNight[1].replace(/,/g, ""));

  // Standard labeled fields — skip per-night annotated values
  for (const k of ["total amount", "total", "grand total", "total block value", "total value", "total cost", "total price", "net total", "invoice total"]) {
    if (fields[k]) {
      if (/per\s*night/i.test(fields[k])) continue; // skip per-night rate fields
      const n = parseInt(fields[k].replace(/[^0-9]/g, ""));
      if (n > 0) return n;
    }
  }
  // Fallback: regex on text (skip per-night inline values)
  const mAll = [...text.matchAll(/(?:total\s*(?:block\s*)?(?:amount|value|price|cost|invoice|charges?))\s*[:=]?\s*[₹$€£]?\s*([\d,]+)/gi)];
  for (const m of mAll) {
    // Check 30 chars after match for "per night" qualifier
    const after = text.substring(m.index! + m[0].length, m.index! + m[0].length + 30);
    if (/per\s*night/i.test(after)) continue;
    return parseInt(m[1].replace(/,/g, ""));
  }
  const m2 = text.match(/[₹$€£]\s*([\d,]+)\s*(?:total|grand\s*total)/i);
  if (m2) return parseInt(m2[1].replace(/,/g, ""));
  return 0;
}

/** Detect currency from text symbols / keywords. */
function extractCurrency(text: string): string {
  if (/₹|inr|indian rupee|rs\./i.test(text)) return "INR";
  if (/\$|usd|us dollar/i.test(text)) return "USD";
  if (/€|eur\b|euro/i.test(text)) return "EUR";
  if (/£|gbp|pound/i.test(text)) return "GBP";
  return "";
}

/** Extract tax / GST information string. */
function extractTaxInfo(text: string): string {
  // Use \b word boundaries so we don't match "vat" inside "reservation" etc.
  const m = text.match(/\b((?:gst|vat|tax|cess|service\s*charge)[^.\n]{0,120})/i);
  if (m) return m[1].replace(/\s+/g, " ").trim().substring(0, 150);
  return "";
}

/** Extract GSTIN in standard Indian format. */
function extractGSTIN(text: string, fields: Record<string, string>): string {
  for (const k of ["gstin", "gst number", "gst no", "gstin number"]) {
    if (fields[k]) return fields[k].trim();
  }
  // Find the GSTIN label, then grab the next ~30 chars, strip ALL whitespace
  // so we handle values split across lines (e.g. "GSTIN: 08AABCG\n1234H1ZP")
  const labelM = text.match(/(?:gstin|gst\s*(?:no\.?|number|in))\s*[:=]?\s*([\s\S]{1,35})/i);
  if (labelM) {
    const candidate = labelM[1].replace(/\s/g, "").toUpperCase().substring(0, 15);
    // Standard 15-char GSTIN: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + Z + 1 alphanum
    if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9]Z[A-Z0-9]$/.test(candidate)) {
      return candidate;
    }
  }
  return "";
}

/** Extract group / booking code shown on contract. */
function extractGroupCode(text: string, fields: Record<string, string>): string {
  for (const k of ["group code", "booking code", "group id", "event code", "promo code", "block code"]) {
    if (fields[k]) return fields[k].trim();
  }
  const m = text.match(/(?:group|booking|event|block)\s*code\s*[:=]?\s*([A-Z0-9\-\/]{3,30})/i);
  if (m) return m[1].trim();
  return "";
}

/** Extract advance payment terms string. */
function extractPaymentTerms(text: string, fields: Record<string, string>): string {
  for (const k of ["payment terms", "payment", "advance payment", "billing terms"]) {
    if (fields[k]) return fields[k].trim().substring(0, 200);
  }
  const m = text.match(/(\d+%\s*advance\s*(?:payment|deposit)[^.]*\.)/i);
  if (m) return m[1].trim();
  const m2 = text.match(/(?:payment\s*terms?|billing)\s*[:=]?\s*([^.\n]{10,200}\.)/i);
  if (m2) return m2[1].trim();
  return "";
}

/** Extract early check-in policy string. */
function extractEarlyCheckIn(text: string): string {
  const m = text.match(/early\s*check[-\s]*in[^.]{0,150}\./i);
  if (m) return m[0].trim();
  return "";
}

/** Extract late check-out policy string. */
function extractLateCheckOut(text: string): string {
  const m = text.match(/late\s*check[-\s]*out[^.]{0,150}\./i);
  if (m) return m[0].trim();
  return "";
}

/** Extract hotel contact details (name, phone, email). */
function extractHotelContact(text: string, fields: Record<string, string>): ParsedContract["hotelContact"] {
  const result: NonNullable<ParsedContract["hotelContact"]> = {};

  // Labeled fields
  for (const k of ["hotel contact", "hotel email", "contact email", "email"]) {
    if (fields[k] && /[@]/.test(fields[k])) { result.email = fields[k].trim(); break; }
  }
  for (const k of ["hotel phone", "hotel contact", "contact", "tel", "telephone", "phone"]) {
    if (fields[k] && /\d{7,}/.test(fields[k])) { result.phone = fields[k].trim(); break; }
  }

  // Look for hotel representative / DOSm block in text — title then name
  const hotelRepMatch = text.match(
    /(?:director\s*of\s*sales|hotel\s*representative|sales\s*manager|gm|general\s*manager|reservations\s*manager|revenue\s*manager|catering\s*manager|banquet\s*manager|front\s*office\s*manager)\s*\n?([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i
  );
  if (hotelRepMatch) result.name = hotelRepMatch[1].trim();

  // Also handle "Name\nTitle" format (name appears before the title)
  if (!result.name) {
    const nameFirstMatch = text.match(
      /([A-Z][a-z]+(?: [A-Z][a-z]+){1,4})\n\s*(?:director\s*of\s*sales|hotel\s*representative|sales\s*manager|gm|general\s*manager|reservations\s*manager|revenue\s*manager|catering\s*manager|banquet\s*manager|front\s*office\s*manager)/i
    );
    if (nameFirstMatch) {
      const n = nameFirstMatch[1].trim();
      // Exclude section titles / generic words
      const excluded = /^(?:authorized|hotel|guest|client|company|dear|signature|representative|date|property|terms)/i;
      if (!excluded.test(n)) result.name = n;
    }
  }

  // Email from text (prefer hotel domain)
  if (!result.email) {
    const emailMatch = text.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) result.email = emailMatch[1];
  }
  // Phone from text
  if (!result.phone) {
    const phoneMatch = text.match(/(?:tel|phone|ph|contact)\s*[:=]?\s*(\+?[\d\s()\-]{7,20})/i);
    if (phoneMatch) result.phone = phoneMatch[1].trim();
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/** Extract agent / coordinating travel agent contact. */
function extractAgentContact(text: string, fields: Record<string, string>): ParsedContract["agentContact"] {
  const result: NonNullable<ParsedContract["agentContact"]> = {};

  // Common label: "Coordinating Agent: Rajesh Kumar · TBO Travel Solutions · +91 98765 43210"
  // Also handle "contact\nRajesh Kumar · TBO Travel Solutions · +91 …" (invitation style)
  const agentLine = text.match(
    /(?:coordinating\s*agent|travel\s*agent|booking\s*agent|agent|contact)\s*\n?\s*([A-Z][a-z]+(?: [A-Z][a-z]+)+ [·\-] [^\n]{5,120})/i
  ) || text.match(
    /(?:coordinating\s*agent|travel\s*agent|booking\s*agent|agent)\s*\n?\s*([^\n]{5,120})/i
  );
  if (agentLine) {
    const line = agentLine[1];
    // Name is the first proper-name component before ·, comma, or @
    const nameM = line.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
    if (nameM) result.name = nameM[1].trim();
    const phoneM = line.match(/(\+?[\d\s()\-]{7,20})/);
    if (phoneM) result.phone = phoneM[1].trim();
    const emailM = line.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    if (emailM) result.email = emailM[1];
  }

  // If still empty, look for a bullet-separated name · company · phone line
  // e.g. "Rajesh Kumar · TBO Travel Solutions · +91 98765 43210"
  if (!result.name) {
    const bulletLine = text.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s*[·•]\s*[A-Z][A-Za-z\s]+[·•]\s*(\+?[\d\s]{8,20})/);
    if (bulletLine) {
      result.name = bulletLine[1].trim();
      result.phone = bulletLine[2].trim();
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/** Extract signatory names near signature blocks. */
function extractSignatories(text: string): string[] {
  const names: string[] = [];
  // Exclude section headers and generic labels that match name patterns
  const EXCLUDED_SIGNATORIES = /^(?:for\s*the|authorized|hotel|guest|client|company|signature|director|manager|title|date|representative|delegated|signed|print|name)$/i;
  // Look for names after "Signature:" or "For the hotel/guest/client:" or near Date/Title lines
  const patterns = [
    /(?:for\s*the\s*(?:guest|hotel|client|company)[:=\s]*)\n?\s*(?!for\s+the\b)([A-Z][a-z]+(?: [A-Z][a-z]+)+)/gi,
    /(?:signature\s*[:=]?\s*I?\s*)([A-Z][a-z]+(?: [A-Z][a-z]+)+)/gi,
    /(?:title\s*[:=]?.{0,30}\n)([A-Z][a-z]+(?: [A-Z][a-z]+)+)/gi,
  ];
  for (const p of patterns) {
    let m;
    p.lastIndex = 0;
    while ((m = p.exec(text)) !== null) {
      const name = m[1].trim();
      if (name.length > 3 && name.length < 60 && !names.includes(name) && !EXCLUDED_SIGNATORIES.test(name)) {
        names.push(name);
      }
    }
  }
  return names;
}

/**
 * Extract room types with rates and quantities from text.
 * Multi-strategy: table parsing → named room types → generic row extraction.
 */
export function extractRooms(
  text: string,
  tableRows: TableRow[]
): ParsedContract["rooms"] {
  const rooms: ParsedContract["rooms"] = [];
  const seen = new Set<string>();

  // ── Strategy 1: Use parsed table rows ──
  if (tableRows.length > 0) {
    for (const row of tableRows) {
      const desc = row.description;
      // Check if this row looks like a room/accommodation item
      const isRoom =
        /room|suite|villa|cottage|studio|deluxe|standard|premium|executive|royal|superior|twin|double|single|king|queen|club|penthouse|accommodation/i.test(
          desc
        );

      if (isRoom) {
        const { rate, quantity } = interpretTableRow(row.numbers);
        const key = desc.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          rooms.push({
            roomType: desc,
            rate: rate || 0,
            quantity: quantity || 1,
          });
        }
      }
    }
  }

  // ── Strategy 2: Named room type pattern matching ──
  if (rooms.length === 0) {
    const roomTypeWords = [
      // Compound names
      "Deluxe Room", "Deluxe Rooms", "Deluxe King", "Deluxe Twin",
      "Deluxe Double", "Deluxe Single",
      "Standard Room", "Standard Rooms", "Standard King", "Standard Twin",
      "Standard Double",
      "Premium Suite", "Premium Room", "Premium Rooms", "Premium King",
      "Executive Suite", "Executive Room", "Executive Rooms", "Executive King",
      "Royal Suite", "Royal Room",
      "Presidential Suite", "Presidential Room",
      "Superior Room", "Superior Rooms", "Superior King", "Superior Double",
      "Family Room", "Family Rooms", "Family Suite",
      "Luxury Suite", "Luxury Room", "Luxury Rooms",
      "Classic Room", "Classic Rooms", "Classic Suite",
      "Junior Suite",
      "Grand Suite", "Grand Room",
      "Honeymoon Suite",
      "Penthouse Suite", "Penthouse",
      "Villa", "Pool Villa", "Beach Villa", "Garden Villa",
      "Cottage",
      "Studio Room", "Studio Rooms", "Studio",
      "Twin Room", "Twin Rooms", "Twin Sharing",
      "Double Room", "Double Rooms", "Double Occupancy",
      "Single Room", "Single Rooms", "Single Occupancy",
      "King Room", "King Rooms",
      // removed "King Bed" (descriptive attribute)
      "Queen Room", "Queen Rooms",
      // removed "Queen Bed"
      "Club Room", "Club Rooms", "Club Suite",
      "Garden Room",
      // views and beds are descriptive, skip
      // "Garden View",
      "Ocean Suite",
      // "Ocean View", "Sea View",
      // "Lake View Room", "Lake View",
      "Mountain View", "Valley View", "Pool View", "City View",
      
      // Bare keywords (lower priority)
      "Deluxe", "Suite", "Superior", "Executive", "Premier", "Premium",
    ];

    const lower = text.toLowerCase();

    for (const roomType of roomTypeWords) {
      const roomLower = roomType.toLowerCase();
      const idx = lower.indexOf(roomLower);
      if (idx === -1) continue;

      let normalizedType = roomType.replace(/\s+/g, " ").trim();
      // skip obvious descriptive phrases that are not room categories
      const descriptiveBlacklist = [
        "king bed", "lake view", "ocean view", "sea view", "garden view",
        "panoramic view", "separate lounge", "butler service",
      ];
      if (descriptiveBlacklist.some(b => roomLower.includes(b))) {
        continue;
      }

      if (seen.has(normalizedType.toLowerCase())) continue;
      // If this is a bare keyword, check if there's a more specific match already added
      if (roomType.split(" ").length === 1) {
        const hasSpecific = [...seen].some((s) => s.includes(roomLower));
        if (hasSpecific) continue;
      }

      // Get the LINE containing this room type for context
      const lineStart = text.lastIndexOf("\n", idx);
      const lineEnd = text.indexOf("\n", idx + roomLower.length);
      const line = text.substring(
        lineStart >= 0 ? lineStart + 1 : 0,
        lineEnd >= 0 ? lineEnd : text.length
      );
      // expand bare keyword using context in same line
      if (roomType.split(" ").length === 1) {
        const extraMatch = line.match(new RegExp(`([A-Z][A-Za-z& ]+)\\s+${roomType}`));
        if (extraMatch) {
          normalizedType = `${extraMatch[1]} ${roomType}`.trim();
        }
      }

      // Also get broader context for labeled patterns
      let context = text.substring(
        idx,
        Math.min(text.length, idx + 800)
      );
      // fix concatenated numbers within context as well
      context = context.replace(/,(\d{3})(?=\d)/g, ", $1");
      const beforeContext = text.substring(Math.max(0, idx - 200), idx);

      // Extract rate — try line-level numbers first, then broader context
      let rate = 0;
      let quantity = 0;

      // Try to extract numbers from the same line (table-like)
      // first sanitize merged numbers like "205,000100,000" → "205,000 100,000"
      const sanitizedLine = line.replace(/,(\d{3})(?=\d)/g, ", $1");
      const lineNumbers = [
        ...sanitizedLine.matchAll(/([\d,]+(?:\.\d{1,2})?)/g),
      ]
        .map((matchArr) => parseFloat(matchArr[1].replace(/,/g, "")))
        .filter((n) => n > 0);

      if (lineNumbers.length >= 2) {
        // Table-like line: use interpretTableRow
        const interpreted = interpretTableRow(lineNumbers);
        rate = interpreted.rate;
        quantity = interpreted.quantity;
      } else {
        // Fall back to labeled/symbol-based patterns in broader context
        const ratePatterns = [
          /[₹$]\s*([\d,]+(?:\.\d{1,2})?)/,
          /(?:rs\.?|inr|usd|rate|tariff|price|rack\s*rate|published\s*rate|negotiated\s*rate|net\s*rate|per\s*night|per\s*room)\s*[:=]?\s*[₹$]?\s*([\d,]+(?:\.\d{1,2})?)/i,
          /([\d,]{4,})\s*(?:\/\s*night|per\s*night|per\s*room|\/-)/i,
        ];
        for (const rp of ratePatterns) {
          if (rate > 0) break;
          const rateMatch = context.match(rp);
          if (rateMatch) {
            const val = parseInt(
              (rateMatch[1] || rateMatch[2] || "0").replace(/,/g, "")
            );
            if (val > 100 && val < 10000000) rate = val;
          }
        }

        // Extract quantity from NEARBY context only (150 chars)
        // Smaller window reduces false matches from subsequent rows (e.g., "150 pax" in catering)
        let qtyContext = text.substring(idx, Math.min(text.length, idx + 150));
        qtyContext = qtyContext.replace(/,(\d{3})(?=\d)/g, ", $1");
        const qtyPatterns = [
          /(?:qty|quantity)\s*[:=]?\s*(\d+)/i,
          /(\d+)\s*(?:rooms?|units?|nos\.?|keys)/i, // exclude pax
          /(?:rooms?|units?|nos?\.?|count|block|blocked|allocated)\s*[:=]?\s*(\d+)/i,
          /(?:x|×)\s*(\d+)/i,
          /(\d+)\s*(?:x|×)/i,
        ];
        for (const qp of qtyPatterns) {
          if (quantity > 0) break;
          const qtyMatch = qtyContext.match(qp);
          if (qtyMatch) {
            const val = parseInt(qtyMatch[1]);
            if (val > 0 && val < 10000) quantity = val;
          }
        }
        // Check before context too
        if (quantity === 0) {
          const qtyBefore = beforeContext.match(
            /(\d+)\s*(?:rooms?|units?|nos\.?|x|×)\s*$/i
          );
          if (qtyBefore) quantity = parseInt(qtyBefore[1]);
        }
      }

      // Extract floor
      let floor = "";
      const floorMatch = context.match(
        /(?:floor|levels?|level|storey|storeys?)s?\s*[:=]?\s*([A-Za-z0-9\-–]+)/i
      );
      if (floorMatch) {
        if (!/^s$/i.test(floorMatch[1])) floor = floorMatch[1];
      }

      // Extract wing
      let wing = "";
      const wingMatch = context.match(
        /(?:wing|tower|block|building)\s*[:=]?\s*([A-Za-z\s]+?)(?:\s*[,.\n|]|$)/i
      );
      if (wingMatch) wing = wingMatch[1].trim();
      // Fallback: if we only captured the word "Wing" (e.g. "Tower Wing" → captured "wing")
      // look only within the room's own context, not the entire document.
      // Prefer a wing that appears alone on its own line (table cell), not embedded mid-sentence.
      if (!wing || /^Wing$/i.test(wing)) {
        // First try: "[Word] Wing" that appears at the start of a line (standalone table cell)
        const standaloneLine = context.match(/(?:^|\n)\s*([A-Za-z]+)\s+Wing\s*(?:\n|$)/m);
        if (standaloneLine) {
          wing = standaloneLine[1];
        } else {
          // Second try: any "[Word] Wing" in context, but only if it's after the floor/qty area
          // (skip "Heritage palace wing" in description by requiring uppercase start)
          const ctxWing = context.match(/\b([A-Z][a-z]+)\s+Wing\b/);
          if (ctxWing) wing = ctxWing[1];
        }
      }

      // Extract hotel name (for multi-property contracts)
      let hotelName = "";
      const hotelMatch = (beforeContext + context).match(
        /(?:at|hotel|property)\s*[:=]?\s*([A-Z][A-Za-z\s&']+(?:Hotel|Resort|Palace|Spa|Suites)?)/
      );
      if (hotelMatch) hotelName = hotelMatch[1].trim();

      // avoid near-duplicate names (e.g. "Deluxe Room" vs "Deluxe Rooms")
      const normLower = normalizedType.toLowerCase();
      const dup = [...seen].some((s) => s.includes(normLower) || normLower.includes(s));
      if (!dup) {
        seen.add(normLower);
        rooms.push({
          roomType: normalizedType,
          rate: rate || 0,
          quantity: quantity || 1,
          floor: floor || undefined,
          wing: wing || undefined,
          hotelName: hotelName || undefined,
        });
      }
    }
  }

  // ── Strategy 3: Generic table-row extraction with separators ──
  if (rooms.length === 0) {
    const rowPatterns = [
      // Pipe/tab separated
      /([A-Za-z][A-Za-z\s]{2,40}?)\s*(?:[|│┃\t])\s*[₹$]?\s*(?:Rs\.?\s*)?([\d,]+(?:\.\d{2})?)\s*(?:\/[- ]?(?:night|room|n))?\s*(?:[|│┃\t])\s*(\d+)\s*(?:rooms?|units?|nos?\.?|keys|pax)?/gi,
      // 2+ space separated: Name   Rate   Qty
      /^([A-Za-z][A-Za-z\s/&()]{2,40}?)\s{2,}[₹$]?\s*(?:Rs\.?\s*)?([\d,]+)\s{2,}(\d+)\s*$/gm,
      // Name, Rate, Qty (CSV-ish)
      /([A-Za-z][A-Za-z\s]{2,40}?)\s*,\s*[₹$]?\s*(?:Rs\.?\s*)?([\d,]+)\s*,\s*(\d+)/gi,
    ];

    for (const rowPattern of rowPatterns) {
      let rowMatch;
      while ((rowMatch = rowPattern.exec(text)) !== null) {
        const name = rowMatch[1].trim();
        const rate = parseInt(rowMatch[2].replace(/,/g, ""));
        const qty = parseInt(rowMatch[3]);
        if (
          name.length > 2 &&
          name.length < 50 &&
          rate > 100 &&
          rate < 10000000 &&
          qty > 0 &&
          qty < 10000 &&
          !seen.has(name.toLowerCase())
        ) {
          seen.add(name.toLowerCase());
          rooms.push({ roomType: name, rate, quantity: qty });
        }
      }
      if (rooms.length > 0) break;
    }
  }

  // ── Strategy 4: "Room Type" table header scanning ──
  if (rooms.length === 0) {
    const tableHeaderIdx = text.search(
      /room\s*type|category|accommodation\s*type/i
    );
    if (tableHeaderIdx >= 0) {
      const tableText = text.substring(tableHeaderIdx, tableHeaderIdx + 2000);
      const lines = tableText.split("\n").slice(1);
      for (const line of lines) {
        if (line.trim().length < 5) continue;
        const lineMatch = line.match(
          /([A-Za-z][A-Za-z\s/&-]{2,40}?)\s+.*?([\d,]{3,})/
        );
        if (lineMatch) {
          const name = lineMatch[1].trim();
          const rate = parseInt(lineMatch[2].replace(/,/g, ""));
          const qtyInLine = line.match(
            /(\d+)\s*(?:rooms?|units?|nos?\.?|keys|pax)/i
          );
          const qty = qtyInLine ? parseInt(qtyInLine[1]) : 1;
          if (
            rate > 100 &&
            rate < 10000000 &&
            !seen.has(name.toLowerCase())
          ) {
            seen.add(name.toLowerCase());
            rooms.push({ roomType: name, rate, quantity: qty });
          }
        }
      }
    }
  }

  return rooms;
}

/**
 * Extract add-ons, services, and inclusions from text.
 * Uses both keyword matching and table data.
 */
export function extractAddOns(
  text: string,
  tableRows: TableRow[]
): ParsedContract["addOns"] {
  const addOns: ParsedContract["addOns"] = [];
  const seen = new Set<string>();
  const sanitizeName = (n: string) => n
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*\d+$/g, "")
    .trim();

  /** Returns true if this name looks like noise (file path, date fragment, URL, etc.) */
  const isJunkName = (n: string): boolean => {
    if (n.length < 3) return true;
    if (/^file:\/\//i.test(n)) return true;           // file:/// URL
    if (/^https?:\/\//i.test(n)) return true;          // http/https URL
    if (/^\d+\/\d+/.test(n)) return true;              // date fragment like "2/22/"
    if (n.includes("\\") || n.includes("%20")) return true; // encoded path
    if (/^[^A-Za-z]{4,}/.test(n)) return true;        // starts with 4+ non-letters
    return false;
  };

  // ── Strategy 1: Table rows that look like services (not rooms) ──
  for (const row of tableRows) {
    const desc = row.description;
    // Skip room-type items (they're handled by extractRooms)
    if (
      /^(?:deluxe|standard|premium|executive|royal|superior|twin|double|single|king|queen|club|penthouse)\s+(?:room|suite|villa|cottage|studio)/i.test(
        desc
      ) ||
      /\broom\b.*\b(?:deluxe|suite|standard|premium|executive|superior)\b/i.test(
        desc
      )
    )
      continue;
    // Also skip if it ONLY says "Deluxe Rooms", "Standard Rooms" etc.
    if (
      /^(?:deluxe|standard|premium|executive|royal|superior)\s+rooms?$/i.test(
        desc
      )
    )
      continue;

    // Check if it's a service/add-on
    const isService =
      /banquet|hall|catering|audio|visual|setup|rental|decoration|photography|dj|music|entertainment|transfer|shuttle|airport|valet|parking|flowers?|stage|lighting|sound|projector|screen|podium|ceremony|food|beverage|drinks?|bar|lounge|menu|buffet|pax|breakfast|lunch|dinner|spa|wifi|internet|gym|pool|laundry|concierge/i.test(
        desc
      );

    // If it has numbers and isn't a pure room type, treat it as a service
    if (
      (isService || row.numbers.length >= 2) &&
      !seen.has(desc.toLowerCase())
    ) {
      // Double check it's not a room
      const isDefinitelyRoom =
        /^(?:deluxe|standard|premium|executive|royal|superior|family|luxury|classic|junior|grand|honeymoon|penthouse|villa|cottage|studio|twin|double|single|king|queen|club|garden|ocean|lake|mountain|valley|pool|city)\s/i.test(
          desc
        );
      if (isDefinitelyRoom) continue;

      const clean = sanitizeName(desc);
      if (seen.has(clean.toLowerCase())) continue;
      if (isJunkName(clean)) continue;
      seen.add(clean.toLowerCase());
      const { rate } = interpretTableRow(row.numbers);
      addOns.push({
        name: clean,
        price: rate || 0,
        isIncluded: false,
      });
    }
  }

  // ── Strategy 2: Keyword-based pattern matching ──
  // Build a lookup of all descriptions already captured in strategy 1 (for dedup)
  const tableAddOnNames = addOns.map((a) => a.name.toLowerCase());

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
    { pattern: /(?:mini-?bar|minibar)/i, name: "Mini Bar" },
    { pattern: /(?:room\s*service)/i, name: "Room Service" },
    { pattern: /(?:concierge)/i, name: "Concierge" },
    { pattern: /(?:babysitting|childcare|kids\s*club)/i, name: "Childcare" },
    { pattern: /(?:boat|yacht|cruise)\s*(?:ride|trip)?/i, name: "Boat Trip" },
    { pattern: /(?:sangeet|sangeeth)/i, name: "Sangeet Ceremony" },
    { pattern: /(?:haldi)/i, name: "Haldi Ceremony" },
    { pattern: /(?:cocktail)\s*(?:party|night|event)?/i, name: "Cocktail Party" },
    { pattern: /(?:audio|a\s*\/?\s*v)\s*(?:visual|setup|equipment)/i, name: "Audio/Visual Setup" },
    { pattern: /banquet\s*(?:hall|room|rental)/i, name: "Banquet Hall" },
    { pattern: /(?:conference|meeting)\s*(?:room|hall|facility)/i, name: "Conference Room" },
    { pattern: /catering\s*(?:service)?/i, name: "Catering" },
    { pattern: /projector|screen|podium/i, name: "AV Equipment" },
    { pattern: /valet/i, name: "Valet Parking" },
    { pattern: /(?:flower|floral)\s*(?:arrangement|decoration)?/i, name: "Flower Arrangement" },
    { pattern: /(?:stage|lighting|sound)\s*(?:setup)?/i, name: "Stage Setup" },
  ];

  const lower = text.toLowerCase();

  for (const { pattern, name } of addOnPatterns) {
    if (seen.has(name.toLowerCase()) || seen.has(name)) continue;
    // Also skip if the strategy-1 table rows already captured a fuller version of this item
    if (tableAddOnNames.some((n) => n.includes(name.toLowerCase()))) continue;

    const match = lower.match(pattern);
    if (match) {
      // Get line-scoped context for this add-on
      const idx = lower.indexOf(match[0]);
      const lineStart = lower.lastIndexOf("\n", idx);
      const lineEnd = lower.indexOf("\n", idx + match[0].length);
      const currentLine = lower.substring(
        lineStart >= 0 ? lineStart : 0,
        lineEnd >= 0 ? lineEnd : lower.length
      );
      // Also check NEXT line (complimentary/included often on the line below)
      const nextLineEnd = lower.indexOf(
        "\n",
        lineEnd >= 0 ? lineEnd + 1 : idx + match[0].length
      );
      const twoLines = lower.substring(
        lineStart >= 0 ? lineStart : 0,
        nextLineEnd >= 0 ? nextLineEnd : lower.length
      );

      // Check complimentary on current + next line (PDF text often splits label and status onto separate lines)
      const isIncluded =
        /complimentary|included|free|no\s*charge|inclusive|gratis|at no cost/i.test(twoLines)
        && !/[₹$]\s*[\d,]{3,}|(?:rs\.?|inr)\s*[\d,]{3,}/i.test(twoLines);

      let price = 0;
      if (!isIncluded) {
        // Look for price AFTER the keyword (not before) to avoid picking up adjacent add-on prices
        const afterKeyword = lower.substring(
          idx + match[0].length,
          Math.min(lower.length, idx + match[0].length + 80)
        );
        const afterPriceMatch = afterKeyword.match(
          /[₹$]\s*([\d,]+)|(?:rs\.?|inr)\s*([\d,]+)/i
        );
        if (afterPriceMatch) {
          price = parseInt((afterPriceMatch[1] || afterPriceMatch[2]).replace(/,/g, ""));
        }
      }

      const clean = sanitizeName(name);
      if (!seen.has(clean.toLowerCase()) && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        seen.add(clean.toLowerCase());
        addOns.push({ name: clean, price: isIncluded ? 0 : price, isIncluded });
      }
    }
  }

  return addOns;
}

/**
 * Extract attrition/cancellation rules from text.
 * Handles 9+ pattern variants including "within X days", "incur X% charge",
 * labeled percentages, and standalone penalty statements.
 */
function extractAttritionRules(
  text: string
): ParsedContract["attritionRules"] {
  const rules: ParsedContract["attritionRules"] = [];

  // Focus on the attrition/cancellation section if it exists
  const attritionIdx = text
    .toLowerCase()
    .search(
      /attrition|release\s*schedule|cancellation\s*policy|cancellation\s*clause|penalty|cut[\s-]*off|terms\s*(?:&|and)\s*conditions/
    );
  const searchText =
    attritionIdx >= 0 ? text.substring(attritionIdx) : text;

  let m;

  // Pattern 1: "Date ... X% release/cancel" — date followed by percentage
  const dateThenPercent =
    /((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})\s*(?:[^\n]*?)(\d+)\s*%\s*(?:release|cancel|reduction|unsold|attrition)/gi;
  while ((m = dateThenPercent.exec(searchText)) !== null) {
    const dateStr = m[1];
    const percent = parseInt(m[2]);
    rules.push({
      releaseDate: normalizeDateString(dateStr),
      releasePercent: percent,
      description: `Release ${percent}% of rooms`,
    });
  }

  // Pattern 2: "X% ... Date" — percentage followed by date
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

  // Pattern 3: "X days before/prior ... X%" (days then percentage)
  if (rules.length === 0) {
    const daysBeforePattern =
      /(\d+)\s*days?\s*(?:before|prior|ahead|in\s*advance).*?(\d+)\s*%/gi;
    while ((m = daysBeforePattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[2]),
        description: `Release ${parseInt(m[2])}% of rooms ${parseInt(m[1])} days prior to check-in`,
      });
    }
  }

  // Pattern 4: "X% ... X days" (percentage then days)
  if (rules.length === 0) {
    const percentDaysPattern =
      /(\d+)\s*%\s*(?:.*?)(\d+)\s*days?\s*(?:before|prior|ahead|in\s*advance)/gi;
    while ((m = percentDaysPattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[1]),
        description: `Release ${parseInt(m[1])}% of rooms ${parseInt(m[2])} days prior to check-in`,
      });
    }
  }

  // Pattern 5: "within X days ... X% charge/penalty" (common in Indian contracts)
  if (rules.length === 0) {
    const withinDaysPattern =
      /(?:cancellation|cancel)\s*(?:within|inside|less\s*than)\s*(\d+)\s*days?\s*(?:of|before|from)?\s*(?:the\s*)?(?:event|check[\s-]*in|arrival|function)?[^.]*?(\d+)\s*%\s*(?:charge|penalty|fee|of\s*(?:the\s*)?total|cancellation)/gi;
    while ((m = withinDaysPattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[2]),
        description: `${parseInt(m[2])}% cancellation charge within ${parseInt(m[1])} days of the event`,
      });
    }
  }

  // Pattern 6: "within X days ... will incur/attract X%" (alternate wording)
  if (rules.length === 0) {
    const incurPattern =
      /(?:cancellation\s*)?(?:within|inside)\s*(\d+)\s*days?[^.]*?(?:will\s*)?(?:incur|attract|result\s*in|lead\s*to|be\s*subject\s*to)\s*(\d+)\s*%/gi;
    while ((m = incurPattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[2]),
        description: `${parseInt(m[2])}% charge for cancellation within ${parseInt(m[1])} days`,
      });
    }
  }

  // Pattern 7: Simple "penalty of X%" or "charge of X%" or "X% penalty"
  if (rules.length === 0) {
    const penaltyPattern =
      /(?:penalty|charge|fee)\s*(?:of|:)?\s*(\d+)\s*%/gi;
    while ((m = penaltyPattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[1]),
        description: `${parseInt(m[1])}% penalty on cancellation`,
      });
    }
  }

  // Pattern 8: "X% ... penalty/charge/fee" (percentage then penalty word)
  if (rules.length === 0) {
    const percentPenaltyPattern =
      /(\d+)\s*%\s*(?:cancellation\s*)?(?:penalty|charge|fee)/gi;
    while ((m = percentPenaltyPattern.exec(searchText)) !== null) {
      rules.push({
        releaseDate: "",
        releasePercent: parseInt(m[1]),
        description: `${parseInt(m[1])}% cancellation penalty`,
      });
    }
  }

  // NOTE: Pattern 9 (advance payment) removed — advance payment is NOT an attrition rule.
  // It is captured separately by extractPaymentTerms.

  return rules;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT / ORGANIZER NAME EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract the client / organizer name from a contract.
 * Looks for labeled fields like "Client Name:", "Company:", "Organized By:", etc.
 * Also detects "between X and Y" contract preamble patterns.
 */
function extractClientName(
  text: string,
  fields: Record<string, string>
): string {
  // Strategy 1: Labeled fields
  const clientFieldKeys = [
    "client name", "client", "company name", "company", "organized by",
    "organizer", "booking by", "booked by", "coordinated by", "group name",
    "group", "party name", "contact person", "organiser",
  ];
  for (const key of clientFieldKeys) {
    if (fields[key] && fields[key].length >= 2 && fields[key].length < 100) {
      return fields[key];
    }
  }

  // Strategy 2: "between [Client] and [Hotel]" — common contract opening
  const betweenMatch = text.match(
    /between\s+([A-Z][A-Za-z\s&'.]+?)\s+(?:and|&)\s+(?:[A-Z].*?(?:Hotel|Resort|Palace|Inn|Lodge|Retreat|Spa))/i
  );
  if (betweenMatch?.[1]) {
    const name = betweenMatch[1].trim().replace(/[,.]$/, "");
    if (name.length >= 3 && name.length < 80) return name;
  }

  // Strategy 3: Regex on text patterns
  const patterns = [
    /(?:client|company|organiz(?:er|ed\s*by)|group)\s*[:–—-]\s*\n?\s*([^\n]{3,80})/i,
    /(?:booking\s*(?:by|for)|booked\s*(?:by|for))\s*[:–—-]?\s*\n?\s*([^\n]{3,80})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim().replace(/[,.]$/, "");
      if (name.length >= 3) return name.substring(0, 80);
    }
  }

  // Strategy 4: For wedding/family events, extract from event name
  // e.g., "The Sharma-Patel Wedding" → "Sharma-Patel Families"
  const eventNameFromText =
    fields["event name"] ||
    fields["function name"] ||
    text.match(/([A-Z][a-z]+(?:\s*[-&]\s*[A-Z][a-z]+)+)\s+Wedding/)?.[1] || "";
  if (eventNameFromText) {
    const familyM = eventNameFromText.match(
      /([A-Z][a-z]+(?:\s*[-&]\s*[A-Z][a-z]+)*)\s+(?:Wedding|Marriage|Shaadi)/i
    );
    if (familyM) return familyM[1].trim() + " Families";
  }

  // Strategy 5: "X Families" or "X and Y Family"
  const familyLineMatch = text.match(
    /([A-Z][a-z]+(?:\s*(?:&|and)\s*[A-Z][a-z]+)*)\s+Famil(?:y|ies)/i
  );
  if (familyLineMatch) return familyLineMatch[1].trim() + " Families";

  return "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT INVITATION PARSING
// ═══════════════════════════════════════════════════════════════════════════════

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

function extractEventName(
  text: string,
  eventType: string,
  fields: Record<string, string>
): string {
  // Strategy 1: Labeled fields
  const nameFieldKeys = [
    "event name", "function name", "event", "function",
    "ceremony", "conference name", "programme",
  ];
  for (const key of nameFieldKeys) {
    if (fields[key] && fields[key].length >= 3 && fields[key].length < 100) {
      return fields[key];
    }
  }

  // Strategy 2: Regex patterns
  const namePatterns = [
    /(?:event|function|ceremony|conference)\s*(?:name)?\s*[:–—-]\s*\n?\s*(.+)/i,
    /(?:the\s+)?([A-Z][a-z]+(?:\s*[-&]\s*[A-Z][a-z]+)?\s+(?:Wedding|Marriage|Conference|Summit|Gala|Celebration|Ceremony|Reception|Launch|Reunion))/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().substring(0, 100);
  }

  // Strategy 3: For weddings, find two family names
  if (eventType === "wedding") {
    const familyPattern = text.match(
      /([A-Z][a-z]+)\s*(?:&|and|-|weds|❤)\s*([A-Z][a-z]+)/
    );
    if (familyPattern) {
      return `The ${familyPattern[1]}-${familyPattern[2]} Wedding`;
    }
  }

  // Strategy 4: First significant capitalized phrase
  const titleMatch = text.match(/^([A-Z][A-Za-z\s&'\-]{5,60})$/m);
  if (titleMatch) return titleMatch[1].trim();

  return "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR EXTRACTION FROM IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

export async function extractColorsFromImage(
  buffer: Buffer
): Promise<{ primary: string; secondary: string; accent: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const { dominant } = await sharp(buffer).stats();

    const primary = rgbToHex(dominant.r, dominant.g, dominant.b);
    const secondary = rgbToHex(
      Math.min(255, dominant.r + 100),
      Math.min(255, dominant.g + 100),
      Math.min(255, dominant.b + 100)
    );
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PARSE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  validation?: ValidationResult;
}

/**
 * Parse a hotel contract from a PDF or image buffer.
 * Supports text-based PDFs, scanned PDFs (via OCR), and image uploads.
 * Returns structured data or a validation error.
 */
export async function parseContractLocally(
  buffer: Buffer,
  mimeType: string
): Promise<ParseResult<ParsedContract>> {
  let text = "";
  let usedOCR = false;

  if (mimeType.includes("pdf")) {
    // PDF: try text extraction with OCR fallback
    try {
      const result = await extractTextWithOCRFallback(buffer);
      text = result.text;
      usedOCR = result.usedOCR;
    } catch (err) {
      console.error("PDF extraction error:", err);
      return {
        success: false,
        error:
          "Failed to extract text from this PDF. The file may be corrupted, password-protected, or contain only scanned images.",
      };
    }
  } else if (
    mimeType.includes("image") ||
    mimeType.includes("png") ||
    mimeType.includes("jpg") ||
    mimeType.includes("jpeg") ||
    mimeType.includes("webp")
  ) {
    // Image upload: use OCR
    try {
      text = normalizeText(await extractTextFromImage(buffer));
      usedOCR = true;
    } catch (err) {
      console.error("Image OCR error:", err);
      return {
        success: false,
        error:
          "Failed to extract text from this image. Please upload a clearer image or a text-based PDF.",
      };
    }
  } else {
    return {
      success: false,
      error:
        "Unsupported file type. Please upload a PDF or image file (PNG, JPEG, WebP).",
    };
  }

  // Validate content
  const validation = validateContractText(text);
  if (!validation.isValid) {
    return {
      success: false,
      error: usedOCR
        ? `OCR was used but ${validation.error?.toLowerCase() || "insufficient text was recognized."} Try uploading a higher-quality scan or a text-based PDF.`
        : validation.error,
      validation,
    };
  }

  // Extract labeled fields (e.g., "Hotel Name: Grand Horizon Hotel")
  const fields = extractLabeledFields(text);

  // Parse table data
  const tableRows = parseTableRows(text);

  // ── Core fields ────────────────────────────────────────────────────────────
  const venue = extractVenue(text, fields);
  const location = extractLocation(text, fields);
  const [checkIn, checkOut] = extractDates(text, fields);
  const eventType = detectEventType(text);
  const eventName = extractEventName(text, eventType, fields);
  const clientName = extractClientName(text, fields);

  // ── Structured arrays ──────────────────────────────────────────────────────
  const rooms = extractRooms(text, tableRows);
  const addOns = extractAddOns(text, tableRows);
  const attritionRules = extractAttritionRules(text);

  // ── Extended metadata ──────────────────────────────────────────────────────
  const contractNo    = extractContractNo(text, fields);
  const issueDate     = extractIssueDate(text, fields);
  const validUntil    = extractValidUntil(text, fields);
  const groupCode     = extractGroupCode(text, fields);
  const gstin         = extractGSTIN(text, fields);
  const expectedGuests = extractExpectedGuests(text, fields);
  const nights        = extractNights(text, fields);
  // If no explicit nights found, calculate from check-in/check-out dates
  const resolvedNights = nights || (() => {
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn), d2 = new Date(checkOut);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
        if (diff > 0 && diff < 90) return diff;
      }
    }
    return 0;
  })();
  const totalAmount   = extractTotalAmount(text, fields);
  const currency      = extractCurrency(text);
  const taxInfo       = extractTaxInfo(text);
  const paymentTerms  = extractPaymentTerms(text, fields);
  const earlyCheckIn  = extractEarlyCheckIn(text);
  const lateCheckOut  = extractLateCheckOut(text);
  const hotelContact  = extractHotelContact(text, fields);
  const agentContact  = extractAgentContact(text, fields);
  const signatories   = extractSignatories(text);

  const data: ParsedContract = {
    // Core
    venue: venue || "Unknown Venue",
    location: location || "Unknown Location",
    checkIn: checkIn || "",
    checkOut: checkOut || "",
    eventName: eventName || "",
    eventType: eventType || "event",
    clientName: clientName || "",
    // Contract metadata
    contractNo:     contractNo     || undefined,
    issueDate:      issueDate      || undefined,
    validUntil:     validUntil     || undefined,
    groupCode:      groupCode      || undefined,
    gstin:          gstin          || undefined,
    // Headcount / duration
    expectedGuests: expectedGuests || undefined,
    nights:         resolvedNights || undefined,
    // Financial
    totalAmount:    totalAmount    || undefined,
    currency:       currency       || undefined,
    taxInfo:        taxInfo        || undefined,
    paymentTerms:   paymentTerms   || undefined,
    // Contacts
    hotelContact:   hotelContact   || undefined,
    agentContact:   agentContact   || undefined,
    signatories:    signatories.length > 0 ? signatories : undefined,
    // Policies
    earlyCheckIn:   earlyCheckIn   || undefined,
    lateCheckOut:   lateCheckOut   || undefined,
    // Structured arrays
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
    try {
      const result = await extractTextWithOCRFallback(buffer);
      text = result.text;
    } catch (err) {
      console.error("PDF invite extraction error:", err);
      return {
        success: false,
        error: "Failed to extract text from this PDF.",
      };
    }

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
    // Also try OCR on the image for text content
    try {
      const ocrText = await extractTextFromImage(buffer);
      if (ocrText.trim().length > 20) {
        text = normalizeText(ocrText);
      }
    } catch {
      // OCR failed, continue with just colors
    }
  } else {
    return {
      success: false,
      error: `Unsupported file type: ${mimeType}. Please upload a PDF or image file.`,
    };
  }

  // Extract labeled fields
  const fields = extractLabeledFields(text);

  // Detect event type and name from text
  const eventType = text ? detectEventType(text) : "event";
  const eventName = text ? extractEventName(text, eventType, fields) : "";

  // Extract colors from text if available
  if (text) {
    const hexColors = text.match(/#[0-9A-Fa-f]{6}/g);
    if (hexColors && hexColors.length >= 1) colors.primary = hexColors[0];
    if (hexColors && hexColors.length >= 2) colors.secondary = hexColors[1];
    if (hexColors && hexColors.length >= 3) colors.accent = hexColors[2];

    if (!hexColors || hexColors.length === 0) {
      const namedColorMap: Record<string, string> = {
        "rose gold": "#B76E79", "navy blue": "#001F5B", "royal blue": "#2E3B8C",
        "sky blue": "#87CEEB", "baby blue": "#89CFF0", "teal": "#008080",
        "turquoise": "#40E0D0", "maroon": "#800000", "burgundy": "#800020",
        "crimson": "#DC143C", "scarlet": "#FF2400", "ivory": "#FFFFF0",
        "cream": "#FFFDD0", "champagne": "#F7E7CE", "gold": "#D4AF37",
        "golden": "#DAA520", "silver": "#C0C0C0", "copper": "#B87333",
        "bronze": "#CD7F32", "blush": "#DE5D83", "peach": "#FFCBA4",
        "coral": "#FF7F50", "salmon": "#FA8072", "mauve": "#E0B0FF",
        "lavender": "#E6E6FA", "lilac": "#C8A2C8", "plum": "#8E4585",
        "purple": "#800080", "wine": "#722F37", "sage": "#B2AC88",
        "mint": "#98FB98", "emerald": "#50C878", "forest green": "#228B22",
        "olive": "#808000", "charcoal": "#36454F", "slate": "#708090",
        "dusty rose": "#DCAE96", "magenta": "#FF00FF", "fuchsia": "#FF00FF",
        "white": "#FFFFFF", "black": "#000000", "red": "#FF0000",
        "blue": "#0000FF", "green": "#008000", "pink": "#FFC0CB",
        "orange": "#FFA500", "yellow": "#FFD700",
      };

      const textLower = text.toLowerCase();
      const foundColors: string[] = [];
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

  const data: ParsedInvite = {
    eventName: eventName || "",
    eventType: eventType || "event",
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    description: text
      ? "Event details extracted from uploaded document."
      : "Colors extracted from uploaded image. Please enter event name and type manually.",
  };

  // Enrich with venue, dates, and agent contact if text is available
  if (text) {
    const iFields = extractLabeledFields(text);
    const iVenue = extractVenue(text, iFields);
    if (iVenue) data.venue = iVenue;

    const iLocation = extractLocation(text, iFields);
    if (iLocation) data.location = iLocation;

    const [iCheckIn, iCheckOut] = extractDates(text, iFields);
    if (iCheckIn)  data.checkIn  = iCheckIn;
    if (iCheckOut) data.checkOut = iCheckOut;

    // nights – explicit text first, then date diff
    let iNights = extractNights(text, iFields);
    if (!iNights && iCheckIn && iCheckOut) {
      const d1 = new Date(iCheckIn), d2 = new Date(iCheckOut);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
        if (diff > 0 && diff < 90) iNights = diff;
      }
    }
    if (iNights) data.nights = iNights;

    const iAgent = extractAgentContact(text, iFields);
    if (iAgent) data.agentContact = iAgent;
  }

  return { success: true, data };
}
