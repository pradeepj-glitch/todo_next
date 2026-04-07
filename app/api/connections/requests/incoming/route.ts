import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getIncomingRequests } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const incoming = await getIncomingRequests(payload.userId);
    return NextResponse.json(incoming, { status: 200 });
  } catch (error) {
    console.error("Incoming requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

