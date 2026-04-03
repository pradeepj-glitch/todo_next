import { NextRequest } from "next/server";

type Priority = "low" | "medium" | "high";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}

// Temporary in-memory DB (will reset on deploy)
let todos: Todo[] = [
  { id: 1, text: "Learn Next.js App Router", completed: false, priority: "high", createdAt: new Date().toISOString() },
  { id: 2, text: "Build CRUD with MongoDB", completed: false, priority: "medium", createdAt: new Date().toISOString() },
  { id: 3, text: "Style the UI beautifully", completed: true, priority: "low", createdAt: new Date().toISOString() },
];

// ✅ GET single todo
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const todo = todos.find(t => t.id === Number(id));

  if (!todo) {
    return Response.json({ error: "Todo not found" }, { status: 404 });
  }

  return Response.json(todo);
}

// ✅ UPDATE todo (toggle OR edit text)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const index = todos.findIndex(t => t.id === Number(id));

  if (index === -1) {
    return Response.json({ error: "Todo not found" }, { status: 404 });
  }

  if (body.toggle) {
    todos[index].completed = !todos[index].completed;
  }

  if (body.text) {
    todos[index].text = body.text;
  }

  return Response.json(todos[index]);
}

// ✅ DELETE todo
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  todos = todos.filter(t => t.id !== Number(id));

  return Response.json({ success: true });
}