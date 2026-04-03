import { NextRequest, NextResponse } from "next/server";
import type { Priority } from "../../../lib/types";
import { getTokenFromRequest, verifyToken } from "../../../lib/auth";
import { getTodosByUserId, createTodo } from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get todos for this user only
    const todos = getTodosByUserId(payload.userId);
    
    return NextResponse.json(todos, { status: 200 });
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await req.json();
    const { text, priority } = body;

    // Validation
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Todo text is required" },
        { status: 400 }
      );
    }

    // Create todo for this user
    const newTodo = createTodo(
      payload.userId,
      text.trim(),
      (priority as Priority) ?? "medium"
    );

    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}