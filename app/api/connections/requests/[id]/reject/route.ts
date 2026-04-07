import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { rejectConnectionRequest } from "@/lib/db";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const { id } = await context.params;
    const requestId = Number(id);
    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const ok = await rejectConnectionRequest(requestId, payload.userId);
    if (!ok) return NextResponse.json({ error: "Request not found or not allowed" }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Reject request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

