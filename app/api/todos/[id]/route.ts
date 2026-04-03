type Priority = "low" | "medium" | "high";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}

// In a real app this would be your DB — share via a module-level import
let todos: Todo[] = [
  { id: 1, text: "Learn Next.js App Router", completed: false, priority: "high",   createdAt: new Date().toISOString() },
  { id: 2, text: "Build CRUD with MongoDB",  completed: false, priority: "medium", createdAt: new Date().toISOString() },
  { id: 3, text: "Style the UI beautifully", completed: true,  priority: "low",    createdAt: new Date().toISOString() },
];

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const todo = todos.find(t => t.id == Number(params.id));
  if (!todo) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(todo);
}

export async function PUT(req: Request, { params }: Params) {
  const body = await req.json();
  const id = Number(params.id);

  todos = todos.map(t => {
    if (t.id !== id) return t;
    if (body.toggle) return { ...t, completed: !t.completed };
    return {
      ...t,
      text:     body.text     ?? t.text,
      priority: body.priority ?? t.priority,
    };
  });

  const updated = todos.find(t => t.id === id);
  return Response.json(updated ?? { error: "Not found" });
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  todos = todos.filter(t => t.id !== id);
  return Response.json({ message: "Deleted", id });
}