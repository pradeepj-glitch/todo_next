import type { User } from './auth';
import type { Priority, Todo } from './types';

// In-memory user storage
export const users: User[] = [];

// In-memory todo storage
export const todos: Todo[] = [
  { id: 1, userId: 1, text: "Learn Next.js App Router", completed: false, priority: "high", createdAt: new Date().toISOString() },
  { id: 2, userId: 1, text: "Build CRUD with MongoDB", completed: false, priority: "medium", createdAt: new Date().toISOString() },
  { id: 3, userId: 1, text: "Style the UI beautifully", completed: true, priority: "low", createdAt: new Date().toISOString() },
];

// User database operations
export function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email === email);
}

export function findUserById(id: number): User | undefined {
  return users.find(user => user.id === id);
}

export function createUser(email: string, password: string, name: string): User {
  const newUser: User = {
    id: Date.now(),
    email,
    password,
    name,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

// Todo database operations (user-specific)
export function getTodosByUserId(userId: number): Todo[] {
  return todos.filter(todo => todo.userId === userId);
}

export function findTodoByIdAndUserId(id: number, userId: number): Todo | undefined {
  return todos.find(todo => todo.id === id && todo.userId === userId);
}

export function createTodo(userId: number, text: string, priority: Priority): Todo {
  const newTodo: Todo = {
    id: Date.now(),
    userId,
    text,
    completed: false,
    priority,
    createdAt: new Date().toISOString(),
  };
  todos.push(newTodo);
  return newTodo;
}

export function updateTodo(id: number, userId: number, updates: Partial<Omit<Todo, 'id' | 'userId' | 'createdAt'>>): Todo | null {
  const index = todos.findIndex(todo => todo.id === id && todo.userId === userId);
  if (index === -1) return null;
  
  const todo = todos[index];
  if (updates.text !== undefined) todo.text = updates.text;
  if (updates.completed !== undefined) todo.completed = updates.completed;
  if (updates.priority !== undefined) todo.priority = updates.priority;
  
  return todo;
}

export function deleteTodo(id: number, userId: number): boolean {
  const index = todos.findIndex(todo => todo.id === id && todo.userId === userId);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}