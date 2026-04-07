import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Manual env loading for standalone script
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'todo-app';

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);

    // 1. Migrate Users
    console.log("Migrating Users collection...");
    const usersCollection = db.collection('users');
    
    // Set default fields for users if they don't exist
    const usersResult = await usersCollection.updateMany(
      { $or: [
        { role: { $exists: false } },
        { isDeleted: { $exists: false } },
        { createdAt: { $exists: false } }
      ]},
      [
        {
          $set: {
            role: { $ifNull: ["$role", "user"] },
            isDeleted: { $ifNull: ["$isDeleted", false] },
            createdAt: { $ifNull: ["$createdAt", new Date().toISOString()] }
          }
        }
      ]
    );
    console.log(`Updated ${usersResult.modifiedCount} users.`);

    // 2. Migrate Todos
    console.log("Migrating Todos collection...");
    const todosCollection = db.collection('todos');

    // Step A: Map 'text' to 'title' and set default fields
    const todosResult = await todosCollection.updateMany(
      {}, // Apply to all to ensure consistency
      [
        {
          $set: {
            title: { $ifNull: ["$title", "$text", "Untitled Task"] },
            description: { $ifNull: ["$description", ""] },
            completed: { $ifNull: ["$completed", false] },
            priority: { $ifNull: ["$priority", "medium"] },
            dueDate: { $ifNull: ["$dueDate", new Date().toISOString()] },
            assignedBy: { $ifNull: ["$assignedBy", "$userId"] },
            assignedByName: { $ifNull: ["$assignedByName", "System"] },
            message: { $ifNull: ["$message", ""] },
            createdAt: { $ifNull: ["$createdAt", new Date().toISOString()] }
          }
        },
        {
          $unset: ["text"] // Remove text after mapping to title
        }
      ]
    );
    console.log(`Updated ${todosResult.modifiedCount} todos.`);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
  }
}

migrate();
