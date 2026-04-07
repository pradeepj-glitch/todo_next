import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { areUsersConnected, getOrCreateConversation } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const body = await req.json();
    const withUserId = Number(body?.withUserId);
    if (!withUserId || Number.isNaN(withUserId)) {
      return NextResponse.json({ error: "withUserId is required" }, { status: 400 });
    }
    if (withUserId === payload.userId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const connected = await areUsersConnected(payload.userId, withUserId);
    if (!connected) {
      return NextResponse.json({ error: "Forbidden: not connected" }, { status: 403 });
    }

    const convo = await getOrCreateConversation(payload.userId, withUserId);
    return NextResponse.json({ conversation: convo }, { status: 200 });
  } catch (error) {
    console.error("Create/get conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

