export type Priority = "low" | "medium" | "high";

export interface Todo {
  _id: number;
  id?: number;
  userId: number;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  dueDate: string;
  assignedBy: number;
  assignedByName: string;
  message: string;
  completionMessage?: string;
  createdAt: string;
}
