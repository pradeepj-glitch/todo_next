import { NextRequest, NextResponse } from "next/server";
import { isAdmin, adminOnlyResponse } from "@/lib/admin-check";
import { searchUsers } from "@/lib/db";
import { User } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return adminOnlyResponse();

  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const users = await searchUsers(query);
    const safeUsers = users.map((user: User) => {
      const { password, ...safe } = user;
      return { ...safe, id: user._id };
    });
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
