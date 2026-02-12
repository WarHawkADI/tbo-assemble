# TBO Assemble: The Ultimate Technical Compendium

> **SYSTEM INSTRUCTION FOR AI AGENTS**:
> This document is the **absolute source of truth** for the TBO Assemble project.
> Before writing code, changing configuration, or answering architectural questions, **READ THIS FILE**.
> It contains critical configuration overrides (specifically regarding Prisma 7 + SQLite) that deviate from standard documentation.

---

## 1. Project Manifesto: What is TBO Assemble?

**Mission**: To revolutionize the "Room Block" negotiation and allocation process for large-scale events (Weddings, MICE - Meetings, Incentives, Conferences, Exhibitions).

**Context**: This is a **prototype** built for **VOYAGEHACK 3.0** (TBO.com's hackathon, Round 2). It is a working demo, not a production system. There is no authentication, no production database, and some features are simulated.

**The Problem**:
Hotel Sales Managers and Event Agents currently negotiate room rates via email chains and Excel sheets. Allocation (who gets which room) is a manual nightmare.

**The Solution**:
A unified platform where:

1. **Agents** create Events and define structure (Room Types, Rates, Block Sizes).
2. **Microsites** are generated for Guests to book rooms directly.
3. **Allocators** (Drag & Drop interface) allow Agents to assign specific guests to specific rooms/floors purely for logistics.
4. **Analytics** track fill rates, revenue, and attrition risks.
5. **Attrition Management** monitors release schedules and protects revenue with AI nudges.
6. **Check-in, Feedback, Activity Tracking** provide full event lifecycle management.

---

## 2. Technical Stack & Architecture

### Core Frameworks

| Component | Technology | Version | Usage |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 16.1.6 | Full Stack React Framework (Turbopack) |
| **Language** | TypeScript | 5.x | Strict Typed Logic |
| **Styling** | Tailwind CSS v4 | 4.x | Utility-first styling |
| **UI Components** | Custom + Radix | - | Accessible Design System |
| **Icons** | Lucide React | - | SVG Iconography |
| **Charts** | Recharts | - | Data visualization |

### Database Core (CRITICAL)

| Component | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **ORM** | Prisma Client | 7.x | **Requires Driver Adapter** |
| **Database** | SQLite | - | Local `dev.db` file |
| **Driver** | `better-sqlite3` | 12.x | High-performance synchronous driver |
| **Adapter** | `@prisma/adapter-better-sqlite3`| 7.x | Bridge between Prisma 7 & Driver |

### Key Libraries

- **Charts**: `recharts` - Visualizes block pickup, revenue, analytics, occupancy, timelines.
- **AI**: `openai` (GPT-4o) - For contract parsing, auto-allocation suggestions, nudge generation.
- **Toasts**: Custom `Toaster` context provider wrapping app children in root layout via `toast.tsx` / `toaster.tsx`.
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` - Guest-to-room allocator.

---

## 3. The "Danger Zone": Unique Configurations

**WARNING**: This project uses non-standard configurations to bypass specific Prisma 7/Windows/ESM issues. **Do not strict-refactor these without understanding why.**

### A. The Database Connection (`src/lib/db.ts`)

**Issue**: Prisma 7 + SQLite on certain Node environments fails with `TypeError: Cannot read properties of undefined (reading 'replace')` inside the driver adapter if initialized typically.

**The Fix**: We must explicitly pass the URL object to the adapter.

**Reference Code**:

```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// DO NOT CHANGE: Explicit URL object required
const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
```

### B. Seeding Strategy (In-Band API)

**Issue**: Running `prisma db seed` via CLI triggers "ESM vs CommonJS" module wars (`SyntaxError: Cannot use import statement outside a module`) because of how `ts-node` interacts with the generated Prisma Client in this Next.js 16 environment.

**The Fix**: **In-Band Seeding**. We execute seed logic *inside* the running Next.js server via an API route.

**Mechanism**:

- **Location**: `src/app/api/seed/route.ts`
- **Trigger**: `POST http://localhost:3000/api/seed`
- **UI Trigger**: Dashboard has a "Reset Demo" button that calls this endpoint
- **Benefit**: Inherits the exact same module resolution and runtime as the app itself. Zero config hell.

### C. Dark Mode System

**Custom Variant**: Tailwind v4 uses a custom variant in `globals.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));
```

**Theme Toggle**: `src/components/ui/theme-toggle.tsx` exports:
- `ThemeScript` – inline `<script>` in root layout that reads `localStorage('tbo-theme')` and applies `.dark` class on `<html>` **before paint** (prevents flash).
- `ThemeToggle` – Sun/Moon button component, used in sidebar, landing page nav, and event overview actions.

**Convention**: All components use `dark:` variants for every visible element (backgrounds, text, borders, icons). Pattern: `bg-white dark:bg-zinc-900`, `text-gray-900 dark:text-zinc-100`, `border-gray-200 dark:border-zinc-700`.

**Coverage**: Full dark mode across dashboard, landing page, microsites, and booking flow.

### D. India-Specific Formatting

All currency and date formatting is centralized in `src/lib/utils.ts`:
- `formatCurrency(n)` → `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` → outputs `₹1,23,456`
- `formatDate(d)` → `Intl.DateTimeFormat('en-IN', ...)` → outputs Indian date format
- `formatDateTime(d)` → Full date+time in en-IN locale
- **NEVER** create local formatCurrency/formatDate functions. Always import from `@/lib/utils`.
- Icon: Use `IndianRupee` from lucide-react, NOT `DollarSign`.
- Root layout: `lang="en-IN"`, OpenGraph `locale: "en_IN"`

### E. CSS Animations & Utilities (`globals.css`)

Custom keyframes and utility classes defined in `src/app/globals.css`:

| Keyframe | Utility Class | Effect |
|:---------|:-------------|:-------|
| `reveal-up` | `.reveal` / `.revealed` | Scroll-triggered fade-up entrance |
| `float` | `.animate-float` | Gentle vertical bobbing (3s) |
| `float-reverse` | `.animate-float-reverse` | Inverted float (4s) |
| `shimmer` | `.btn-shimmer` | Sweeping white highlight on buttons |
| `gradient-shift` | `.text-gradient-animated` | Animated gradient text (orange↔blue) |
| `marquee` | `.animate-marquee` | Horizontal infinite scroll ticker |
| `glow-pulse` | `.animate-glow` | Pulsing orange box-shadow |
| `spin-slow` | `.animate-spin-slow` | 20s rotation |
| `scale-in` | — | Pop-in scale effect |
| `pulse-soft` | `.animate-pulse-soft` | Gentle opacity breathing |
| — | `.tilt-card` | `transform-style: preserve-3d` for 3D tilt |
| — | `.noise` | Pseudo-element grain/noise texture overlay |
| — | `.skeleton-shimmer` | Additional skeleton loading animation |

**Accessibility**: `@media (prefers-reduced-motion: reduce)` disables all animations globally.

**Scoped Transitions**: Global `transition-colors` is applied only to interactive elements (`a, button, input, select, textarea, [role="button"], [tabindex]`) — NOT all elements via `*` selector, to avoid jank.

**Scrollbar**: Custom scrollbar styling for both Webkit (`::-webkit-scrollbar`) and Firefox (`scrollbar-width: thin; scrollbar-color`).

**Convention**: Use these existing animations rather than creating new ones. Section backgrounds use inline `style` for unique gradients/patterns.

### F. Microsite Zoom

All microsite pages (`/event/[slug]`, `/event/[slug]/book`) render at `zoom: 0.8` (80% scale). Applied via inline `style={{ zoom: 0.8 }}`. Note: the `zoom` CSS property is non-standard and may not work properly in Firefox.

### G. Root Layout Configuration (`src/app/layout.tsx`)

- `Viewport` export: Device-width, initial-scale 1, adaptive `themeColor` (light: `#fafbfc`, dark: `#09090b`)
- `Metadata` export: Title template (`%s | TBO Assemble`), keywords array, OpenGraph (locale `en_IN`), Twitter card, `manifest.json`, robots
- `<body>`: Children wrapped by `<Toaster>` context provider (NOT a sibling — it needs `{children}` as prop)
- `<head>`: `<ThemeScript />` for flash-free dark mode

### H. Security Utilities (`src/lib/utils.ts`)

- `escapeHtml(str)` — Escapes `& < > " '` to prevent XSS in HTML output (used in QR batch API)
- `escapeCsv(value)` — Prefixes CSV-injection characters (`= + - @ \t \r`) with `'` (used in rooming list export)
- `daysUntil(date)` — Days remaining to a date (used in attrition timelines)
- `calculateNights(checkIn, checkOut)` — Night count between dates
- `getStatusColor(status)` — Returns Tailwind classes with both light AND dark mode variants for: confirmed, invited, cancelled, checked-in, active, draft, completed

---

## 4. Data Model Breakdown (`prisma/schema.prisma`)

### Core Entities (13 Models)

#### 1. Agent
- **Role**: Creates events, manages room blocks.
- **Key Fields**: `company`, `email`, `password` (plain text — no auth system).
- **Relations**: Has many `Events`.

#### 2. Event
- **Visuals**: `primaryColor`, `secondaryColor`, `accentColor`, `heroImageUrl` (for microsite theming).
- **Logistics**: `checkIn`, `checkOut`, `venue`, `location`.
- **Slug**: Unique URL identifier (e.g., `/event/sharma-patel-wedding`).
- **Status**: `draft`, `active`, `completed`, `cancelled` — managed via `/api/events/[eventId]/status`
- **Relations**: `RoomBlocks`, `Guests`, `Agent`, `AddOns`, `AttritionRules`, `Bookings`, `Waitlists`, `ActivityLogs`, `Feedbacks`, `DiscountRules`.

#### 3. RoomBlock
- **Definition**: "10 Deluxe Rooms at ₹15,000/night".
- **Fields**: `roomType`, `rate`, `totalQty`, `bookedQty`, `floor`, `wing`, `hotelName`.
- **Multi-Hotel**: `hotelName` field enables multi-hotel event support (e.g., wedding across Grand Hyatt + Taj Lake Palace).
- **Purpose**: Tracks how many rooms are booked vs available.

#### 4. Guest
- **Status**: `invited`, `booked`, `confirmed`, `declined`.
- **Allocation**: `allocatedFloor`, `allocatedRoom`, `allocatedWing` (Assigned via Drag & Drop Allocator).
- **Proximity**: `proximityRequest` for grouping preferences.
- **Relations**: Has many `Bookings`, `Nudges`.

#### 5. Booking
- **Link**: Connects a `Guest` to a `RoomBlock` within an `Event`.
- **Financials**: `totalAmount`, `status` (confirmed/cancelled).
- **Check-in**: `checkedIn` (boolean), `checkedInAt` (timestamp).
- **Relations**: Has many `BookingAddOns`.
- **Duplicate Prevention**: API prevents same guest email from booking twice per event (409 response).

#### 6. AddOn
- **Definition**: Optional extras like "Airport Transfer", "Welcome Kit".
- **Fields**: `name`, `description`, `price`, `isIncluded`.
- **Relations**: Belongs to `Event`, has many `BookingAddOns`.

#### 7. BookingAddOn
- **Junction**: Links a `Booking` to an `AddOn` with captured price.

#### 8. AttritionRule
- **Purpose**: Tracks contractual release dates (e.g., "Release 20% of rooms by March 1").
- **Fields**: `releaseDate` (DateTime), `releasePercent` (Int), `description`, `isTriggered`.
- **⚠️ IMPORTANT**: The date field is `releaseDate`, NOT `deadline`. Do not use `deadline` — it doesn't exist.
- **Relations**: Belongs to `Event`.

#### 9. Nudge
- **Purpose**: Communication records sent to guests (booking reminders).
- **Fields**: `channel` (default: "whatsapp"), `message`, `sentAt`, `status`.
- **Note**: WhatsApp sending is **simulated** — nudges are created as DB records with status "sent" but no actual messages are dispatched.
- **Deduplication**: API prevents re-nudging same guest within 24 hours.
- **Relations**: Belongs to `Guest`.

#### 10. Waitlist
- **Purpose**: Tracks guests waiting for room availability.
- **Fields**: `guestName`, `guestEmail`, `guestPhone`, `status` (waiting).
- **Duplicate Prevention**: API prevents same email from joining waitlist twice (409).
- **Relations**: Belongs to `Event` and `RoomBlock`.

#### 11. ActivityLog
- **Purpose**: Audit trail for event actions.
- **Fields**: `action`, `details`, `actor` (default: "system").
- **Relations**: Belongs to `Event`.

#### 12. Feedback
- **Purpose**: Guest feedback/reviews.
- **Fields**: `guestName`, `guestEmail`, `rating` (1-5), `stayRating`, `eventRating`, `comment`.
- **Relations**: Belongs to `Event`.

#### 13. DiscountRule
- **Purpose**: Tiered discount rules based on booking volume.
- **Fields**: `minRooms` (threshold), `discountPct` (percentage off), `isActive`, `description`.
- **⚠️ IMPORTANT**: The percentage field is `discountPct`, NOT `discountPercent`. Do not use `discountPercent` — it doesn't exist.
- **Application**: The bookings API queries active rules at checkout, finds the highest applicable discount based on current booked count, and applies it to `totalAmount`.
- **Relations**: Belongs to `Event`.

---

## 5. Application Structure & Routing

### Error Handling & Loading States

| File | Scope | Description |
|:-----|:------|:------------|
| `src/app/not-found.tsx` | Global | Custom 404 — "Room Not Found" themed, gradient bg, hotel icon, home/dashboard links |
| `src/app/error.tsx` | Global | Error boundary with retry button, error digest display, dashboard link |
| `src/app/dashboard/error.tsx` | Dashboard | Dashboard-scoped error boundary |
| `src/app/dashboard/loading.tsx` | Dashboard | Uses `DashboardSkeleton` from `skeleton-loaders.tsx` |
| `src/app/dashboard/events/[eventId]/loading.tsx` | Event Detail | Uses `EventDetailSkeleton` from `skeleton-loaders.tsx` |
| `src/app/dashboard/events/[eventId]/error.tsx` | Event Detail | Event-specific error boundary |
| `src/app/event/[slug]/loading.tsx` | Microsite | Full microsite skeleton (hero, stats, room cards) |
| `src/app/event/[slug]/book/loading.tsx` | Booking | Booking page loading spinner |

### PWA Manifest

`public/manifest.json` — TBO Assemble branded, orange theme color (`#ff6b35`), standalone display mode.

### Landing Page (`/`) — Public

- **Component**: `src/app/page.tsx` (Client Component)
- **AnimatedBackground**: HTML5 Canvas mouse-reactive particle network — particles repel from cursor with connecting lines (renders behind all content via fixed canvas `z:-10`)
- **useScrollReveal Hook**: IntersectionObserver-based CSS reveal animations (`.reveal` → `.revealed`)
- **useCounter Hook**: IntersectionObserver-based animated number counters
- **TiltCard Component**: 3D perspective tilt-on-hover wrapper using `onMouseMove` transform calculations
- **Sections**:
  1. **Nav**: Sticky navbar with section anchors, ThemeToggle, "Try Demo" + dashboard links
  2. **Hero**: Gradient blobs + floating badges, CTA buttons, demo event quick-access links (MICE Conference + Wedding microsites)
  3. **Trust Marquee**: Infinite horizontal ticker of partner/credential badges
  4. **Animated Stats**: 4 stat cards with IntersectionObserver-triggered counters
  5. **4-Pillar Features**: TiltCard bento grid (Room Block Mgmt, AI Allocation, Attrition Engine, Analytics)
  6. **How it Works**: 3-step process (Upload Contract → AI Parses → Microsite Generated)
  7. **6 India-Specific Use Cases**: Wedding, MICE, Corporate, Exhibition, Social, Festival
  8. **Testimonials**: 3 Indian industry professionals with star ratings
  9. **Manual vs TBO Comparison**: 8-row side-by-side table (spreadsheets vs platform)
  10. **Why TBO Assemble**: Problem/Solution with spinning ring visual
  11. **Tech Stack Showcase**: 6 cards (Next.js 16, GPT-4o, Prisma 7, TypeScript, Tailwind v4, Recharts)
  12. **CTA**: Final call-to-action with ambient glow
  13. **Footer**: 4-column grid (Brand, Product links, Demo Events links, Tech Stack credits)
- **Section Background Animations** (each section has unique layered effects):
  - **Stats**: Animated orange dot grid pattern overlay
  - **Features**: Triple radial gradient mesh (purple/blue/orange) + diagonal stripe pattern + pulsing center blob
  - **How it Works**: Floating hollow circles + dashed spinning ring border with varied animation delays
  - **Use Cases**: Offset hexagonal dot pattern + two-tone gradient blobs (pink-rose, emerald-teal)
  - **Testimonials**: Warm amber top glow + corner orbs pulsing at different speeds + gold star dot pattern
  - **Why TBO Assemble**: Wavy gradient stripes (orange+blue) with slow pulse + two-color cross-dot pattern
  - **CTA**: Large ambient rainbow glow (orange→purple→blue) pulsing behind the dark card
- **Visual Effects**: Animated gradient text (`.text-gradient-animated`), shimmer CTA buttons (`.btn-shimmer`), pulsing glow (`.animate-glow`), noise texture overlay (`.noise`), animated nav underlines
- **Responsive**: Mobile hamburger menu, fluid grids, breakpoint-aware spacing
- **Dark Mode**: Full dark mode with ThemeToggle in navbar

### Dashboard (`/dashboard`) — Agent Portal

| Route | File | Purpose | Back Button |
|:------|:-----|:--------|:------------|
| `/dashboard` | `page.tsx` + `dashboard-client.tsx` | Events list, aggregate stats, search & filters, **Reset Demo** button | — (root) |
| `/dashboard/onboarding` | `onboarding/page.tsx` | AI event setup wizard (upload → parse → review → create) | → `/dashboard` |
| `/dashboard/analytics` | `analytics/page.tsx` + `comparative-analytics.tsx` | Cross-event comparative analytics | → `/dashboard` |
| `/dashboard/calendar` | `calendar/page.tsx` + `calendar-view.tsx` | Calendar view of all events | → `/dashboard` |
| `/dashboard/events/[eventId]` | `page.tsx` + `overview-actions.tsx` | Event overview with stats, quick links, room blocks | → `/dashboard` |
| `/dashboard/events/[eventId]/guests` | `guests/page.tsx` + `guest-management.tsx` | Guest CRUD, CSV import/export, search, filter | → Event Overview |
| `/dashboard/events/[eventId]/allocator` | `allocator/page.tsx` + `allocator-client.tsx` | Drag-and-drop guest-to-floor/wing assignment | → Event Overview |
| `/dashboard/events/[eventId]/inventory` | `inventory/page.tsx` | Room block inventory with occupancy progress bars | → Event Overview |
| `/dashboard/events/[eventId]/attrition` | `attrition/page.tsx` + `attrition-client.tsx` | Attrition timeline, nudge system, WhatsApp simulator | → Event Overview |
| `/dashboard/events/[eventId]/checkin` | `checkin-client.tsx` | Check-in management, QR-ready | → Event Overview |
| `/dashboard/events/[eventId]/feedback` | `feedback-client.tsx` | Guest feedback collection & analysis | → Event Overview |
| `/dashboard/events/[eventId]/activity` | `activity-log.tsx` | Activity audit trail | → Event Overview |

**Dashboard Layout**: `dashboard/layout.tsx` wraps all dashboard pages with `Sidebar` component and `PageTransition` wrapper containing navigation, event list, bottom utilities, and ThemeToggle.

**Back Buttons**: All sub-pages have a consistent back button (ArrowLeft icon with hover slide animation) that links to the logical parent. Event sub-pages link back to the event overview showing the event name. Top-level sub-pages (analytics, calendar, onboarding) link back to `/dashboard`.

**Navigation**: The sidebar auto-detects `eventId` from the URL path via regex and shows event-specific navigation items when inside an event context. Includes keyboard shortcuts (Ctrl+D, Ctrl+N, Ctrl+K, Ctrl+A).

**Reset Demo**: The dashboard has a "Reset Demo" button in the toolbar that calls `POST /api/seed` to re-seed the database with fresh demo data. Essential for repeatable hackathon demos.

### Guest Microsite (`/event/[slug]`) — Public

- **Global Zoom**: All microsite pages render at `zoom: 0.8` (80% scale).
- **SEO**: `generateMetadata` exports dynamic OpenGraph/Twitter metadata per event (title, description, venue, dates).
- **Landing** (`event/[slug]/page.tsx`): Server component with dynamic event theming via inline styles (`primaryColor`, `secondaryColor`, `accentColor`). Features:
  - Floating nav with WhatsApp share button (`MicrositeWhatsAppShare` from `microsite-extras.tsx`)
  - Hero with animated orbs + grid pattern + dark mode support (separate light/dark gradient divs)
  - Event status banner (past/live/upcoming event indicator)
  - Stats section (rooms, guests, nights, venue)
  - Room selection cards with `hotelName` display, sold-out/limited availability badges
  - **Discount Tiers section**: Shows volume discount rules with "BEST VALUE" badge on highest tier
  - **Attrition Timeline section**: Shows booking deadlines with countdown, release percentages, and description (only for upcoming events)
  - Perks/add-ons section, CTA, footer with agent contact email
  - Room blocks ordered by `hotelName` for multi-hotel grouping
  - Data query includes: `roomBlocks`, `addOns`, `guests`, `agent`, `discountRules`, `attritionRules`
- **Booking** (`event/[slug]/book/page.tsx` + `booking-client.tsx`): Multi-step booking form with labeled progress steps (Guest → Room → Confirm). Features:
  - **Labeled step indicator** with icons (User, Hotel, Check) and active/complete state tracking
  - Guest Details: name, email, phone, group (event-type-aware options), proximity request, **special requests** textarea
  - Room Selection: `hotelName` display on room cards in event primary color
  - Add-ons selection
  - **Terms & Conditions** checkbox (required before submit)
  - **Payment Simulation**: 4-phase processing animation (verifying availability → processing payment → securing reservation → generating confirmation) before API call
  - `bookingError` state — shows server error messages (duplicate booking, sold out, etc.)
  - Duplicate booking prevention (409), room availability validation (400)
  - Discount rules applied at checkout
  - Floating glass-card confirm button with price summary bar and shimmer effect
  - Success screen with confetti, QR code, email preview, manage booking/invoice links, discount savings banner
  - **Dark mode** support on header, form cards, and inputs
- **Feedback** (`event/[slug]/feedback/`): Guest-facing feedback submission form.
- **Client Components** (`event/[slug]/microsite-extras.tsx`): `MicrositeWhatsAppShare` — opens `wa.me` with pre-filled event invitation text.

### Booking Management (`/booking/[bookingId]`) — Public

- **Confirmation** (`booking/[bookingId]/page.tsx`): Post-booking portal with:
  - QR code for check-in
  - Status timeline (booking → confirmed → checked-in)
  - Booking details grid (guest, room, dates, venue, email)
  - Cost breakdown with itemized add-ons
  - **Add to Google Calendar** button (generates calendar link with event details, venue, dates)
  - **WhatsApp share** button (pre-filled booking confirmation message)
  - Share link (copy to clipboard)
  - Invoice link
  - Self-service cancellation
  - Back button to event microsite
- **Invoice** (`booking/[bookingId]/invoice/page.tsx`): Printable invoice with itemized breakdown, `window.print()`, print-specific CSS.

---

## 6. API Endpoints (Complete)

### Events
| Method | Route | Purpose | Error Handling |
|:-------|:------|:--------|:---------------|
| `GET` | `/api/events` | List all events with related data | 500 |
| `POST` | `/api/events` | Create new event from parsed contract | 500 |
| `GET` | `/api/events/search?q=&status=&type=` | Search and filter events | 500 |

### Event Actions
| Method | Route | Purpose | Error Handling |
|:-------|:------|:--------|:---------------|
| `POST` | `/api/events/[eventId]/allocate` | Save room allocations (floor/wing assignments) | 500 |
| `POST` | `/api/events/[eventId]/auto-allocate` | Rule-based auto-allocation (proximity → group → zone) | 404, 500 |
| `POST` | `/api/events/[eventId]/nudge` | Create nudge records (simulated WhatsApp) with **24h deduplication** + activity logging | 500 |
| `POST` | `/api/events/[eventId]/bulk-checkin` | Bulk check-in for multiple bookings (rejects cancelled bookings) | 404, 500 |
| `POST` | `/api/events/[eventId]/clone` | Clone an event with all room blocks and add-ons | 404, 500 |
| `PATCH` | `/api/events/[eventId]/status` | Event lifecycle transitions (draft→active→completed) | 400, 404, 500 |
| `GET` | `/api/events/[eventId]/activity` | Get activity log entries (limit param) | 500 |
| `POST` | `/api/events/[eventId]/activity` | Create activity log entry | 500 |
| `GET/POST` | `/api/events/[eventId]/feedback` | Get/submit event feedback | 400, 500 |
| `GET/POST/DELETE` | `/api/events/[eventId]/discount` | CRUD for discount rules | 400, 500 |
| `GET` | `/api/events/[eventId]/rooming-list` | Export rooming list as hotel-ops CSV (with **CSV injection protection**) | 404, 500 |
| `GET` | `/api/events/[eventId]/qr-batch` | Generate batch QR codes for all event guests (with **XSS protection** via `escapeHtml`) | 404, 500 |

### Guests
| Method | Route | Purpose | Error Handling |
|:-------|:------|:--------|:---------------|
| `GET` | `/api/guests?eventId=&search=&status=` | List guests with filters | 400, 500 |
| `POST` | `/api/guests` | Add guest manually | 400, 500 |
| `PUT` | `/api/guests` | Update guest details | 400, 404, 500 |
| `DELETE` | `/api/guests?id=` | Remove guest + bookings | 400, 404, 500 |
| `POST` | `/api/guests/import` | Import guests from CSV | 400, 404, 500 |
| `GET` | `/api/guests/import?eventId=` | Export guests as CSV | 400, 500 |
| `GET` | `/api/guests/search?eventId=&q=` | Search guests by name/email | 400, 500 |

### Bookings
| Method | Route | Purpose | Error Handling |
|:-------|:------|:--------|:---------------|
| `POST` | `/api/bookings` | Create booking (duplicate/availability/discount checks) | 400, 409, 500 |
| `GET` | `/api/bookings/[bookingId]` | Get booking details with cost breakdown | 404, 500 |
| `PATCH` | `/api/bookings/[bookingId]` | Update guest details / cancel booking | 404, 500 |
| `POST` | `/api/bookings/[bookingId]/checkin` | Check in a booking | 400, 404, 409, 500 |
| `POST` | `/api/bookings/[bookingId]/upgrade` | Upgrade/downgrade room type | 400, 404, 409, 500 |

### Other
| Method | Route | Purpose | Error Handling |
|:-------|:------|:--------|:---------------|
| `POST` | `/api/ai/parse` | AI contract parsing (with demo fallback) | 500 |
| `POST` | `/api/seed` | Seed database with demo data (also triggered by "Reset Demo" button) | 500 |
| `POST/GET` | `/api/waitlist` | Join/list waitlist (with duplicate prevention) | 400, 404, 409, 500 |

---

## 7. Seed Data Details

The seed (`POST /api/seed`) creates comprehensive demo data:

### Agent
- **Rajesh Kumar** — TBO Group Travel

### Events
1. **Sharma-Patel Grand Wedding** (slug: `sharma-patel-wedding`)
   - Venue: The Grand Hyatt, Mumbai | Dates: +30 to +33 days from now
   - Colors: Blue/Light Blue/Blue | Status: active
   - Room Blocks:
     - Deluxe Room (₹15,000, 20 qty, Floor 3, East Wing) — **The Grand Hyatt Resort & Spa**
     - Premium Suite (₹25,000, 10 qty, Floor 5, North Wing) — **The Grand Hyatt Resort & Spa**
     - Royal Suite (₹45,000, 5 qty, Floor 7, Penthouse Wing) — **Taj Lake Palace** (different hotel!)
   - 17 Guests across 4 groups (Bride Side, Groom Side, Family, Friends)
   - Bookings for confirmed guests, VIP floor allocations
   - Discount Rules: 5+ rooms → 8% off, 10+ rooms → 12% off

2. **TechVista Conference 2025** (slug: `techvista-conference-2025`)
   - Venue: JW Marriott, Bengaluru | Dates: +60 to +63 days from now
   - Colors: Emerald/Light Emerald/Emerald | Status: active
   - Room Blocks:
     - Business Room (₹8,000, 30 qty, Floor 2, Conference Wing) — **JW Marriott Convention Centre**
     - Executive Suite (₹18,000, 15 qty, Floor 4, Executive Wing) — **JW Marriott Convention Centre**
   - 9 Guests (speakers + attendees)
   - Discount Rules: 10+ rooms → 5% off, 20+ rooms → 10% off

---

## 8. UI Components & Design System

### Brand Colors (TBO)

- **Primary Orange**: `#ff6b35` (TBO signature color)
- **Secondary Orange**: `#e55a2b`
- **Primary Blue**: `#0066cc`
- **Navy**: `#1e293b`

### Component Library (`src/components/ui/`)

| Component | File | Dark Mode | Notes |
|:----------|:-----|:----------|:------|
| **Button** | `button.tsx` | ✅ | Orange gradient primary, outline, ghost, destructive variants |
| **Card** | `card.tsx` | ✅ | `dark:bg-zinc-900 dark:border-zinc-800` |
| **Badge** | `badge.tsx` | ✅ | success, warning, destructive, secondary, outline variants |
| **Progress** | `progress.tsx` | ✅ | Orange gradient indicator, custom `indicatorClassName` prop |
| **Input** | `input.tsx` | ✅ | Orange focus ring |
| **Skeleton** | `skeleton.tsx` | ✅ | Loading placeholder |
| **SkeletonLoaders** | `skeleton-loaders.tsx` | ✅ | `DashboardSkeleton`, `EventDetailSkeleton`, section-specific skeletons |
| **Toast** | `toast.tsx` + `toaster.tsx` | ✅ | Context-based notifications, wraps app children |
| **ThemeToggle** | `theme-toggle.tsx` | ✅ | Sun/Moon toggle + ThemeScript for flash prevention |
| **AnimatedCounter** | `animated-counter.tsx` | ✅ | Animated number counter with prefix/suffix/formatter |
| **Confetti** | `confetti.tsx` | ✅ | Celebration animation on successful booking |
| **Countdown** | `countdown.tsx` | ✅ | Countdown timer component |
| **StatusTimeline** | `status-timeline.tsx` | ✅ | Step-based timeline (booking, check-in statuses) |
| **EmptyState** | `empty-state.tsx` | ✅ | Empty state placeholder with icon + message |
| **PageTransition** | `page-transition.tsx` | ✅ | Animated page transitions for dashboard |

### Dashboard Components (`src/components/dashboard/`)

| Component | Purpose | Dark Mode | Key Features |
|:----------|:--------|:----------|:-------------|
| `dashboard-client.tsx` | Events list + search | ✅ | AnimatedCounters, debounced search, status/type filters, auto-refresh 30s, copy link, clone event, **Reset Demo** button |
| `analytics-charts.tsx` | Recharts visualizations | ✅ | ₹ formatting, en-IN date locale |
| `guest-management.tsx` | Guest CRUD + CSV | ✅ | Import/export, search, filter |
| `allocator-client.tsx` | Drag-and-drop allocator | ✅ | Group colors, floor/wing grid, proximity cards |
| `attrition-client.tsx` | Attrition management | ✅ | IndianRupee icon, timeline, WhatsApp simulator |
| `sidebar.tsx` | Dashboard navigation | ✅ | Collapsible, event list, auto-detects eventId, keyboard shortcuts, ThemeToggle, LogOut, Help |
| `checkin-client.tsx` | Check-in management | ✅ | QR-ready |
| `activity-log.tsx` | Activity audit trail | ✅ | Filterable log entries |
| `calendar-view.tsx` | Calendar visualization | ✅ | Monthly event view |
| `comparative-analytics.tsx` | Cross-event comparison | ✅ | Multi-event charts |
| `whatsapp-simulator.tsx` | WhatsApp message preview | ✅ | Simulated chat UI |

### Microsite Components (`src/components/microsite/`)

| Component | Purpose | Notes |
|:----------|:--------|:------|
| `booking-client.tsx` | Booking wizard + success | Dynamic theming, labeled step indicator, terms checkbox, special requests, payment simulation, glass-card confirm button with price summary, bookingError display, discount, shimmer, confetti, zoom 0.8, dark mode |

---

## 9. Key Business Logic

### Booking Flow (POST /api/bookings)
1. **Duplicate Check**: Query existing bookings for the guest's email + event. If found → 409.
2. **Availability Check**: Verify `roomBlock.bookedQty < roomBlock.totalQty`. If full → 400.
3. **Discount Application**: Query active `DiscountRule`s for the event. Find the highest applicable rule where `currentBookedCount >= minRooms`. Apply `discountPct` to the total amount.
4. **Create Guest + Booking**: Create/link guest, create booking with `totalAmount`, create `BookingAddOn` records.
5. **Increment `bookedQty`**: Manually increment on the room block.
6. **Activity Log**: Log the booking with discount note if applicable.
7. **Response**: Return booking details + discount info (`{ percent, originalAmount, finalAmount }`).

### Payment Simulation (Client-Side)
The booking form shows a 4-phase processing animation before the actual API call:
1. "Verifying room availability..."
2. "Processing payment of ₹X..."
3. "Securing your reservation..."
4. "Generating confirmation..."
Each phase displays for 700ms, creating a realistic payment flow feeling. **No actual payment processing occurs** — this is a demo.

### Auto-Allocation Algorithm (POST /api/events/[eventId]/auto-allocate)
- Priority-based floor allocation: VIP → Bride Side → Groom Side → Family → Friends
- Respects proximity requests (guests requesting to be near others)
- Groups members on the same floor/wing
- Assigns highest floors to highest priority groups

### Attrition Management
- Release dates with percentage thresholds
- Visual timeline on dashboard AND microsite (upcoming events only)
- Simulated WhatsApp nudges to pending guests with **24-hour deduplication** (won't re-nudge same guest within 24h)
- Activity logging on nudge actions

### API Hardening
- **XSS Prevention**: Guest names escaped via `escapeHtml()` in QR batch HTML output
- **CSV Injection Prevention**: Cell values processed through `escapeCsv()` in rooming list export
- **Cancelled Booking Guard**: Bulk check-in rejects cancelled bookings (won't check in a cancelled reservation)
- **Nudge Spam Prevention**: 24-hour deduplication on nudge endpoint, activity logging, graceful handling of 0 pending guests

---

## 10. Known Prototype Limitations

These are **known and accepted** limitations for a hackathon prototype:

| Area | Limitation |
|:-----|:-----------|
| **Authentication** | No auth system — agent is hardcoded "Rajesh Kumar", seed API is unprotected |
| **Database** | SQLite single-file DB, no concurrent write support |
| **Transactions** | Booking creation spans multiple DB operations without transactional wrapper |
| **`bookedQty` Integrity** | Manually incremented on booking, never decremented on cancellation/upgrade |
| **WhatsApp/Nudges** | Simulated — records created but no actual messages sent |
| **Payment** | Simulated — 4-phase animation but no real payment gateway integration |
| **QR Codes** | Generated via external service `api.qrserver.com` |
| **Amount Validation** | `totalAmount` originates from client; server recalculates with discounts but base amount comes from client |
| **Group Dropdown** | Booking form has event-type-aware groups (wedding: Bride/Groom Side; MICE: Speaker/Attendee) |
| **Firefox** | `zoom: 0.8` CSS is non-standard, may not render correctly |
| **Pagination** | No pagination on events/guests lists — fine for demo data volume |

---

## 11. Developer Workflow

### Initial Setup

1. **Install**: `npm install`
2. **Generate Client**: `npx prisma generate`
3. **Push Schema**: `npx prisma db push` (creates tables)
4. **Start Server**: `npm run dev`
5. **Seed Data**: `POST http://localhost:3000/api/seed` (or use "Reset Demo" button in dashboard)

### Making Schema Changes

1. Edit `prisma/schema.prisma`.
2. Push Changes: `npx prisma db push` (for development).
3. **Regenerate Client**: `npx prisma generate` (Crucial step with the Adapter).
4. Restart Dev Server (Next.js config often caches the DB connection).

### Troubleshooting Cheatsheet

| Symptom | Probable Cause | Fix |
| :--- | :--- | :--- |
| `TypeError: ...reading 'replace'` | `db.ts` connection string is just a string. | Change to `{ url: "file:..." }` object. |
| `PrismaClientInitializationError` | Query Engine binary mismatch. | Run `npx prisma generate`. |
| `SyntaxError: import statement` | Running `npx prisma db seed`. | Don't. Use `/api/seed` endpoint. |
| `Table does not exist` | DB was reset without schema push. | Run `npx prisma db push`. |
| "Database is locked" | SQLite concurrency issue. | Restart server, ensure no other DB viewers are writing. |
| ESLint "inline styles" warnings | Microsite uses dynamic event colors. | **Expected**. Inline styles required for DB-driven colors. |
| Dark mode flash on load | ThemeScript not in layout. | Ensure `<ThemeScript />` is in root `layout.tsx` `<head>`. |
| `deadline` field error | Using wrong field name. | AttritionRule uses `releaseDate`, NOT `deadline`. |
| `discountPercent` field error | Using wrong field name. | DiscountRule uses `discountPct`, NOT `discountPercent`. |
| `contactEmail` field error | Field doesn't exist on Event. | Use `event.agent.email` (include `agent: true` in query). |

---

## 12. Build Output (42+ Routes)

```
Route (app)
├ ○ /                                          (Static landing page)
├ ○ /_not-found                                (Custom 404 page)
├ ƒ /api/ai/parse
├ ƒ /api/bookings
├ ƒ /api/bookings/[bookingId]
├ ƒ /api/bookings/[bookingId]/checkin
├ ƒ /api/bookings/[bookingId]/upgrade
├ ƒ /api/events
├ ƒ /api/events/[eventId]/activity
├ ƒ /api/events/[eventId]/allocate
├ ƒ /api/events/[eventId]/auto-allocate
├ ƒ /api/events/[eventId]/bulk-checkin
├ ƒ /api/events/[eventId]/clone
├ ƒ /api/events/[eventId]/discount
├ ƒ /api/events/[eventId]/feedback
├ ƒ /api/events/[eventId]/nudge
├ ƒ /api/events/[eventId]/qr-batch
├ ƒ /api/events/[eventId]/rooming-list
├ ƒ /api/events/[eventId]/status
├ ƒ /api/events/search
├ ƒ /api/guests
├ ƒ /api/guests/import
├ ƒ /api/guests/search
├ ƒ /api/seed
├ ƒ /api/waitlist
├ ƒ /booking/[bookingId]
├ ƒ /booking/[bookingId]/invoice
├ ƒ /dashboard
├ ƒ /dashboard/analytics
├ ƒ /dashboard/calendar
├ ƒ /dashboard/events/[eventId]
├ ƒ /dashboard/events/[eventId]/activity
├ ƒ /dashboard/events/[eventId]/allocator
├ ƒ /dashboard/events/[eventId]/attrition
├ ƒ /dashboard/events/[eventId]/checkin
├ ƒ /dashboard/events/[eventId]/feedback
├ ƒ /dashboard/events/[eventId]/guests
├ ƒ /dashboard/events/[eventId]/inventory
├ ○ /dashboard/onboarding
├ ƒ /event/[slug]
├ ƒ /event/[slug]/book
└ ƒ /event/[slug]/feedback
```

`○` = Static, `ƒ` = Dynamic (force-dynamic or server-rendered)

---

**End of Technical Compendium**
