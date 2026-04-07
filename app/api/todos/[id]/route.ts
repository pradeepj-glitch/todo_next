import { NextRequest, NextResponse } from "next/server";
import type { Priority } from "@/lib/types";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { findTodoByIdAndUserId, updateTodo, deleteTodo, getDatabase } from "@/lib/db";

// GET single todo (with ownership/admin verification)
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const { id } = await context.params;
    const todoId = Number(id);

    let todo;
    if (payload.role === 'admin') {
      const db = await getDatabase();
      todo = await db.collection("todos").findOne({ _id: todoId } as any);
    } else {
      todo = await findTodoByIdAndUserId(todoId, payload.userId);
    }

    if (!todo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

    return NextResponse.json({ ...todo, id: todo._id }, { status: 200 });
  } catch (error) {
    console.error("Get todo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// UPDATE todo (with ownership/admin verification)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const { id } = await context.params;
    const todoId = Number(id);
    const body = await req.json();

    let existingTodo;
    if (payload.role === 'admin') {
      const db = await getDatabase();
      existingTodo = await db.collection("todos").findOne({ _id: todoId } as any);
    } else {
      existingTodo = await findTodoByIdAndUserId(todoId, payload.userId);
    }

    if (!existingTodo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

    // Build updates object
    const updates: any = {};
    if (body.toggle !== undefined) updates.completed = !existingTodo.completed;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.priority !== undefined) updates.priority = body.priority as Priority;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
    if (body.message !== undefined) updates.message = body.message;
    if (body.completionMessage !== undefined) updates.completionMessage = body.completionMessage;

    // Enforce one-way completion for non-admins
    if (payload.role !== 'admin') {
      if (existingTodo.completed && body.toggle !== undefined) {
        return NextResponse.json({ error: "Completed tasks cannot be reopened" }, { status: 400 });
      }
      if (existingTodo.completed && (body.title || body.description || body.priority || body.dueDate)) {
        return NextResponse.json({ error: "Completed tasks cannot be edited" }, { status: 400 });
      }
    }

    const updatedTodo = await updateTodo(todoId, existingTodo.userId, updates);

    if (!updatedTodo) return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });

    return NextResponse.json({ ...updatedTodo, id: updatedTodo._id }, { status: 200 });
  } catch (error) {
    console.error("Update todo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE todo (with ownership/admin verification)
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });

    const { id } = await context.params;
    const todoId = Number(id);

    let existingTodo;
    if (payload.role === 'admin') {
      const db = await getDatabase();
      existingTodo = await db.collection("todos").findOne({ _id: todoId } as any);
    } else {
      existingTodo = await findTodoByIdAndUserId(todoId, payload.userId);
    }

    if (!existingTodo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });

    const success = await deleteTodo(todoId, existingTodo.userId);
    if (!success) return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete todo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}