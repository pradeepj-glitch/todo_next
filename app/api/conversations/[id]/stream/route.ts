/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getDatabase, listMessages } from "@/lib/db";
import type { Conversation } from "@/lib/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(req);
  if (!token) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });

  const { id } = await context.params;
  const conversationId = Number(id);
  if (!conversationId || Number.isNaN(conversationId)) {
    return new Response(JSON.stringify({ error: "Invalid conversation id" }), { status: 400 });
  }

  const db = await getDatabase();
  const convo = await db.collection<Conversation>("conversations").findOne({ _id: conversationId });
  if (!convo) return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 });
  if (!convo.memberIds.includes(payload.userId)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const startAfter = req.nextUrl.searchParams.get("after") || new Date().toISOString();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let after = startAfter;

      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      // Initial handshake.
      send(`retry: 2000\n\n`);

      while (!req.signal.aborted) {
        try {
          const msgs = await listMessages(conversationId, after);
          for (const m of msgs) {
            after = m.createdAt;
            send(`event: message\ndata: ${JSON.stringify(m)}\n\n`);
          }
        } catch (e) {
          // keep stream alive; client can reconnect
        }
        await sleep(1000);
      }

      controller.close();
    },
    cancel() {
      // client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

