# TBO Assemble — Video Demonstration Script
## VoyageHack 3.0 | Prototype Submission Round | ~5 Minutes

> **Production Notes:**
> - **Total runtime:** ~5 minutes (300 seconds). Hard ceiling: 5:15.
> - **Tone:** Fast, confident, zero filler. You're not explaining a product — you're letting a product speak for itself. Narrate what's on screen. Don't describe what the product "can do." Show it doing it.
> - **Narrative thread:** The entire demo is ONE continuous story — a hotel contract becomes a live event → the event's microsite goes live → a guest books through it → the agent manages everything from the dashboard. Every section feeds into the next.
> - **Pacing:** Brisk throughout. Strategic silence ONLY at the two "wow" moments — (1) when AI parse output populates, (2) when confetti fires on booking confirmation. Everywhere else, keep talking.
> - **Screen recording:** Dark mode ON. Browser fullscreen. 1080p minimum. No bookmarks bar, no dev tools, no other tabs.
> - **Mouse:** Purposeful. Hover on what you name. Never idle. Never click rapidly.
> - **Editing:** Cross-fade (0.3s) between sections. Subtle zoom-in (1.3x) on AI output and booking confirmation. Cut every frame of dead air.
> - **Voice:** Speak like you built this and you're proud of it. Not reading — presenting. If a feature is visible, one sentence is enough.

---

## SECTION 1: HOOK + AI CONTRACT PARSING (0:00 – 1:25)

**[SCREEN: AI onboarding wizard (`/dashboard/onboarding`) already loaded. Two upload zones visible. Clean, dark UI.]**

> Aditya Rai, Team IIITDards, IIIT Delhi.
>
> A travel agent just received a hotel contract for a 200-guest destination wedding. Normally, they'd spend the next two hours reading it, copying room types, rates, and attrition clauses into a spreadsheet. Here — they upload it.

**[SCREEN: Drag the hotel-contract.pdf into the left upload zone. File name appears. Then drag wedding-invitation.pdf into the right zone.]**

> A hotel contract on the left. The event invitation on the right.

**[SCREEN: Click "Parse with AI." The loading spinner appears — GPT-4o label visible. Wait. Then the parsed data populates the form fields. LET THIS MOMENT BREATHE — hold 2 seconds of silence as data fills in.]**

> Both go to **OpenAI GPT-4o Vision** — a multimodal LLM, not OCR — and watch what comes back.
>
> *[2 seconds of silence. Let the form populate. This is the first "wow" moment.]*

**[SCREEN: Scroll through the parsed output. Hover on each section as you name it. Move deliberately — this is the money shot.]**

> The AI extracted the **venue** — Grand Hyatt Resort & Spa, Udaipur — and a second property, **Taj Lake Palace**, for the Royal Suite. Multi-hotel event, auto-detected from one document.
>
> **Three room types** — Deluxe at ₹12,000 per night, Premium Suite at ₹22,000, Royal Suite at ₹45,000 — with exact quantities, floor assignments, and wing placements.
>
> **Six add-ons** — airport transfers, welcome dinner, spa credits — each correctly tagged as complimentary or paid.
>
> **Three attrition rules** — the release dates, the percentage of rooms at risk, and the penalty clauses. This is the data that protects revenue.
>
> And from the wedding invitation — the **event name**, **type**, and **three brand colors in hex**. Those colors are about to theme an entire microsite automatically.

**[SCREEN: Edit one rate briefly — change ₹12,000 to ₹11,500 — to prove it's editable. Then click "Create Event." Show the success toast.]**

> The agent reviews, tweaks one rate, and hits **Create Event**. One API call atomically creates the event, three room blocks, six add-ons, three attrition rules, and two discount tiers. Done.
>
> That was setup. Two hours of manual work — compressed to **under two minutes**.

---

## SECTION 2: BRANDED MICROSITE — LIVE INSTANTLY (1:25 – 2:20)

**[SCREEN: Navigate to `/event/sharma-patel-wedding-2026`. The microsite loads — maroon and rose gold theme, floating orbs, gradient hero.]**

> Now look at what that one click generated. A **branded microsite**, live at a unique URL, themed in those exact colors the AI pulled from the wedding invitation thirty seconds ago.

**[SCREEN: Pan across the hero — event name, venue, dates, countdown timer, "Reserve Now" button glowing in the accent color.]**

> Guests see the event name, venue, dates, a **live countdown** to check-in, and a prominent Reserve button — all styled in the event's own brand identity. No configuration. No CSS. The AI did this.

**[SCREEN: Scroll to room selection cards. Hover on each — show hotel name, rate, occupancy bar.]**

> The room cards — hotel name, room type, **negotiated rate per night**, and a **live occupancy bar**. "14 of 20 booked." When availability drops — a **"Limited Availability"** badge. When it's gone — **"Sold Out."** This is the real-time inventory visibility the problem statement asks for, but surfaced directly to the guest.

**[SCREEN: Keep scrolling — social proof popup slides in at bottom-left. Volume discount tiers visible. Attrition timeline with countdowns. Add-ons section. Don't stop — let them appear naturally as you scroll.]**

> As we scroll — social proof: "26 guests confirmed" — volume discount tiers with a **"Best Value"** badge on the highest tier — attrition **deadline countdowns** pushing urgency — included perks and paid add-ons with clear pricing.

**[SCREEN: Quickly toggle Hindi language, then back to English. Show dark/light toggle. Show the WhatsApp share button.]**

> Full **Hindi-English toggle** — 120+ translated strings. Dark mode. WhatsApp share with a pre-filled message. Mobile responsive with sticky bottom navigation. This microsite is built for a guest receiving a WhatsApp link on their phone in India.

---

## SECTION 3: GUEST BOOKING — END TO END (2:20 – 3:20)

**[SCREEN: Click "Reserve Room" on a room card → navigates to `/event/.../book`. Booking wizard loads — Step 1 visible.]**

> A guest clicks Reserve. Let's book a room.

**[SCREEN: Fill in Step 1 LIVE — type a name, email, select phone, pick "Bride Side" from group dropdown. Type a proximity request. Move at a natural pace — not rushed, not slow.]**

> Guest details — name, email, phone with +91 validation. The group dropdown says **Bride Side, Groom Side, VIP, Family, Friends** — because this is a wedding. For a MICE event, it automatically switches to Speaker, Attendee, Sponsor. And a proximity request — "I want to be near Priya Sharma."

**[SCREEN: Click Next → Step 2. Select "Premium Suite" room card. Toggle on "Airport Transfer" add-on.]**

> Room selection — Premium Suite at Taj Lake Palace. Toggle the airport transfer add-on.

**[SCREEN: Click Next → Step 3. The invoice summary appears with itemized lines. Hover over the discount line.]**

> The review screen — itemized: room rate times three nights, the add-on, and here — a **volume discount auto-calculated server-side** based on how many rooms are already booked for this event. The server enforces duplicate prevention, availability guards, and price validation. The client cannot manipulate this total.

**[SCREEN: Click Confirm. Watch the 4-phase payment animation: Verifying → Processing → Securing → Generating. Then CONFETTI explodes. QR code appears. Hold 2 seconds.]**

> *[Let the 4-phase animation play. Then confetti fires — QR code, booking confirmation card, action buttons appear.]*
>
> *[2 seconds of silence. This is the second "wow" moment.]*
>
> Booking confirmed. **QR code** for event-day check-in. **GST invoice** with CGST and SGST. Add to **Google Calendar**. Share on **WhatsApp**. The entire post-booking experience — done.

**[SCREEN: Navigate to `/booking/[id]`. Show the self-service portal — status timeline, cancel button, upgrade dropdown. Click the upgrade dropdown to show room options. Don't actually upgrade — just show the option.]**

> And the guest doesn't need the agent anymore. Self-service portal — view booking status, **cancel**, or **upgrade to a different room type**. Inventory adjusts on both room blocks automatically.

---

## SECTION 4: AGENT DASHBOARD — COMMAND CENTER (3:20 – 4:40)

**[SCREEN: Navigate to `/dashboard`. Animated counters tick up — total revenue, total guests, average occupancy. Seven event cards below.]**

> Now — what the agent sees. The dashboard: **aggregate stats** ticking up on load — total revenue, guests, occupancy. This auto-refreshes every 30 seconds. That booking we just made? It's already here.
>
> Seven live events across six Indian cities — weddings in Udaipur and Goa, conferences in Mumbai and Hyderabad, a corporate offsite in Jaipur, a reunion in Shimla, a product launch in Bengaluru. **135 guests. 80+ bookings.** Every event fully interactive.

**[SCREEN: Click into Sharma-Patel Wedding → Event Overview. Occupancy bars. Actions toolbar visible.]**

> Inside an event — **occupancy bars** per room type, per hotel. The actions bar: copy microsite link, export **rooming list CSV**, print **batch QR codes**, **clone the event** with all room blocks and rules, or change status. The event lifecycle follows a state machine — draft to active to completed or cancelled — with server-enforced transitions.

**[SCREEN: Quick click: Inventory page (2 seconds, show revenue stats) → Guest Management (2 seconds, show CSV import/export buttons and search bar) → Room Allocator (land here).]**

> Inventory management with **potential revenue tracking**. Guest management with CSV import, export, and rooming list download — replacing every spreadsheet.

**[SCREEN: Show the allocator grid — guest cards color-coded by group. Drag one guest card from one slot to another. Then click "AI Auto-Allocate." Watch the cards redistribute. Hold 1 second after allocation completes.]**

> The **Room Allocator** — drag-and-drop. Guests color-coded by group — pink for Bride Side, blue for Groom Side, gold for VIPs. I can drag anyone anywhere. But watch this —
>
> **AI Auto-Allocate.** One click. Three-pass algorithm: first, honor proximity requests. Second, cluster groups on the same floor. Third, assign by priority — VIPs get the top floors. A hundred guests, allocated in **one click**.

**[SCREEN: Navigate to Attrition Management. Color-coded timeline — red, amber, green badges. Hover on a red "CRITICAL" rule showing revenue at risk. Click "Send Nudge."]**

> **Attrition management** — every deadline is urgency-coded. This one is **critical** — three days left, ₹4.5 lakhs at risk. One click — **Send Nudge** — WhatsApp messages to every pending guest. 24-hour deduplication prevents spam.

**[SCREEN: MONTAGE — move briskly through these. 2 seconds each. Check-In page (click one checkbox to check in a guest) → Analytics (pan across the 4 charts, pause on cross-event comparison) → Calendar view → Activity Log → Feedback page.]**

> QR check-in — single or bulk. Analytics — four charts with **cross-event comparison** and PDF export. Calendar view. Full **activity audit trail**. Guest **feedback with ratings**. Every stage of the event lifecycle — covered.

---

## SECTION 5: CLOSING (4:40 – 5:00)

**[SCREEN: Return to the dashboard. All 7 events visible. Counters have settled. Pause. Let the dashboard breathe for 1 second before speaking.]**

> You just watched a hotel contract become a live event with AI. You watched that event generate a branded microsite — automatically themed from an invitation. You watched a guest book a room through it with server-enforced rules. And you watched an agent manage the entire lifecycle from one dashboard.
>
> **15,300 lines of TypeScript.** 37 API endpoints. 13 data models. Next.js 16, React 19, Prisma 7, GPT-4o Vision. Full dark mode. Hindi and English. PWA-ready.
>
> This is not a prototype that could work. This is a prototype that **is** working. Right now.
>
> TBO Assemble. Team IIITDards, IIIT Delhi.

**[SCREEN: Hold 3 seconds. Fade to black.]**

---

## APPENDIX A: TIMING BREAKDOWN

| Section | Duration | Cumulative | Core Focus |
|:--------|:---------|:-----------|:-----------|
| 1. Hook + AI Contract Parsing | 85s | 1:25 | GPT-4o Vision, structured extraction, one-click event creation |
| 2. Branded Microsite | 55s | 2:20 | AI-themed microsite, live occupancy, discounts, i18n |
| 3. Guest Booking Flow | 60s | 3:20 | 3-step wizard, server rules, confetti, QR, self-service |
| 4. Agent Dashboard | 80s | 4:40 | Stats, allocator, AI auto-allocate, attrition nudge, lifecycle montage |
| 5. Closing | 20s | 5:00 | Narrative recap, tech stats, sign-off |
| **TOTAL** | **300s** | **5:00** | |

## APPENDIX B: NAVIGATION PATH (15 STOPS)

| # | URL / Action | Section | Time |
|:-:|:-------------|:--------|:-----|
| 1 | `/dashboard/onboarding` — Drag both PDFs into upload zones | S1 | 8s |
| 2 | Click "Parse with AI" — loading → output populates | S1 | 15s |
| 3 | Scroll parsed form: venue, rooms, add-ons, attrition, colors | S1 | 30s |
| 4 | Edit one field + click "Create Event" → success toast | S1 | 10s |
| 5 | `/event/sharma-patel-wedding-2026` — Hero, countdown, scroll | S2 | 25s |
| 6 | Scroll: room cards → social proof → discounts → attrition → add-ons | S2 | 15s |
| 7 | Toggle Hindi, dark mode, show WhatsApp share | S2 | 8s |
| 8 | Click "Reserve Room" → 3-step wizard (fill all steps live) | S3 | 35s |
| 9 | Confirm → 4-phase animation → confetti + QR (hold 2s) | S3 | 12s |
| 10 | `/booking/[id]` — Self-service portal flash | S3 | 5s |
| 11 | `/dashboard` — Aggregate stats, 7 event cards | S4 | 8s |
| 12 | `/dashboard/events/[id]` → Overview → Inventory → Guests → Allocator | S4 | 18s |
| 13 | Drag a guest + click "AI Auto-Allocate" | S4 | 12s |
| 14 | Attrition timeline → Click "Send Nudge" | S4 | 10s |
| 15 | Montage: Check-in → Analytics → Calendar → Activity → Feedback → Dashboard | S4–S5 | 20s |

## APPENDIX C: SCREEN RECORDING CHECKLIST

**Before Recording:**
- [ ] Database freshly seeded (click "Reset Demo" on dashboard)
- [ ] Dark mode ON
- [ ] Browser fullscreen (F11), bookmarks bar hidden, no other tabs
- [ ] Resolution: 1920×1080 minimum
- [ ] Both demo PDFs (hotel-contract.pdf + wedding-invitation.pdf) ready to drag from a folder
- [ ] AI onboarding page pre-loaded at `/dashboard/onboarding`
- [ ] Practice the full 15-stop navigation path 3 times — aim for 4:45–5:00

**The Two "Wow" Moments — Nail These:**
- [ ] **WOW #1 (1:00):** AI parse output populates the form. STOP TALKING for 2 seconds. Let the data fill in. This is the single most impressive moment — a contract just became structured inventory.
- [ ] **WOW #2 (3:05):** Confetti fires on booking confirmation. STOP TALKING for 2 seconds. QR code, invoice link, calendar link — all visible. The guest journey is complete.

**During Recording:**
- [ ] Narrate what's ON SCREEN — don't explain what the product "supports"
- [ ] If it's visible, one sentence. Not two.
- [ ] Keep the narrative thread: contract → event → microsite → booking → dashboard. Each section opens by connecting to the previous one.
- [ ] Breathe between sections — one natural breath, not a planned pause

**Post-Recording:**
- [ ] Trim all dead air except the two "wow" pauses
- [ ] Cross-fade transitions (0.3s) between sections
- [ ] Zoom-in (1.3x) on: AI parse output fields, volume discount line in invoice, confetti/QR screen, AI auto-allocate result
- [ ] Verify duration: 4:45 – 5:15
- [ ] Watch once as a judge — is there a single second where nothing impressive is visible?

## APPENDIX D: WHY THIS SCRIPT WINS

| Principle | How It's Applied |
|:----------|:-----------------|
| **Action first** | Opens on the product doing something, not a bio or problem slide |
| **Narrative thread** | Contract → event → microsite → booking → dashboard. Every section references the previous one ("those colors the AI pulled thirty seconds ago," "that booking we just made is already here") |
| **Two strategic silences** | AI parse output filling in (1:00) and confetti firing (3:05). These are the two moments judges will remember. Everything else is fast. |
| **Show, don't explain** | Zero sentences about what the product "can do" or "supports." Every sentence describes something happening live on screen. |
| **No problem setup** | Judges wrote the problem statement. The one-line hook ("a travel agent just received a hotel contract") provides all the context needed. |
| **Server-side credibility** | Brief but specific: "duplicate prevention, availability guards, price validation, the client can't manipulate the total." Signals engineering depth without slowing down. |
| **The closing thread** | "You watched a contract become an event. You watched it generate a microsite. You watched a guest book through it. You watched an agent manage the lifecycle." — Recaps the entire demo as one connected story in 4 sentences. |
| **The last line sticks** | "This is not a prototype that could work. This is a prototype that IS working. Right now." — Differentiates from every mockup and Figma in the competition. |
