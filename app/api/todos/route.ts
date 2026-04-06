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
    const todos = await getTodosByUserId(payload.userId);
    
    // Map _id to id for frontend compatibility
    const todosWithId = todos.map(todo => ({
      id: todo._id,
      userId: todo.userId,
      text: todo.text,
      completed: todo.completed,
      priority: todo.priority,
      createdAt: todo.createdAt,
    }));
    
    return NextResponse.json(todosWithId, { status: 200 });
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
    const newTodo = await createTodo(
      payload.userId,
      text.trim(),
      (priority as Priority) ?? "medium"
    );

    // Map _id to id for frontend compatibility
    const todoWithId = {
      id: newTodo._id,
      userId: newTodo.userId,
      text: newTodo.text,
      completed: newTodo.completed,
      priority: newTodo.priority,
      createdAt: newTodo.createdAt,
    };

    return NextResponse.json(todoWithId, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}