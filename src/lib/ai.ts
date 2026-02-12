import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface ParsedContract {
  venue: string;
  location: string;
  checkIn: string;
  checkOut: string;
  rooms: {
    roomType: string;
    rate: number;
    quantity: number;
    floor?: string;
    wing?: string;
    hotelName?: string;
  }[];
  addOns: {
    name: string;
    price: number;
    isIncluded: boolean;
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
}

export async function parseContractWithAI(
  base64File: string,
  mimeType: string
): Promise<ParsedContract> {
  // If no API key, return demo data
  if (!process.env.OPENAI_API_KEY) {
    return getDemoContractData();
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a contract parsing AI. Extract hotel group booking contract details into structured JSON. Return ONLY valid JSON with this exact structure:
{
  "venue": "Hotel Name",
  "location": "City, Country",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "rooms": [{"roomType": "Type", "rate": 0, "quantity": 0, "floor": "", "wing": ""}],
  "addOns": [{"name": "Service", "price": 0, "isIncluded": false}],
  "attritionRules": [{"releaseDate": "YYYY-MM-DD", "releasePercent": 0, "description": ""}]
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64File}`,
              },
            },
            {
              type: "text",
              text: "Parse this hotel contract and extract all booking details, room blocks, rates, dates, add-ons/inclusions, and attrition/release rules. Return structured JSON only.",
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr) as ParsedContract;
  } catch (error) {
    console.error("AI parsing error:", error);
    return getDemoContractData();
  }
}

export async function parseInviteWithAI(
  base64File: string,
  mimeType: string
): Promise<ParsedInvite> {
  if (!process.env.OPENAI_API_KEY) {
    return getDemoInviteData();
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a design AI that extracts event information and color themes from wedding/event invitations. Return ONLY valid JSON:
{
  "eventName": "Event Name",
  "eventType": "wedding",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "description": "Brief event description"
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64File}`,
              },
            },
            {
              type: "text",
              text: "Extract the event name, type (wedding/conference/mice), dominant color palette (as hex codes), and a brief description from this invitation image.",
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr) as ParsedInvite;
  } catch (error) {
    console.error("AI invite parsing error:", error);
    return getDemoInviteData();
  }
}

function getDemoContractData(): ParsedContract {
  return {
    venue: "The Grand Hyatt Resort & Spa",
    location: "Udaipur, Rajasthan",
    checkIn: "2026-04-10",
    checkOut: "2026-04-13",
    rooms: [
      { roomType: "Deluxe Room", rate: 12000, quantity: 30, floor: "2-3", wing: "East Wing", hotelName: "The Grand Hyatt Resort & Spa" },
      { roomType: "Premium Suite", rate: 22000, quantity: 15, floor: "4", wing: "East Wing", hotelName: "The Grand Hyatt Resort & Spa" },
      { roomType: "Royal Suite", rate: 45000, quantity: 5, floor: "5", wing: "Tower", hotelName: "Taj Lake Palace" },
    ],
    addOns: [
      { name: "Airport Pickup (Group)", price: 1500, isIncluded: false },
      { name: "Welcome Dinner", price: 0, isIncluded: true },
      { name: "Mehendi Ceremony Pass", price: 0, isIncluded: true },
      { name: "Gala Night Pass", price: 2500, isIncluded: false },
      { name: "Spa Package", price: 3000, isIncluded: false },
    ],
    attritionRules: [
      { releaseDate: "2026-03-10", releasePercent: 30, description: "Release 30% of unsold rooms 30 days prior" },
      { releaseDate: "2026-03-25", releasePercent: 50, description: "Release 50% of remaining unsold rooms 15 days prior" },
      { releaseDate: "2026-04-03", releasePercent: 100, description: "Release all unsold rooms 7 days prior" },
    ],
  };
}

function getDemoInviteData(): ParsedInvite {
  return {
    eventName: "The Sharma-Patel Wedding",
    eventType: "wedding",
    primaryColor: "#8B1A4A",
    secondaryColor: "#FFF5F5",
    accentColor: "#D4A574",
    description:
      "A grand celebration of love uniting the Sharma and Patel families at The Grand Hyatt Resort & Spa, Udaipur.",
  };
}
