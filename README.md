# TBO Assemble — The Operating System for Group Travel

> **VOYAGEHACK 3.0 Submission** | Team IIITDards

AI-orchestrated Group Inventory Management Platform for MICE conferences, destination weddings, and corporate retreats. Smart room-block allocation, real-time attrition tracking, and automated guest communication — all in one platform.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.4-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![GPT-4o](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)

---

## Problem Statement

India's group travel industry manages thousands of crore in hotel room blocks annually — yet most agents still rely on **spreadsheets, WhatsApp groups, and manual emails**. This leads to:

- Missed attrition deadlines causing heavy penalty charges
- 4–6 hours wasted per event on manual guest allocation
- High booking drop-off due to clunky reservation processes
- Zero real-time visibility into room block utilisation

## Solution

TBO Assemble replaces this chaos with an intelligent, end-to-end platform:

1. **Upload** a hotel contract PDF + event invitation → AI extracts everything in <60 seconds
2. **Review & Customise** → Adjust room blocks, add-ons, attrition rules, and a branded microsite
3. **Go Live & Track** → Share the microsite link, monitor bookings in real-time, auto-nudge pending guests

---

## Core Features

### 🤖 GenAI Contract Parsing
Upload a hotel contract PDF and event invitation. GPT-4o extracts room blocks, negotiated rates, dates, attrition penalties, and theme colours — generating a branded microsite in under 60 seconds.

### 🏨 Visual Proximity Allocator
Drag-and-drop guest assignment to specific floors and wings. Honours proximity requests ("near the bride's family") with smart visual cues, VIP prioritisation, and real-time capacity tracking.

### ⚠️ Smart-Yield Protection
Real-time attrition deadline tracking with visual timelines. Auto-calculates at-risk revenue in ₹, triggers WhatsApp nudges to pending guests, and prevents costly penalties.

### 🎁 Experience Bundling Engine
Dynamic add-on management for airport transfers, gala passes, spa packages. Generates invoices with GST-compliant itemised billing.

### 📱 Branded Event Microsites
Auto-generated, mobile-first event pages with QR check-in, self-service booking, countdown timer, and WhatsApp share.

### 📊 Comparative Analytics
Cross-event analytics dashboard with occupancy rates, revenue tracking, booking velocity, and demographic breakdowns via interactive Recharts visualisations.

### 📅 Calendar View
Month/week calendar with event timelines, attrition deadlines, and check-in/check-out visualisation.

### ✅ QR Code Check-In
Batch QR generation per event. Scan-to-check-in with instant verification and real-time status updates.

### 💬 WhatsApp Nudges & Notifications
Simulated WhatsApp message flows for booking confirmations, deadline reminders, and pending-guest nudges.

### 🔄 Reset Demo
One-click database reseed to restore demo data for presentation purposes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Language** | TypeScript 5.x (strict mode) |
| **Database** | Prisma 7 + SQLite (via `@prisma/adapter-better-sqlite3`) |
| **AI** | OpenAI GPT-4o (contract & invitation parsing) |
| **Styling** | Tailwind CSS v4 + Radix UI primitives |
| **Charts** | Recharts 3.7 |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Auth** | NextAuth.js 4.x |
| **Font** | Geist (via `next/font`) |

---

## Data Model

13 Prisma models powering the platform:

```
Agent → Event → RoomBlock
                → Guest → Booking → BookingAddOn
                → AddOn
                → AttritionRule
                → Nudge
                → Waitlist
                → ActivityLog
                → Feedback
                → DiscountRule
```

---

## API Routes (42+)

| Endpoint | Description |
|----------|-------------|
| `POST /api/ai/parse` | AI contract + invitation parsing |
| `GET/POST /api/events` | CRUD events |
| `GET /api/events/search` | Search events |
| `GET/PATCH /api/events/[id]/status` | Event status management |
| `POST /api/events/[id]/allocate` | Manual room allocation |
| `POST /api/events/[id]/auto-allocate` | AI-powered auto-allocation |
| `POST /api/events/[id]/bulk-checkin` | Bulk check-in with animation |
| `POST /api/events/[id]/clone` | Clone event |
| `POST /api/events/[id]/discount` | Apply discount rules |
| `GET/POST /api/events/[id]/feedback` | Guest feedback |
| `POST /api/events/[id]/nudge` | WhatsApp nudge triggers |
| `GET /api/events/[id]/qr-batch` | Batch QR code generation |
| `GET /api/events/[id]/rooming-list` | Export rooming list |
| `GET /api/events/[id]/activity` | Activity log |
| `GET/POST /api/bookings` | CRUD bookings |
| `PATCH /api/bookings/[id]` | Update booking |
| `POST /api/bookings/[id]/checkin` | QR check-in |
| `POST /api/bookings/[id]/upgrade` | Room upgrade |
| `GET/POST /api/guests` | CRUD guests |
| `POST /api/guests/import` | Bulk guest import |
| `GET /api/guests/search` | Search guests |
| `GET/POST /api/waitlist` | Waitlist management |
| `POST /api/seed` | Reset & seed demo data |

---

## Dashboard Pages

| Page | Path | Description |
|------|------|-------------|
| **Dashboard** | `/dashboard` | Overview with stats, recent events, activity |
| **Event Detail** | `/dashboard/events/[id]` | Full event management hub |
| **Guest Management** | `/dashboard/events/[id]/guests` | Guest list with filters |
| **Room Allocator** | `/dashboard/events/[id]/allocator` | Drag-and-drop visual allocator |
| **Attrition Tracker** | `/dashboard/events/[id]/attrition` | Deadline alerts & revenue at risk |
| **Inventory** | `/dashboard/events/[id]/inventory` | Room block occupancy |
| **Check-In** | `/dashboard/events/[id]/checkin` | QR scan check-in interface |
| **Activity Log** | `/dashboard/events/[id]/activity` | Chronological event log |
| **Feedback** | `/dashboard/events/[id]/feedback` | Guest sentiment & reviews |
| **Analytics** | `/dashboard/analytics` | Cross-event comparative analytics |
| **Calendar** | `/dashboard/calendar` | Calendar view of all events |
| **Onboarding** | `/dashboard/onboarding` | 60-second AI-powered event setup |

---

## Public Pages

| Page | Path | Description |
|------|------|-------------|
| **Landing** | `/` | Marketing page with features, comparison, beta feedback |
| **Event Microsite** | `/event/[slug]` | Branded public event page |
| **Booking Page** | `/event/[slug]/book` | Guest self-service booking |
| **Feedback Page** | `/event/[slug]/feedback` | Post-event feedback form |
| **Booking Confirmation** | `/booking/[id]` | Booking status + self-service |
| **Invoice** | `/booking/[id]/invoice` | GST-compliant printable invoice |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm
- OpenAI API key (for AI parsing features)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
#    Create .env file with:
#    OPENAI_API_KEY=your_key_here

# 3. Generate Prisma client
npx prisma generate

# 4. Push database schema
npx prisma db push

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Seed Demo Data

Hit the seed endpoint to populate the database with realistic Indian demo data:

```bash
# Via browser or curl:
POST http://localhost:3000/api/seed
```

Or use the **Reset Demo** button in the dashboard sidebar.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server (Turbopack) |
| `build` | `npm run build` | Production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `seed` | `npm run seed` | Seed database via CLI |
| `db:push` | `npm run db:push` | Push Prisma schema to DB |
| `db:studio` | `npm run db:studio` | Open Prisma Studio |

---

## Demo Events (Seeded)

| Event | Type | Slug |
|-------|------|------|
| Grand Hyatt Annual Conference | MICE | `grand-hyatt-annual-conference` |
| Royal Rajputana Wedding | Destination Wedding | `royal-rajputana-wedding` |

---

## Project Structure

```
tbo-assemble/
├── prisma/
│   └── schema.prisma          # 13 models
├── public/
│   └── logo.png               # Brand logo
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout + fonts
│   │   ├── globals.css         # Tailwind v4 + animations
│   │   ├── api/                # 42+ API routes
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── event/[slug]/       # Public microsite
│   │   └── booking/[bookingId]/ # Booking + invoice
│   ├── components/
│   │   ├── dashboard/          # Dashboard components
│   │   ├── microsite/          # Booking client
│   │   └── ui/                 # Reusable UI components
│   ├── generated/prisma/       # Generated Prisma client
│   └── lib/
│       ├── ai.ts               # OpenAI integration
│       ├── db.ts               # Prisma client singleton
│       └── utils.ts            # Utility functions
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind / postcss configs
```

---

## Key Design Decisions

- **SQLite** for zero-config deployment — no external database required for hackathon demo
- **Prisma 7** with `@prisma/adapter-better-sqlite3` for type-safe database access
- **App Router** with `force-dynamic` on API routes for real-time data
- **Tailwind CSS v4** with custom CSS animations (particle network, scroll reveal, tilt cards, shimmer buttons)
- **Dark mode** via class-based toggle with system preference detection
- **Mobile-first** responsive design across all pages
- **Indian locale** data — ₹ currency, Indian names, GST invoicing, WhatsApp integration

---

## Team

**Team IIITDards** — VOYAGEHACK 3.0

---

*Built with ❤️ for VOYAGEHACK 3.0 by TBO.com*
