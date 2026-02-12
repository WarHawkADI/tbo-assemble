import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// AI Auto-Allocator: automatically assigns guests to floors/wings
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: true,
        roomBlocks: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const unallocated = event.guests.filter(
      (g) => !g.allocatedFloor && !g.allocatedWing && g.status !== "cancelled"
    );

    if (unallocated.length === 0) {
      return NextResponse.json({ message: "All guests are already allocated", allocations: {} });
    }

    // Build floor/wing zones from room blocks
    const zones: { floor: string; wing: string; capacity: number; currentCount: number }[] = [];
    for (const room of event.roomBlocks) {
      const floor = room.floor || "1";
      const wing = room.wing || "Main";
      const existing = zones.find((z) => z.floor === floor && z.wing === wing);
      if (existing) {
        existing.capacity += room.totalQty;
      } else {
        zones.push({ floor, wing, capacity: room.totalQty, currentCount: 0 });
      }
    }

    // Count already-allocated guests per zone
    for (const guest of event.guests) {
      if (guest.allocatedFloor && guest.allocatedWing) {
        const zone = zones.find(
          (z) => z.floor === guest.allocatedFloor && z.wing === guest.allocatedWing
        );
        if (zone) zone.currentCount++;
      }
    }

    // Priority order: VIP first, then Bride Side, Groom Side, Family, Friends, others
    const groupPriority: Record<string, number> = {
      VIP: 0,
      "Bride Side": 1,
      "Groom Side": 2,
      Family: 3,
      Friends: 4,
    };

    const sorted = [...unallocated].sort((a, b) => {
      const pa = groupPriority[a.group || ""] ?? 99;
      const pb = groupPriority[b.group || ""] ?? 99;
      return pa - pb;
    });

    // Sort zones by floor (highest first for VIPs)
    const sortedZones = [...zones].sort((a, b) => b.floor.localeCompare(a.floor));

    const allocations: Record<string, { floor: string; wing: string }> = {};

    // Build a map for proximity lookups
    const guestNameToAllocation = new Map<string, { floor: string; wing: string }>();
    for (const guest of event.guests) {
      if (guest.allocatedFloor && guest.allocatedWing) {
        guestNameToAllocation.set(guest.name.toLowerCase(), {
          floor: guest.allocatedFloor,
          wing: guest.allocatedWing,
        });
      }
    }

    // Assign group zones: keep same groups together
    const groupZoneAssignment = new Map<string, { floor: string; wing: string }>();

    for (const guest of sorted) {
      let assigned = false;

      // 1. Honor proximity requests first
      if (guest.proximityRequest) {
        const nearName = guest.proximityRequest
          .replace(/^near\s*/i, "")
          .replace(/^next to\s*/i, "")
          .trim()
          .toLowerCase();
        const nearAlloc = guestNameToAllocation.get(nearName);
        if (nearAlloc) {
          const zone = zones.find(
            (z) => z.floor === nearAlloc.floor && z.wing === nearAlloc.wing
          );
          if (zone && zone.currentCount < zone.capacity) {
            allocations[guest.id] = { floor: zone.floor, wing: zone.wing };
            zone.currentCount++;
            guestNameToAllocation.set(guest.name.toLowerCase(), {
              floor: zone.floor,
              wing: zone.wing,
            });
            assigned = true;
          }
        }
      }

      // 2. Try to keep same group together
      if (!assigned && guest.group) {
        const groupZone = groupZoneAssignment.get(guest.group);
        if (groupZone) {
          const zone = zones.find(
            (z) => z.floor === groupZone.floor && z.wing === groupZone.wing
          );
          if (zone && zone.currentCount < zone.capacity) {
            allocations[guest.id] = { floor: zone.floor, wing: zone.wing };
            zone.currentCount++;
            guestNameToAllocation.set(guest.name.toLowerCase(), {
              floor: zone.floor,
              wing: zone.wing,
            });
            assigned = true;
          }
        }
      }

      // 3. Assign to best available zone (VIPs get top floors)
      if (!assigned) {
        const isVIP = guest.group === "VIP";
        const candidates = isVIP ? sortedZones : [...zones].sort((a, b) => a.floor.localeCompare(b.floor));
        for (const zone of candidates) {
          if (zone.currentCount < zone.capacity) {
            allocations[guest.id] = { floor: zone.floor, wing: zone.wing };
            zone.currentCount++;
            guestNameToAllocation.set(guest.name.toLowerCase(), {
              floor: zone.floor,
              wing: zone.wing,
            });
            if (guest.group && !groupZoneAssignment.has(guest.group)) {
              groupZoneAssignment.set(guest.group, { floor: zone.floor, wing: zone.wing });
            }
            assigned = true;
            break;
          }
        }
      }
    }

    // Save allocations to database
    for (const [guestId, alloc] of Object.entries(allocations)) {
      await prisma.guest.update({
        where: { id: guestId },
        data: {
          allocatedFloor: alloc.floor,
          allocatedWing: alloc.wing,
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        eventId,
        action: "auto_allocate",
        details: `AI auto-allocated ${Object.keys(allocations).length} guests across ${zones.length} zones`,
        actor: "AI Allocator",
      },
    });

    return NextResponse.json({
      success: true,
      allocated: Object.keys(allocations).length,
      allocations,
    });
  } catch (error) {
    console.error("Auto-allocate error:", error);
    return NextResponse.json({ error: "Failed to auto-allocate" }, { status: 500 });
  }
}
