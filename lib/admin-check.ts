import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "./auth";

export async function isAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return false;

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return false;

  return true;
}

export function adminOnlyResponse() {
  return NextResponse.json(
    { error: "Forbidden: Admin access required" },
    { status: 403 }
  );
}
