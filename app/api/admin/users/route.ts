import { NextRequest, NextResponse } from "next/server";
import { isAdmin, adminOnlyResponse } from "@/lib/admin-check";
import { getAllUsers, updateUser } from "@/lib/db";
import { User } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return adminOnlyResponse();

  try {
    const users = await getAllUsers(true);
    // Remove passwords from returned data
    const safeUsers = users.map((user: User) => {
      const { password, ...safe } = user;
      return { ...safe, id: user._id };
    });
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await isAdmin(req)) return adminOnlyResponse();

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

    const updatedUser = await updateUser(id, updates);
    if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password, ...safe } = updatedUser;
    return NextResponse.json(safe);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
