# TBO Assemble — System Architecture & Design Document

> **Version:** 1.0 | **Date:** February 22, 2026 | **Team:** IIITDards | **Competition:** VoyageHack 3.0, Prototype Round

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architectural Philosophy & Design Patterns](#2-architectural-philosophy--design-patterns)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Technology Stack — Decisions & Rationale](#4-technology-stack--decisions--rationale)
5. [Data Architecture](#5-data-architecture)
6. [Application Layer Architecture](#6-application-layer-architecture)
7. [API Architecture](#7-api-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [AI/ML Integration Architecture](#9-aiml-integration-architecture)
10. [Security Architecture](#10-security-architecture)
11. [User Experience Architecture](#11-user-experience-architecture)
12. [Business Logic Architecture](#12-business-logic-architecture)
13. [Deployment & DevOps Architecture](#13-deployment--devops-architecture)
14. [Scalability & Production Roadmap](#14-scalability--production-roadmap)
15. [Architecture Decision Records (ADRs)](#15-architecture-decision-records-adrs)
16. [Module Inventory](#16-module-inventory)

---

## 1. Executive Summary

**TBO Assemble** is a Group Inventory Management Platform paired with event-specific branded microsites, designed to digitize the offline-heavy MICE (Meetings, Incentives, Conferences, Exhibitions) and destination wedding coordination process.

### Problem Statement

Group travel for MICE events and destination weddings is still largely coordinated offline — through emails, spreadsheets, and manual follow-ups with multiple suppliers. There is no structured digital system to manage customized, group-specific inventory or present it cohesively to attendees.

### Solution Architecture

TBO Assemble is a **full-stack monolithic application** built on the **Next.js App Router** (v16.1.6), following a **Server-First Rendering** pattern with **Islands of Interactivity** for complex client-side features. It comprises:

- **Agent Dashboard** — Full event lifecycle management (create → allocate → track → check-in → analyze)
- **Guest Microsites** — Per-event branded booking portals with real-time inventory
- **AI Pipeline** — GPT-4o-powered contract/invite parsing for one-click event setup
- **Analytics Engine** — Real-time cross-event comparative analytics and revenue tracking
- **Inventory Engine** — Room block management with attrition protection and discount automation

### Architecture Style

| Attribute | Choice | Rationale |
|:----------|:-------|:----------|
| **Pattern** | Monolithic Full-Stack (Next.js App Router) | Single deployment, shared types, minimal network hops for prototype |
| **Rendering** | Hybrid SSR + CSR (Server Components + Client Islands) | SEO for microsites, interactivity for dashboard |
| **Data Flow** | Server-first with API Routes for mutations | Direct Prisma queries in server components, REST API for client mutations |
| **State** | Local React State + Context API | No global store needed; auth + i18n are app-wide contexts |
| **Database** | Embedded SQLite via Prisma ORM | Zero-config, portable, ideal for demo/prototype |

---

## 2. Architectural Philosophy & Design Patterns

### 2.1 Design Principles

1. **Server-First Data Fetching**: Server Components query the database directly — no API round-trip for read paths. Only mutations go through API routes.
2. **Islands Architecture**: Complex interactive features (drag-and-drop allocator, charts, booking wizard) are isolated as Client Components (`"use client"`) embedded within server-rendered pages.
3. **Event-Driven Inventory**: Every inventory operation (booking, cancellation, upgrade) triggers cascading state updates (bookedQty, activity logs, waitlist promotions).
4. **Progressive Enhancement**: Landing page works without JavaScript for SEO. Dashboard degrades gracefully with skeleton loaders. Dark mode applies before paint via inline script.
5. **Convention Over Configuration**: Centralized utilities (`utils.ts`) enforce consistent formatting (INR currency, en-IN dates), security (XSS/CSV escaping), and styling (status colors).

### 2.2 Design Patterns Used

| Pattern | Implementation | Where Used |
|:--------|:---------------|:-----------|
| **Repository Pattern** | Prisma Client as data access layer; all DB queries centralized through `prisma` singleton | `src/lib/db.ts`, all API routes |
| **Singleton** | Global Prisma client instance with dev hot-reload caching | `db.ts` (`globalForPrisma`) |
| **Provider Pattern** | React Context for cross-cutting concerns | `AuthProvider`, `Toaster`, `I18nProvider` |
| **Adapter Pattern** | Prisma 7 Driver Adapter bridging ORM ↔ SQLite driver | `PrismaBetterSqlite3` adapter |
| **Strategy Pattern** | AI parsing with fallback strategy (GPT-4o → hardcoded demo data) | `ai.ts` (try OpenAI, catch → demo) |
| **Observer Pattern** | IntersectionObserver for scroll animations and counter triggers | Landing page hooks |
| **Template Method** | Consistent API route structure: validate → process → log → respond | All 30+ API endpoints |
| **Builder Pattern** | Multi-step booking wizard (Guest → Room → Confirm) | `booking-client.tsx` |
| **State Machine** | Event lifecycle transitions (draft → active → completed/cancelled) | `/api/events/[eventId]/status` |
| **Facade Pattern** | Unified utility functions hiding complexity | `utils.ts` (formatting, escaping, status colors) |
| **Decorator Pattern** | `AuthGuard` wrapping dashboard layout for protected routes | `auth-guard.tsx` → `dashboard/layout.tsx` |

### 2.3 Separation of Concerns

```
┌──────────────────────────────────────────────────┐
│                PRESENTATION LAYER                 │
│  Server Components (SSR) + Client Islands (CSR)  │
│  Landing Page │ Dashboard │ Microsite │ Booking   │
├──────────────────────────────────────────────────┤
│               APPLICATION LAYER                   │
│  API Routes (REST) + Server Actions               │
│  30+ endpoints: CRUD, Business Logic, AI Parse    │
├──────────────────────────────────────────────────┤
│              BUSINESS LOGIC LAYER                 │
│  Booking Pipeline │ Auto-Allocator │ Attrition    │
│  Discount Engine │ Nudge System │ State Machine   │
├──────────────────────────────────────────────────┤
│                DATA ACCESS LAYER                  │
│  Prisma 7 ORM + SQLite Driver Adapter             │
│  13 Models │ Relations │ Indexes │ Cascades       │
├──────────────────────────────────────────────────┤
│               INFRASTRUCTURE LAYER                │
│  SQLite (dev.db) │ Vercel Edge │ QR Service       │
│  OpenAI GPT-4o │ localStorage │ Service Worker    │
└──────────────────────────────────────────────────┘
```

---

## 3. High-Level System Architecture

### 3.1 System Context Diagram (C4 Level 1)

```
                                    ┌──────────────────┐
                                    │    OpenAI API     │
                                    │   (GPT-4o Vision) │
                                    └────────┬─────────┘
                                             │ Contract/Invite
                                             │ Parsing
    ┌──────────────┐              ┌──────────▼──────────┐              ┌──────────────┐
    │  Event Agent  │──────────▶  │   TBO ASSEMBLE      │  ◀──────────│  Event Guest  │
    │  (Planner)    │  Dashboard  │   (Next.js 16 App)  │  Microsite  │  (Attendee)   │
    │               │◀──────────  │                     │  ──────────▶│               │
    └──────────────┘              └──────────┬──────────┘              └──────────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │  SQLite Database  │
                                    │   (dev.db file)   │
                                    └──────────────────┘
```

### 3.2 Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TBO ASSEMBLE APPLICATION                                │
│                                                                                      │
│  ┌─────────────────────────┐    ┌────────────────────────────────┐                  │
│  │    NEXT.JS SERVER        │    │    NEXT.JS CLIENT (Browser)    │                  │
│  │                          │    │                                │                  │
│  │  ┌───────────────────┐   │    │  ┌──────────────────────────┐ │                  │
│  │  │ Server Components  │   │    │  │ Client Components        │ │                  │
│  │  │ • page.tsx (SSR)   │   │    │  │ • dashboard-client.tsx   │ │                  │
│  │  │ • Microsite pages  │   │    │  │ • booking-client.tsx     │ │                  │
│  │  │ • Event overview   │   │    │  │ • allocator-client.tsx   │ │                  │
│  │  └────────┬──────────┘   │    │  │ • analytics-charts.tsx   │ │                  │
│  │           │ Direct DB     │    │  │ • attrition-client.tsx   │ │                  │
│  │  ┌────────▼──────────┐   │    │  │ • checkin-client.tsx     │ │                  │
│  │  │ API Route Handlers │   │    │  └──────────┬───────────────┘ │                  │
│  │  │ • /api/events/*    │   │    │             │ fetch()          │                  │
│  │  │ • /api/bookings/*  │   │◀───┼─────────────┘                 │                  │
│  │  │ • /api/guests/*    │   │    │                                │                  │
│  │  │ • /api/ai/parse    │   │    │  ┌──────────────────────────┐ │                  │
│  │  │ • /api/seed        │   │    │  │ Context Providers         │ │                  │
│  │  │ • /api/waitlist    │   │    │  │ • AuthProvider            │ │                  │
│  │  └────────┬──────────┘   │    │  │ • Toaster                 │ │                  │
│  │           │               │    │  │ • I18nProvider            │ │                  │
│  │  ┌────────▼──────────┐   │    │  └──────────────────────────┘ │                  │
│  │  │ Prisma 7 ORM       │   │    └────────────────────────────────┘                  │
│  │  │ + Driver Adapter   │   │                                                        │
│  │  └────────┬──────────┘   │                                                        │
│  │           │               │                                                        │
│  └───────────┼───────────────┘                                                        │
│              │                                                                        │
│  ┌───────────▼───────────┐    ┌──────────────────────┐                               │
│  │   SQLite Database      │    │   External Services   │                               │
│  │   (dev.db - embedded)  │    │   • OpenAI GPT-4o     │                               │
│  │   13 tables            │    │   • QR Code API       │                               │
│  │   UUID primary keys    │    │   • WhatsApp (sim.)   │                               │
│  └────────────────────────┘    └──────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Diagram (C4 Level 3 — Key Flows)

#### Booking Flow Architecture

```
Guest Browser                  Next.js Server                    Database
     │                              │                               │
     │  GET /event/[slug]           │                               │
     │─────────────────────────────▶│                               │
     │                              │  prisma.event.findUnique()    │
     │                              │──────────────────────────────▶│
     │                              │◀──────────────────────────────│
     │   SSR HTML (Microsite)       │                               │
     │◀─────────────────────────────│                               │
     │                              │                               │
     │  GET /event/[slug]/book      │                               │
     │─────────────────────────────▶│                               │
     │   SSR with BookingClient     │                               │
     │◀─────────────────────────────│                               │
     │                              │                               │
     │  [User fills 3-step form]    │                               │
     │  [Payment simulation 4-phase]│                               │
     │                              │                               │
     │  POST /api/bookings          │                               │
     │─────────────────────────────▶│                               │
     │                              │  1. Duplicate check           │
     │                              │  2. Availability check        │
     │                              │  3. Discount calculation      │
     │                              │  4. Price validation          │
     │                              │  5. Create Guest              │
     │                              │  6. Create Booking            │
     │                              │  7. Create BookingAddOns      │
     │                              │  8. Increment bookedQty       │
     │                              │  9. Log Activity              │
     │                              │──────────────────────────────▶│
     │                              │◀──────────────────────────────│
     │   { booking, discount }      │                               │
     │◀─────────────────────────────│                               │
     │                              │                               │
     │  [Confetti + Success Screen] │                               │
     │  [QR Code + Invoice Link]    │                               │
```

#### AI Onboarding Flow Architecture

```
Agent Browser                  Next.js Server                    OpenAI
     │                              │                               │
     │  Navigate to /onboarding     │                               │
     │  Upload contract PDF/image   │                               │
     │  Upload invite design        │                               │
     │                              │                               │
     │  POST /api/ai/parse          │                               │
     │  (multipart/form-data)       │                               │
     │─────────────────────────────▶│                               │
     │                              │  Base64 encode files          │
     │                              │  parseContractWithAI()        │
     │                              │──────────────────────────────▶│
     │                              │  GPT-4o Vision analysis       │
     │                              │◀──────────────────────────────│
     │                              │  parseInviteWithAI()          │
     │                              │──────────────────────────────▶│
     │                              │  GPT-4o color/theme extract   │
     │                              │◀──────────────────────────────│
     │  { contract, invite }        │                               │
     │◀─────────────────────────────│                               │
     │                              │                               │
     │  [Agent reviews parsed data] │                               │
     │  [Edits room blocks/dates]   │                               │
     │                              │                               │
     │  POST /api/events            │                               │
     │─────────────────────────────▶│                               │
     │                              │  Create Event + RoomBlocks    │
     │                              │  + AddOns + AttritionRules    │
     │                              │  + ActivityLog                │
     │  { event }                   │                               │
     │◀─────────────────────────────│                               │
     │                              │                               │
     │  Redirect to event dashboard │                               │
```

---

## 4. Technology Stack — Decisions & Rationale

### 4.1 Core Framework

| Technology | Version | Role | Why Chosen |
|:-----------|:--------|:-----|:-----------|
| **Next.js** (App Router) | 16.1.6 | Full-stack framework | Server Components for SEO, API routes for mutations, Turbopack for fast DX, single deployment |
| **React** | 19.2.3 | UI library | Server Components, Suspense, concurrent features |
| **TypeScript** | 5.x | Type safety | Strict typing across full stack, shared interfaces between server/client |

### 4.2 Database Stack

| Technology | Version | Role | Why Chosen |
|:-----------|:--------|:-----|:-----------|
| **Prisma** | 7.4.0 | ORM | Type-safe queries, migrations, relation management, generated client |
| **SQLite** | — | Database | Zero-config, portable, embedded — ideal for prototype deployment |
| **better-sqlite3** | 12.6.2 | Driver | High-performance synchronous SQLite driver for Node.js |
| **@prisma/adapter-better-sqlite3** | 7.4.0 | Adapter | Required bridge for Prisma 7 Driver Adapter architecture |

**Critical Configuration**: Prisma 7 with SQLite on certain Node environments requires explicit URL object (`{ url: "file:./dev.db" }`) passed to the adapter — not a plain string. This is a non-standard configuration documented in the codebase.

### 4.3 Frontend Stack

| Technology | Role | Why Chosen |
|:-----------|:-----|:-----------|
| **Tailwind CSS v4** | Styling | Utility-first, dark mode variants, custom animations |
| **Radix UI** | Accessible primitives | Dialog, Dropdown, Toast, Tabs, Select, Switch, Tooltip, Progress, Label, Slot |
| **Recharts** | Data visualization | React-native charting: Bar, Pie, Area, Donut charts |
| **Lucide React** | Iconography | 80+ icons used across the app, consistent SVG icon set |
| **class-variance-authority** | Component variants | Type-safe variant system for Button, Badge |
| **date-fns** | Date utilities | Lightweight date manipulation |

### 4.4 AI Stack

| Technology | Role | Why Chosen |
|:-----------|:-----|:-----------|
| **OpenAI GPT-4o** | Vision AI | Contract parsing (PDF/image → structured JSON), invite color extraction |
| **Fallback Strategy** | Demo resilience | Hardcoded demo data if no API key — ensures demo always works |

### 4.5 Drag & Drop

| Technology | Role | Why Chosen |
|:-----------|:-----|:-----------|
| **@dnd-kit/core** | DnD foundation | Modern, accessible drag-and-drop for React |
| **@dnd-kit/sortable** | Sortable lists | Used for guest-to-room/floor allocation grid |

### 4.6 Supporting Libraries

| Library | Role |
|:--------|:-----|
| `clsx` + `tailwind-merge` | Class name composition |
| `uuid` | UUID generation for entities |
| `next-auth` | Auth primitives (installed but using custom context for prototype) |

---

## 5. Data Architecture

### 5.1 Entity-Relationship Diagram

```
                                    ┌──────────┐
                                    │  Agent   │
                                    │──────────│
                                    │ id (PK)  │
                                    │ name     │
                                    │ email    │
                                    │ company  │
                                    └────┬─────┘
                                         │ 1:N
                                         ▼
                           ┌─────────────────────────────┐
                           │          Event               │
                           │─────────────────────────────│
                           │ id (PK), slug (UNIQUE)       │
                           │ name, type, venue, location  │
                           │ checkIn, checkOut, status    │
                           │ primaryColor, secondaryColor │
                           │ accentColor, heroImageUrl    │
                           │ agentId (FK → Agent)         │
                           └──┬────┬────┬────┬────┬──────┘
               ┌──────────────┤    │    │    │    │
               │              │    │    │    │    │
               ▼              ▼    │    ▼    │    ▼
        ┌──────────┐  ┌────────┐  │  ┌─────────────┐ ┌──────────────┐
        │ RoomBlock │  │ Guest  │  │  │AttritionRule│ │DiscountRule  │
        │──────────│  │────────│  │  │─────────────│ │──────────────│
        │ roomType  │  │ name   │  │  │ releaseDate │ │ minRooms     │
        │ rate      │  │ email  │  │  │ releasePct  │ │ discountPct  │
        │ totalQty  │  │ phone  │  │  │ isTriggered │ │ isActive     │
        │ bookedQty │  │ group  │  │  └─────────────┘ └──────────────┘
        │ floor     │  │ status │  │
        │ wing      │  │ alloc* │  │  Also: AddOn, Waitlist,
        │ hotelName │  └───┬────┘  │  ActivityLog, Feedback
        └────┬─────┘      │       │
             │             │       │
             │     ┌───────┘       │
             │     │               │
             ▼     ▼               │
        ┌──────────────┐           │
        │   Booking     │◀──────────┘
        │──────────────│
        │ guestId (FK)  │
        │ roomBlockId   │
        │ eventId (FK)  │             ┌──────────────┐
        │ totalAmount   │────────────▶│ BookingAddOn  │
        │ status        │  1:N        │──────────────│
        │ checkedIn     │             │ addOnId (FK)  │
        └──────────────┘             │ price, qty    │
                                      └──────────────┘
```

### 5.2 Model Summary (13 Models)

| Model | Records (Seed) | Key Fields | Indexes | Cascade Delete |
|:------|:---------------|:-----------|:--------|:---------------|
| **Agent** | 1 | name, email (unique), password, company | email | — |
| **Event** | 7 | name, slug (unique), type, venue, status, colors | slug | — |
| **RoomBlock** | ~21 | roomType, rate, totalQty, bookedQty, hotelName | eventId | from Event |
| **Guest** | ~135 | name, email, status, group, allocated* | eventId | from Event |
| **Booking** | ~80 | guestId, roomBlockId, totalAmount, status, checkedIn | eventId, guestId | from Event, Guest |
| **BookingAddOn** | ~60 | bookingId, addOnId, price, quantity | bookingId | from Booking |
| **AddOn** | ~30 | name, price, isIncluded | eventId | from Event |
| **AttritionRule** | ~15 | releaseDate, releasePercent, isTriggered | — | from Event |
| **DiscountRule** | ~15 | minRooms, discountPct, isActive | eventId | from Event |
| **Nudge** | ~5 | guestId, channel, message, status | — | from Guest |
| **Waitlist** | ~6 | guestName, guestEmail, roomBlockId, status | eventId | from Event |
| **ActivityLog** | ~30 | action, details, actor | eventId | from Event |
| **Feedback** | ~22 | guestName, rating, stayRating, eventRating, comment | eventId | from Event |

### 5.3 Data Integrity Mechanisms

| Mechanism | Implementation |
|:----------|:---------------|
| **Duplicate Booking Prevention** | Email uniqueness check per event before booking creation (409 response) |
| **Availability Guard** | `bookedQty < totalQty` check before booking confirmation |
| **Cascading Deletes** | `onDelete: Cascade` on all child relations — event deletion removes all children |
| **Index Optimization** | Indexes on `eventId` for all event-scoped queries, `guestId` on bookings |
| **Status Transitions** | State machine validation: draft→active→completed/cancelled with defined transitions |
| **Nudge Deduplication** | 24-hour window check prevents spam (won't re-nudge same guest within 24h) |
| **Waitlist Deduplication** | Email uniqueness per room block (409 response) |
| **Price Validation** | Server-side recalculation with discount; client amount validated against 3× expected base |

---

## 6. Application Layer Architecture

### 6.1 Route Architecture (42+ Routes)

```
src/app/
├── page.tsx                          ○ Landing Page (Static)
├── layout.tsx                        Root Layout (Toaster → AuthProvider → Children)
├── error.tsx                         Global Error Boundary
├── not-found.tsx                     Custom 404
├── login/page.tsx                    Login Page
│
├── dashboard/                        ── AGENT PORTAL ──
│   ├── layout.tsx                    AuthGuard → Sidebar + PageTransition
│   ├── page.tsx                      Events List + Stats (SSR → DashboardClient)
│   ├── onboarding/page.tsx           AI Event Setup Wizard
│   ├── analytics/page.tsx            Cross-Event Comparative Analytics
│   ├── calendar/page.tsx             Calendar View
│   └── events/[eventId]/
│       ├── page.tsx                  Event Overview + Stats
│       ├── guests/page.tsx           Guest CRUD + CSV Import/Export
│       ├── inventory/page.tsx        Room Block Inventory
│       ├── allocator/page.tsx        Drag-and-Drop Room Allocator
│       ├── attrition/page.tsx        Attrition Timeline + Nudges
│       ├── checkin/page.tsx          QR Check-In Management
│       ├── activity/page.tsx         Activity Audit Trail
│       └── feedback/page.tsx         Feedback Collection
│
├── event/[slug]/                     ── GUEST MICROSITE ──
│   ├── layout.tsx                    I18nProvider Wrapper
│   ├── page.tsx                      Event Landing (SSR, SEO)
│   ├── book/page.tsx                 Booking Wizard (3-Step)
│   └── feedback/page.tsx             Feedback Form
│
├── booking/[bookingId]/              ── SELF-SERVICE PORTAL ──
│   ├── page.tsx                      Booking Confirmation + Manage
│   └── invoice/page.tsx              Printable Tax Invoice
│
└── api/                              ── REST API LAYER ──
    ├── events/                       Events CRUD + Search
    │   ├── route.ts                  GET (list), POST (create)
    │   ├── search/route.ts           GET (search/filter)
    │   └── [eventId]/
    │       ├── route.ts              GET, PATCH, DELETE
    │       ├── activity/route.ts     GET, POST
    │       ├── allocate/route.ts     POST (manual)
    │       ├── auto-allocate/route.ts POST (AI-assisted)
    │       ├── bulk-checkin/route.ts  POST
    │       ├── clone/route.ts        POST
    │       ├── discount/route.ts     GET, POST, DELETE
    │       ├── feedback/route.ts     GET, POST
    │       ├── nudge/route.ts        POST
    │       ├── qr-batch/route.ts     GET (HTML page)
    │       ├── rooming-list/route.ts GET (CSV download)
    │       └── status/route.ts       PATCH
    ├── bookings/
    │   ├── route.ts                  POST (create booking)
    │   └── [bookingId]/
    │       ├── route.ts              GET, PATCH (cancel)
    │       ├── checkin/route.ts      POST
    │       └── upgrade/route.ts      POST
    ├── guests/
    │   ├── route.ts                  GET, POST, PUT, DELETE
    │   ├── import/route.ts           POST (CSV import), GET (CSV export)
    │   └── search/route.ts           GET (global search)
    ├── ai/parse/route.ts             POST (AI contract parsing)
    ├── seed/route.ts                 POST (demo data seeder)
    └── waitlist/route.ts             POST (join), GET (list)
```

### 6.2 Provider Architecture

```
<html lang="en-IN">
  <head>
    <ThemeScript />           ← Inline script: reads localStorage, applies .dark class before paint
  </head>
  <body>
    <Toaster>                 ← Toast notification context (wraps children)
      <AuthProvider>          ← Authentication state (demo credentials)
        {children}            ← All page content
      </AuthProvider>
    </Toaster>
  </body>
</html>

For Microsite pages:
  <I18nProvider>              ← English/Hindi translations (microsite only)
    {children}
  </I18nProvider>
```

### 6.3 Authentication Architecture

```
┌─────────────────────────────────────────────┐
│              AuthProvider (Context)           │
│  ┌─────────────────────────────────────────┐│
│  │ State: isAuthenticated, user, isLoading ││
│  │ Storage: localStorage('tbo-auth')       ││
│  │ Sync: Multi-tab via 'storage' event     ││
│  │ Demo Users:                             ││
│  │   • rajesh@tbo.com / tbo2026            ││
│  │   • admin@tbo.com  / admin123           ││
│  │   • demo@tbo.com   / demo              ││
│  └─────────────────────────────────────────┘│
│                     │                        │
│  ┌──────────────────▼──────────────────────┐│
│  │           AuthGuard (HOC)               ││
│  │  • Wraps: /dashboard/* routes           ││
│  │  • Redirects: → /login if !auth         ││
│  │  • Shows: Branded loading during check  ││
│  └─────────────────────────────────────────┘│
│                     │                        │
│  ┌──────────────────▼──────────────────────┐│
│  │       Public Routes (No Guard)          ││
│  │  • / (landing)                          ││
│  │  • /event/[slug] (microsite)            ││
│  │  • /booking/[bookingId] (self-service)  ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## 7. API Architecture

### 7.1 API Design Principles

1. **Resource-Oriented REST**: `/api/events`, `/api/bookings`, `/api/guests` as top-level resources
2. **Sub-Resource Nesting**: `/api/events/[eventId]/activity`, `/api/bookings/[bookingId]/checkin`
3. **Consistent Error Responses**: `{ error: string }` with appropriate HTTP status codes
4. **Activity Logging**: Mutations log to `ActivityLog` for audit trail
5. **Idempotency Guards**: Duplicate email checks on bookings, waitlist, and nudges

### 7.2 Complete API Inventory

| # | Method | Endpoint | Purpose | Status Codes |
|:--|:-------|:---------|:--------|:-------------|
| 1 | GET | `/api/events` | List all events | 200, 500 |
| 2 | POST | `/api/events` | Create event + blocks + add-ons | 201, 400, 500 |
| 3 | GET | `/api/events/search` | Search/filter events | 200, 500 |
| 4 | GET | `/api/events/[id]` | Get event details | 200, 404, 500 |
| 5 | PATCH | `/api/events/[id]` | Update event | 200, 404, 500 |
| 6 | DELETE | `/api/events/[id]` | Delete event (cascade) | 200, 404, 500 |
| 7 | GET | `/api/events/[id]/activity` | Activity log entries | 200, 500 |
| 8 | POST | `/api/events/[id]/activity` | Create log entry | 201, 500 |
| 9 | POST | `/api/events/[id]/allocate` | Save room allocations | 200, 500 |
| 10 | POST | `/api/events/[id]/auto-allocate` | AI-powered auto-allocation | 200, 404, 500 |
| 11 | POST | `/api/events/[id]/bulk-checkin` | Batch check-in | 200, 404, 500 |
| 12 | POST | `/api/events/[id]/clone` | Clone event | 201, 404, 500 |
| 13 | GET | `/api/events/[id]/discount` | List discount rules | 200, 500 |
| 14 | POST | `/api/events/[id]/discount` | Create discount rule | 201, 400, 500 |
| 15 | DELETE | `/api/events/[id]/discount` | Delete discount rule | 200, 500 |
| 16 | GET | `/api/events/[id]/feedback` | List feedback | 200, 500 |
| 17 | POST | `/api/events/[id]/feedback` | Submit feedback | 201, 400, 500 |
| 18 | POST | `/api/events/[id]/nudge` | Send WhatsApp nudges | 200, 500 |
| 19 | GET | `/api/events/[id]/qr-batch` | Batch QR code page | 200, 404, 500 |
| 20 | GET | `/api/events/[id]/rooming-list` | CSV rooming list | 200, 404, 500 |
| 21 | PATCH | `/api/events/[id]/status` | Status transition | 200, 400, 404, 500 |
| 22 | POST | `/api/bookings` | Create booking | 201, 400, 409, 500 |
| 23 | GET | `/api/bookings/[id]` | Booking details | 200, 404, 500 |
| 24 | PATCH | `/api/bookings/[id]` | Update/cancel booking | 200, 400, 404, 500 |
| 25 | POST | `/api/bookings/[id]/checkin` | Check-in booking | 200, 400, 404, 409, 500 |
| 26 | POST | `/api/bookings/[id]/upgrade` | Room upgrade/downgrade | 200, 400, 404, 409, 500 |
| 27 | GET | `/api/guests` | List guests (filterable) | 200, 400, 500 |
| 28 | POST | `/api/guests` | Add guest | 201, 400, 500 |
| 29 | PUT | `/api/guests` | Update guest | 200, 400, 404, 500 |
| 30 | DELETE | `/api/guests` | Delete guest + bookings | 200, 400, 404, 500 |
| 31 | POST | `/api/guests/import` | CSV guest import | 200, 400, 500 |
| 32 | GET | `/api/guests/import` | CSV guest export | 200, 400, 500 |
| 33 | GET | `/api/guests/search` | Global guest search | 200, 400, 500 |
| 34 | POST | `/api/ai/parse` | AI contract/invite parsing | 200, 500 |
| 35 | POST | `/api/seed` | Seed demo database | 200, 403, 500 |
| 36 | POST | `/api/waitlist` | Join waitlist | 201, 400, 404, 409, 500 |
| 37 | GET | `/api/waitlist` | List waitlist entries | 200, 400, 500 |

**Total: 37 API handler functions across 20 route files**

### 7.3 Booking API — Pipeline Architecture

```
POST /api/bookings
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Validate     │────▶│ Duplicate   │────▶│ Availability │
│ Request Body │     │ Check       │     │ Check        │
│ (required    │     │ (email +    │     │ (bookedQty < │
│  fields)     │     │  eventId)   │     │  totalQty)   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │ 409               │ 400
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Discount    │────▶│ Price        │
                    │ Engine      │     │ Validation   │
                    │ (find best  │     │ (amount ≤ 3× │
                    │  applicable)│     │  expected)   │
                    └─────────────┘     └─────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────┐
                    │        Transaction Block              │
                    │  1. Create Guest record               │
                    │  2. Create Booking record              │
                    │  3. Create BookingAddOn records        │
                    │  4. Increment RoomBlock.bookedQty      │
                    │  5. Create ActivityLog entry           │
                    └─────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────┐
                    │  Response: { booking, discount }     │
                    └─────────────────────────────────────┘
```

---

## 8. Frontend Architecture

### 8.1 Component Hierarchy

```
UI Components (src/components/ui/)
├── Primitives: Button, Input, Card, Badge, Progress, Skeleton
├── Feedback: Toast/Toaster, Confetti, EmptyState
├── Data Display: AnimatedCounter, StatusTimeline, Countdown
├── Navigation: PageTransition, ThemeToggle
└── Loading: SkeletonLoaders (Dashboard, EventDetail, Table)

Dashboard Components (src/components/dashboard/)
├── Core: DashboardClient, DashboardHeader, Sidebar
├── Visualization: AnalyticsCharts, ComparativeAnalytics
├── Management: GuestManagement, AllocatorClient, CheckinClient
├── Revenue: AttritionClient, DiscountRulesClient
├── Communication: WhatsAppSimulator
├── Utilities: ActivityLog, CalendarView, PdfExport, KeyboardShortcuts

Microsite Components (src/components/microsite/)
└── BookingClient (788-line multi-step booking wizard)
```

### 8.2 State Management Strategy

| Scope | Method | Examples |
|:------|:-------|:--------|
| **App-wide** | React Context | `AuthProvider` (auth state), `Toaster` (notifications), `I18nProvider` (locale) |
| **Page-level** | `useState` + `useEffect` | Search filters, form data, loading states, API results |
| **Computed** | `useMemo` | Aggregate stats, filtered lists, chart data |
| **Server** | Direct Prisma queries | Event data, guest lists, booking details (in Server Components) |
| **Persistence** | `localStorage` | Auth token (`tbo-auth`), theme preference (`tbo-theme`), locale |
| **Polling** | `setInterval` in `useEffect` | Dashboard (30s), Activity Log (30s) for real-time updates |

### 8.3 Design System

| Property | Value |
|:---------|:------|
| **Primary Brand Color** | `#ff6b35` (TBO Orange) |
| **Secondary Orange** | `#e55a2b` |
| **Primary Blue** | `#0066cc`  |
| **Navy** | `#1e293b` |
| **Dark Mode** | Full coverage — every component uses `dark:` Tailwind variants |
| **Theme Persistence** | `localStorage('tbo-theme')` + inline `<ThemeScript>` prevents FOUC |
| **Font** | Geist Sans + Geist Mono (Google Fonts) |
| **Icons** | Lucide React (80+ icons used) |
| **Locale** | `en-IN` (Indian English) — all dates/currency formatted for India |
| **Currency** | INR (₹) via `Intl.NumberFormat('en-IN')` |
| **Animations** | 12 custom keyframes in `globals.css` with `prefers-reduced-motion` respect |
| **Accessibility** | Skip-nav links, ARIA labels/roles, keyboard shortcuts (Alt+D/N/K/A), focus rings |

### 8.4 Custom Animations Inventory

| Animation | Class | Duration | Use |
|:----------|:------|:---------|:----|
| Scroll reveal | `.reveal` → `.revealed` | 600ms | Section entrance |
| Float | `.animate-float` | 3s | Landing page badges |
| Button shimmer | `.btn-shimmer` | 2s | CTA buttons |
| Gradient text | `.text-gradient-animated` | 3s | Hero headings |
| Marquee | `.animate-marquee` | 25s | Trust ticker |
| Glow pulse | `.animate-glow` | 2s | Highlight buttons |
| Scale-in | `animate-scale-in` | 200ms | Modals/overlays |
| Pulse-soft | `.animate-pulse-soft` | 2s | Status indicators |
| Slow spin | `.animate-spin-slow` | 20s | Decorative rings |
| 3D tilt | `.tilt-card` | — | Feature cards |
| Noise texture | `.noise` | — | Background overlay |
| Skeleton shimmer | `.skeleton-shimmer` | 1.5s | Loading states |

---

## 9. AI/ML Integration Architecture

### 9.1 AI Pipeline

```
┌───────────────────────────────────────────────────────┐
│                AI ONBOARDING PIPELINE                  │
│                                                        │
│  INPUT                    PROCESSING              OUTPUT│
│  ┌──────────┐    ┌──────────────────────┐    ┌──────┐│
│  │ Contract  │───▶│ parseContractWithAI()│───▶│ JSON ││
│  │ PDF/Image │    │ GPT-4o Vision        │    │      ││
│  └──────────┘    │ System prompt:        │    │venue ││
│                  │ "Extract hotel rooms,  │    │rooms ││
│                  │  rates, dates, perks"  │    │rates ││
│                  └──────────────────────┘    │dates ││
│                                              │addons││
│  ┌──────────┐    ┌──────────────────────┐    │rules ││
│  │ Invite    │───▶│ parseInviteWithAI()  │───▶│      ││
│  │ Design    │    │ GPT-4o Vision        │    │name  ││
│  │ PDF/Image │    │ System prompt:        │    │type  ││
│  └──────────┘    │ "Extract event name,  │    │colors││
│                  │  type, colors (hex)"   │    └──────┘│
│                  └──────────────────────┘             │
│                                                        │
│  FALLBACK: If no OPENAI_API_KEY or API error,         │
│  returns hardcoded demo data (Grand Hyatt wedding)    │
└───────────────────────────────────────────────────────┘
```

### 9.2 Auto-Allocation Algorithm

```
POST /api/events/[eventId]/auto-allocate

PHASE 1: Build Zone Map
  - Extract unique (floor, wing) pairs from RoomBlocks
  - Count allocations already assigned per zone

PHASE 2: Priority Queue
  Priority Groups (descending):
  1. VIP     → Highest floors
  2. Bride Side → Premium wings
  3. Groom Side → Standard wings
  4. Family  → Mid-level floors
  5. Friends → Available zones

PHASE 3: Three-Pass Assignment
  Pass 1: Honor proximity requests (guests requesting to be near someone)
  Pass 2: Group cohesion (keep same-group guests on same floor/wing)
  Pass 3: Best available zone (highest priority → highest floor)

PHASE 4: Persist + Log
  - Update guest.allocatedFloor, guest.allocatedWing
  - Create ActivityLog entry with allocation count
```

---

## 10. Security Architecture

### 10.1 Security Measures (Prototype Scope)

| Attack Vector | Mitigation | Implementation |
|:--------------|:-----------|:---------------|
| **XSS** | HTML entity escaping | `escapeHtml()` in QR batch output (`& < > " '` → entities) |
| **CSV Injection** | Formula prefix escaping | `escapeCsv()` prefixes `= + - @ \t \r` with `'` in rooming list export |
| **Duplicate Bookings** | Server-side email uniqueness | Email check per event before booking creation (409) |
| **Cancelled Booking Check-in** | Status guard | Bulk check-in rejects cancelled bookings |
| **Nudge Spam** | 24-hour deduplication | Nudge endpoint skips guests nudged within 24h |
| **FOUC (Dark Mode)** | Inline theme script | `<ThemeScript>` reads localStorage before paint |
| **Seed in Production** | Environment guard | `POST /api/seed` returns 403 in production |
| **Status Tampering** | State machine | Valid transitions enforced server-side |
| **Price Manipulation** | Server recalculation | Discount applied server-side; amount validated against 3× expected |

### 10.2 Known Gaps (Prototype Scope)

| Area | Current State | Production Needed |
|:-----|:-------------|:------------------|
| Authentication | Demo credentials in localStorage | OAuth 2.0 / JWT / NextAuth |
| Authorization | No role-based access control | RBAC (agent, admin, guest roles) |
| API Protection | No rate limiting, no CORS config | Rate limiter, CORS whitelist |
| Input Validation | Partial server-side validation | Zod schema validation on all endpoints |
| Database | SQLite single-file, no encryption | PostgreSQL + connection pooling |
| Transactions | Partial (multi-step without full rollback) | Full ACID transactions |
| Secrets | API key in environment variable | Vault/Secret Manager |

---

## 11. User Experience Architecture

### 11.1 User Journeys

#### Agent Journey (Dashboard)
```
Login → Dashboard (Events List + Stats)
                   ├── Create Event (AI Onboarding)
                   │   └── Upload Contract → AI Parse → Review → Create
                   ├── Event Management
                   │   ├── Overview (Stats, Quick Actions)
                   │   ├── Inventory (Room Blocks, Occupancy)
                   │   ├── Guests (CRUD, CSV Import/Export)
                   │   ├── Allocator (Drag-and-Drop Floor Plan)
                   │   ├── Attrition (Timeline, Nudges, WhatsApp)
                   │   ├── Check-In (QR, Bulk, Print QR Codes)
                   │   ├── Activity (Audit Trail, Export)
                   │   └── Feedback (Collection, Analysis)
                   ├── Calendar (Monthly View, All Events)
                   └── Analytics (Cross-Event Comparison, PDF Export)
```

#### Guest Journey (Microsite)
```
Receive Link → Microsite Landing (/event/[slug])
                   ├── View Event Details, Room Types, Pricing
                   ├── See Discount Tiers & Attrition Deadlines
                   └── Book Room (/event/[slug]/book)
                       ├── Step 1: Guest Details
                       ├── Step 2: Room Selection + Add-ons
                       ├── Step 3: Review + Terms + Payment Simulation
                       └── Success: Confetti + QR + Invoice Link
                              ├── Manage Booking (/booking/[id])
                              │   ├── View Status Timeline
                              │   ├── Add to Google Calendar
                              │   ├── WhatsApp Share
                              │   ├── Room Upgrade/Downgrade
                              │   └── Self-Service Cancel
                              ├── View/Print Invoice (/booking/[id]/invoice)
                              └── Submit Feedback (/event/[slug]/feedback)
```

### 11.2 Responsiveness Architecture

| Breakpoint | Layout Adaptation |
|:-----------|:-----------------|
| Mobile (<768px) | Hamburger sidebar, stacked cards, mobile bottom nav, reduced particles |
| Tablet (768-1024px) | Collapsible sidebar, 2-column grids |
| Desktop (>1024px) | Full sidebar, 3-4 column grids, expanded charts |

### 11.3 Internationalization

| Feature | Implementation |
|:--------|:---------------|
| **Locales** | English (`en`) + Hindi (`hi`) |
| **Scope** | Microsite pages only (guest-facing) |
| **Toggle** | Flag emoji button (🇮🇳/🇬🇧) |
| **Keys** | 120+ translation keys covering all guest-facing content |
| **Currency** | Always INR (₹), `en-IN` locale |
| **Dates** | `en-IN` locale for all date formatting |

---

## 12. Business Logic Architecture

### 12.1 Inventory Management

```
┌──────────────────────────────────────────────────────────┐
│                  INVENTORY ENGINE                          │
│                                                            │
│  Event                                                     │
│  └── RoomBlock[]                                          │
│      ├── totalQty: Total rooms allocated to group          │
│      ├── bookedQty: Rooms consumed (incremented on book)   │
│      ├── Available = totalQty - bookedQty                  │
│      ├── Occupancy% = (bookedQty / totalQty) × 100        │
│      └── hotelName: Multi-hotel support per event          │
│                                                            │
│  Operations:                                               │
│  ├── Book   → bookedQty++ (if < totalQty)                 │
│  ├── Cancel → bookedQty-- + Waitlist auto-promote         │
│  ├── Upgrade → old.bookedQty-- + new.bookedQty++          │
│  └── Clone  → Copy blocks with bookedQty=0                │
│                                                            │
│  Revenue Tracking:                                         │
│  ├── Earned = SUM(booking.totalAmount) for confirmed       │
│  ├── Potential = totalQty × rate × nights                  │
│  └── At-Risk = (totalQty - bookedQty) × rate × nights     │
└──────────────────────────────────────────────────────────┘
```

### 12.2 Discount Engine

```
Event DiscountRules (ordered by minRooms DESC)
├── Rule 1: 20+ rooms → 15% off  ← Checked first (highest threshold)
├── Rule 2: 10+ rooms → 10% off  ← Checked second
└── Rule 3: 5+ rooms  → 5% off   ← Checked last

At booking time:
  currentBookedCount = event's total bookedQty across all blocks
  applicableRule = rules.find(r => currentBookedCount >= r.minRooms)
  finalAmount = baseAmount × (1 - applicableRule.discountPct / 100)
```

### 12.3 Attrition Management

```
AttritionRule Timeline:
  ┌─────────────────────────────────────────────────────┐
  │ Today                                     Event Day │
  │  ├──────┤           ├──────┤         ├──────┤      │
  │  OVERDUE (past)     CRITICAL         WARNING        │
  │  (release happened) (≤3 days)        (≤7 days)     │
  │                                                     │
  │ On each rule's releaseDate:                        │
  │   • X% of unsold rooms may be released to hotel    │
  │   • Revenue at risk = unsold × rate × nights        │
  │   • Agent can send nudges to pending guests         │
  │   • Auto-trigger nudges for all CRITICAL rules      │
  └─────────────────────────────────────────────────────┘
```

### 12.4 Event Lifecycle State Machine

```
         ┌───────────┐
    ┌───▶│   DRAFT   │◀────────────────┐
    │    └─────┬─────┘                  │
    │          │ Activate               │ Reset
    │          ▼                        │
    │    ┌───────────┐          ┌───────┴─────┐
    │    │  ACTIVE   │─────────▶│  CANCELLED  │
    │    └─────┬─────┘          └─────────────┘
    │          │ Complete
    │          ▼
    │    ┌───────────┐
    └────│ COMPLETED │
         │ (reactivate)│
         └───────────┘
```

---

## 13. Deployment & DevOps Architecture

### 13.1 Build Pipeline

```
npm install
    └── postinstall: prisma generate (generates typed client)

npm run build
    ├── prisma generate (ensures fresh client)
    └── next build (Turbopack)
         ├── Static: / (landing page), /_not-found
         └── Dynamic: 40+ ƒ routes (force-dynamic / server-rendered)

npm run dev
    └── next dev (Turbopack HMR)
         └── Seed via POST /api/seed or "Reset Demo" button
```

### 13.2 Deployment Target

| Platform | Configuration |
|:---------|:-------------|
| **Primary** | Vercel (Edge-compatible, zero-config Next.js deployment) |
| **Database** | Embedded SQLite (`dev.db` file — persists across function invocations in Vercel) |
| **CDN** | Vercel Edge Network (static assets, ISR) |
| **Domain** | `tbo-assemble.vercel.app` |

### 13.3 PWA Support

- `public/manifest.json` — TBO Assemble branded manifest
- `public/sw.js` — Service Worker (registered in root layout)
- Theme color: `#ff6b35` (TBO Orange)
- Display: `standalone`

---

## 14. Scalability & Production Roadmap

### 14.1 Current Architecture Limits (Prototype)

| Dimension | Current | Limit |
|:----------|:--------|:------|
| Concurrent users | ~50 | SQLite write locks |
| Events | ~10 | No pagination |
| Guests per event | ~50 | Client-side filtering |
| Database size | ~5MB | SQLite practical limit ~1GB |
| API rate | Unlimited | No rate limiting |

### 14.2 Production Migration Path

```
PROTOTYPE (Current)                    PRODUCTION (Roadmap)
─────────────────                      ─────────────────────
SQLite (embedded)            ──▶       PostgreSQL (managed)
No auth                      ──▶       NextAuth + JWT + RBAC
localStorage creds           ──▶       Secure HTTP-only cookies
Polling (30s)                ──▶       WebSockets / SSE
Client filtering             ──▶       Server-side pagination + search
No rate limiting             ──▶       Redis rate limiter
Manual QR API                ──▶       Self-hosted QR generation
Simulated WhatsApp           ──▶       WhatsApp Business API
Simulated payment            ──▶       Razorpay/Stripe integration
Single instance              ──▶       Horizontal scaling
No caching                   ──▶       Redis + ISR caching
No monitoring                ──▶       Sentry + Vercel Analytics
CSV import/export            ──▶       Excel + Google Sheets integration
Demo agent                   ──▶       Multi-tenant agent management
```

---

## 15. Architecture Decision Records (ADRs)

### ADR-001: Next.js App Router Over Pages Router
- **Decision**: Use App Router (v16) instead of Pages Router
- **Context**: Need server components for data-heavy pages, API routes for mutations
- **Consequence**: Better SEO for microsites, simpler data fetching, but requires understanding of server/client component boundaries

### ADR-002: SQLite Over PostgreSQL for Prototype
- **Decision**: Use embedded SQLite instead of hosted PostgreSQL
- **Context**: Hackathon prototype needs zero-config database, portable, no hosting costs
- **Consequence**: Single-file database, no concurrent write support, but demo-ready with zero setup

### ADR-003: In-Band Seeding Over CLI Seeding
- **Decision**: Seed database via API route (`POST /api/seed`) instead of `prisma db seed`
- **Context**: ESM/CommonJS conflicts when running seed scripts with Prisma 7 + Next.js 16 + TypeScript
- **Consequence**: Seed shares exact runtime with app, works reliably, exposed as "Reset Demo" button

### ADR-004: Client-Side Auth Over NextAuth
- **Decision**: Use React Context + localStorage for authentication instead of NextAuth sessions
- **Context**: Prototype doesn't need real authentication; demo needs quick login without external providers
- **Consequence**: Simple, fast, multi-tab sync, but not secure for production

### ADR-005: GPT-4o Vision with Demo Fallback
- **Decision**: Use AI for contract parsing but always provide hardcoded fallback
- **Context**: Demo must work without API key; AI parsing is the "wow factor" but can't be a single point of failure
- **Consequence**: Demo always works, AI features are additive

### ADR-006: Prisma 7 Driver Adapter Pattern
- **Decision**: Use adapter pattern (`@prisma/adapter-better-sqlite3`) instead of standard Prisma client
- **Context**: Prisma 7 requires explicit driver adapters for SQLite; standard connection fails
- **Consequence**: Non-standard initialization code in `db.ts`, must pass `{ url: "file:./dev.db" }` as object

### ADR-007: Hybrid SSR + CSR Rendering Strategy
- **Decision**: Server Components for data-heavy read pages, Client Components for interactive features
- **Context**: Microsites need SEO (SSR), dashboard needs interactivity (CSR)
- **Consequence**: Best of both worlds, but requires careful data serialization between server/client boundary

### ADR-008: Custom UI Components Over Component Library
- **Decision**: Build custom UI components with Radix primitives instead of using shadcn/ui or Chakra
- **Context**: Need full control over TBO branding, dark mode, and animations
- **Consequence**: 16 custom UI components with consistent TBO orange branding and full dark mode

---

## 16. Module Inventory

### 16.1 File Statistics

| Category | Files | Total Lines (est.) |
|:---------|:------|:-------------------|
| **Pages (SSR)** | 25 | ~3,500 |
| **Client Components** | 20 | ~6,500 |
| **API Routes** | 20 | ~2,800 |
| **UI Components** | 16 | ~1,000 |
| **Library/Utils** | 5 | ~550 |
| **Config** | 7 | ~100 |
| **Schema** | 1 | ~220 |
| **Documentation** | 1 | ~660 |
| **TOTAL** | **~95** | **~15,300** |

### 16.2 Feature Matrix

| Feature | Agent Dashboard | Guest Microsite | Self-Service Portal | API |
|:--------|:---------------|:----------------|:--------------------|:----|
| Event CRUD | ✅ Create, Edit, Delete, Clone | — | — | ✅ |
| Room Block Mgmt | ✅ Full inventory control | ✅ View availability | — | ✅ |
| Guest Mgmt | ✅ CRUD, CSV Import/Export | — | ✅ Edit details | ✅ |
| Booking | — | ✅ 3-step wizard | ✅ View, Cancel, Upgrade | ✅ |
| Room Allocation | ✅ Drag-and-drop + Auto | — | — | ✅ |
| Attrition Mgmt | ✅ Timeline, Nudges | ✅ Deadline display | — | ✅ |
| Check-In | ✅ QR scan, Bulk, Print | — | ✅ QR code display | ✅ |
| Analytics | ✅ Charts, Comparative, PDF | — | — | ✅ |
| Discount Rules | ✅ CRUD | ✅ Tier display | ✅ Savings shown | ✅ |
| Activity Log | ✅ Filterable audit trail | — | — | ✅ |
| Feedback | ✅ View & analyze | — | ✅ Submit feedback | ✅ |
| Waitlist | — | ✅ Join (implicit) | — | ✅ |
| AI Parsing | ✅ Contract + Invite | — | — | ✅ |
| WhatsApp Nudge | ✅ Simulator + Send | — | — | ✅ |
| Dark Mode | ✅ | ✅ | ✅ | — |
| i18n (EN/HI) | — | ✅ | — | — |
| Calendar View | ✅ | — | — | — |
| Invoice | — | — | ✅ Printable GST invoice | — |
| Rooming List | ✅ CSV export | — | — | ✅ |
| QR Batch Print | ✅ | — | — | ✅ |
| Live Demo Mode | ✅ Simulated bookings | — | — | ✅ |
| Keyboard Shortcuts | ✅ Alt+D/N/K/A, ?, Ctrl+S | — | — | — |

---

**End of System Architecture Document**

*Built by Team IIITDards for VoyageHack 3.0 — Prototype Round*
