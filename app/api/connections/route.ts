import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, type User as DbUser } from "@/lib/auth";
import { findUserById, getConnectionsForUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const connections = await getConnectionsForUser(payload.userId);

    const hydrated = await Promise.all(connections.map(async (c) => {
      const otherUserId = c.userIdA === payload.userId ? c.userIdB : c.userIdA;
      const other = await findUserById(otherUserId);
      if (!other || other.isDeleted) return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safe } = other as DbUser;
      return {
        connection: c,
        user: { ...safe, id: other._id },
      };
    }));

    return NextResponse.json(hydrated.filter(Boolean), { status: 200 });
  } catch (error) {
    console.error("Connections list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

