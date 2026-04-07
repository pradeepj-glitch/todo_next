import { NextRequest, NextResponse } from "next/server";
import { isAdmin, adminOnlyResponse } from "@/lib/admin-check";
import { softDeleteUser } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAdmin(req)) return adminOnlyResponse();

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const success = await softDeleteUser(id);
    if (!success) return NextResponse.json({ error: "User not found or already deleted" }, { status: 404 });

    return NextResponse.json({ message: "User soft deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
