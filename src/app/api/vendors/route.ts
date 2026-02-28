import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all vendors
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        rfps: {
          select: { id: true, status: true, quotedAmount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Get vendors error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

// POST - Create new vendor
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, phone, contactPerson, address, notes } = data;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate phone format if provided - accept 7-15 digits with optional +
    if (phone) {
      const phoneClean = phone.replace(/[^\d+]/g, "");
      if (!/^\+?\d{7,15}$/.test(phoneClean)) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        contactPerson: contactPerson || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Create vendor error:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

// PUT - Update vendor
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, name, email, phone, contactPerson, address, notes } = data;

    if (!id) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Update vendor error:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

// DELETE - Remove vendor
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    // Check if vendor has associated RFPs
    const rfpCount = await prisma.rFP.count({ where: { vendorId: id } });
    if (rfpCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete vendor with ${rfpCount} associated RFP${rfpCount > 1 ? 's' : ''}. Remove or reassign RFPs first.` 
      }, { status: 400 });
    }

    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
