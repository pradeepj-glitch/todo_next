import { NextRequest, NextResponse } from "next/server";
import type { Priority } from "../../../../lib/types";
import { getTokenFromRequest, verifyToken } from "../../../../lib/auth";
import { findTodoByIdAndUserId, updateTodo, deleteTodo } from "../../../../lib/db";

// GET single todo (with ownership verification)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get todo ID from params
    const { id } = await context.params;
    const todoId = Number(id);

    // Find todo with ownership verification
    const todo = await findTodoByIdAndUserId(todoId, payload.userId);

    if (!todo) {
      return NextResponse.json(
        { error: "Todo not found" },
        { status: 404 }
      );
    }

    // Map _id to id for frontend compatibility
    const todoWithId = {
      id: todo._id,
      userId: todo.userId,
      text: todo.text,
      completed: todo.completed,
      priority: todo.priority,
      createdAt: todo.createdAt,
    };

    return NextResponse.json(todoWithId, { status: 200 });
  } catch (error) {
    console.error("Get todo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE todo (with ownership verification)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get todo ID from params
    const { id } = await context.params;
    const todoId = Number(id);

    // Get request body
    const body = await req.json();

    // Find todo with ownership verification
    const existingTodo = await findTodoByIdAndUserId(todoId, payload.userId);

    if (!existingTodo) {
      return NextResponse.json(
        { error: "Todo not found" },
        { status: 404 }
      );
    }

    // Build updates object
    const updates: { text?: string; completed?: boolean; priority?: Priority } = {};
    
    if (body.toggle !== undefined) {
      updates.completed = !existingTodo.completed;
    }
    
    if (body.text !== undefined) {
      updates.text = body.text;
    }

    if (body.priority !== undefined) {
      updates.priority = body.priority as Priority;
    }

    // Update todo
    const updatedTodo = await updateTodo(todoId, payload.userId, updates);

    if (!updatedTodo) {
      return NextResponse.json(
        { error: "Failed to update todo" },
        { status: 500 }
      );
    }

    // Map _id to id for frontend compatibility
    const todoWithId = {
      id: updatedTodo._id,
      userId: updatedTodo.userId,
      text: updatedTodo.text,
      completed: updatedTodo.completed,
      priority: updatedTodo.priority,
      createdAt: updatedTodo.createdAt,
    };

    return NextResponse.json(todoWithId, { status: 200 });
  } catch (error) {
    console.error("Update todo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE todo (with ownership verification)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get todo ID from params
    const { id } = await context.params;
    const todoId = Number(id);

    // Find todo with ownership verification
    const existingTodo = await findTodoByIdAndUserId(todoId, payload.userId);

    if (!existingTodo) {
      return NextResponse.json(
        { error: "Todo not found" },
        { status: 404 }
      );
    }

    // Delete todo
    const success = await deleteTodo(todoId, payload.userId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete todo" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete todo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}