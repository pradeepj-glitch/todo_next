import type { User } from './auth';
import type { Priority, Todo } from './types';
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

if (!DB_NAME) {
  throw new Error("Please define the DB_NAME environment variable");
}

const client = new MongoClient(MONGODB_URI);
let db: Db;

export async function connectToDatabase() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Connected to MongoDB database: ${DB_NAME}`);
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

// User database operations
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

export async function findUserById(id: number): Promise<User | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ _id: id });
    return user;
  } catch (error) {
    console.error('Error finding user by id:', error);
    return null;
  }
}

export async function createUser(email: string, password: string, name: string, role: 'admin' | 'user' = 'user'): Promise<User> {
  try {
    const db = await getDatabase();
    const newUser: User = {
      _id: Date.now(),
      email,
      password,
      name,
      role,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection<User>('users').insertOne(newUser);
    console.log(`User created: ${email} with role ${role}`);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getAllUsers(includeDeleted: boolean = false): Promise<User[]> {
  try {
    const db = await getDatabase();
    const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
    const users = await db.collection<User>('users')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function searchUsers(query: string): Promise<User[]> {
  try {
    const db = await getDatabase();
    const users = await db.collection<User>('users')
      .find({
        isDeleted: { $ne: true },
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(10)
      .toArray();
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export async function softDeleteUser(id: number): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection<User>('users').updateOne(
      { _id: id },
      { $set: { isDeleted: true } }
    );
    return result.modifiedCount === 1;
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return false;
  }
}

// Todo database operations (user-specific)
export async function getTodosByUserId(userId: number): Promise<Todo[]> {
  try {
    const db = await getDatabase();
    const todos = await db.collection<Todo>('todos')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return todos;
  } catch (error) {
    console.error('Error getting todos by user id:', error);
    return [];
  }
}

export async function findTodoByIdAndUserId(id: number, userId: number): Promise<Todo | null> {
  try {
    const db = await getDatabase();
    const todo = await db.collection<Todo>('todos').findOne({ _id: id, userId });
    return todo;
  } catch (error) {
    console.error('Error finding todo by id and user id:', error);
    return null;
  }
}

export interface CreateTodoParams {
  userId: number;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  assignedBy: number;
  assignedByName: string;
  message: string;
  completionMessage?: string;
}

export async function createTodo(params: CreateTodoParams): Promise<Todo> {
  try {
    const db = await getDatabase();
    const newTodo: Todo = {
      _id: Date.now(),
      ...params,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    await db.collection<Todo>('todos').insertOne(newTodo);
    console.log(`Todo created for user ${params.userId}: ${params.title}`);
    return newTodo;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
}

export async function updateTodo(id: number, userId: number, updates: Partial<Omit<Todo, '_id' | 'userId' | 'createdAt'>>): Promise<Todo | null> {
  try {
    const db = await getDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOps: any = {};
    
    if (updates.title !== undefined) updateOps.title = updates.title;
    if (updates.description !== undefined) updateOps.description = updates.description;
    if (updates.completed !== undefined) updateOps.completed = updates.completed;
    if (updates.priority !== undefined) updateOps.priority = updates.priority;
    if (updates.dueDate !== undefined) updateOps.dueDate = updates.dueDate;
    if (updates.message !== undefined) updateOps.message = updates.message;
    if (updates.completionMessage !== undefined) updateOps.completionMessage = updates.completionMessage;
    
    const result = await db.collection<Todo>('todos').updateOne(
      { _id: id, userId },
      { $set: updateOps }
    );
    
    if (result.matchedCount === 0) {
      return null;
    }
    
    const updatedTodo = await findTodoByIdAndUserId(id, userId);
    console.log(`Todo updated: ${id}`);
    return updatedTodo;
  } catch (error) {
    console.error('Error updating todo:', error);
    return null;
  }
}

export async function deleteTodo(id: number, userId: number): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection<Todo>('todos').deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 1) {
      console.log(`Todo deleted: ${id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting todo:', error);
    return false;
  }
}

// Update user profile
export async function updateUser(id: number, updates: Partial<Omit<User, '_id' | 'createdAt'>>): Promise<User | null> {
  try {
    const db = await getDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOps: any = {};
    
    if (updates.name !== undefined) updateOps.name = updates.name;
    if (updates.email !== undefined) updateOps.email = updates.email;
    if (updates.password !== undefined) updateOps.password = updates.password;
    if (updates.role !== undefined) updateOps.role = updates.role;
    if (updates.isDeleted !== undefined) updateOps.isDeleted = updates.isDeleted;
    
    const result = await db.collection<User>('users').updateOne(
      { _id: id },
      { $set: updateOps }
    );
    
    if (result.matchedCount === 0) {
      return null;
    }
    
    const updatedUser = await findUserById(id);
    console.log(`User updated: ${id}`);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// Seed initial todos for testing (optional - remove in production)
export async function seedInitialTodos() {
  try {
    const db = await getDatabase();
    const existingTodos = await db.collection<Todo>('todos').countDocuments();
    
    if (existingTodos === 0) {
      // Only seed if no todos exist
      const sampleTodos: Todo[] = [
        { _id: 1, userId: 1, title: "Learn Next.js App Router", description: "Follow the official docs", completed: false, priority: "high", dueDate: "2026-12-31", assignedBy: 1, assignedByName: "Admin", message: "Kickoff task", createdAt: new Date().toISOString() },
        { _id: 2, userId: 1, title: "Build CRUD with MongoDB", description: "Implement all endpoints", completed: false, priority: "medium", dueDate: "2026-12-31", assignedBy: 1, assignedByName: "Admin", message: "Core logic", createdAt: new Date().toISOString() },
        { _id: 3, userId: 1, title: "Style the UI beautifully", description: "Use modern CSS", completed: true, priority: "low", dueDate: "2026-12-31", assignedBy: 1, assignedByName: "Admin", message: "Final polish", createdAt: new Date().toISOString() },
      ];
      
      await db.collection<Todo>('todos').insertMany(sampleTodos);
      console.log('Seeded initial todos');
    }
  } catch (error) {
    console.error('Error seeding todos:', error);
  }
}