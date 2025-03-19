import { db } from "./db";
import * as schema from "@shared/schema";

export async function migrate() {
  console.log('Starting database migrations...');
  try {
    // Create tables using drizzle schema
    await db.execute(schema.users);
    await db.execute(schema.subscribers);
    await db.execute(schema.posts);
    await db.execute(schema.categories);
    await db.execute(schema.comments);
    await db.execute(schema.tracks);
    await db.execute(schema.albums);
    await db.execute(schema.musicUploads);

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}