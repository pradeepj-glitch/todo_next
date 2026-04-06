export type Priority = "low" | "medium" | "high";

export interface Todo {
  _id: number;
  userId: number;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
}
