import { NextResponse } from "next/server";
import { parseContractWithAI, parseInviteWithAI } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    let contractData;
    let inviteData;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const contractFile = formData.get("contract") as File | null;
      const inviteFile = formData.get("invite") as File | null;

      if (contractFile && contractFile.size > 0) {
        const bytes = await contractFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        contractData = await parseContractWithAI(base64, contractFile.type);
      }

      if (inviteFile && inviteFile.size > 0) {
        const bytes = await inviteFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        inviteData = await parseInviteWithAI(base64, inviteFile.type);
      }
    }

    // Fallback to demo data if no files or no API key
    if (!contractData) {
      contractData = await parseContractWithAI("", "");
    }
    if (!inviteData) {
      inviteData = await parseInviteWithAI("", "");
    }

    return NextResponse.json({
      contract: contractData,
      invite: inviteData,
    });
  } catch (error) {
    console.error("Parse API error:", error);
    return NextResponse.json(
      { error: "Failed to parse documents" },
      { status: 500 }
    );
  }
}
