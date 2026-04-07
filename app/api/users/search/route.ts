import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, type User as DbUser } from "@/lib/auth";
import { searchUsersForUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q") || "";
    if (!q || q.length < 2) return NextResponse.json([], { status: 200 });

    const users = await searchUsersForUser(q, payload.userId);
    const safeUsers = users.map((user: DbUser) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safe } = user;
      return { ...safe, id: user._id };
    });

    const filtered = safeUsers.filter(u => !u.isDeleted);
    return NextResponse.json(filtered, { status: 200 });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}

