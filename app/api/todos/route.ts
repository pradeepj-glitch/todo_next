import { NextRequest, NextResponse } from "next/server";
import type { Priority } from "../../../lib/types";
import { getTokenFromRequest, verifyToken } from "../../../lib/auth";
import { getTodosByUserId, createTodo } from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    // Users and Admins can see todos.
    // If admin, maybe return all? The prompt says "track the user progress".
    // For now, let's allow admins to see ALL todos if they want, but use a query param.
    const searchParams = req.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true' && payload.role === 'admin';

    let todos;
    if (all) {
      const { getDatabase } = await import("../../../lib/db");
      const db = await getDatabase();
      todos = await db.collection("todos").find({}).sort({ createdAt: -1 }).toArray();
    } else {
      todos = await getTodosByUserId(payload.userId);
    }
    
    const todosWithId = todos.map(todo => ({
      ...todo,
      id: todo._id,
    }));
    
    return NextResponse.json(todosWithId, { status: 200 });
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, title, description, priority, dueDate, message } = body;

    if (!userId || !title || !dueDate) {
      return NextResponse.json({ error: "UserId, title, and dueDate are required" }, { status: 400 });
    }

    const { findUserById } = await import("../../../lib/db");
    const adminUser = await findUserById(payload.userId);

    const newTodo = await createTodo({
      userId: parseInt(userId),
      title: title.trim(),
      description: (description || "").trim(),
      priority: (priority as Priority) ?? "medium",
      dueDate,
      assignedBy: payload.userId,
      assignedByName: adminUser?.name || "Admin",
      message: (message || "").trim(),
    });

    return NextResponse.json({ ...newTodo, id: newTodo._id }, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}