import { NextResponse } from "next/server";
import { getDemoContractData, getDemoInviteData } from "@/lib/ai";
import { parseContractLocally, parseInviteLocally } from "@/lib/local-parser";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const url = new URL(request.url);
    const isDemo = url.searchParams.get("demo") === "true";

    // ── Explicit demo data request ─────────────────────────────────────────
    if (isDemo) {
      return NextResponse.json({
        contract: getDemoContractData(),
        invite: getDemoInviteData(),
        mode: "demo",
      });
    }

    // ── File upload parsing ────────────────────────────────────────────────
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error:
            "No files uploaded. Please upload a hotel contract PDF and/or an event invitation.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const contractFile = formData.get("contract") as File | null;
    const inviteFile = formData.get("invite") as File | null;

    if (
      (!contractFile || contractFile.size === 0) &&
      (!inviteFile || inviteFile.size === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "No files uploaded. Please upload a hotel contract PDF and/or an event invitation.",
        },
        { status: 400 }
      );
    }

    let contractData = null;
    let contractError: string | null = null;
    let inviteData = null;
    let inviteError: string | null = null;

    // Parse contract
    if (contractFile && contractFile.size > 0) {
      const bytes = await contractFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await parseContractLocally(buffer, contractFile.type);

      if (result.success && result.data) {
        contractData = result.data;
      } else {
        contractError = result.error || "Failed to parse contract.";
      }
    }

    // Parse invite
    if (inviteFile && inviteFile.size > 0) {
      const bytes = await inviteFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await parseInviteLocally(buffer, inviteFile.type);

      if (result.success && result.data) {
        inviteData = result.data;
      } else {
        inviteError = result.error || "Failed to parse invitation.";
      }
    }

    // If BOTH failed, return error
    if (!contractData && !inviteData && (contractError || inviteError)) {
      return NextResponse.json(
        {
          error: "Document validation failed.",
          contractError,
          inviteError,
        },
        { status: 422 }
      );
    }

    // Check if we have any MEANINGFUL data — not just default colors from a random image.
    // Contract must have a venue, or invite must have an event name.
    const hasRealContract = contractData && contractData.venue && contractData.venue !== "Unknown Venue";
    const hasRealInvite = inviteData && inviteData.eventName && inviteData.eventName.length > 0;

    if (!hasRealContract && !hasRealInvite) {
      return NextResponse.json(
        {
          error: "Could not extract meaningful event data from the uploaded documents. Please upload a valid hotel contract PDF or event invitation.",
          contractError: contractError || (contractData ? "No recognizable hotel contract data found." : null),
          inviteError: inviteError || (inviteData ? "No recognizable event details found in this file." : null),
        },
        { status: 422 }
      );
    }

    // Return whatever we successfully parsed (with errors for failed ones)
    return NextResponse.json({
      contract: contractData || null,
      invite: inviteData || null,
      contractError,
      inviteError,
      mode: "parsed",
    });
  } catch (error) {
    console.error("Parse API error:", error);
    return NextResponse.json(
      { error: "Failed to parse documents. Please try again." },
      { status: 500 }
    );
  }
}
