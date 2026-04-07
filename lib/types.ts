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

export type ConnectionRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface ConnectionRequest {
  _id: number;
  fromUserId: number;
  toUserId: number;
  status: ConnectionRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface Connection {
  _id: number;
  userIdA: number; // normalized: min(userIdA,userIdB)
  userIdB: number; // normalized: max(userIdA,userIdB)
  createdAt: string;
}

export interface Conversation {
  _id: number;
  memberIds: [number, number]; // normalized ascending
  createdAt: string;
  lastMessageAt?: string;
}

export interface Message {
  _id: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: string;
}
