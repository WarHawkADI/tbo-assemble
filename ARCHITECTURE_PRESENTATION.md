# TBO Assemble — System Architecture Deep Dive | 5-Slide Presentation

> **INSTRUCTIONS FOR AI PPT MAKER:**
> This document contains the complete content for a 5-slide technical architecture presentation for the VoyageHack 3.0 hackathon (prototype submission round) by TBO.com.
> Each slide has a title, subtitle, full body content, and design directives.
> Follow the design directives precisely for colors, layouts, fonts, icons, and visual elements.
> This presentation focuses exclusively on the **system architecture and technical depth** of TBO Assemble.

---

## GLOBAL DESIGN DIRECTIVES

### Brand Identity
- **Company Hosting Hackathon:** TBO.com (Travel Boutique Online) — India's leading B2B travel platform
- **Project Name:** TBO Assemble
- **Team Name:** IIITDards (from IIIT Delhi)
- **Competition:** VoyageHack 3.0 — Prototype Submission Round

### Color Palette (MUST USE)
| Role | Color | Hex | Usage |
|:-----|:------|:----|:------|
| **Primary** | TBO Orange | `#ff6b35` | Headlines, accent bars, icons, CTAs, key metrics |
| **Secondary** | Deep Orange | `#e55a2b` | Gradients paired with primary, hover states |
| **Tertiary** | TBO Blue | `#0066cc` | Secondary headings, links, charts, tech elements |
| **Background Dark** | Navy/Charcoal | `#0f172a` | Slide backgrounds (dark theme recommended) |
| **Background Alt** | Deep Slate | `#1e293b` | Card backgrounds, sections |
| **Text Primary** | White | `#ffffff` | All body text on dark slides |
| **Text Secondary** | Light Gray | `#94a3b8` | Subtitles, captions, secondary info |
| **Success** | Emerald | `#10b981` | Positive metrics, checkmarks |
| **Warning** | Amber | `#f59e0b` | Caution indicators |
| **Danger** | Red | `#ef4444` | Risk indicators |

### Typography
- **Headlines:** Bold sans-serif (Inter, Geist Sans, or Montserrat) — 36-44pt
- **Subheadlines:** Semi-bold — 24-28pt
- **Body:** Regular — 16-20pt
- **Metrics/Numbers:** Bold, oversized (48-72pt) in TBO Orange for impact
- **Code/Tech:** Monospace font (Geist Mono, JetBrains Mono, or Fira Code)

### Visual Style
- **Theme:** Dark mode (navy/charcoal backgrounds) — modern, premium tech aesthetic
- **Cards:** Rounded corners (12-16px), subtle border (`#334155`), glass-morphism effect (slight white border + blur)
- **Gradients:** Use `#ff6b35` → `#e55a2b` (orange) and `#0066cc` → `#3b82f6` (blue) gradients
- **Icons:** Use line/outline style icons (Lucide-style), colored in TBO Orange or white
- **Spacing:** Generous whitespace — do not crowd slides
- **Layout:** Wide 16:9 aspect ratio
- **Decorative:** Subtle dot grid pattern or circuit board line pattern in background (very low opacity, 3-5%) — to give a technical/engineering vibe
- **Diagrams:** Use colored boxes with connection lines/arrows for architecture diagrams. Orange for presentation layer, blue for application/data layer, green for external services.

---

## SLIDE 1 — COVER: ARCHITECTURE OVERVIEW

### Design
- Full dark background (`#0f172a`)
- Large TBO Orange gradient glow orb (blurred, 10% opacity) in center-right
- A very subtle, semi-transparent 5-layer architecture stack diagram watermarked in the background (just outlines, 5% opacity)
- Clean, centered layout

### Content

**Title:** TBO Assemble — System Architecture

**Subtitle:** Full-Stack Technical Deep Dive

**Tagline (smaller, italic, in `#94a3b8`):** 15,300 Lines of Production-Quality Code · 37 API Endpoints · 13 Data Models · Hybrid SSR + CSR

**Architecture Style Card (centered, glass-morphism card):**

| Attribute | Choice |
|:----------|:-------|
| **Pattern** | Monolithic Full-Stack (Next.js 16 App Router) |
| **Rendering** | Hybrid SSR + CSR (Server Components + Client Islands) |
| **Data Flow** | Server-first reads, REST API mutations |
| **State** | React Context + localStorage |
| **Database** | Embedded SQLite via Prisma 7 ORM |
| **AI** | OpenAI GPT-4o Vision — Contract & Invite Parsing |

**Key Metrics Bar (bottom, horizontal row of 4 stat cards in orange):**

| ~15,300 LOC | 37 API Endpoints | 13 Data Models | 42+ Routes |
|:------------|:-----------------|:---------------|:-----------|
| Across ~95 source files | GET, POST, PATCH, DELETE | Prisma schema with UUID PKs | Static + Dynamic (SSR) |

**Footer:**
- Team IIITDards | IIIT Delhi | VoyageHack 3.0 | February 2026

---

## SLIDE 2 — SYSTEM LAYERS & RENDERING STRATEGY

### Design
- Dark background with a subtle blue gradient glow on the left (engineering/technical feel)
- Main visual: **5-tier horizontal layer diagram** (stacked blocks, full width) with colored accents
  - Each layer is a dark card (`#1e293b`) with a colored left border (orange, blue, green, purple, gray)
  - Arrows between layers showing data flow
- Right side: Rendering strategy comparison card

### Title
**5-Layer Architecture: Server-First with Client Islands**

### Subtitle
Each layer is cleanly separated — Presentation, Application, Business Logic, Data Access, and Infrastructure.

### Content

**Architecture Layer Diagram (primary visual — 5 stacked layers):**

**Layer 1 — PRESENTATION (Orange accent `#ff6b35`):**
- Next.js 16 App Router with Server Components (SSR) + Client Islands (CSR)
- 42+ routes: Landing Page, Dashboard (8 sub-pages), Microsites, Booking Portal, Invoices
- Tailwind CSS v4 with full dark mode, 12 custom animations, glass-morphism cards
- Radix UI accessible primitives (Dialog, Tabs, Toast, Select, Switch, Tooltip, Progress)
- Recharts for data visualization (Bar, Pie, Area, Donut)

**Layer 2 — APPLICATION (Blue accent `#0066cc`):**
- 37 REST API endpoints across 20 route files
- Resource-oriented design: `/api/events/*`, `/api/bookings/*`, `/api/guests/*`, `/api/ai/*`
- Consistent pipeline: Validate → Duplicate Check → Business Logic → Log → Respond
- Activity logging on all mutations for audit trail

**Layer 3 — BUSINESS LOGIC (Amber accent `#f59e0b`):**
- Booking pipeline (9-step: validate → duplicate → availability → discount → price → guest → booking → addons → log)
- AI auto-allocation algorithm (3-pass: proximity → group cohesion → priority)
- Attrition engine (urgency: OVERDUE → CRITICAL → URGENT → WARNING → ON TRACK)
- Discount engine (volume-based progressive tiers, server-side calculation)
- Event state machine (draft → active → completed/cancelled)

**Layer 4 — DATA ACCESS (Green accent `#10b981`):**
- Prisma 7 ORM with Driver Adapter pattern
- 13 data models with indexed relations and cascade deletes
- Singleton pattern with dev hot-reload caching (`globalForPrisma`)
- Direct Prisma queries in Server Components (zero API hop for reads)

**Layer 5 — INFRASTRUCTURE (Gray accent `#94a3b8`):**
- SQLite embedded database (dev.db — zero-config, portable)
- OpenAI GPT-4o Vision API (external service)
- QR Code generation, WhatsApp simulation, Google Calendar links
- Vercel deployment, PWA manifest + service worker

**Rendering Strategy Card (right side, comparison):**

| Server Components (SSR) | Client Islands (CSR) |
|:------------------------|:---------------------|
| Microsite landing pages (SEO) | Dashboard interactive features |
| Event overview with stats | Drag-and-drop room allocator |
| Booking confirmation page | Analytics charts (Recharts) |
| Direct Prisma DB queries | Booking wizard (3-step form) |
| Zero client-side JS | Attrition timeline + nudges |
| **Benefit:** Fast load, SEO-indexed | **Benefit:** Rich interactivity |

**Hybrid Advantage Callout (bottom banner, orange):**
> Guest-facing microsites achieve fast load times and SEO indexing via Server Components, while the agent dashboard delivers rich interactivity via Client Islands — all within a single monolithic deployment with shared TypeScript types.

---

## SLIDE 3 — DATA ARCHITECTURE & API DEPTH

### Design
- Dark background
- Split layout: **Left half** = Entity-Relationship diagram (simplified), **Right half** = API inventory highlights
- Use orange connection lines and blue entity boxes
- Bottom section: Data integrity mechanisms in green checkmark cards

### Title
**13 Models, 37 Endpoints, Full Lifecycle Data Coverage**

### Subtitle
Every entity in the MICE/wedding workflow is digitized — from hotel contracts to guest feedback, with cascading integrity.

### Content

**Entity-Relationship Diagram (left half — simplified visual):**

```
Agent (1) ──▶ (N) Event ──▶ (N) RoomBlock ──▶ (N) Booking ──▶ (N) BookingAddOn
                    │                                │
                    ├──▶ (N) Guest ──────────────────┘
                    │         └──▶ (N) Nudge
                    ├──▶ (N) AddOn
                    ├──▶ (N) AttritionRule
                    ├──▶ (N) DiscountRule
                    ├──▶ (N) Waitlist
                    ├──▶ (N) ActivityLog
                    └──▶ (N) Feedback
```

**13 Models (compact table):**

| Model | Purpose | Key Fields |
|:------|:--------|:-----------|
| **Agent** | Event planner/travel agent | name, email (unique), company |
| **Event** | MICE event or wedding | name, slug (unique), type, venue, dates, status, brand colors |
| **RoomBlock** | Hotel room inventory per event | roomType, rate (₹), totalQty, bookedQty, floor, wing, hotelName |
| **Guest** | Event attendee | name, email, phone, group, status, allocatedFloor/Wing/Room |
| **Booking** | Guest-to-room reservation | guestId, roomBlockId, totalAmount, status, checkedIn |
| **BookingAddOn** | Add-ons attached to booking | bookingId, addOnId, price, quantity |
| **AddOn** | Optional extras per event | name, price, isIncluded (free vs paid) |
| **AttritionRule** | Release date deadlines | releaseDate, releasePercent, isTriggered |
| **DiscountRule** | Volume-based discounts | minRooms, discountPct, isActive |
| **Nudge** | WhatsApp communication records | guestId, channel, message, sentAt, status |
| **Waitlist** | Guests waiting for availability | guestName, guestEmail, roomBlockId, status |
| **ActivityLog** | Audit trail per event | action, details, actor, timestamp |
| **Feedback** | Guest reviews and ratings | guestName, rating (1-5), stayRating, eventRating, comment |

**API Highlights (right half — grouped):**

| Resource | Count | Key Operations |
|:---------|:------|:---------------|
| **Events** | 12 endpoints | CRUD, search, status transitions, clone, allocate, auto-allocate, nudge, rooming list CSV, QR batch |
| **Bookings** | 5 endpoints | Create (with discount engine), detail, cancel, check-in, room upgrade/downgrade |
| **Guests** | 5 endpoints | CRUD, CSV import/export, global search |
| **Sub-Resources** | 8 endpoints | Activity log, feedback, discount rules, bulk check-in |
| **AI & Utility** | 7 endpoints | Contract parsing (GPT-4o), waitlist management, database seed |

**Data Integrity Mechanisms (bottom row — green checkmark cards):**

| ✅ Duplicate Booking Prevention | ✅ Availability Guard | ✅ Cascading Deletes | ✅ Price Validation |
|:-------------------------------|:---------------------|:-------------------|:------------------|
| Email uniqueness per event (HTTP 409) | bookedQty < totalQty enforced (HTTP 400) | Event deletion removes ALL child records | Server recalculates; rejects amounts > 3× expected |

| ✅ Status State Machine | ✅ Nudge Deduplication | ✅ Index Optimization | ✅ Waitlist Dedup |
|:----------------------|:---------------------|:--------------------|:----------------|
| Valid transitions only: draft → active → completed/cancelled | 24-hour window prevents re-nudging same guest | eventId indexed on all event-scoped queries | Email uniqueness per room block (HTTP 409) |

---

## SLIDE 4 — AI PIPELINE & SMART ALGORITHMS

### Design
- Dark background with futuristic blue and orange gradient orbs (one top-left, one bottom-right)
- Main visual: **AI Pipeline flow diagram** (left to right: Document → GPT-4o → JSON → Platform)
- Secondary visual: 3-pass auto-allocation algorithm diagram
- Use AI/brain icon for the header area
- Card layout for each AI feature

### Title
**AI-Powered Intelligence: 4 Smart Systems**

### Subtitle
GPT-4o Vision for document parsing + custom algorithms for allocation, attrition, and discounts.

### Content

**AI System 1: GenAI Contract Parsing (primary visual — pipeline diagram):**

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Hotel        │     │  Base64 Encode    │     │  GPT-4o Vision   │     │  Structured    │
│  Contract     │────▶│  + System Prompt  │────▶│  Analysis        │────▶│  JSON Output   │
│  (PDF/Image)  │     │  (extraction      │     │  (hotel rooms,   │     │  (venue, rooms,│
│               │     │   directives)     │     │   rates, dates)  │     │   rates, dates,│
└──────────────┘     └──────────────────┘     └──────────────────┘     │   addons,      │
                                                                        │   attrition)   │
                                                                        └────────────────┘
```

| Input | Model | Output | Fallback |
|:------|:------|:-------|:---------|
| Hotel contract — PDF, image, scan, handwritten | OpenAI GPT-4o with Vision | Venue, location, dates, room types with rates & quantities, floor/wing assignments, add-ons with pricing, attrition rules | Hardcoded demo data (Grand Hyatt Udaipur, 3 rooms, 6 add-ons, 3 attrition rules) |
| Event invitation design (image/PDF) | OpenAI GPT-4o with Vision | Event name, event type, brand colors in hex (primary, secondary, accent) | Demo colors (#8B1A4A, #FFF5F5, #D4A574) |

**Impact:** Event setup reduced from **2+ hours → under 2 minutes**. Prototype **never fails** — demo fallback ensures it always works without an API key.

**AI System 2: Priority-Based Auto-Allocation Algorithm**

```
3-Pass Assignment Engine:

Pass 1: PROXIMITY REQUESTS
  "I want to be near the bride" → Same floor/wing as bride's allocated room

Pass 2: GROUP COHESION
  All "Groom Side" guests → Same floor together
  All "VIP" guests → Grouped in premium zones

Pass 3: PRIORITY ASSIGNMENT
  VIP        → Highest floors (Floor 7)
  Bride Side → Premium wings (Floor 5)
  Family     → Mid-level (Floor 3)
  Friends    → Available zones (Floor 2)
```

**Result:** 100+ guests auto-allocated to rooms in **one click** vs hours of manual spreadsheet work.

**AI System 3: Smart Attrition & Nudge Engine**

| Urgency Level | Color | Trigger | Action |
|:-------------|:------|:--------|:-------|
| **OVERDUE** | 🔴 Red | Release date passed | Alert — revenue already at risk |
| **CRITICAL** | 🔴 Red | ≤ 3 days to deadline | Auto-trigger WhatsApp nudges to all pending guests |
| **URGENT** | 🟠 Amber | ≤ 7 days to deadline | Dashboard highlight, manual nudge available |
| **WARNING** | 🟡 Yellow | ≤ 14 days to deadline | Visible in timeline, planning stage |
| **ON TRACK** | 🟢 Green | > 14 days to deadline | Monitoring only |

- Revenue-at-risk: calculated as `(unsold rooms × rate × nights)` per attrition rule
- 24-hour deduplication prevents nudge spam
- WhatsApp simulator with realistic chat UI preview

**AI System 4: Volume-Based Discount Engine**

```
Server-Side Calculation Pipeline:
  1. Count total bookings for event
  2. Find highest applicable discount tier (minRooms threshold)
  3. Calculate discount: originalPrice × (1 - discountPct/100)
  4. Validate client-submitted amount against 3× expected (fraud guard)
  5. Return { appliedDiscount, savedAmount, finalPrice }
```

- Progressive tiers: Book 5+ rooms → 5-8% off, Book 10+ rooms → 10-15% off
- Automatically displayed in microsite with "BEST VALUE" badges
- Waitlist auto-promotion fills slots when cancellations occur

---

## SLIDE 5 — TECH STACK & DESIGN PATTERNS

### Design
- Dark background
- **Left half:** Technology stack as a visual grid with colored category headers (logo + name + version + role per row)
- **Right half:** Design patterns used as icon + name + one-liner cards (2-column grid)
- **Bottom:** Key engineering metrics bar and closing statement
- Use orange for framework categories, blue for data categories, green for AI/external

### Title
**Technology Stack & Engineering Patterns**

### Subtitle
11 Design Patterns · 12 Custom Animations · Full Dark Mode · India-First Localization · PWA-Ready

### Content

**Technology Stack (left half — categorized grid):**

**🟠 Core Framework (Orange header)**

| Tech | Version | Role |
|:-----|:--------|:-----|
| Next.js (App Router) | 16.1.6 | Full-stack React framework with Turbopack |
| React | 19.2.3 | Server Components + Client Islands |
| TypeScript | 5.x | Strict type safety across full stack |

**🔵 Database & ORM (Blue header)**

| Tech | Version | Role |
|:-----|:--------|:-----|
| Prisma | 7.4.0 | Type-safe ORM with Driver Adapter pattern |
| SQLite | — | Zero-config embedded database |
| better-sqlite3 | 12.6.2 | High-performance synchronous SQLite driver |

**🟢 Frontend & UI (Green header)**

| Tech | Role |
|:-----|:-----|
| Tailwind CSS v4 | Utility-first styling, custom dark mode, 12 animations |
| Radix UI | Accessible primitives (Dialog, Toast, Tabs, Select, Switch, Tooltip) |
| Recharts 3.7 | Data visualization (Bar, Pie, Area, Donut charts) |
| Lucide React | 80+ SVG icons |
| dnd-kit | Drag-and-drop room allocation |
| class-variance-authority | Type-safe component variants (Button, Badge) |

**🟣 AI & External (Purple header)**

| Tech | Role |
|:-----|:-----|
| OpenAI GPT-4o | Vision AI — contract/invite parsing |
| QR Code API | Guest check-in QR generation |
| WhatsApp (simulated) | Nudge message delivery simulation |
| Google Calendar | Add-to-calendar deep links |

**Design Patterns (right half — 2-column card grid):**

| Pattern | Where Used |
|:--------|:-----------|
| **Repository** | Prisma singleton as data access layer (`db.ts`) |
| **Singleton** | Global Prisma client with dev hot-reload caching |
| **Provider** | React Context for Auth, Toast, I18n |
| **Adapter** | Prisma 7 Driver Adapter bridging ORM ↔ SQLite |
| **Strategy** | AI parsing with fallback (GPT-4o → demo data) |
| **Observer** | IntersectionObserver for scroll animations |
| **Template Method** | Consistent API route pipeline: validate → process → log → respond |
| **Builder** | Multi-step booking wizard (Guest → Room → Confirm) |
| **State Machine** | Event lifecycle: draft → active → completed/cancelled |
| **Facade** | Unified utility functions in `utils.ts` (formatting, escaping, colors) |
| **Decorator** | AuthGuard wrapping dashboard layout for protected routes |

**Engineering Highlights (bottom — horizontal metric cards):**

| 12 Custom Animations | Full Dark Mode | Hindi + English i18n | PWA Manifest |
|:---------------------|:---------------|:---------------------|:-------------|
| With `prefers-reduced-motion` respect | ~95% component coverage, flash-free | 120+ translated strings on microsites | Installable app + service worker |

| Keyboard Shortcuts | WCAG Accessibility | India-First Locale | CSV Injection Protection |
|:-------------------|:-------------------|:-------------------|:------------------------|
| Alt+D/N/K/A navigation + ? help | Skip-nav, ARIA labels, focus rings | INR ₹, en-IN dates, Indian phone format | XSS escaping on all exports |

**Closing Statement (centered, bold white text with orange accent):**

> **Full-stack monolith. 5 clean layers. 11 design patterns. 37 REST APIs.**
> **Server-first rendering with interactive islands. AI-powered document parsing.**
> **Built for demo speed. Architected for production scale.**

**Footer:** Team IIITDards | IIIT Delhi | VoyageHack 3.0 | February 2026

---

*End of Architecture Presentation Content*
