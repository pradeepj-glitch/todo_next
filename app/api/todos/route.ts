type Priority = "low" | "medium" | "high";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}

const todos: Todo[] = [
  { id: 1, text: "Learn Next.js App Router", completed: false, priority: "high",   createdAt: new Date().toISOString() },
  { id: 2, text: "Build CRUD with MongoDB",  completed: false, priority: "medium", createdAt: new Date().toISOString() },
  { id: 3, text: "Style the UI beautifully", completed: true,  priority: "low",    createdAt: new Date().toISOString() },
];

export async function GET() {
  return Response.json(todos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newTodo: Todo = {
    id: Date.now(),
    text: body.text,
    completed: false,
    priority: body.priority ?? "medium",
    createdAt: new Date().toISOString(),
  };
  todos.push(newTodo);
  return Response.json(newTodo, { status: 201 });
}