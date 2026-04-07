import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { areUsersConnected, createConnectionRequest, findPendingRequest, findUserById } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const body = await req.json();
    const toUserIdRaw = body?.toUserId;
    const toUserId = Number(toUserIdRaw);
    if (!toUserId || Number.isNaN(toUserId)) {
      return NextResponse.json({ error: "toUserId is required" }, { status: 400 });
    }

    if (toUserId === payload.userId) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
    }

    const recipient = await findUserById(toUserId);
    if (!recipient || recipient.isDeleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connected = await areUsersConnected(payload.userId, toUserId);
    if (connected) {
      return NextResponse.json({ error: "Already connected" }, { status: 409 });
    }

    // Prevent duplicate pending requests in either direction.
    const existing1 = await findPendingRequest(payload.userId, toUserId);
    const existing2 = await findPendingRequest(toUserId, payload.userId);
    if (existing1 || existing2) {
      return NextResponse.json({ error: "A pending request already exists" }, { status: 409 });
    }

    // Use an upsert to make the operation idempotent under races.
    const created = await createConnectionRequest(payload.userId, toUserId);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Create connection request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

