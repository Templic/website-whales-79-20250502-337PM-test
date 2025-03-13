import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";

// Create a PostgreSQL pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create a drizzle instance with our schema
export const db = drizzle(pool, { schema });