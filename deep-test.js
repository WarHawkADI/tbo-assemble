/**
 * deep-test.js  –  Exhaustive parser test for ALL demo-docs
 * Run:  node deep-test.js
 *
 * For each PDF it prints every single extracted field so we can manually
 * verify against the source documents.
 */

const fs   = require('fs');
const path = require('path');
const { parseContractLocally, parseInviteLocally, extractTextWithOCRFallback } =
  require('./src/lib/local-parser');

const DEMO = path.join(__dirname, 'demo-docs');
const SEP  = '═'.repeat(70);
const DIV  = '─'.repeat(50);

function p(label, value) {
  if (value === undefined || value === null) {
    console.log(`  ${label.padEnd(28)} : ‹not found›`);
  } else if (typeof value === 'string') {
    console.log(`  ${label.padEnd(28)} : "${value}"`);
  } else {
    console.log(`  ${label.padEnd(28)} : ${JSON.stringify(value)}`);
  }
}

function printRooms(rooms) {
  if (!rooms || rooms.length === 0) {
    console.log('  ‹no rooms extracted›');
    return;
  }
  rooms.forEach((r, i) => {
    console.log(`  [${i+1}] ${r.roomType}`);
    console.log(`       rate     = ${r.rate}`);
    console.log(`       qty      = ${r.quantity}`);
    if (r.floor) console.log(`       floor    = ${r.floor}`);
    if (r.wing)  console.log(`       wing     = ${r.wing}`);
    if (r.hotelName) console.log(`       hotel    = ${r.hotelName}`);
  });
}

function printAddOns(addOns) {
  if (!addOns || addOns.length === 0) {
    console.log('  ‹no add-ons extracted›');
    return;
  }
  addOns.forEach((a, i) => {
    const priceStr = a.isIncluded ? 'COMPLIMENTARY' : `₹${a.price}`;
    console.log(`  [${i+1}] ${a.name.padEnd(30)} ${priceStr}`);
  });
}

function printAttrition(rules) {
  if (!rules || rules.length === 0) {
    console.log('  ‹no attrition rules extracted›');
    return;
  }
  rules.forEach((r, i) => {
    console.log(`  [${i+1}] ${r.releaseDate || '(no date)'}  →  ${r.releasePercent}%  –  ${r.description}`);
  });
}

function printGuests(guests) {
  if (!guests || guests.length === 0) { console.log('  ‹none›'); return; }
  guests.forEach((g, i) => {
    console.log(`  [${i+1}] ${g.name || '?'}  |  ${g.email || '?'}  |  ${g.phone || '?'}  |  ${g.room || '?'}`);
  });
}

(async () => {
  const files = fs.readdirSync(DEMO).filter(f => /\.(pdf|jpg|jpeg|png|webp)$/i.test(f));

  for (const file of files) {
    console.log('\n' + SEP);
    console.log(`FILE : ${file}`);
    console.log(SEP);

    const buf      = fs.readFileSync(path.join(DEMO, file));
    const mime     = /\.pdf$/i.test(file) ? 'application/pdf' : 'image/jpeg';
    const isInvite = /invitation|invite/i.test(file);

    // ── 1. Extract raw text so we can check what the parser actually sees ──
    let rawText = '';
    try {
      const ocrResult = await extractTextWithOCRFallback(buf);
      rawText = ocrResult.text;
      console.log(`\n[OCR method: ${ocrResult.method || 'pdf-parse'}]`);
      console.log(`[Raw text length: ${rawText.length} chars]\n`);
      // Print the first 600 chars & last 400 chars so we can spot truncation
      console.log('── RAW TEXT (first 600) ──');
      console.log(rawText.slice(0, 600));
      console.log('── RAW TEXT (last 400)  ──');
      console.log(rawText.slice(-400));
      console.log(DIV);
    } catch(e) {
      console.log(`[Text extraction error]: ${e.message}`);
    }

    // ── 2. Run the appropriate parser ──
    let res;
    try {
      res = isInvite
        ? await parseInviteLocally(buf, mime)
        : await parseContractLocally(buf, mime);
    } catch(e) {
      console.log(`[Parse ERROR]: ${e.message}`);
      console.log(e.stack);
      continue;
    }

    if (!res.success || !res.data) {
      console.log('[Parse FAILED]:');
      console.log('  error      :', res.error);
      console.log('  validation :', JSON.stringify(res.validation));
      continue;
    }

    const d = res.data;

    // ── 3. Print EVERY extracted field ──
    console.log('\n── CORE FIELDS ──');
    p('venue',           d.venue);
    p('eventName',       d.eventName);
    p('eventType',       d.eventType);
    p('clientName',      d.clientName);
    p('contractNo',      d.contractNo);

    console.log('\n── DATES ──');
    p('checkIn',         d.checkIn);
    p('checkOut',        d.checkOut);
    p('validUntil',      d.validUntil);
    p('issueDate',       d.issueDate);

    console.log('\n── GUEST / HEADCOUNT ──');
    p('expectedGuests',  d.expectedGuests);
    p('nights',          d.nights);

    console.log('\n── PRICING / TOTALS ──');
    p('totalAmount',     d.totalAmount);
    p('currency',        d.currency);
    p('taxInfo',         d.taxInfo);

    console.log('\n── CONTACT / SIGNATORIES ──');
    p('hotelContact',    d.hotelContact);
    p('agentContact',    d.agentContact);
    p('signatories',     d.signatories);

    console.log('\n── ROOMS ──');
    printRooms(d.rooms);

    console.log('\n── ADD-ONS / INCLUSIONS ──');
    printAddOns(d.addOns);

    console.log('\n── ATTRITION / CANCELLATION ──');
    printAttrition(d.attritionRules);

    console.log('\n── GUESTS LIST (invite only) ──');
    if (d.guests) printGuests(d.guests); else console.log('  (not a guest list)');

    console.log('\n── MISC ──');
    p('notes',           d.notes);
    p('specialTerms',    d.specialTerms);
    p('groupCode',       d.groupCode);
    p('paymentTerms',    d.paymentTerms);
    p('earlyCheckIn',    d.earlyCheckIn);
    p('lateCheckOut',    d.lateCheckOut);
    p('gstin',           d.gstin);
    p('location',        d.location);
    // Invite-specific enriched fields
    if (d.primaryColor !== undefined) {
      console.log('\n── INVITE COLORS ──');
      p('primaryColor',   d.primaryColor);
      p('secondaryColor', d.secondaryColor);
      p('accentColor',    d.accentColor);
    }
    if (d.agentContact !== undefined && !d.rooms) {
      console.log('\n── INVITE CONTACTS ──');
      p('agentContact',   d.agentContact);
    }

    console.log('\n── VALIDATION ──');
    console.log('  missingFields :', JSON.stringify(res.validation?.missingFields));
    console.log('  warnings      :', JSON.stringify(res.validation?.warnings));
  }

  console.log('\n' + SEP);
  console.log('ALL FILES PROCESSED');
  console.log(SEP + '\n');
})();
