import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST() {
  try {
    // Environment guard — prevent seeding in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Seed not available in production" }, { status: 403 });
    }

    console.log("🌱 Seeding TBO Assemble database...\n");

    // Clean existing data (order matters for foreign keys)
    await prisma.roomOccupant.deleteMany();
    await prisma.scheduleItem.deleteMany();
    await prisma.rFP.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.bookingAddOn.deleteMany();
    await prisma.nudge.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.waitlist.deleteMany();
    await prisma.discountRule.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.addOn.deleteMany();
    await prisma.attritionRule.deleteMany();
    await prisma.roomBlock.deleteMany();
    await prisma.event.deleteMany();
    await prisma.agent.deleteMany();

    // Create Agent
    const agent = await prisma.agent.create({
      data: {
        name: "Rajesh Kumar",
        email: "agent@tbo.com",
        password: "demo123",
        company: "TBO Travel Solutions",
      },
    });

    // Create Event - Wedding
    const wedding = await prisma.event.create({
      data: {
        name: "The Sharma-Patel Wedding",
        slug: "sharma-patel-wedding-2026",
        type: "wedding",
        venue: "The Grand Hyatt Resort & Spa",
        location: "Udaipur, Rajasthan",
        checkIn: new Date("2026-04-10"),
        checkOut: new Date("2026-04-13"),
        description:
          "A grand celebration of love uniting the Sharma and Patel families at the magnificent Grand Hyatt Resort & Spa, Udaipur.",
        primaryColor: "#8B1A4A",
        secondaryColor: "#FFF5F5",
        accentColor: "#D4A574",
        expectedPax: 150,
        agentId: agent.id,
        status: "active",
      },
    });

    // Create Room Blocks
    const deluxe = await prisma.roomBlock.create({
      data: {
        roomType: "Deluxe Room",
        description: "Spacious room with garden view, king bed, and modern amenities",
        rate: 12000,
        totalQty: 30,
        bookedQty: 9,
        floor: "2-3",
        wing: "East Wing",
        hotelName: "The Grand Hyatt Resort & Spa",
        eventId: wedding.id,
      },
    });

    const premium = await prisma.roomBlock.create({
      data: {
        roomType: "Premium Suite",
        description: "Luxurious suite with lake view, separate living area, and premium amenities",
        rate: 22000,
        totalQty: 15,
        bookedQty: 6,
        floor: "4",
        wing: "East Wing",
        hotelName: "The Grand Hyatt Resort & Spa",
        eventId: wedding.id,
      },
    });

    const royal = await prisma.roomBlock.create({
      data: {
        roomType: "Royal Suite",
        description: "Ultra-luxury suite with panoramic lake view, private balcony, and butler service",
        rate: 45000,
        totalQty: 5,
        bookedQty: 2,
        floor: "5",
        wing: "Tower",
        hotelName: "Taj Lake Palace",
        eventId: wedding.id,
      },
    });

    // Create Add-Ons
    const addOns = await Promise.all([
      prisma.addOn.create({
        data: { name: "Airport Pickup (Group)", price: 1500, isIncluded: false, eventId: wedding.id },
      }),
      prisma.addOn.create({
        data: { name: "Welcome Dinner", price: 0, isIncluded: true, eventId: wedding.id },
      }),
      prisma.addOn.create({
        data: { name: "Mehendi Ceremony Pass", price: 0, isIncluded: true, eventId: wedding.id },
      }),
      prisma.addOn.create({
        data: { name: "Gala Night Pass", price: 2500, isIncluded: false, eventId: wedding.id },
      }),
      prisma.addOn.create({
        data: { name: "Spa Package (60 min)", price: 3000, isIncluded: false, eventId: wedding.id },
      }),
      prisma.addOn.create({
        data: { name: "Heritage City Tour", price: 2000, isIncluded: false, eventId: wedding.id },
      }),
    ]);

    // Create Attrition Rules
    await Promise.all([
      prisma.attritionRule.create({
        data: {
          releaseDate: new Date("2026-03-10"),
          releasePercent: 30,
          description: "Release 30% of unsold rooms 30 days prior",
          eventId: wedding.id,
        },
      }),
      prisma.attritionRule.create({
        data: {
          releaseDate: new Date("2026-03-25"),
          releasePercent: 50,
          description: "Release 50% of remaining unsold rooms 15 days prior",
          eventId: wedding.id,
        },
      }),
      prisma.attritionRule.create({
        data: {
          releaseDate: new Date("2026-04-03"),
          releasePercent: 100,
          description: "Release all unsold rooms 7 days prior — full attrition penalty applies",
          eventId: wedding.id,
        },
      }),
    ]);

    // Create Guests
    const brideGuests = [
      { name: "Priya Sharma", status: "confirmed", group: "Bride Side", email: "priya@email.com", phone: "+91 98765 43210", proximityRequest: null as string | null },
      { name: "Anita Sharma", status: "confirmed", group: "Bride Side", email: "anita@email.com", phone: "+91 98765 43211", proximityRequest: "Near Priya Sharma" },
      { name: "Rajiv Sharma", status: "confirmed", group: "Bride Side", email: "rajiv@email.com", phone: null as string | null, proximityRequest: "Near Anita Sharma" },
      { name: "Meena Sharma", status: "confirmed", group: "Bride Side", email: null as string | null, phone: "+91 98765 43213", proximityRequest: null as string | null },
      { name: "Sanjay Gupta", status: "confirmed", group: "Bride Side", email: "sanjay@email.com", phone: null as string | null, proximityRequest: null as string | null },
      { name: "Neha Verma", status: "invited", group: "Bride Side", email: "neha@email.com", phone: "+91 98765 43215", proximityRequest: "Near Priya Sharma" },
      { name: "Vikram Sharma", status: "invited", group: "Bride Side", email: "vikram@email.com", phone: null as string | null, proximityRequest: null as string | null },
      { name: "Ritu Agarwal", status: "invited", group: "Bride Side", email: null as string | null, phone: "+91 98765 43217", proximityRequest: null as string | null },
    ];

    const groomGuests = [
      { name: "Amit Patel", status: "confirmed", group: "Groom Side", email: "amit@email.com", phone: "+91 87654 32100", proximityRequest: null as string | null },
      { name: "Sunita Patel", status: "confirmed", group: "Groom Side", email: "sunita@email.com", phone: "+91 87654 32101", proximityRequest: "Near Amit Patel" },
      { name: "Kiran Patel", status: "confirmed", group: "Groom Side", email: "kiran@email.com", phone: null as string | null, proximityRequest: null as string | null },
      { name: "Deepak Joshi", status: "confirmed", group: "Groom Side", email: "deepak@email.com", phone: "+91 87654 32103", proximityRequest: null as string | null },
      { name: "Pooja Mehta", status: "confirmed", group: "Groom Side", email: null as string | null, phone: "+91 87654 32104", proximityRequest: "Near Kiran Patel" },
      { name: "Rohit Shah", status: "invited", group: "Groom Side", email: "rohit@email.com", phone: null as string | null, proximityRequest: null as string | null },
      { name: "Anjali Desai", status: "invited", group: "Groom Side", email: "anjali@email.com", phone: "+91 87654 32106", proximityRequest: null as string | null },
    ];

    const vipGuests = [
      { name: "Mr. Harish Sharma", status: "confirmed", group: "VIP", email: "harish@email.com", phone: "+91 99999 11111", proximityRequest: null as string | null },
      { name: "Mrs. Kamla Sharma", status: "confirmed", group: "VIP", email: null as string | null, phone: "+91 99999 22222", proximityRequest: "Near Mr. Harish Sharma" },
      { name: "Mr. Suresh Patel", status: "confirmed", group: "VIP", email: "suresh@email.com", phone: "+91 88888 11111", proximityRequest: null as string | null },
      { name: "Mrs. Geeta Patel", status: "confirmed", group: "VIP", email: null as string | null, phone: "+91 88888 22222", proximityRequest: "Near Mr. Suresh Patel" },
      { name: "Pandit Ravi Shankar", status: "confirmed", group: "VIP", email: null as string | null, phone: "+91 77777 11111", proximityRequest: null as string | null },
    ];

    const friendGuests = [
      { name: "Aditya Rai", status: "confirmed", group: "Friends", email: "aditya@email.com", phone: "+91 76543 21000", proximityRequest: null as string | null },
      { name: "Sneha Kapoor", status: "confirmed", group: "Friends", email: "sneha@email.com", phone: null as string | null, proximityRequest: "Near Aditya Rai" },
      { name: "Arjun Singh", status: "invited", group: "Friends", email: "arjun@email.com", phone: "+91 76543 21002", proximityRequest: null as string | null },
      { name: "Divya Nair", status: "invited", group: "Friends", email: "divya@email.com", phone: null as string | null, proximityRequest: null as string | null },
      { name: "Rahul Mehta", status: "invited", group: "Friends", email: "rahul@email.com", phone: "+91 76543 21004", proximityRequest: "Near Arjun Singh" },
      { name: "Tanvi Jain", status: "cancelled", group: "Friends", email: "tanvi@email.com", phone: null as string | null, proximityRequest: null as string | null },
    ];

    const allGuests = [...brideGuests, ...groomGuests, ...vipGuests, ...friendGuests];

    const createdGuests = [];
    for (const guestData of allGuests) {
      const guest = await prisma.guest.create({
        data: {
          name: guestData.name,
          email: guestData.email || null,
          phone: guestData.phone || null,
          group: guestData.group,
          status: guestData.status,
          proximityRequest: guestData.proximityRequest || null,
          eventId: wedding.id,
        },
      });
      createdGuests.push(guest);
    }

    // Create Bookings for confirmed guests
    const confirmedGuests = createdGuests.filter((g) => g.status === "confirmed");
    const roomOptions = [deluxe, deluxe, deluxe, premium, premium, royal];

    for (let i = 0; i < confirmedGuests.length; i++) {
      const guest = confirmedGuests[i];
      const room = roomOptions[i % roomOptions.length];
      const nights = 3;
      const roomCost = room.rate * nights;
      const addOnCost = i % 3 === 0 ? 1500 : i % 3 === 1 ? 2500 : 0;

      const booking = await prisma.booking.create({
        data: {
          guestId: guest.id,
          eventId: wedding.id,
          roomBlockId: room.id,
          totalAmount: roomCost + addOnCost,
          status: "confirmed",
        },
      });

      if (addOnCost === 1500) {
        await prisma.bookingAddOn.create({
          data: { bookingId: booking.id, addOnId: addOns[0].id, price: 1500 },
        });
      } else if (addOnCost === 2500) {
        await prisma.bookingAddOn.create({
          data: { bookingId: booking.id, addOnId: addOns[3].id, price: 2500 },
        });
      }
    }

    // Allocate VIP guests
    const vipCreated = createdGuests.filter((g) => g.group === "VIP");
    for (const vip of vipCreated) {
      await prisma.guest.update({
        where: { id: vip.id },
        data: { allocatedFloor: "5", allocatedWing: "Tower" },
      });
    }

    // Create MICE event
    const conference = await prisma.event.create({
      data: {
        name: "TechConnect Summit 2026",
        slug: "techconnect-summit-2026",
        type: "mice",
        venue: "JW Marriott Convention Centre",
        location: "Mumbai, Maharashtra",
        checkIn: new Date("2026-05-15"),
        checkOut: new Date("2026-05-18"),
        description:
          "Annual technology conference bringing together industry leaders for 3 days of innovation.",
        primaryColor: "#1e40af",
        secondaryColor: "#eff6ff",
        accentColor: "#3b82f6",
        expectedPax: 200,
        agentId: agent.id,
        status: "active",
      },
    });

    await prisma.roomBlock.createMany({
      data: [
        { roomType: "Business Room", rate: 8000, totalQty: 50, bookedQty: 5, floor: "3-5", wing: "North Wing", hotelName: "JW Marriott Convention Centre", eventId: conference.id },
        { roomType: "Executive Suite", rate: 15000, totalQty: 20, bookedQty: 5, floor: "6-7", wing: "North Wing", hotelName: "JW Marriott Convention Centre", eventId: conference.id },
      ],
    });

    await prisma.addOn.createMany({
      data: [
        { name: "Conference Lunch (3 days)", price: 0, isIncluded: true, eventId: conference.id },
        { name: "Networking Dinner", price: 3500, isIncluded: false, eventId: conference.id },
        { name: "Workshop Pass", price: 5000, isIncluded: false, eventId: conference.id },
      ],
    });

    await prisma.attritionRule.createMany({
      data: [
        { releaseDate: new Date("2026-04-15"), releasePercent: 25, description: "Release 25% of unsold rooms 30 days prior", eventId: conference.id },
        { releaseDate: new Date("2026-05-01"), releasePercent: 50, description: "Release 50% of remaining 14 days prior", eventId: conference.id },
      ],
    });

    // Conference guests
    const confGuestData = [
      { name: "Vikram Sundaram", status: "confirmed", group: "Speakers", email: "vikram.s@techcorp.in", phone: "+91 98100 20001" },
      { name: "Nandini Rao", status: "confirmed", group: "Speakers", email: "nandini.rao@startupx.com", phone: "+91 98100 20002" },
      { name: "Suresh Iyer", status: "confirmed", group: "Speakers", email: "suresh.iyer@cloudnext.io", phone: "+91 98100 20003" },
      { name: "Prashant Mittal", status: "confirmed", group: "Attendees", email: "prashant@infosys.com", phone: "+91 98100 20010" },
      { name: "Kavitha Menon", status: "confirmed", group: "Attendees", email: "kavitha.m@wipro.com", phone: "+91 98100 20011" },
      { name: "Rajan Nair", status: "confirmed", group: "Attendees", email: "rajan@tcs.com", phone: "+91 98100 20012" },
      { name: "Deepa Krishnan", status: "confirmed", group: "Attendees", email: "deepa.k@amazon.in", phone: "+91 98100 20013" },
      { name: "Arjun Kapoor", status: "confirmed", group: "Attendees", email: "arjun.k@google.com", phone: "+91 98100 20014" },
      { name: "Shruti Bansal", status: "confirmed", group: "Sponsors", email: "shruti@salesforce.com", phone: "+91 98100 20020" },
      { name: "Gaurav Bhatia", status: "confirmed", group: "Sponsors", email: "gaurav.b@microsoft.com", phone: "+91 98100 20021" },
      { name: "Megha Joshi", status: "invited", group: "Attendees", email: "megha@flipkart.com", phone: "+91 98100 20030" },
      { name: "Anand Sharma", status: "invited", group: "Attendees", email: "anand.s@paytm.com", phone: "+91 98100 20031" },
      { name: "Poornima Reddy", status: "invited", group: "Attendees", email: "poornima@razorpay.com", phone: "+91 98100 20032" },
      { name: "Tarun Gupta", status: "invited", group: "Attendees", email: "tarun@zerodha.com", phone: "+91 98100 20033" },
    ];
    const confRoomBlocks = await prisma.roomBlock.findMany({ where: { eventId: conference.id } });
    for (const gd of confGuestData) {
      const g = await prisma.guest.create({
        data: { ...gd, phone: gd.phone || null, proximityRequest: null, eventId: conference.id },
      });
      if (gd.status === "confirmed") {
        const rb = gd.group === "Speakers" || gd.group === "Sponsors" ? confRoomBlocks[1] : confRoomBlocks[0];
        const nights = 3;
        await prisma.booking.create({
          data: { guestId: g.id, eventId: conference.id, roomBlockId: rb.id, totalAmount: rb.rate * nights, status: "confirmed" },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // EVENT 3: Destination Wedding in Goa
    // ═══════════════════════════════════════════════════════
    const goaWedding = await prisma.event.create({
      data: {
        name: "The Khanna-Batra Beach Wedding",
        slug: "khanna-batra-goa-2026",
        type: "wedding",
        venue: "Taj Exotica Resort & Spa",
        location: "Benaulim, Goa",
        checkIn: new Date("2026-03-05"),
        checkOut: new Date("2026-03-08"),
        description: "A breathtaking beachside wedding celebration at the Taj Exotica, where the Arabian Sea meets timeless romance. Three days of sun, sand, and celebration.",
        primaryColor: "#0e7490",
        secondaryColor: "#ecfeff",
        accentColor: "#06b6d4",
        expectedPax: 80,
        agentId: agent.id,
        status: "active",
      },
    });

    const goaDeluxe = await prisma.roomBlock.create({
      data: { roomType: "Garden View Room", description: "Spacious room with lush garden views and private sit-out", rate: 14000, totalQty: 40, bookedQty: 9, floor: "1-2", wing: "South Wing", hotelName: "Taj Exotica Resort & Spa", eventId: goaWedding.id },
    });
    const goaSea = await prisma.roomBlock.create({
      data: { roomType: "Sea View Suite", description: "Premium suite with panoramic ocean views and private balcony", rate: 28000, totalQty: 12, bookedQty: 5, floor: "3", wing: "Beachfront", hotelName: "Taj Exotica Resort & Spa", eventId: goaWedding.id },
    });
    const goaVilla = await prisma.roomBlock.create({
      data: { roomType: "Presidential Villa", description: "Ultra-luxury private villa with infinity pool and direct beach access", rate: 65000, totalQty: 5, bookedQty: 4, floor: "Ground", wing: "Villa Complex", hotelName: "Taj Exotica Resort & Spa", eventId: goaWedding.id },
    });

    await prisma.addOn.createMany({
      data: [
        { name: "Sunset Cruise (Couples)", price: 5000, isIncluded: false, eventId: goaWedding.id },
        { name: "Beach BBQ Night", price: 0, isIncluded: true, eventId: goaWedding.id },
        { name: "Sangeet Night Pass", price: 0, isIncluded: true, eventId: goaWedding.id },
        { name: "Catamaran Ride", price: 2500, isIncluded: false, eventId: goaWedding.id },
        { name: "Ayurvedic Spa (90 min)", price: 4500, isIncluded: false, eventId: goaWedding.id },
      ],
    });

    await prisma.attritionRule.createMany({
      data: [
        { releaseDate: new Date("2026-02-05"), releasePercent: 20, description: "Release 20% unsold rooms 28 days prior", eventId: goaWedding.id },
        { releaseDate: new Date("2026-02-19"), releasePercent: 50, description: "Release 50% remaining 14 days prior", eventId: goaWedding.id },
        { releaseDate: new Date("2026-02-26"), releasePercent: 100, description: "Final release — all unsold rooms 7 days prior", eventId: goaWedding.id },
      ],
    });

    const goaGuests = [
      { name: "Rohan Khanna", status: "confirmed", group: "Groom Family", email: "rohan.k@gmail.com", phone: "+91 99001 10001" },
      { name: "Nisha Khanna", status: "confirmed", group: "Groom Family", email: "nisha.k@gmail.com", phone: "+91 99001 10002" },
      { name: "Vikrant Khanna", status: "confirmed", group: "Groom Family", email: "vikrant@gmail.com", phone: "+91 99001 10003" },
      { name: "Simran Batra", status: "confirmed", group: "Bride Family", email: "simran.b@gmail.com", phone: "+91 99002 20001" },
      { name: "Harpreet Batra", status: "confirmed", group: "Bride Family", email: "harpreet.b@gmail.com", phone: "+91 99002 20002" },
      { name: "Gurpreet Singh Batra", status: "confirmed", group: "Bride Family", email: "gurpreet@gmail.com", phone: "+91 99002 20003" },
      { name: "Jasmine Kaur", status: "confirmed", group: "Bride Family", email: "jasmine.k@gmail.com", phone: "+91 99002 20004" },
      { name: "Dev Malhotra", status: "confirmed", group: "Friends", email: "dev.m@hotmail.com", phone: "+91 99003 30001" },
      { name: "Tara Chopra", status: "confirmed", group: "Friends", email: "tara.c@hotmail.com", phone: "+91 99003 30002" },
      { name: "Kabir Sethi", status: "confirmed", group: "Friends", email: "kabir.s@outlook.com", phone: "+91 99003 30003" },
      { name: "Zoya Khan", status: "confirmed", group: "Friends", email: "zoya.k@gmail.com", phone: "+91 99003 30004" },
      { name: "Aman Dhillon", status: "confirmed", group: "Friends", email: "aman.d@gmail.com", phone: "+91 99003 30005" },
      { name: "Rhea Oberoi", status: "confirmed", group: "Friends", email: "rhea.o@gmail.com", phone: "+91 99003 30006" },
      { name: "Karan Ahuja", status: "confirmed", group: "College Friends", email: "karan.a@yahoo.com", phone: "+91 99004 40001" },
      { name: "Priyanka Gill", status: "confirmed", group: "College Friends", email: "priyanka.g@yahoo.com", phone: "+91 99004 40002" },
      { name: "Manish Tandon", status: "confirmed", group: "College Friends", email: "manish.t@gmail.com", phone: "+91 99004 40003" },
      { name: "Sania Mirza", status: "confirmed", group: "VIP", email: "sania.m@vip.com", phone: "+91 99005 50001" },
      { name: "Farhan Ahmed", status: "confirmed", group: "VIP", email: "farhan.a@vip.com", phone: "+91 99005 50002" },
      { name: "Aditi Reddy", status: "invited", group: "Extended Family", email: "aditi.r@gmail.com", phone: "+91 99006 60001" },
      { name: "Sameer Walia", status: "invited", group: "Extended Family", email: "sameer.w@gmail.com", phone: "+91 99006 60002" },
      { name: "Preeti Dutt", status: "invited", group: "Extended Family", email: "preeti.d@gmail.com", phone: "+91 99006 60003" },
      { name: "Aryan Sood", status: "invited", group: "Friends", email: "aryan.s@gmail.com", phone: "+91 99006 60004" },
      { name: "Natasha Gill", status: "cancelled", group: "Friends", email: "natasha.g@gmail.com", phone: "+91 99006 60005" },
    ];
    const goaRoomOpts = [goaDeluxe, goaDeluxe, goaDeluxe, goaSea, goaSea, goaVilla];
    for (let i = 0; i < goaGuests.length; i++) {
      const gd = goaGuests[i];
      const g = await prisma.guest.create({
        data: { name: gd.name, email: gd.email, phone: gd.phone, group: gd.group, status: gd.status, proximityRequest: null, eventId: goaWedding.id },
      });
      if (gd.status === "confirmed") {
        const rb = gd.group === "VIP" ? goaVilla : goaRoomOpts[i % goaRoomOpts.length];
        await prisma.booking.create({
          data: { guestId: g.id, eventId: goaWedding.id, roomBlockId: rb.id, totalAmount: rb.rate * 3, status: "confirmed" },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // EVENT 4: Corporate Annual Offsite – Jaipur
    // ═══════════════════════════════════════════════════════
    const corpOffsite = await prisma.event.create({
      data: {
        name: "Zephyr Corp Annual Offsite 2026",
        slug: "zephyr-corp-offsite-2026",
        type: "corporate",
        venue: "ITC Rajputana",
        location: "Jaipur, Rajasthan",
        checkIn: new Date("2026-06-20"),
        checkOut: new Date("2026-06-23"),
        description: "Zephyr Corporation's annual leadership offsite bringing together 120+ team members for strategy sessions, team-building, and celebrating milestones in the Pink City.",
        primaryColor: "#7c3aed",
        secondaryColor: "#f5f3ff",
        accentColor: "#a78bfa",
        expectedPax: 120,
        agentId: agent.id,
        status: "active",
      },
    });

    const corpStandard = await prisma.roomBlock.create({
      data: { roomType: "ITC One Room", description: "Well-appointed room with city views and club floor access", rate: 9500, totalQty: 60, bookedQty: 8, floor: "3-6", wing: "Heritage Wing", hotelName: "ITC Rajputana", eventId: corpOffsite.id },
    });
    const corpExec = await prisma.roomBlock.create({
      data: { roomType: "Executive Club Suite", description: "Spacious suite with separate lounge, club privileges and Hawa Mahal views", rate: 18000, totalQty: 15, bookedQty: 2, floor: "7-8", wing: "Tower Block", hotelName: "ITC Rajputana", eventId: corpOffsite.id },
    });
    const corpPres = await prisma.roomBlock.create({
      data: { roomType: "Rajputana Suite", description: "Heritage luxury suite with royal décor, private dining room, and butler service", rate: 35000, totalQty: 8, bookedQty: 7, floor: "9", wing: "Royal Wing", hotelName: "ITC Rajputana", eventId: corpOffsite.id },
    });

    await prisma.addOn.createMany({
      data: [
        { name: "Airport Transfer (Jaipur)", price: 1200, isIncluded: false, eventId: corpOffsite.id },
        { name: "Team Dinner at Nahargarh Fort", price: 0, isIncluded: true, eventId: corpOffsite.id },
        { name: "Heritage Walking Tour", price: 1800, isIncluded: false, eventId: corpOffsite.id },
        { name: "Hot Air Balloon Ride", price: 8000, isIncluded: false, eventId: corpOffsite.id },
        { name: "Rajasthani Cultural Night", price: 0, isIncluded: true, eventId: corpOffsite.id },
        { name: "Executive Spa Package", price: 3500, isIncluded: false, eventId: corpOffsite.id },
      ],
    });

    await prisma.attritionRule.createMany({
      data: [
        { releaseDate: new Date("2026-05-20"), releasePercent: 20, description: "Release 20% unsold inventory 30 days prior", eventId: corpOffsite.id },
        { releaseDate: new Date("2026-06-06"), releasePercent: 50, description: "Release 50% remaining rooms 14 days prior", eventId: corpOffsite.id },
        { releaseDate: new Date("2026-06-13"), releasePercent: 100, description: "Full release 7 days prior — penalty applies", eventId: corpOffsite.id },
      ],
    });

    const corpGuests = [
      { name: "Anika Mehra", status: "confirmed", group: "Leadership", email: "anika.m@zephyr.com", phone: "+91 98200 10001" },
      { name: "Rajat Verma", status: "confirmed", group: "Leadership", email: "rajat.v@zephyr.com", phone: "+91 98200 10002" },
      { name: "Siddharth Jain", status: "confirmed", group: "Leadership", email: "sid.jain@zephyr.com", phone: "+91 98200 10003" },
      { name: "Pooja Srinivasan", status: "confirmed", group: "Leadership", email: "pooja.s@zephyr.com", phone: "+91 98200 10004" },
      { name: "Nikhil Agrawal", status: "confirmed", group: "Engineering", email: "nikhil.a@zephyr.com", phone: "+91 98200 20001" },
      { name: "Roshni Deshmukh", status: "confirmed", group: "Engineering", email: "roshni.d@zephyr.com", phone: "+91 98200 20002" },
      { name: "Varun Tiwari", status: "confirmed", group: "Engineering", email: "varun.t@zephyr.com", phone: "+91 98200 20003" },
      { name: "Aditi Saxena", status: "confirmed", group: "Engineering", email: "aditi.s@zephyr.com", phone: "+91 98200 20004" },
      { name: "Harsh Pandey", status: "confirmed", group: "Engineering", email: "harsh.p@zephyr.com", phone: "+91 98200 20005" },
      { name: "Meghna Pillai", status: "confirmed", group: "Engineering", email: "meghna.p@zephyr.com", phone: "+91 98200 20006" },
      { name: "Dhruv Kapoor", status: "confirmed", group: "Product", email: "dhruv.k@zephyr.com", phone: "+91 98200 30001" },
      { name: "Isha Bhatt", status: "confirmed", group: "Product", email: "isha.b@zephyr.com", phone: "+91 98200 30002" },
      { name: "Kunal Thakur", status: "confirmed", group: "Design", email: "kunal.t@zephyr.com", phone: "+91 98200 40001" },
      { name: "Divya Kohli", status: "confirmed", group: "Design", email: "divya.k@zephyr.com", phone: "+91 98200 40002" },
      { name: "Ankur Gupta", status: "confirmed", group: "Sales", email: "ankur.g@zephyr.com", phone: "+91 98200 50001" },
      { name: "Sonal Chauhan", status: "confirmed", group: "Sales", email: "sonal.c@zephyr.com", phone: "+91 98200 50002" },
      { name: "Yash Malhotra", status: "confirmed", group: "Sales", email: "yash.m@zephyr.com", phone: "+91 98200 50003" },
      { name: "Ritika Singh", status: "invited", group: "Marketing", email: "ritika.s@zephyr.com", phone: "+91 98200 60001" },
      { name: "Ayush Sharma", status: "invited", group: "Marketing", email: "ayush.s@zephyr.com", phone: "+91 98200 60002" },
      { name: "Neelam Puri", status: "invited", group: "HR", email: "neelam.p@zephyr.com", phone: "+91 98200 70001" },
    ];
    const corpRoomOpts = [corpStandard, corpStandard, corpStandard, corpExec, corpPres];
    for (let i = 0; i < corpGuests.length; i++) {
      const gd = corpGuests[i];
      const g = await prisma.guest.create({
        data: { name: gd.name, email: gd.email, phone: gd.phone, group: gd.group, status: gd.status, proximityRequest: null, eventId: corpOffsite.id },
      });
      if (gd.status === "confirmed") {
        const rb = gd.group === "Leadership" ? corpPres : corpRoomOpts[i % corpRoomOpts.length];
        await prisma.booking.create({
          data: { guestId: g.id, eventId: corpOffsite.id, roomBlockId: rb.id, totalAmount: rb.rate * 3, status: "confirmed" },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // EVENT 5: Medical / Pharma Conference – Hyderabad
    // ═══════════════════════════════════════════════════════
    const pharmaConf = await prisma.event.create({
      data: {
        name: "PharmaVision India 2026",
        slug: "pharmavision-india-2026",
        type: "mice",
        venue: "Novotel Hyderabad Convention Centre",
        location: "Hyderabad, Telangana",
        checkIn: new Date("2026-08-08"),
        checkOut: new Date("2026-08-11"),
        description: "India's premier pharmaceutical conference — 3 days of keynotes, panel discussions, and networking with 200+ delegates from across the healthcare industry.",
        primaryColor: "#059669",
        secondaryColor: "#ecfdf5",
        accentColor: "#34d399",
        expectedPax: 200,
        agentId: agent.id,
        status: "draft",
      },
    });

    const pharmaStd = await prisma.roomBlock.create({
      data: { roomType: "Superior Room", description: "Comfortable room with work desk and HITEC City views", rate: 7500, totalQty: 80, bookedQty: 4, floor: "4-8", wing: "Main Block", hotelName: "Novotel HICC", eventId: pharmaConf.id },
    });
    const pharmaPrem = await prisma.roomBlock.create({
      data: { roomType: "Premier Suite", description: "Upgraded suite with executive lounge access and express check-in", rate: 14000, totalQty: 25, bookedQty: 3, floor: "9-10", wing: "Tower Block", hotelName: "Novotel HICC", eventId: pharmaConf.id },
    });
    const pharmaPres = await prisma.roomBlock.create({
      data: { roomType: "Presidential Suite", description: "Top-floor luxury suite with living room, dining area, and panoramic city views", rate: 30000, totalQty: 4, bookedQty: 3, floor: "12", wing: "Tower Block", hotelName: "Novotel HICC", eventId: pharmaConf.id },
    });

    await prisma.addOn.createMany({
      data: [
        { name: "Conference Kit + Badge", price: 0, isIncluded: true, eventId: pharmaConf.id },
        { name: "Workshop: AI in Drug Discovery", price: 7500, isIncluded: false, eventId: pharmaConf.id },
        { name: "Gala Dinner at Falaknuma Palace", price: 6000, isIncluded: false, eventId: pharmaConf.id },
        { name: "Hyderabad Heritage Tour", price: 2000, isIncluded: false, eventId: pharmaConf.id },
        { name: "Airport Transfer (Hyderabad)", price: 800, isIncluded: false, eventId: pharmaConf.id },
      ],
    });

    await prisma.attritionRule.createMany({
      data: [
        { releaseDate: new Date("2026-07-08"), releasePercent: 25, description: "Release 25% — 30 days prior", eventId: pharmaConf.id },
        { releaseDate: new Date("2026-07-25"), releasePercent: 50, description: "Release 50% — 14 days prior", eventId: pharmaConf.id },
        { releaseDate: new Date("2026-08-01"), releasePercent: 100, description: "Full release — 7 days prior", eventId: pharmaConf.id },
      ],
    });

    const pharmaGuests = [
      { name: "Dr. Anjali Deshpande", status: "confirmed", group: "Keynote Speakers", email: "anjali.d@pharmahealth.in", phone: "+91 98300 10001" },
      { name: "Dr. Raghav Menon", status: "confirmed", group: "Keynote Speakers", email: "raghav.m@astrazeneca.com", phone: "+91 98300 10002" },
      { name: "Dr. Sunita Reddy", status: "confirmed", group: "Panelists", email: "sunita.r@cipla.com", phone: "+91 98300 20001" },
      { name: "Dr. Arun Khosla", status: "confirmed", group: "Panelists", email: "arun.k@drreddy.com", phone: "+91 98300 20002" },
      { name: "Priya Natarajan", status: "confirmed", group: "Delegates", email: "priya.n@sunpharma.com", phone: "+91 98300 30001" },
      { name: "Vikash Kumar", status: "confirmed", group: "Delegates", email: "vikash.k@biocon.com", phone: "+91 98300 30002" },
      { name: "Ananya Pillai", status: "confirmed", group: "Delegates", email: "ananya.p@lupin.com", phone: "+91 98300 30003" },
      { name: "Rajesh Bansal", status: "confirmed", group: "Delegates", email: "rajesh.b@glenmark.com", phone: "+91 98300 30004" },
      { name: "Meera Iyer", status: "confirmed", group: "Sponsors", email: "meera.i@pfizer.com", phone: "+91 98300 40001" },
      { name: "Sanjay Gupta", status: "confirmed", group: "Sponsors", email: "sanjay.g@novartis.com", phone: "+91 98300 40002" },
      { name: "Dr. Farida Khan", status: "invited", group: "Delegates", email: "farida.k@zydus.com", phone: "+91 98300 50001" },
      { name: "Amit Jha", status: "invited", group: "Delegates", email: "amit.j@torrent.com", phone: "+91 98300 50002" },
      { name: "Lakshmi Nair", status: "invited", group: "Delegates", email: "lakshmi.n@alkem.com", phone: "+91 98300 50003" },
      { name: "Rahul Saxena", status: "invited", group: "Delegates", email: "rahul.s@mankind.com", phone: "+91 98300 50004" },
      { name: "Dr. Vivek Sharma", status: "invited", group: "Delegates", email: "vivek.sh@sanofi.com", phone: "+91 98300 50005" },
    ];
    const pharmaRoomOpts = [pharmaStd, pharmaStd, pharmaStd, pharmaPrem, pharmaPres];
    for (let i = 0; i < pharmaGuests.length; i++) {
      const gd = pharmaGuests[i];
      const g = await prisma.guest.create({
        data: { name: gd.name, email: gd.email, phone: gd.phone, group: gd.group, status: gd.status, proximityRequest: null, eventId: pharmaConf.id },
      });
      if (gd.status === "confirmed") {
        const rb = gd.group === "Keynote Speakers" ? pharmaPres : gd.group === "Sponsors" ? pharmaPrem : pharmaRoomOpts[i % pharmaRoomOpts.length];
        await prisma.booking.create({
          data: { guestId: g.id, eventId: pharmaConf.id, roomBlockId: rb.id, totalAmount: rb.rate * 3, status: "confirmed" },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // EVENT 6: College Reunion – Shimla
    // ═══════════════════════════════════════════════════════
    const reunion = await prisma.event.create({
      data: {
        name: "IIT Delhi – Batch of 2016 Reunion",
        slug: "iitd-2016-reunion-shimla",
        type: "social",
        venue: "Wildflower Hall, An Oberoi Resort",
        location: "Shimla, Himachal Pradesh",
        checkIn: new Date("2026-10-15"),
        checkOut: new Date("2026-10-18"),
        description: "10-year reunion of IIT Delhi's Class of 2016. Three days of nostalgia, adventure, and reconnection in the Himalayan foothills at one of India's finest resorts.",
        primaryColor: "#dc2626",
        secondaryColor: "#fef2f2",
        accentColor: "#f87171",
        expectedPax: 80,
        agentId: agent.id,
        status: "active",
      },
    });

    const reunionStd = await prisma.roomBlock.create({
      data: { roomType: "Premier Room", description: "Mountain-facing room with fireplace and valley views", rate: 18000, totalQty: 25, bookedQty: 4, floor: "1-2", wing: "Valley Wing", hotelName: "Wildflower Hall", eventId: reunion.id },
    });
    const reunionDlx = await prisma.roomBlock.create({
      data: { roomType: "Deluxe Suite", description: "Upgraded suite with sitting area, mountain views and heated bathroom floors", rate: 32000, totalQty: 10, bookedQty: 5, floor: "2", wing: "Ridge Wing", hotelName: "Wildflower Hall", eventId: reunion.id },
    });
    const reunionLord = await prisma.roomBlock.create({
      data: { roomType: "Lord Kitchener Suite", description: "Historic signature suite with private garden, antique furnishing, and Himalayan panorama", rate: 55000, totalQty: 4, bookedQty: 3, floor: "3", wing: "Heritage", hotelName: "Wildflower Hall", eventId: reunion.id },
    });

    await prisma.addOn.createMany({
      data: [
        { name: "Bonfire & Karaoke Night", price: 0, isIncluded: true, eventId: reunion.id },
        { name: "Himalayan Trek (Guided)", price: 3000, isIncluded: false, eventId: reunion.id },
        { name: "Mountain Biking Experience", price: 4000, isIncluded: false, eventId: reunion.id },
        { name: "Oberoi Spa Day Pass", price: 5500, isIncluded: false, eventId: reunion.id },
        { name: "Shimla Heritage Walk", price: 1500, isIncluded: false, eventId: reunion.id },
        { name: "Private Wine Tasting", price: 3500, isIncluded: false, eventId: reunion.id },
      ],
    });

    await prisma.attritionRule.createMany({
      data: [
        { releaseDate: new Date("2026-09-15"), releasePercent: 30, description: "Release 30% — 30 days prior", eventId: reunion.id },
        { releaseDate: new Date("2026-10-01"), releasePercent: 60, description: "Release 60% — 14 days prior", eventId: reunion.id },
        { releaseDate: new Date("2026-10-08"), releasePercent: 100, description: "Full release — 7 days prior", eventId: reunion.id },
      ],
    });

    const reunionGuests = [
      { name: "Arnav Khanna", status: "confirmed", group: "Organizers", email: "arnav.k@alumni.iitd.ac.in", phone: "+91 99500 10001" },
      { name: "Ishita Malhotra", status: "confirmed", group: "Organizers", email: "ishita.m@alumni.iitd.ac.in", phone: "+91 99500 10002" },
      { name: "Sahil Mehra", status: "confirmed", group: "Organizers", email: "sahil.m@alumni.iitd.ac.in", phone: "+91 99500 10003" },
      { name: "Kriti Bose", status: "confirmed", group: "CSE Batch", email: "kriti.b@google.com", phone: "+91 99500 20001" },
      { name: "Abhinav Rao", status: "confirmed", group: "CSE Batch", email: "abhinav.r@meta.com", phone: "+91 99500 20002" },
      { name: "Neeraj Kumar", status: "confirmed", group: "CSE Batch", email: "neeraj.k@uber.com", phone: "+91 99500 20003" },
      { name: "Tanya Bhardwaj", status: "confirmed", group: "CSE Batch", email: "tanya.b@stripe.com", phone: "+91 99500 20004" },
      { name: "Rohan Shetty", status: "confirmed", group: "Mech Batch", email: "rohan.s@tata.com", phone: "+91 99500 30001" },
      { name: "Prachi Joshi", status: "confirmed", group: "Mech Batch", email: "prachi.j@bosch.com", phone: "+91 99500 30002" },
      { name: "Vivek Agarwal", status: "confirmed", group: "EE Batch", email: "vivek.a@qualcomm.com", phone: "+91 99500 40001" },
      { name: "Swati Mukherjee", status: "confirmed", group: "EE Batch", email: "swati.m@samsung.com", phone: "+91 99500 40002" },
      { name: "Parth Trivedi", status: "confirmed", group: "EE Batch", email: "parth.t@intel.com", phone: "+91 99500 40003" },
      { name: "Shreya Chatterjee", status: "invited", group: "CSE Batch", email: "shreya.c@netflix.com", phone: "+91 99500 50001" },
      { name: "Mohit Agnihotri", status: "invited", group: "Mech Batch", email: "mohit.a@mahindra.com", phone: "+91 99500 50002" },
      { name: "Deepika Raman", status: "invited", group: "EE Batch", email: "deepika.r@ti.com", phone: "+91 99500 50003" },
      { name: "Rohit Kadam", status: "invited", group: "Civil Batch", email: "rohit.k@lnt.com", phone: "+91 99500 50004" },
      { name: "Anita Srivastava", status: "cancelled", group: "CSE Batch", email: "anita.s@amazon.com", phone: "+91 99500 60001" },
    ];
    const reunionRoomOpts = [reunionStd, reunionStd, reunionDlx, reunionLord];
    for (let i = 0; i < reunionGuests.length; i++) {
      const gd = reunionGuests[i];
      const g = await prisma.guest.create({
        data: { name: gd.name, email: gd.email, phone: gd.phone, group: gd.group, status: gd.status, proximityRequest: null, eventId: reunion.id },
      });
      if (gd.status === "confirmed") {
        const rb = gd.group === "Organizers" ? reunionDlx : reunionRoomOpts[i % reunionRoomOpts.length];
        await prisma.booking.create({
          data: { guestId: g.id, eventId: reunion.id, roomBlockId: rb.id, totalAmount: rb.rate * 3, status: "confirmed" },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // EVENT 7: Product Launch – Bengaluru
    // ═══════════════════════════════════════════════════════
    const productLaunch = await prisma.event.create({
      data: {
        name: "NovaByte AI – Product Launch 2026",
        slug: "novabyte-ai-launch-2026",
        type: "corporate",
        venue: "The Leela Palace",
        location: "Bengaluru, Karnataka",
        checkIn: new Date("2026-09-10"),
        checkOut: new Date("2026-09-12"),
        description: "NovaByte unveils its next-generation AI platform to partners, investors, media, and enterprise clients. Two days of demos, keynotes, and after-parties at The Leela Palace Bengaluru.",
        primaryColor: "#0f172a",
        secondaryColor: "#f8fafc",
        accentColor: "#38bdf8",
        expectedPax: 100,
        agentId: agent.id,
        status: "active",
      },
    });

    const launchStd = await prisma.roomBlock.create({
      data: { roomType: "Luxury Room", description: "Elegantly appointed room with city skyline views and marble bathroom", rate: 16000, totalQty: 35, bookedQty: 4, floor: "4-7", wing: "Palace Wing", hotelName: "The Leela Palace", eventId: productLaunch.id },
    });
    const launchClub = await prisma.roomBlock.create({
      data: { roomType: "Royal Club Room", description: "Premium room with club lounge access, evening cocktails, and butler service", rate: 25000, totalQty: 15, bookedQty: 7, floor: "8-9", wing: "Royal Wing", hotelName: "The Leela Palace", eventId: productLaunch.id },
    });
    const launchSuite = await prisma.roomBlock.create({
      data: { roomType: "Grand Presidential Suite", description: "The finest suite with private dining, grand piano, terrace, and 24/7 butler", rate: 75000, totalQty: 6, bookedQty: 5, floor: "10", wing: "Penthouse", hotelName: "The Leela Palace", eventId: productLaunch.id },
    });

    await prisma.addOn.createMany({
      data: [
        { name: "Launch Day Passes (Partner)", price: 0, isIncluded: true, eventId: productLaunch.id },
        { name: "VIP After-Party", price: 8000, isIncluded: false, eventId: productLaunch.id },
        { name: "Bangalore Brewery Tour", price: 3000, isIncluded: false, eventId: productLaunch.id },
        { name: "Nandi Hills Sunrise Trip", price: 2500, isIncluded: false, eventId: productLaunch.id },
        { name: "Airport Concierge (Luxury)", price: 3500, isIncluded: false, eventId: productLaunch.id },
      ],
    });

    await prisma.attritionRule.createMany({
      data: [
        { releaseDate: new Date("2026-08-10"), releasePercent: 25, description: "Release 25% — 30 days prior", eventId: productLaunch.id },
        { releaseDate: new Date("2026-08-27"), releasePercent: 50, description: "Release 50% — 14 days prior", eventId: productLaunch.id },
        { releaseDate: new Date("2026-09-03"), releasePercent: 100, description: "Full release — 7 days prior", eventId: productLaunch.id },
      ],
    });

    const launchGuests = [
      { name: "Arjun Rathore", status: "confirmed", group: "NovaByte Team", email: "arjun@novabyte.ai", phone: "+91 98400 10001" },
      { name: "Meera Iyer", status: "confirmed", group: "NovaByte Team", email: "meera@novabyte.ai", phone: "+91 98400 10002" },
      { name: "Sameer Kulkarni", status: "confirmed", group: "NovaByte Team", email: "sameer@novabyte.ai", phone: "+91 98400 10003" },
      { name: "Kavya Nambiar", status: "confirmed", group: "NovaByte Team", email: "kavya@novabyte.ai", phone: "+91 98400 10004" },
      { name: "Rakesh Agarwal", status: "confirmed", group: "Investors", email: "rakesh@sequoia.com", phone: "+91 98400 20001" },
      { name: "Nisha Goyal", status: "confirmed", group: "Investors", email: "nisha@accel.com", phone: "+91 98400 20002" },
      { name: "Tim Chen", status: "confirmed", group: "Investors", email: "tim.c@lightspeed.com", phone: "+1 650 555 0001" },
      { name: "Priyanka Dutta", status: "confirmed", group: "Enterprise Clients", email: "priyanka.d@reliance.com", phone: "+91 98400 30001" },
      { name: "Varun Malhotra", status: "confirmed", group: "Enterprise Clients", email: "varun.m@hdfc.com", phone: "+91 98400 30002" },
      { name: "Sunita Kaur", status: "confirmed", group: "Enterprise Clients", email: "sunita.k@infosys.com", phone: "+91 98400 30003" },
      { name: "Aditya Prakash", status: "confirmed", group: "Enterprise Clients", email: "aditya.p@tcs.com", phone: "+91 98400 30004" },
      { name: "Kamini Rao", status: "confirmed", group: "Media", email: "kamini@techcrunch.in", phone: "+91 98400 40001" },
      { name: "Rohit Khanna", status: "confirmed", group: "Media", email: "rohit.k@yourstory.com", phone: "+91 98400 40002" },
      { name: "Ananya Sharma", status: "confirmed", group: "Media", email: "ananya.s@moneycontrol.com", phone: "+91 98400 40003" },
      { name: "Jason Lee", status: "confirmed", group: "Partners", email: "jason.l@aws.com", phone: "+1 415 555 0001" },
      { name: "Maria Santos", status: "confirmed", group: "Partners", email: "maria.s@google.com", phone: "+1 650 555 0002" },
      { name: "Deepak Mehta", status: "invited", group: "Enterprise Clients", email: "deepak.m@wipro.com", phone: "+91 98400 50001" },
      { name: "Snehal Patil", status: "invited", group: "Enterprise Clients", email: "snehal.p@mahindra.com", phone: "+91 98400 50002" },
      { name: "Kiran Reddy", status: "invited", group: "Partners", email: "kiran.r@azure.com", phone: "+91 98400 50003" },
      { name: "Prasad Nair", status: "cancelled", group: "Media", email: "prasad.n@et.com", phone: "+91 98400 60001" },
    ];
    const launchRoomOpts = [launchStd, launchStd, launchClub, launchSuite];
    for (let i = 0; i < launchGuests.length; i++) {
      const gd = launchGuests[i];
      const g = await prisma.guest.create({
        data: { name: gd.name, email: gd.email, phone: gd.phone, group: gd.group, status: gd.status, proximityRequest: null, eventId: productLaunch.id },
      });
      if (gd.status === "confirmed") {
        const rb = gd.group === "Investors" ? launchSuite : gd.group === "Partners" || gd.group === "NovaByte Team" ? launchClub : launchRoomOpts[i % launchRoomOpts.length];
        await prisma.booking.create({
          data: { guestId: g.id, eventId: productLaunch.id, roomBlockId: rb.id, totalAmount: rb.rate * 2, status: "confirmed" },
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // CROSS-EVENT DATA: Discount Rules, Activity Logs, Feedback, Waitlist
    // ═══════════════════════════════════════════════════════

    // ── Seed Discount Rules ──
    await prisma.discountRule.createMany({
      data: [
        { eventId: wedding.id, minRooms: 5, discountPct: 5.0, description: "5% off for 5+ rooms booked together" },
        { eventId: wedding.id, minRooms: 10, discountPct: 10.0, description: "10% off for 10+ rooms booked together" },
        { eventId: wedding.id, minRooms: 20, discountPct: 15.0, description: "15% off for 20+ rooms — group deal" },
        { eventId: conference.id, minRooms: 10, discountPct: 8.0, description: "8% corporate discount for 10+ rooms" },
        { eventId: conference.id, minRooms: 25, discountPct: 12.0, description: "12% bulk discount for 25+ rooms" },
        { eventId: goaWedding.id, minRooms: 5, discountPct: 5.0, description: "5% off for 5+ rooms" },
        { eventId: goaWedding.id, minRooms: 15, discountPct: 12.0, description: "12% group discount for 15+ rooms" },
        { eventId: corpOffsite.id, minRooms: 20, discountPct: 10.0, description: "10% corporate volume discount" },
        { eventId: corpOffsite.id, minRooms: 40, discountPct: 15.0, description: "15% bulk enterprise deal for 40+ rooms" },
        { eventId: pharmaConf.id, minRooms: 15, discountPct: 8.0, description: "8% early-bird delegate discount" },
        { eventId: pharmaConf.id, minRooms: 30, discountPct: 12.0, description: "12% sponsor bulk rate for 30+ rooms" },
        { eventId: reunion.id, minRooms: 10, discountPct: 7.0, description: "7% alumni group discount" },
        { eventId: reunion.id, minRooms: 20, discountPct: 12.0, description: "12% full batch booking discount" },
        { eventId: productLaunch.id, minRooms: 10, discountPct: 8.0, description: "8% corporate partner rate" },
        { eventId: productLaunch.id, minRooms: 20, discountPct: 12.0, description: "12% enterprise volume deal" },
      ],
    });

    // ── Seed Activity Logs ──
    await prisma.activityLog.createMany({
      data: [
        // Wedding
        { eventId: wedding.id, action: "event_created", details: "Event 'The Sharma-Patel Wedding' was created", actor: "Rajesh Kumar" },
        { eventId: wedding.id, action: "rooms_blocked", details: "50 rooms blocked across 3 categories", actor: "Rajesh Kumar" },
        { eventId: wedding.id, action: "guest_imported", details: "26 guests imported via bulk upload", actor: "Rajesh Kumar" },
        { eventId: wedding.id, action: "booking_created", details: "Priya Sharma booked Deluxe Room — ₹36,000", actor: "Priya Sharma" },
        { eventId: wedding.id, action: "booking_created", details: "Mr. Harish Sharma booked Royal Suite — ₹1,35,000", actor: "Mr. Harish Sharma" },
        { eventId: wedding.id, action: "vip_allocated", details: "5 VIP guests allocated to Floor 5, Tower wing", actor: "system" },
        { eventId: wedding.id, action: "nudge_sent", details: "Reminder sent to 3 uninvited guests via WhatsApp", actor: "system" },
        // TechConnect
        { eventId: conference.id, action: "event_created", details: "Event 'TechConnect Summit 2026' was created", actor: "Rajesh Kumar" },
        { eventId: conference.id, action: "rooms_blocked", details: "70 rooms blocked across 2 categories", actor: "Rajesh Kumar" },
        { eventId: conference.id, action: "guest_imported", details: "14 delegates added to guest list", actor: "Rajesh Kumar" },
        // Goa Wedding
        { eventId: goaWedding.id, action: "event_created", details: "Event 'The Khanna-Batra Beach Wedding' was created", actor: "Rajesh Kumar" },
        { eventId: goaWedding.id, action: "rooms_blocked", details: "55 rooms blocked across 3 categories at Taj Exotica", actor: "Rajesh Kumar" },
        { eventId: goaWedding.id, action: "guest_imported", details: "23 guests imported via bulk upload", actor: "Rajesh Kumar" },
        { eventId: goaWedding.id, action: "booking_created", details: "Rohan Khanna booked Garden View Room — ₹42,000", actor: "Rohan Khanna" },
        { eventId: goaWedding.id, action: "booking_created", details: "Sania Mirza booked Presidential Villa — ₹1,95,000", actor: "Sania Mirza" },
        { eventId: goaWedding.id, action: "nudge_sent", details: "Beach wedding invite sent to 4 pending guests", actor: "system" },
        // Corporate Offsite
        { eventId: corpOffsite.id, action: "event_created", details: "Event 'Zephyr Corp Annual Offsite 2026' created", actor: "Rajesh Kumar" },
        { eventId: corpOffsite.id, action: "rooms_blocked", details: "80 rooms blocked across 3 categories at ITC Rajputana", actor: "Rajesh Kumar" },
        { eventId: corpOffsite.id, action: "guest_imported", details: "20 employees added across 5 departments", actor: "Rajesh Kumar" },
        { eventId: corpOffsite.id, action: "auto_allocate", details: "Auto-allocated 17 confirmed staff to rooms by department", actor: "system" },
        // PharmaVision
        { eventId: pharmaConf.id, action: "event_created", details: "Event 'PharmaVision India 2026' created", actor: "Rajesh Kumar" },
        { eventId: pharmaConf.id, action: "rooms_blocked", details: "109 rooms blocked at Novotel HICC", actor: "Rajesh Kumar" },
        { eventId: pharmaConf.id, action: "guest_imported", details: "15 delegates and speakers added", actor: "Rajesh Kumar" },
        // IIT Reunion
        { eventId: reunion.id, action: "event_created", details: "Event 'IIT Delhi – Batch of 2016 Reunion' created", actor: "Rajesh Kumar" },
        { eventId: reunion.id, action: "rooms_blocked", details: "37 rooms blocked at Wildflower Hall", actor: "Rajesh Kumar" },
        { eventId: reunion.id, action: "guest_imported", details: "17 alumni added to guest list", actor: "Rajesh Kumar" },
        { eventId: reunion.id, action: "booking_created", details: "Arnav Khanna booked Deluxe Suite — ₹96,000", actor: "Arnav Khanna" },
        // NovaByte Launch
        { eventId: productLaunch.id, action: "event_created", details: "Event 'NovaByte AI – Product Launch 2026' created", actor: "Rajesh Kumar" },
        { eventId: productLaunch.id, action: "rooms_blocked", details: "52 rooms blocked at The Leela Palace", actor: "Rajesh Kumar" },
        { eventId: productLaunch.id, action: "guest_imported", details: "20 attendees added (team, investors, clients, media, partners)", actor: "Rajesh Kumar" },
        { eventId: productLaunch.id, action: "booking_created", details: "Rakesh Agarwal (Sequoia) booked Grand Presidential Suite — ₹1,50,000", actor: "Rakesh Agarwal" },
        { eventId: productLaunch.id, action: "nudge_sent", details: "Launch invite sent to 3 pending enterprise clients", actor: "system" },
      ],
    });

    // ── Seed Feedback ──
    await prisma.feedback.createMany({
      data: [
        // Wedding
        { eventId: wedding.id, guestName: "Priya Sharma", guestEmail: "priya@email.com", rating: 5, stayRating: 5, eventRating: 5, comment: "Absolutely magical! Every detail was perfect. The lake view from our room was breathtaking." },
        { eventId: wedding.id, guestName: "Amit Patel", guestEmail: "amit@email.com", rating: 4, stayRating: 4, eventRating: 5, comment: "Wonderful ceremony and great hospitality. Room service could be a bit faster." },
        { eventId: wedding.id, guestName: "Aditya Rai", guestEmail: "aditya@email.com", rating: 5, stayRating: 5, eventRating: 4, comment: "Loved every moment! The hotel was fantastic. Would have liked more vegetarian options at dinner." },
        { eventId: wedding.id, guestName: "Sneha Kapoor", guestEmail: "sneha@email.com", rating: 4, stayRating: 3, eventRating: 5, comment: "The wedding was gorgeous. Room AC had some issues but staff resolved it quickly." },
        { eventId: wedding.id, guestName: "Deepak Joshi", guestEmail: "deepak@email.com", rating: 5, stayRating: 5, eventRating: 5, comment: "Best wedding I've attended. Everything was world-class!" },
        // Goa Wedding
        { eventId: goaWedding.id, guestName: "Dev Malhotra", guestEmail: "dev.m@hotmail.com", rating: 5, stayRating: 5, eventRating: 5, comment: "The sunset ceremony on the beach was unforgettable! Taj Exotica is paradise." },
        { eventId: goaWedding.id, guestName: "Tara Chopra", guestEmail: "tara.c@hotmail.com", rating: 5, stayRating: 4, eventRating: 5, comment: "Gorgeous venue, amazing food. The sangeet night had everyone on their feet!" },
        { eventId: goaWedding.id, guestName: "Karan Ahuja", guestEmail: "karan.a@yahoo.com", rating: 4, stayRating: 4, eventRating: 4, comment: "Great wedding, loved the beach vibes. WiFi could have been better in the rooms." },
        { eventId: goaWedding.id, guestName: "Sania Mirza", guestEmail: "sania.m@vip.com", rating: 5, stayRating: 5, eventRating: 5, comment: "The villa was absolutely stunning. A truly royal experience." },
        // Corporate Offsite
        { eventId: corpOffsite.id, guestName: "Anika Mehra", guestEmail: "anika.m@zephyr.com", rating: 5, stayRating: 5, eventRating: 5, comment: "Best offsite we've ever had. ITC Rajputana exceeded all expectations." },
        { eventId: corpOffsite.id, guestName: "Nikhil Agrawal", guestEmail: "nikhil.a@zephyr.com", rating: 4, stayRating: 4, eventRating: 5, comment: "The Nahargarh Fort dinner was the highlight! Team bonding sessions were top-notch." },
        { eventId: corpOffsite.id, guestName: "Isha Bhatt", guestEmail: "isha.b@zephyr.com", rating: 4, stayRating: 5, eventRating: 3, comment: "Amazing hotel and food. Strategy sessions could have been more interactive." },
        { eventId: corpOffsite.id, guestName: "Dhruv Kapoor", guestEmail: "dhruv.k@zephyr.com", rating: 5, stayRating: 5, eventRating: 5, comment: "Jaipur was the perfect choice. The cultural night was an amazing touch!" },
        // IIT Reunion
        { eventId: reunion.id, guestName: "Arnav Khanna", guestEmail: "arnav.k@alumni.iitd.ac.in", rating: 5, stayRating: 5, eventRating: 5, comment: "Wildflower Hall is magical. Seeing everyone after 10 years was incredibly emotional." },
        { eventId: reunion.id, guestName: "Kriti Bose", guestEmail: "kriti.b@google.com", rating: 5, stayRating: 5, eventRating: 5, comment: "The trek through the mountains brought back so many memories. A perfect reunion!" },
        { eventId: reunion.id, guestName: "Rohan Shetty", guestEmail: "rohan.s@tata.com", rating: 4, stayRating: 5, eventRating: 4, comment: "What a resort! The bonfire karaoke night was legendary. Need to do this every year." },
        { eventId: reunion.id, guestName: "Vivek Agarwal", guestEmail: "vivek.a@qualcomm.com", rating: 5, stayRating: 4, eventRating: 5, comment: "10 years flew by. The Shimla walks and late-night conversations were the best part." },
        // NovaByte Launch
        { eventId: productLaunch.id, guestName: "Rakesh Agarwal", guestEmail: "rakesh@sequoia.com", rating: 5, stayRating: 5, eventRating: 5, comment: "Phenomenal product demo and the hospitality was on another level. Presidential suite was incredible." },
        { eventId: productLaunch.id, guestName: "Priyanka Dutta", guestEmail: "priyanka.d@reliance.com", rating: 4, stayRating: 5, eventRating: 4, comment: "Very impressive launch event. The Leela was an excellent choice." },
        { eventId: productLaunch.id, guestName: "Kamini Rao", guestEmail: "kamini@techcrunch.in", rating: 5, stayRating: 5, eventRating: 5, comment: "One of the best tech launches I've covered. NovaByte knows how to make an impression." },
        { eventId: productLaunch.id, guestName: "Jason Lee", guestEmail: "jason.l@aws.com", rating: 4, stayRating: 4, eventRating: 5, comment: "Great partnership potential. The after-party was a nice touch." },
      ],
    });

    // ── Seed Waitlist ──
    await prisma.waitlist.createMany({
      data: [
        { guestName: "Mohit Kapoor", guestEmail: "mohit@email.com", guestPhone: "+91 99876 54321", roomBlockId: royal.id, eventId: wedding.id, status: "waiting" },
        { guestName: "Rashmi Iyer", guestEmail: "rashmi@email.com", guestPhone: "+91 99876 54322", roomBlockId: royal.id, eventId: wedding.id, status: "waiting" },
        { guestName: "Neha Bajaj", guestEmail: "neha.b@gmail.com", guestPhone: "+91 99876 11111", roomBlockId: goaVilla.id, eventId: goaWedding.id, status: "waiting" },
        { guestName: "Suraj Thakkar", guestEmail: "suraj.t@gmail.com", guestPhone: "+91 99876 22222", roomBlockId: goaVilla.id, eventId: goaWedding.id, status: "waiting" },
        { guestName: "Radhika Singhania", guestEmail: "radhika.s@gmail.com", guestPhone: "+91 99876 33333", roomBlockId: launchSuite.id, eventId: productLaunch.id, status: "waiting" },
        { guestName: "Anuj Patel", guestEmail: "anuj.p@gmail.com", guestPhone: "+91 99876 44444", roomBlockId: reunionLord.id, eventId: reunion.id, status: "waiting" },
      ],
    });

    // ── Seed Check-in Data (mark ~35% of bookings as checked-in for demo) ──
    const goaBookings = await prisma.booking.findMany({ where: { eventId: goaWedding.id } });
    const goaCheckinCount = Math.floor(goaBookings.length * 0.35);
    for (let ci = 0; ci < goaCheckinCount; ci++) {
      await prisma.booking.update({
        where: { id: goaBookings[ci].id },
        data: { checkedIn: true, checkedInAt: new Date("2026-03-05T14:30:00") },
      });
    }

    const weddingBookings = await prisma.booking.findMany({ where: { eventId: wedding.id } });
    const weddingCheckinCount = Math.floor(weddingBookings.length * 0.35);
    for (let ci = 0; ci < weddingCheckinCount; ci++) {
      await prisma.booking.update({
        where: { id: weddingBookings[ci].id },
        data: { checkedIn: true, checkedInAt: new Date("2026-04-10T15:00:00") },
      });
    }

    // ── Seed Nudges (for invited guests who haven't booked) ──
    const weddingInvited = await prisma.guest.findMany({
      where: { eventId: wedding.id, status: "invited" },
      take: 3,
    });
    const goaInvited = await prisma.guest.findMany({
      where: { eventId: goaWedding.id, status: "invited" },
      take: 2,
    });

    await prisma.nudge.createMany({
      data: [
        ...(weddingInvited[0] ? [{ guestId: weddingInvited[0].id, channel: 'whatsapp', message: 'Hi! Just a reminder to book your room for the Sharma-Patel Wedding. Rooms are filling up!', status: 'delivered' }] : []),
        ...(weddingInvited[1] ? [{ guestId: weddingInvited[1].id, channel: 'email', message: 'Your room block is filling up fast \u2014 book now to secure your preferred room type!', status: 'sent' }] : []),
        ...(weddingInvited[2] ? [{ guestId: weddingInvited[2].id, channel: 'whatsapp', message: 'Don\'t miss the grand celebration! Reserve your room at The Grand Hyatt today.', status: 'delivered' }] : []),
        ...(goaInvited[0] ? [{ guestId: goaInvited[0].id, channel: 'whatsapp', message: 'The Khanna-Batra Beach Wedding is coming up! Book your room at Taj Exotica now.', status: 'delivered' }] : []),
        ...(goaInvited[1] ? [{ guestId: goaInvited[1].id, channel: 'sms', message: 'Reminder: Beach-side rooms for the Goa wedding are going fast. Reserve yours!', status: 'sent' }] : []),
      ],
    });

    // ═══════════════════════════════════════════════════════
    // VENDORS & RFPs - Hotel/Venue quotes for comparison
    // ═══════════════════════════════════════════════════════
    console.log("📋 Creating Vendors and RFPs...");

    // Create Vendors
    const grandHyatt = await prisma.vendor.create({
      data: {
        name: "The Grand Hyatt Resort & Spa",
        email: "events@grandhyattudaipur.com",
        phone: "+91 294 266 1234",
        contactPerson: "Mr. Vikram Singh",
        address: "Udaipur, Rajasthan",
        notes: "Premium heritage property, excellent for destination weddings",
      },
    });

    const tajLakePalace = await prisma.vendor.create({
      data: {
        name: "Taj Lake Palace",
        email: "reservations@tajhotels.com",
        phone: "+91 294 242 8800",
        contactPerson: "Ms. Anjali Sharma",
        address: "Lake Pichola, Udaipur",
        notes: "Iconic floating palace, ultra-luxury segment",
      },
    });

    const oberoi = await prisma.vendor.create({
      data: {
        name: "The Oberoi Udaivilas",
        email: "events@oberoihotels.com",
        phone: "+91 294 243 3300",
        contactPerson: "Mr. Raghav Mehta",
        address: "Haridasji Ki Magri, Udaipur",
        notes: "Award-winning luxury resort with lake views",
      },
    });

    const jwMarriott = await prisma.vendor.create({
      data: {
        name: "JW Marriott Convention Centre",
        email: "events@jwmarriottmumbai.com",
        phone: "+91 22 6882 8888",
        contactPerson: "Ms. Priya Nair",
        address: "Juhu, Mumbai",
        notes: "Premier MICE venue with extensive convention facilities",
      },
    });

    const hyattRegency = await prisma.vendor.create({
      data: {
        name: "Hyatt Regency Mumbai",
        email: "events@hyattmumbai.com",
        phone: "+91 22 6696 1234",
        contactPerson: "Mr. Ashish Kumar",
        address: "Sahar Airport Road, Mumbai",
        notes: "Modern business hotel near airport",
      },
    });

    const tajExotica = await prisma.vendor.create({
      data: {
        name: "Taj Exotica Resort & Spa",
        email: "reservations.goa@tajhotels.com",
        phone: "+91 832 668 3333",
        contactPerson: "Mr. Santosh Naik",
        address: "Benaulim, South Goa",
        notes: "Beachfront luxury resort, ideal for destination weddings",
      },
    });

    const wHotelGoa = await prisma.vendor.create({
      data: {
        name: "W Goa",
        email: "events@wgoa.com",
        phone: "+91 832 671 8888",
        contactPerson: "Ms. Rina D'Souza",
        address: "Vagator Beach, North Goa",
        notes: "Contemporary luxury with stunning sea views",
      },
    });

    const itcRajputana = await prisma.vendor.create({
      data: {
        name: "ITC Rajputana",
        email: "reservations@itcrajputana.com",
        phone: "+91 141 510 0100",
        contactPerson: "Mr. Devendra Singh",
        address: "Palace Road, Jaipur",
        notes: "Heritage luxury hotel with Rajasthani architecture",
      },
    });

    const rambagh = await prisma.vendor.create({
      data: {
        name: "Rambagh Palace",
        email: "rambagh@tajhotels.com",
        phone: "+91 141 221 1919",
        contactPerson: "Ms. Kavita Rathore",
        address: "Bhawani Singh Road, Jaipur",
        notes: "Former royal residence, ultra-luxury palace hotel",
      },
    });

    // Vendors for PharmaVision Conference
    const novotelHICC = await prisma.vendor.create({
      data: {
        name: "Novotel Hyderabad Convention Centre",
        email: "events@novotelhicc.com",
        phone: "+91 40 6682 4422",
        contactPerson: "Mr. Krishna Rao",
        address: "HITEC City, Hyderabad",
        notes: "Connected to HICC, India's largest convention center",
      },
    });

    const hyattHyderabad = await prisma.vendor.create({
      data: {
        name: "Park Hyatt Hyderabad",
        email: "events@parkhyatthyderabad.com",
        phone: "+91 40 4949 1234",
        contactPerson: "Ms. Lakshmi Menon",
        address: "Banjara Hills, Hyderabad",
        notes: "Luxury hotel with excellent meeting facilities",
      },
    });

    // Vendors for IIT Reunion
    const wildflowerHall = await prisma.vendor.create({
      data: {
        name: "Wildflower Hall, An Oberoi Resort",
        email: "reservations@oberoihotels.com",
        phone: "+91 177 264 8585",
        contactPerson: "Mr. Rajat Verma",
        address: "Chharabra, Shimla",
        notes: "Former residence of Lord Kitchener, heritage luxury in Himalayas",
      },
    });

    const anandaSpa = await prisma.vendor.create({
      data: {
        name: "Ananda in the Himalayas",
        email: "reservations@anandaspa.com",
        phone: "+91 1378 227 500",
        contactPerson: "Ms. Priya Kapoor",
        address: "Narendra Nagar, Uttarakhand",
        notes: "Award-winning wellness resort with Himalayan views",
      },
    });

    // Vendors for NovaByte Product Launch
    const leelaPalace = await prisma.vendor.create({
      data: {
        name: "The Leela Palace Bengaluru",
        email: "events@theleela.com",
        phone: "+91 80 2521 1234",
        contactPerson: "Mr. Arun Nair",
        address: "Old Airport Road, Bengaluru",
        notes: "Premier luxury hotel, excellent for corporate events",
      },
    });

    const tajWestEnd = await prisma.vendor.create({
      data: {
        name: "Taj West End Bengaluru",
        email: "westend.bangalore@tajhotels.com",
        phone: "+91 80 6660 5660",
        contactPerson: "Ms. Anita Sharma",
        address: "Race Course Road, Bengaluru",
        notes: "Heritage property with 20 acres of gardens",
      },
    });

    // Create RFPs for Wedding Event
    await prisma.rFP.createMany({
      data: [
        {
          eventId: wedding.id,
          vendorId: grandHyatt.id,
          quotedAmount: 4850000,
          roomRate: 12000,
          foodRate: 3500,
          venueRate: 250000,
          additionalCosts: 150000,
          validUntil: new Date("2026-03-15"),
          status: "accepted",
          notes: "Includes complimentary mehendi venue, 20% discount on spa packages. Best value for money.",
          responseDate: new Date("2026-01-20"),
        },
        {
          eventId: wedding.id,
          vendorId: tajLakePalace.id,
          quotedAmount: 7200000,
          roomRate: 45000,
          foodRate: 5500,
          venueRate: 400000,
          additionalCosts: 200000,
          validUntil: new Date("2026-03-10"),
          status: "rejected",
          notes: "Premium location but significantly over budget. Limited room availability.",
          responseDate: new Date("2026-01-18"),
        },
        {
          eventId: wedding.id,
          vendorId: oberoi.id,
          quotedAmount: 5800000,
          roomRate: 22000,
          foodRate: 4200,
          venueRate: 350000,
          additionalCosts: 180000,
          validUntil: new Date("2026-03-20"),
          status: "negotiating",
          notes: "Excellent property. Negotiating to include boat transfers for all guests.",
          responseDate: new Date("2026-01-22"),
        },
      ],
    });

    // Create RFPs for MICE Conference
    await prisma.rFP.createMany({
      data: [
        {
          eventId: conference.id,
          vendorId: jwMarriott.id,
          quotedAmount: 2850000,
          roomRate: 8000,
          foodRate: 2500,
          venueRate: 180000,
          additionalCosts: 120000,
          validUntil: new Date("2026-04-20"),
          status: "accepted",
          notes: "State-of-art AV equipment included. Conference hall capacity 500 pax.",
          responseDate: new Date("2026-02-10"),
        },
        {
          eventId: conference.id,
          vendorId: hyattRegency.id,
          quotedAmount: 2450000,
          roomRate: 7500,
          foodRate: 2200,
          venueRate: 150000,
          additionalCosts: 100000,
          validUntil: new Date("2026-04-15"),
          status: "pending",
          notes: "Competitive pricing. Conference room slightly smaller but proximity to airport is advantage.",
          responseDate: null,
        },
      ],
    });

    // Create RFPs for Goa Wedding
    await prisma.rFP.createMany({
      data: [
        {
          eventId: goaWedding.id,
          vendorId: tajExotica.id,
          quotedAmount: 3600000,
          roomRate: 14000,
          foodRate: 3000,
          venueRate: 200000,
          additionalCosts: 100000,
          validUntil: new Date("2026-02-15"),
          status: "accepted",
          notes: "Beachside mandap included. Complimentary sunset cruise for bride & groom families.",
          responseDate: new Date("2025-12-20"),
        },
        {
          eventId: goaWedding.id,
          vendorId: wHotelGoa.id,
          quotedAmount: 3950000,
          roomRate: 16000,
          foodRate: 3200,
          venueRate: 220000,
          additionalCosts: 130000,
          validUntil: new Date("2026-02-10"),
          status: "rejected",
          notes: "Modern vibe doesn't match traditional wedding requirements.",
          responseDate: new Date("2025-12-18"),
        },
      ],
    });

    // Create RFPs for Corporate Offsite
    await prisma.rFP.createMany({
      data: [
        {
          eventId: corpOffsite.id,
          vendorId: itcRajputana.id,
          quotedAmount: 2100000,
          roomRate: 9500,
          foodRate: 2800,
          venueRate: 150000,
          additionalCosts: 80000,
          validUntil: new Date("2026-05-25"),
          status: "accepted",
          notes: "Corporate rates applied. Meeting rooms fully equipped. Rajasthani cultural dinner included.",
          responseDate: new Date("2026-03-15"),
        },
        {
          eventId: corpOffsite.id,
          vendorId: rambagh.id,
          quotedAmount: 3800000,
          roomRate: 18000,
          foodRate: 4500,
          venueRate: 300000,
          additionalCosts: 150000,
          validUntil: new Date("2026-05-20"),
          status: "rejected",
          notes: "Exceptional property but exceeds budget by 80%. Keeping as option for CEO dinner.",
          responseDate: new Date("2026-03-12"),
        },
      ],
    });

    // Create RFPs for PharmaVision Conference
    await prisma.rFP.createMany({
      data: [
        {
          eventId: pharmaConf.id,
          vendorId: novotelHICC.id,
          quotedAmount: 3200000,
          roomRate: 7500,
          foodRate: 2200,
          venueRate: 180000,
          additionalCosts: 100000,
          validUntil: new Date("2026-07-15"),
          status: "accepted",
          notes: "Direct access to HICC convention halls. Includes exhibition space for sponsors. Medical-grade AV setup included.",
          responseDate: new Date("2026-05-10"),
        },
        {
          eventId: pharmaConf.id,
          vendorId: hyattHyderabad.id,
          quotedAmount: 3800000,
          roomRate: 9000,
          foodRate: 2800,
          venueRate: 220000,
          additionalCosts: 120000,
          validUntil: new Date("2026-07-10"),
          status: "negotiating",
          notes: "Premium location at Banjara Hills. Better dining options. Negotiating for pharma industry discount.",
          responseDate: new Date("2026-05-15"),
        },
      ],
    });

    // Create RFPs for IIT Reunion
    await prisma.rFP.createMany({
      data: [
        {
          eventId: reunion.id,
          vendorId: wildflowerHall.id,
          quotedAmount: 2400000,
          roomRate: 18000,
          foodRate: 3500,
          venueRate: 120000,
          additionalCosts: 80000,
          validUntil: new Date("2026-09-20"),
          status: "accepted",
          notes: "Iconic heritage property. Includes bonfire setup, guided trek, and exclusive spa access for group.",
          responseDate: new Date("2026-07-15"),
        },
        {
          eventId: reunion.id,
          vendorId: anandaSpa.id,
          quotedAmount: 3100000,
          roomRate: 28000,
          foodRate: 4000,
          venueRate: 100000,
          additionalCosts: 120000,
          validUntil: new Date("2026-09-15"),
          status: "rejected",
          notes: "Exceptional wellness resort but pricing too high for alumni group. Focus is on relaxation over activities.",
          responseDate: new Date("2026-07-10"),
        },
      ],
    });

    // Create RFPs for NovaByte Product Launch
    await prisma.rFP.createMany({
      data: [
        {
          eventId: productLaunch.id,
          vendorId: leelaPalace.id,
          quotedAmount: 2800000,
          roomRate: 16000,
          foodRate: 3000,
          venueRate: 200000,
          additionalCosts: 100000,
          validUntil: new Date("2026-08-15"),
          status: "accepted",
          notes: "State-of-art AV for product demos. Rooftop access for after-party. Tech-ready conference halls.",
          responseDate: new Date("2026-06-20"),
        },
        {
          eventId: productLaunch.id,
          vendorId: tajWestEnd.id,
          quotedAmount: 2500000,
          roomRate: 14000,
          foodRate: 2800,
          venueRate: 180000,
          additionalCosts: 90000,
          validUntil: new Date("2026-08-10"),
          status: "pending",
          notes: "Heritage charm with modern amenities. Garden lawn available for networking event. Lower pricing but older tech setup.",
          responseDate: null,
        },
      ],
    });

    // ═══════════════════════════════════════════════════════
    // SCHEDULE ITEMS - Detailed event agendas
    // ═══════════════════════════════════════════════════════
    console.log("📅 Creating Event Schedules...");

    // Sharma-Patel Wedding Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - April 10, 2026
        { eventId: wedding.id, title: "Guest Arrival & Check-in", description: "Welcome drinks at lobby. Room assignments distributed.", date: new Date("2026-04-10"), startTime: "14:00", endTime: "17:00", venue: "Main Lobby", type: "transport", paxCount: 50, sortOrder: 1 },
        { eventId: wedding.id, title: "Mehendi Ceremony", description: "Traditional henna application for bride and female guests. Live folk music.", date: new Date("2026-04-10"), startTime: "17:00", endTime: "20:00", venue: "Poolside Garden", type: "entertainment", cost: 75000, paxCount: 80, sortOrder: 2 },
        { eventId: wedding.id, title: "Welcome Dinner", description: "Buffet dinner featuring Rajasthani and North Indian cuisine.", date: new Date("2026-04-10"), startTime: "20:30", endTime: "23:00", venue: "Grand Ballroom", type: "meal", cost: 120000, paxCount: 100, sortOrder: 3 },
        // Day 2 - April 11, 2026
        { eventId: wedding.id, title: "Breakfast", description: "Continental and Indian breakfast buffet.", date: new Date("2026-04-11"), startTime: "08:00", endTime: "10:30", venue: "Restaurant", type: "meal", cost: 40000, paxCount: 100, sortOrder: 4 },
        { eventId: wedding.id, title: "Haldi Ceremony", description: "Traditional turmeric ceremony for bride and groom.", date: new Date("2026-04-11"), startTime: "11:00", endTime: "13:00", venue: "Lakeside Lawn", type: "entertainment", cost: 35000, paxCount: 60, sortOrder: 5 },
        { eventId: wedding.id, title: "Lunch", description: "Multi-cuisine lunch with live counters.", date: new Date("2026-04-11"), startTime: "13:30", endTime: "15:00", venue: "Restaurant", type: "meal", cost: 60000, paxCount: 100, sortOrder: 6 },
        { eventId: wedding.id, title: "Free Time / Spa", description: "Leisure time. Spa pre-booked for bridal party.", date: new Date("2026-04-11"), startTime: "15:00", endTime: "17:30", venue: "Various", type: "break", sortOrder: 7 },
        { eventId: wedding.id, title: "Sangeet Night", description: "Choreographed performances, DJ, and cocktails. Dress code: Indo-Western.", date: new Date("2026-04-11"), startTime: "19:00", endTime: "24:00", venue: "Lakeview Terrace", type: "entertainment", cost: 250000, paxCount: 120, sortOrder: 8 },
        // Day 3 - April 12, 2026 (Wedding Day)
        { eventId: wedding.id, title: "Breakfast", description: "Light breakfast.", date: new Date("2026-04-12"), startTime: "07:30", endTime: "09:30", venue: "Restaurant", type: "meal", cost: 30000, paxCount: 100, sortOrder: 9 },
        { eventId: wedding.id, title: "Baraat Procession", description: "Groom's procession with band and decorated vehicle.", date: new Date("2026-04-12"), startTime: "16:00", endTime: "17:30", venue: "Hotel Entrance to Mandap", type: "entertainment", cost: 80000, paxCount: 80, sortOrder: 10 },
        { eventId: wedding.id, title: "Wedding Ceremony", description: "Traditional Hindu wedding ceremony with Vedic rituals.", date: new Date("2026-04-12"), startTime: "18:00", endTime: "21:00", venue: "Lakeside Mandap", type: "session", cost: 150000, paxCount: 150, sortOrder: 11 },
        { eventId: wedding.id, title: "Reception & Grand Dinner", description: "Formal reception followed by 7-course dinner. Live band.", date: new Date("2026-04-12"), startTime: "21:30", endTime: "01:00", venue: "Grand Ballroom", type: "meal", cost: 350000, paxCount: 200, sortOrder: 12 },
        // Day 4 - April 13, 2026
        { eventId: wedding.id, title: "Farewell Brunch", description: "Farewell brunch before guest departures.", date: new Date("2026-04-13"), startTime: "10:00", endTime: "12:00", venue: "Garden Restaurant", type: "meal", cost: 45000, paxCount: 80, sortOrder: 13 },
        { eventId: wedding.id, title: "Check-out & Departure", description: "Coordinated checkout and airport transfers.", date: new Date("2026-04-13"), startTime: "12:00", endTime: "15:00", venue: "Lobby", type: "transport", cost: 30000, paxCount: 100, sortOrder: 14 },
      ],
    });

    // TechConnect Summit Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - May 15, 2026
        { eventId: conference.id, title: "Registration & Networking Breakfast", description: "Badge collection, welcome kit distribution, and networking over breakfast.", date: new Date("2026-05-15"), startTime: "08:00", endTime: "09:30", venue: "Convention Centre Lobby", type: "networking", cost: 50000, paxCount: 200, sortOrder: 1 },
        { eventId: conference.id, title: "Opening Keynote: Future of AI", description: "Keynote by Vikram Sundaram on emerging AI trends in enterprise.", date: new Date("2026-05-15"), startTime: "09:45", endTime: "10:45", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 2 },
        { eventId: conference.id, title: "Coffee Break", description: "Refreshments and networking.", date: new Date("2026-05-15"), startTime: "10:45", endTime: "11:15", venue: "Foyer", type: "break", cost: 15000, paxCount: 200, sortOrder: 3 },
        { eventId: conference.id, title: "Panel: Cloud Infrastructure at Scale", description: "Industry leaders discuss cloud architecture best practices.", date: new Date("2026-05-15"), startTime: "11:15", endTime: "12:30", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 4 },
        { eventId: conference.id, title: "Networking Lunch", description: "Curated lunch with themed discussion tables.", date: new Date("2026-05-15"), startTime: "12:30", endTime: "14:00", venue: "Banquet Hall", type: "meal", cost: 180000, paxCount: 200, sortOrder: 5 },
        { eventId: conference.id, title: "Track A: DevOps & SRE", description: "Deep dive sessions on DevOps practices.", date: new Date("2026-05-15"), startTime: "14:00", endTime: "16:00", venue: "Hall A", type: "session", paxCount: 80, sortOrder: 6 },
        { eventId: conference.id, title: "Track B: Product Management", description: "Product strategy and roadmap sessions.", date: new Date("2026-05-15"), startTime: "14:00", endTime: "16:00", venue: "Hall B", type: "session", paxCount: 70, sortOrder: 7 },
        { eventId: conference.id, title: "Track C: Startup Showcase", description: "Startup pitches and investor interactions.", date: new Date("2026-05-15"), startTime: "14:00", endTime: "16:00", venue: "Innovation Lab", type: "session", paxCount: 50, sortOrder: 8 },
        { eventId: conference.id, title: "Evening Networking", description: "Cocktails with sponsor booths.", date: new Date("2026-05-15"), startTime: "18:00", endTime: "20:00", venue: "Rooftop Lounge", type: "networking", cost: 100000, paxCount: 150, sortOrder: 9 },
        // Day 2 - May 16, 2026
        { eventId: conference.id, title: "Breakfast", description: "Networking breakfast.", date: new Date("2026-05-16"), startTime: "08:00", endTime: "09:00", venue: "Restaurant", type: "meal", cost: 40000, paxCount: 200, sortOrder: 10 },
        { eventId: conference.id, title: "Keynote: Data-Driven Decisions", description: "Nandini Rao on building data culture in organizations.", date: new Date("2026-05-16"), startTime: "09:15", endTime: "10:15", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 11 },
        { eventId: conference.id, title: "Hands-on Workshop: Kubernetes", description: "Practical K8s workshop for intermediate users.", date: new Date("2026-05-16"), startTime: "10:30", endTime: "13:00", venue: "Workshop Room 1", type: "session", cost: 50000, paxCount: 40, sortOrder: 12 },
        { eventId: conference.id, title: "Lunch", description: "Lunch break.", date: new Date("2026-05-16"), startTime: "13:00", endTime: "14:30", venue: "Banquet Hall", type: "meal", cost: 150000, paxCount: 200, sortOrder: 13 },
        { eventId: conference.id, title: "Fireside Chat: Tech Leadership", description: "Candid conversation with CTOs from leading companies.", date: new Date("2026-05-16"), startTime: "14:30", endTime: "15:30", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 14 },
        { eventId: conference.id, title: "Networking Dinner", description: "Formal dinner with awards ceremony.", date: new Date("2026-05-16"), startTime: "19:30", endTime: "22:30", venue: "Grand Ballroom", type: "meal", cost: 250000, paxCount: 180, sortOrder: 15 },
        // Day 3 - May 17, 2026
        { eventId: conference.id, title: "Breakfast", description: "Light breakfast.", date: new Date("2026-05-17"), startTime: "08:00", endTime: "09:00", venue: "Restaurant", type: "meal", cost: 35000, paxCount: 180, sortOrder: 16 },
        { eventId: conference.id, title: "Closing Keynote: Innovation Roadmap", description: "Closing address and next steps for community.", date: new Date("2026-05-17"), startTime: "09:15", endTime: "10:15", venue: "Main Auditorium", type: "session", paxCount: 180, sortOrder: 17 },
        { eventId: conference.id, title: "Closing & Departures", description: "Final networking and departures.", date: new Date("2026-05-17"), startTime: "10:30", endTime: "12:00", venue: "Lobby", type: "transport", paxCount: 180, sortOrder: 18 },
      ],
    });

    // Goa Wedding Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - March 5, 2026
        { eventId: goaWedding.id, title: "Arrival & Beach Welcome", description: "Welcome drinks with coconut water and Goan snacks at beachside.", date: new Date("2026-03-05"), startTime: "14:00", endTime: "16:00", venue: "Beach Deck", type: "transport", cost: 25000, paxCount: 60, sortOrder: 1 },
        { eventId: goaWedding.id, title: "Pool Party", description: "Casual pool party with DJ and mocktails.", date: new Date("2026-03-05"), startTime: "16:30", endTime: "19:00", venue: "Infinity Pool", type: "entertainment", cost: 60000, paxCount: 50, sortOrder: 2 },
        { eventId: goaWedding.id, title: "Beach BBQ Night", description: "BBQ dinner on the beach with live band.", date: new Date("2026-03-05"), startTime: "19:30", endTime: "23:00", venue: "Private Beach", type: "meal", cost: 150000, paxCount: 70, sortOrder: 3 },
        // Day 2 - March 6, 2026
        { eventId: goaWedding.id, title: "Breakfast by the Sea", description: "Breakfast with ocean views.", date: new Date("2026-03-06"), startTime: "08:00", endTime: "10:00", venue: "Beach Restaurant", type: "meal", cost: 35000, paxCount: 70, sortOrder: 4 },
        { eventId: goaWedding.id, title: "Morning Yoga", description: "Optional sunrise yoga session.", date: new Date("2026-03-06"), startTime: "06:30", endTime: "07:30", venue: "Beach Lawn", type: "session", paxCount: 20, sortOrder: 5 },
        { eventId: goaWedding.id, title: "Mehendi & Haldi", description: "Combined traditional ceremonies with Goan touches.", date: new Date("2026-03-06"), startTime: "11:00", endTime: "14:00", venue: "Garden Pavilion", type: "entertainment", cost: 80000, paxCount: 60, sortOrder: 6 },
        { eventId: goaWedding.id, title: "Goan Lunch", description: "Authentic Goan seafood spread.", date: new Date("2026-03-06"), startTime: "14:30", endTime: "16:00", venue: "Restaurant", type: "meal", cost: 70000, paxCount: 70, sortOrder: 7 },
        { eventId: goaWedding.id, title: "Sangeet Night", description: "Beachside sangeet with performances and DJ.", date: new Date("2026-03-06"), startTime: "19:00", endTime: "24:00", venue: "Beach Amphitheatre", type: "entertainment", cost: 200000, paxCount: 80, sortOrder: 8 },
        // Day 3 - March 7, 2026 (Wedding Day)
        { eventId: goaWedding.id, title: "Breakfast", description: "Light breakfast.", date: new Date("2026-03-07"), startTime: "08:00", endTime: "10:00", venue: "Restaurant", type: "meal", cost: 25000, paxCount: 70, sortOrder: 9 },
        { eventId: goaWedding.id, title: "Sunset Beach Wedding", description: "Ceremony on the beach at golden hour.", date: new Date("2026-03-07"), startTime: "17:00", endTime: "19:00", venue: "Beachfront Mandap", type: "session", cost: 120000, paxCount: 100, sortOrder: 10 },
        { eventId: goaWedding.id, title: "Reception Dinner", description: "Sit-down dinner under the stars.", date: new Date("2026-03-07"), startTime: "20:00", endTime: "01:00", venue: "Ocean Lawn", type: "meal", cost: 280000, paxCount: 120, sortOrder: 11 },
        // Day 4 - March 8, 2026
        { eventId: goaWedding.id, title: "Farewell Brunch", description: "Goodbye brunch with memories slideshow.", date: new Date("2026-03-08"), startTime: "10:00", endTime: "12:00", venue: "Restaurant", type: "meal", cost: 40000, paxCount: 60, sortOrder: 12 },
        { eventId: goaWedding.id, title: "Departures", description: "Check-out and airport transfers.", date: new Date("2026-03-08"), startTime: "12:00", endTime: "16:00", venue: "Lobby", type: "transport", cost: 20000, paxCount: 70, sortOrder: 13 },
      ],
    });

    // Corporate Offsite Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - June 20, 2026
        { eventId: corpOffsite.id, title: "Arrival & Check-in", description: "Welcome with traditional Rajasthani welcome.", date: new Date("2026-06-20"), startTime: "13:00", endTime: "15:00", venue: "Lobby", type: "transport", paxCount: 120, sortOrder: 1 },
        { eventId: corpOffsite.id, title: "Opening Session: Company Vision 2027", description: "CEO presents company direction and goals.", date: new Date("2026-06-20"), startTime: "15:30", endTime: "17:00", venue: "Convention Hall", type: "session", paxCount: 120, sortOrder: 2 },
        { eventId: corpOffsite.id, title: "Break", description: "High tea and networking.", date: new Date("2026-06-20"), startTime: "17:00", endTime: "17:30", venue: "Foyer", type: "break", cost: 20000, paxCount: 120, sortOrder: 3 },
        { eventId: corpOffsite.id, title: "Team Building: Game Night", description: "Interactive team games and challenges.", date: new Date("2026-06-20"), startTime: "17:30", endTime: "19:30", venue: "Garden", type: "entertainment", cost: 50000, paxCount: 120, sortOrder: 4 },
        { eventId: corpOffsite.id, title: "Dinner at Nahargarh Fort", description: "Exclusive dinner at historic fort with cultural show.", date: new Date("2026-06-20"), startTime: "20:00", endTime: "23:00", venue: "Nahargarh Fort (Offsite)", type: "meal", cost: 180000, paxCount: 120, sortOrder: 5 },
        // Day 2 - June 21, 2026
        { eventId: corpOffsite.id, title: "Breakfast", description: "Buffet breakfast.", date: new Date("2026-06-21"), startTime: "07:30", endTime: "09:00", venue: "Restaurant", type: "meal", cost: 35000, paxCount: 120, sortOrder: 6 },
        { eventId: corpOffsite.id, title: "Leadership Workshop", description: "Breaking silos: Cross-functional collaboration.", date: new Date("2026-06-21"), startTime: "09:30", endTime: "12:30", venue: "Convention Hall", type: "session", cost: 80000, paxCount: 120, sortOrder: 7 },
        { eventId: corpOffsite.id, title: "Lunch", description: "Working lunch with table discussions.", date: new Date("2026-06-21"), startTime: "12:30", endTime: "14:00", venue: "Banquet Hall", type: "meal", cost: 60000, paxCount: 120, sortOrder: 8 },
        { eventId: corpOffsite.id, title: "Department Breakouts", description: "Team-specific planning sessions.", date: new Date("2026-06-21"), startTime: "14:00", endTime: "17:00", venue: "Various Meeting Rooms", type: "session", paxCount: 120, sortOrder: 9 },
        { eventId: corpOffsite.id, title: "Free Time / City Exploration", description: "Optional heritage walking tour available.", date: new Date("2026-06-21"), startTime: "17:00", endTime: "19:30", venue: "City", type: "break", cost: 40000, paxCount: 60, sortOrder: 10 },
        { eventId: corpOffsite.id, title: "Rajasthani Cultural Night", description: "Traditional dance, music, and dinner.", date: new Date("2026-06-21"), startTime: "20:00", endTime: "23:00", venue: "Courtyard", type: "entertainment", cost: 120000, paxCount: 120, sortOrder: 11 },
        // Day 3 - June 22, 2026
        { eventId: corpOffsite.id, title: "Breakfast", description: "Breakfast.", date: new Date("2026-06-22"), startTime: "08:00", endTime: "09:30", venue: "Restaurant", type: "meal", cost: 35000, paxCount: 120, sortOrder: 12 },
        { eventId: corpOffsite.id, title: "Closing Session: Action Plans", description: "Commitments and next steps.", date: new Date("2026-06-22"), startTime: "10:00", endTime: "12:00", venue: "Convention Hall", type: "session", paxCount: 120, sortOrder: 13 },
        { eventId: corpOffsite.id, title: "Awards & Recognition", description: "Annual awards ceremony.", date: new Date("2026-06-22"), startTime: "12:00", endTime: "13:00", venue: "Convention Hall", type: "session", paxCount: 120, sortOrder: 14 },
        { eventId: corpOffsite.id, title: "Farewell Lunch", description: "Closing lunch.", date: new Date("2026-06-22"), startTime: "13:00", endTime: "14:30", venue: "Restaurant", type: "meal", cost: 50000, paxCount: 120, sortOrder: 15 },
        { eventId: corpOffsite.id, title: "Departures", description: "Check-out and airport transfers.", date: new Date("2026-06-22"), startTime: "14:30", endTime: "18:00", venue: "Lobby", type: "transport", cost: 25000, paxCount: 120, sortOrder: 16 },
      ],
    });

    // PharmaVision India 2026 Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - August 8, 2026
        { eventId: pharmaConf.id, title: "Registration & Welcome Kit", description: "Delegate registration, badge collection, conference materials.", date: new Date("2026-08-08"), startTime: "08:00", endTime: "09:30", venue: "HICC Foyer", type: "networking", cost: 40000, paxCount: 200, sortOrder: 1 },
        { eventId: pharmaConf.id, title: "Inaugural Ceremony", description: "Lamp lighting, welcome address by Dr. Anjali Deshpande.", date: new Date("2026-08-08"), startTime: "09:45", endTime: "10:30", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 2 },
        { eventId: pharmaConf.id, title: "Keynote: Future of Drug Discovery", description: "Dr. Raghav Menon on AI-powered pharmaceutical research.", date: new Date("2026-08-08"), startTime: "10:30", endTime: "11:30", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 3 },
        { eventId: pharmaConf.id, title: "Tea Break & Sponsor Exhibits", description: "Visit sponsor booths, networking.", date: new Date("2026-08-08"), startTime: "11:30", endTime: "12:00", venue: "Exhibition Hall", type: "break", cost: 25000, paxCount: 200, sortOrder: 4 },
        { eventId: pharmaConf.id, title: "Panel: Regulatory Landscape 2026", description: "CDSCO, FDA experts discuss evolving compliance.", date: new Date("2026-08-08"), startTime: "12:00", endTime: "13:30", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 5 },
        { eventId: pharmaConf.id, title: "Networking Lunch", description: "Multi-cuisine lunch with themed networking tables.", date: new Date("2026-08-08"), startTime: "13:30", endTime: "15:00", venue: "Banquet Hall", type: "meal", cost: 180000, paxCount: 200, sortOrder: 6 },
        { eventId: pharmaConf.id, title: "Track A: Biologics & Biosimilars", description: "Deep dive into biologic drug development.", date: new Date("2026-08-08"), startTime: "15:00", endTime: "17:00", venue: "Hall A", type: "session", paxCount: 80, sortOrder: 7 },
        { eventId: pharmaConf.id, title: "Track B: Clinical Trials Innovation", description: "Decentralized trials and digital endpoints.", date: new Date("2026-08-08"), startTime: "15:00", endTime: "17:00", venue: "Hall B", type: "session", paxCount: 70, sortOrder: 8 },
        { eventId: pharmaConf.id, title: "Track C: Pharma Manufacturing 4.0", description: "Smart factories and supply chain resilience.", date: new Date("2026-08-08"), startTime: "15:00", endTime: "17:00", venue: "Hall C", type: "session", paxCount: 50, sortOrder: 9 },
        { eventId: pharmaConf.id, title: "Evening Networking Reception", description: "Cocktails with industry leaders.", date: new Date("2026-08-08"), startTime: "18:00", endTime: "20:00", venue: "Poolside", type: "networking", cost: 80000, paxCount: 150, sortOrder: 10 },
        // Day 2 - August 9, 2026
        { eventId: pharmaConf.id, title: "Breakfast", description: "Networking breakfast.", date: new Date("2026-08-09"), startTime: "08:00", endTime: "09:00", venue: "Restaurant", type: "meal", cost: 40000, paxCount: 200, sortOrder: 11 },
        { eventId: pharmaConf.id, title: "Keynote: Precision Medicine", description: "Genomics-driven personalized therapeutics.", date: new Date("2026-08-09"), startTime: "09:15", endTime: "10:15", venue: "Main Auditorium", type: "session", paxCount: 200, sortOrder: 12 },
        { eventId: pharmaConf.id, title: "Workshop: AI in Drug Discovery", description: "Hands-on session with ML models for molecule design.", date: new Date("2026-08-09"), startTime: "10:30", endTime: "13:00", venue: "Workshop Room", type: "session", cost: 75000, paxCount: 40, sortOrder: 13 },
        { eventId: pharmaConf.id, title: "Lunch", description: "Lunch break.", date: new Date("2026-08-09"), startTime: "13:00", endTime: "14:30", venue: "Banquet Hall", type: "meal", cost: 150000, paxCount: 200, sortOrder: 14 },
        { eventId: pharmaConf.id, title: "Startup Showcase: Pharma Innovation", description: "10 biotech startups pitch their solutions.", date: new Date("2026-08-09"), startTime: "14:30", endTime: "16:30", venue: "Innovation Stage", type: "session", paxCount: 150, sortOrder: 15 },
        { eventId: pharmaConf.id, title: "Gala Dinner at Falaknuma Palace", description: "Black-tie dinner at the Nizam's palace.", date: new Date("2026-08-09"), startTime: "19:30", endTime: "23:00", venue: "Falaknuma Palace (Offsite)", type: "meal", cost: 400000, paxCount: 180, sortOrder: 16 },
        // Day 3 - August 10, 2026
        { eventId: pharmaConf.id, title: "Breakfast", description: "Light breakfast.", date: new Date("2026-08-10"), startTime: "08:00", endTime: "09:00", venue: "Restaurant", type: "meal", cost: 35000, paxCount: 180, sortOrder: 17 },
        { eventId: pharmaConf.id, title: "Fireside Chat: Industry Leaders", description: "CEOs share insights on pharma's future.", date: new Date("2026-08-10"), startTime: "09:15", endTime: "10:15", venue: "Main Auditorium", type: "session", paxCount: 180, sortOrder: 18 },
        { eventId: pharmaConf.id, title: "Closing Keynote & Awards", description: "Best paper awards, closing remarks.", date: new Date("2026-08-10"), startTime: "10:30", endTime: "12:00", venue: "Main Auditorium", type: "session", paxCount: 180, sortOrder: 19 },
        { eventId: pharmaConf.id, title: "Farewell Lunch & Departures", description: "Final networking and departures.", date: new Date("2026-08-10"), startTime: "12:00", endTime: "14:00", venue: "Banquet Hall", type: "meal", cost: 60000, paxCount: 180, sortOrder: 20 },
      ],
    });

    // IIT Delhi Reunion Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - October 15, 2026
        { eventId: reunion.id, title: "Arrival at Wildflower Hall", description: "Welcome drinks with hot beverages. Room assignments.", date: new Date("2026-10-15"), startTime: "14:00", endTime: "16:00", venue: "Main Lobby", type: "transport", paxCount: 40, sortOrder: 1 },
        { eventId: reunion.id, title: "Opening Session: 10 Years Later", description: "Icebreaker games, memory lane presentations.", date: new Date("2026-10-15"), startTime: "16:30", endTime: "18:00", venue: "Drawing Room", type: "session", paxCount: 40, sortOrder: 2 },
        { eventId: reunion.id, title: "High Tea with Mountain Views", description: "Traditional Himachali snacks overlooking Shimla.", date: new Date("2026-10-15"), startTime: "18:00", endTime: "19:00", venue: "Terrace", type: "meal", cost: 20000, paxCount: 40, sortOrder: 3 },
        { eventId: reunion.id, title: "Bonfire & Karaoke Night", description: "Outdoor bonfire with old college songs, hot chocolate.", date: new Date("2026-10-15"), startTime: "20:00", endTime: "23:30", venue: "Garden Bonfire Area", type: "entertainment", cost: 35000, paxCount: 40, sortOrder: 4 },
        // Day 2 - October 16, 2026
        { eventId: reunion.id, title: "Sunrise Yoga (Optional)", description: "Mountain yoga with certified instructor.", date: new Date("2026-10-16"), startTime: "06:00", endTime: "07:00", venue: "Lawn", type: "session", paxCount: 15, sortOrder: 5 },
        { eventId: reunion.id, title: "Breakfast", description: "Hearty mountain breakfast.", date: new Date("2026-10-16"), startTime: "08:00", endTime: "09:30", venue: "Restaurant", type: "meal", cost: 30000, paxCount: 40, sortOrder: 6 },
        { eventId: reunion.id, title: "Himalayan Trek: Lord Kitchener's Trail", description: "Guided 4km trek through cedar forests.", date: new Date("2026-10-16"), startTime: "10:00", endTime: "13:30", venue: "Resort Trails", type: "entertainment", cost: 25000, paxCount: 35, sortOrder: 7 },
        { eventId: reunion.id, title: "Picnic Lunch", description: "Packed lunch at scenic viewpoint.", date: new Date("2026-10-16"), startTime: "13:30", endTime: "14:30", venue: "Mahasu Peak", type: "meal", cost: 25000, paxCount: 35, sortOrder: 8 },
        { eventId: reunion.id, title: "Free Time / Spa", description: "Relaxation, Oberoi spa treatments available.", date: new Date("2026-10-16"), startTime: "15:00", endTime: "18:00", venue: "Various", type: "break", sortOrder: 9 },
        { eventId: reunion.id, title: "Batch Presentations Night", description: "Each department shares their journey since 2016.", date: new Date("2026-10-16"), startTime: "18:30", endTime: "20:00", venue: "Drawing Room", type: "session", paxCount: 40, sortOrder: 10 },
        { eventId: reunion.id, title: "Grand Reunion Dinner", description: "Sit-down dinner with awards: 'Most Changed', 'Same Old', etc.", date: new Date("2026-10-16"), startTime: "20:00", endTime: "23:00", venue: "Private Dining Room", type: "meal", cost: 80000, paxCount: 40, sortOrder: 11 },
        // Day 3 - October 17, 2026
        { eventId: reunion.id, title: "Breakfast", description: "Leisurely breakfast.", date: new Date("2026-10-17"), startTime: "08:30", endTime: "10:00", venue: "Restaurant", type: "meal", cost: 30000, paxCount: 40, sortOrder: 12 },
        { eventId: reunion.id, title: "Shimla Heritage Walk", description: "Guided tour of Mall Road, Christ Church, Vice Regal Lodge.", date: new Date("2026-10-17"), startTime: "10:30", endTime: "14:00", venue: "Shimla Town", type: "entertainment", cost: 20000, paxCount: 30, sortOrder: 13 },
        { eventId: reunion.id, title: "Lunch in Shimla", description: "Lunch at Indian Coffee House (historic IIT hangout).", date: new Date("2026-10-17"), startTime: "14:00", endTime: "15:30", venue: "Mall Road, Shimla", type: "meal", cost: 15000, paxCount: 30, sortOrder: 14 },
        { eventId: reunion.id, title: "Free Evening / Private Wine Tasting", description: "Optional wine tasting session at resort.", date: new Date("2026-10-17"), startTime: "17:00", endTime: "19:00", venue: "Wine Cellar", type: "entertainment", cost: 35000, paxCount: 20, sortOrder: 15 },
        { eventId: reunion.id, title: "Farewell Dinner", description: "Final dinner with slideshow of reunion memories.", date: new Date("2026-10-17"), startTime: "20:00", endTime: "22:30", venue: "Restaurant", type: "meal", cost: 50000, paxCount: 40, sortOrder: 16 },
        // Day 4 - October 18, 2026
        { eventId: reunion.id, title: "Check-out Brunch", description: "Goodbye brunch before departures.", date: new Date("2026-10-18"), startTime: "09:00", endTime: "11:00", venue: "Restaurant", type: "meal", cost: 25000, paxCount: 40, sortOrder: 17 },
        { eventId: reunion.id, title: "Departures", description: "Coordinated airport transfers to Chandigarh/Delhi.", date: new Date("2026-10-18"), startTime: "11:00", endTime: "15:00", venue: "Lobby", type: "transport", cost: 40000, paxCount: 40, sortOrder: 18 },
      ],
    });

    // NovaByte AI Product Launch Schedule
    await prisma.scheduleItem.createMany({
      data: [
        // Day 1 - September 10, 2026
        { eventId: productLaunch.id, title: "VIP Arrivals & Check-in", description: "Red carpet welcome for investors, partners, and media.", date: new Date("2026-09-10"), startTime: "12:00", endTime: "14:00", venue: "Hotel Lobby", type: "transport", paxCount: 80, sortOrder: 1 },
        { eventId: productLaunch.id, title: "Partners & Media Briefing", description: "Confidential preview of product features.", date: new Date("2026-09-10"), startTime: "14:30", endTime: "16:00", venue: "Boardroom", type: "session", paxCount: 30, sortOrder: 2 },
        { eventId: productLaunch.id, title: "Product Demo: AI Platform Walkthrough", description: "Live demo of NovaByte's next-gen AI capabilities.", date: new Date("2026-09-10"), startTime: "16:30", endTime: "18:00", venue: "Innovation Lab", type: "session", cost: 50000, paxCount: 80, sortOrder: 3 },
        { eventId: productLaunch.id, title: "Sunset Networking Reception", description: "Cocktails with rooftop city views.", date: new Date("2026-09-10"), startTime: "18:30", endTime: "20:00", venue: "Rooftop Lounge", type: "networking", cost: 100000, paxCount: 80, sortOrder: 4 },
        { eventId: productLaunch.id, title: "Investor Dinner", description: "Private dinner for Sequoia, Accel, Lightspeed partners.", date: new Date("2026-09-10"), startTime: "20:30", endTime: "23:00", venue: "Private Dining Room", type: "meal", cost: 150000, paxCount: 20, sortOrder: 5 },
        // Day 2 - September 11, 2026 (Launch Day)
        { eventId: productLaunch.id, title: "Breakfast", description: "Networking breakfast.", date: new Date("2026-09-11"), startTime: "08:00", endTime: "09:00", venue: "Restaurant", type: "meal", cost: 35000, paxCount: 100, sortOrder: 6 },
        { eventId: productLaunch.id, title: "Media Registration", description: "Press kit distribution, interview scheduling.", date: new Date("2026-09-11"), startTime: "09:00", endTime: "09:45", venue: "Convention Foyer", type: "networking", paxCount: 50, sortOrder: 7 },
        { eventId: productLaunch.id, title: "Main Launch Event", description: "CEO keynote, product unveiling, live AI demonstrations.", date: new Date("2026-09-11"), startTime: "10:00", endTime: "12:30", venue: "Grand Ballroom", type: "session", cost: 200000, paxCount: 150, sortOrder: 8 },
        { eventId: productLaunch.id, title: "Q&A with Leadership", description: "Press and analyst questions.", date: new Date("2026-09-11"), startTime: "12:30", endTime: "13:15", venue: "Grand Ballroom", type: "session", paxCount: 150, sortOrder: 9 },
        { eventId: productLaunch.id, title: "VIP Lunch", description: "Curated lunch with enterprise clients.", date: new Date("2026-09-11"), startTime: "13:30", endTime: "15:00", venue: "Pavilion", type: "meal", cost: 120000, paxCount: 80, sortOrder: 10 },
        { eventId: productLaunch.id, title: "Partner Workshops", description: "Deep-dive integration sessions with AWS, Google, Azure.", date: new Date("2026-09-11"), startTime: "15:00", endTime: "17:30", venue: "Meeting Rooms", type: "session", cost: 40000, paxCount: 60, sortOrder: 11 },
        { eventId: productLaunch.id, title: "One-on-One Media Interviews", description: "Scheduled interviews with tech journalists.", date: new Date("2026-09-11"), startTime: "15:00", endTime: "17:00", venue: "Media Room", type: "session", paxCount: 20, sortOrder: 12 },
        { eventId: productLaunch.id, title: "VIP After-Party", description: "Exclusive party with live DJ, molecular cocktails.", date: new Date("2026-09-11"), startTime: "20:00", endTime: "01:00", venue: "Rooftop & Pool", type: "entertainment", cost: 250000, paxCount: 100, sortOrder: 13 },
        // Day 3 - September 12, 2026
        { eventId: productLaunch.id, title: "Checkout Breakfast", description: "Light breakfast before departures.", date: new Date("2026-09-12"), startTime: "08:00", endTime: "10:00", venue: "Restaurant", type: "meal", cost: 25000, paxCount: 80, sortOrder: 14 },
        { eventId: productLaunch.id, title: "Airport Transfers", description: "Luxury airport transfers for VIP guests.", date: new Date("2026-09-12"), startTime: "10:00", endTime: "14:00", venue: "Lobby", type: "transport", cost: 50000, paxCount: 60, sortOrder: 15 },
      ],
    });

    // ═══════════════════════════════════════════════════════
    // ROOM OCCUPANTS - Multiple guests per room
    // ═══════════════════════════════════════════════════════
    console.log("🛏️ Creating Room Occupants...");

    // Get bookings with guests for the wedding
    const weddingBookingsWithGuests = await prisma.booking.findMany({
      where: { eventId: wedding.id },
      include: { guest: true },
      take: 8,
    });

    // Get some other guests from the wedding to add as room occupants
    const weddingOtherGuests = await prisma.guest.findMany({
      where: { 
        eventId: wedding.id,
        id: { notIn: weddingBookingsWithGuests.map(b => b.guestId) },
      },
      take: 6,
    });

    // Add room occupants (couples/families sharing rooms)
    if (weddingBookingsWithGuests.length > 0 && weddingOtherGuests.length > 0) {
      const occupantData = [];
      
      // First booking - primary guest
      if (weddingBookingsWithGuests[0]) {
        occupantData.push({
          bookingId: weddingBookingsWithGuests[0].id,
          guestId: weddingBookingsWithGuests[0].guestId,
          isPrimary: true,
        });
        // Add spouse as secondary occupant
        if (weddingOtherGuests[0]) {
          occupantData.push({
            bookingId: weddingBookingsWithGuests[0].id,
            guestId: weddingOtherGuests[0].id,
            isPrimary: false,
          });
        }
      }

      // Second booking - couple
      if (weddingBookingsWithGuests[1]) {
        occupantData.push({
          bookingId: weddingBookingsWithGuests[1].id,
          guestId: weddingBookingsWithGuests[1].guestId,
          isPrimary: true,
        });
        if (weddingOtherGuests[1]) {
          occupantData.push({
            bookingId: weddingBookingsWithGuests[1].id,
            guestId: weddingOtherGuests[1].id,
            isPrimary: false,
          });
        }
      }

      // Third booking - family of 3
      if (weddingBookingsWithGuests[2]) {
        occupantData.push({
          bookingId: weddingBookingsWithGuests[2].id,
          guestId: weddingBookingsWithGuests[2].guestId,
          isPrimary: true,
        });
        if (weddingOtherGuests[2]) {
          occupantData.push({
            bookingId: weddingBookingsWithGuests[2].id,
            guestId: weddingOtherGuests[2].id,
            isPrimary: false,
          });
        }
        if (weddingOtherGuests[3]) {
          occupantData.push({
            bookingId: weddingBookingsWithGuests[2].id,
            guestId: weddingOtherGuests[3].id,
            isPrimary: false,
          });
        }
      }

      await prisma.roomOccupant.createMany({ data: occupantData });
    }

    // Corporate offsite - some shared rooms
    const corpBookings = await prisma.booking.findMany({
      where: { eventId: corpOffsite.id },
      include: { guest: true },
      take: 4,
    });

    const corpOtherGuests = await prisma.guest.findMany({
      where: {
        eventId: corpOffsite.id,
        id: { notIn: corpBookings.map(b => b.guestId) },
      },
      take: 4,
    });

    if (corpBookings.length > 0 && corpOtherGuests.length > 0) {
      const corpOccupants = [];
      
      for (let i = 0; i < Math.min(corpBookings.length, 2); i++) {
        corpOccupants.push({
          bookingId: corpBookings[i].id,
          guestId: corpBookings[i].guestId,
          isPrimary: true,
        });
        if (corpOtherGuests[i]) {
          corpOccupants.push({
            bookingId: corpBookings[i].id,
            guestId: corpOtherGuests[i].id,
            isPrimary: false,
          });
        }
      }

      await prisma.roomOccupant.createMany({ data: corpOccupants });
    }

    // Goa Wedding - couples sharing beach villas
    const goaRoomBookings = await prisma.booking.findMany({
      where: { eventId: goaWedding.id },
      include: { guest: true },
      take: 6,
    });

    const goaOtherGuests = await prisma.guest.findMany({
      where: {
        eventId: goaWedding.id,
        id: { notIn: goaRoomBookings.map(b => b.guestId) },
      },
      take: 6,
    });

    if (goaRoomBookings.length > 0 && goaOtherGuests.length > 0) {
      const goaOccupants = [];
      
      // Couples sharing villas
      for (let i = 0; i < Math.min(goaRoomBookings.length, 4); i++) {
        goaOccupants.push({
          bookingId: goaRoomBookings[i].id,
          guestId: goaRoomBookings[i].guestId,
          isPrimary: true,
        });
        if (goaOtherGuests[i]) {
          goaOccupants.push({
            bookingId: goaRoomBookings[i].id,
            guestId: goaOtherGuests[i].id,
            isPrimary: false,
          });
        }
      }

      await prisma.roomOccupant.createMany({ data: goaOccupants });
    }

    // Pharma Conference - shared rooms for delegates
    const pharmaBookings = await prisma.booking.findMany({
      where: { eventId: pharmaConf.id },
      include: { guest: true },
      take: 4,
    });

    const pharmaOtherGuests = await prisma.guest.findMany({
      where: {
        eventId: pharmaConf.id,
        id: { notIn: pharmaBookings.map(b => b.guestId) },
      },
      take: 4,
    });

    if (pharmaBookings.length > 0 && pharmaOtherGuests.length > 0) {
      const pharmaOccupants = [];
      
      // Twin-sharing for conference delegates
      for (let i = 0; i < Math.min(pharmaBookings.length, 2); i++) {
        pharmaOccupants.push({
          bookingId: pharmaBookings[i].id,
          guestId: pharmaBookings[i].guestId,
          isPrimary: true,
        });
        if (pharmaOtherGuests[i]) {
          pharmaOccupants.push({
            bookingId: pharmaBookings[i].id,
            guestId: pharmaOtherGuests[i].id,
            isPrimary: false,
          });
        }
      }

      await prisma.roomOccupant.createMany({ data: pharmaOccupants });
    }

    // IIT Reunion - batchmates sharing rooms for nostalgia
    const reunionBookings = await prisma.booking.findMany({
      where: { eventId: reunion.id },
      include: { guest: true },
      take: 6,
    });

    const reunionOtherGuests = await prisma.guest.findMany({
      where: {
        eventId: reunion.id,
        id: { notIn: reunionBookings.map(b => b.guestId) },
      },
      take: 6,
    });

    if (reunionBookings.length > 0 && reunionOtherGuests.length > 0) {
      const reunionOccupants = [];
      
      // Old roommates reuniting
      for (let i = 0; i < Math.min(reunionBookings.length, 3); i++) {
        reunionOccupants.push({
          bookingId: reunionBookings[i].id,
          guestId: reunionBookings[i].guestId,
          isPrimary: true,
        });
        if (reunionOtherGuests[i]) {
          reunionOccupants.push({
            bookingId: reunionBookings[i].id,
            guestId: reunionOtherGuests[i].id,
            isPrimary: false,
          });
        }
      }

      await prisma.roomOccupant.createMany({ data: reunionOccupants });
    }

    // NovaByte Product Launch - VIP executive suites
    const launchBookings = await prisma.booking.findMany({
      where: { eventId: productLaunch.id },
      include: { guest: true },
      take: 4,
    });

    const launchOtherGuests = await prisma.guest.findMany({
      where: {
        eventId: productLaunch.id,
        id: { notIn: launchBookings.map(b => b.guestId) },
      },
      take: 4,
    });

    if (launchBookings.length > 0 && launchOtherGuests.length > 0) {
      const launchOccupants = [];
      
      // Executive assistants with VIPs
      for (let i = 0; i < Math.min(launchBookings.length, 2); i++) {
        launchOccupants.push({
          bookingId: launchBookings[i].id,
          guestId: launchBookings[i].guestId,
          isPrimary: true,
        });
        if (launchOtherGuests[i]) {
          launchOccupants.push({
            bookingId: launchBookings[i].id,
            guestId: launchOtherGuests[i].id,
            isPrimary: false,
          });
        }
      }

      await prisma.roomOccupant.createMany({ data: launchOccupants });
    }

    console.log("✅ Vendors, RFPs, Schedules, and Room Occupants created successfully!");

    const totalEvents = 7;
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with 7 events!",
      data: {
        agent: agent.name,
        events: [
          wedding.name,
          conference.name,
          goaWedding.name,
          corpOffsite.name,
          pharmaConf.name,
          reunion.name,
          productLaunch.name,
        ],
        totalEvents,
        summary: {
          weddingGuests: createdGuests.length,
          conferenceGuests: confGuestData.length,
          goaWeddingGuests: goaGuests.length,
          corpOffsiteGuests: corpGuests.length,
          pharmaConfGuests: pharmaGuests.length,
          reunionGuests: reunionGuests.length,
          productLaunchGuests: launchGuests.length,
        },
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
