"use strict";
/**
 * AI / Parsing Interfaces & Demo Data
 *
 * The actual parsing logic lives in ./local-parser.ts (regex + pdf-parse, no API key needed).
 * This file exports shared TypeScript interfaces and the demo/fallback data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDemoContractData = getDemoContractData;
exports.getDemoInviteData = getDemoInviteData;
function getDemoContractData() {
    return {
        venue: "The Grand Hyatt Resort & Spa",
        location: "Udaipur, Rajasthan",
        checkIn: "2026-04-10",
        checkOut: "2026-04-13",
        eventName: "The Sharma-Patel Wedding",
        eventType: "wedding",
        clientName: "Sharma & Patel Families",
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
function getDemoInviteData() {
    return {
        eventName: "The Sharma-Patel Wedding",
        eventType: "wedding",
        primaryColor: "#8B1A4A",
        secondaryColor: "#FFF5F5",
        accentColor: "#D4A574",
        description: "A grand celebration of love uniting the Sharma and Patel families at The Grand Hyatt Resort & Spa, Udaipur.",
    };
}
