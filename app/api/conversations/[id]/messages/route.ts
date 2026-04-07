import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createMessage, getDatabase, listMessages } from "@/lib/db";
import type { Conversation } from "@/lib/types";

async function requireMembership(req: NextRequest, conversationId: number) {
  const token = getTokenFromRequest(req);
  if (!token) return { ok: false as const, status: 401 as const, error: "Not authenticated" };
  const payload = verifyToken(token);
  if (!payload) return { ok: false as const, status: 401 as const, error: "Invalid or expired token" };

  const db = await getDatabase();
  const convo = await db.collection<Conversation>("conversations").findOne({ _id: conversationId });
  if (!convo) return { ok: false as const, status: 404 as const, error: "Conversation not found" };

  if (!convo.memberIds.includes(payload.userId)) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true as const, payload, convo };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const conversationId = Number(id);
    if (!conversationId || Number.isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const membership = await requireMembership(req, conversationId);
    if (!membership.ok) return NextResponse.json({ error: membership.error }, { status: membership.status });

    const after = req.nextUrl.searchParams.get("after") || undefined;
    const messages = await listMessages(conversationId, after);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("List messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const conversationId = Number(id);
    if (!conversationId || Number.isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const membership = await requireMembership(req, conversationId);
    if (!membership.ok) return NextResponse.json({ error: membership.error }, { status: membership.status });

    const body = await req.json();
    const text = String(body?.text || "").trim();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ error: "Text too long" }, { status: 400 });

    const msg = await createMessage(conversationId, membership.payload.userId, text);
    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

