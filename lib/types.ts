export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: number;
  userId: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}