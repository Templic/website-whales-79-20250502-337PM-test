// Initialize database script
import { execSync } from 'child_process';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Get the database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Function to apply migrations by directly executing SQL files
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // First try to push the schema using drizzle-kit
    try {
      console.log('Pushing schema with drizzle-kit...');
      
      // Force yes to all prompts
      process.env.DRIZZLE_YES = 'true';
      
      // Execute drizzle push command
      execSync('npx drizzle-kit push:pg', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DRIZZLE_YES: 'true'
        }
      });
      
      console.log('Schema pushed successfully');
    } catch (error) {
      console.error('Error pushing schema with drizzle-kit:', error.message);
      console.log('Attempting to create tables manually...');
      
      // Connect to the database
      const client = new Client({
        connectionString: databaseUrl,
      });
      
      await client.connect();
      
      // Check if users table exists
      const tablesCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      if (!tablesCheck.rows[0].exists) {
        console.log('Creating tables from schema.ts...');
        
        // Create basic tables manually
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL DEFAULT 'user',
            is_banned BOOLEAN NOT NULL DEFAULT false,
            two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
            two_factor_secret TEXT,
            backup_codes TEXT[],
            last_login TIMESTAMP,
            last_login_ip TEXT,
            login_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TIMESTAMP,
            must_change_password BOOLEAN NOT NULL DEFAULT false,
            password_updated_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS subscribers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
          
          CREATE TABLE IF NOT EXISTS albums (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            release_date TIMESTAMP,
            cover_image TEXT,
            description TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS tracks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album_id INTEGER,
            duration TEXT,
            audio_url TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP
          );
        `);
        
        console.log('Basic tables created');
      } else {
        console.log('Tables already exist');
      }
      
      // Create some initial data
      try {
        await client.query(`
          INSERT INTO users (username, password, email, role)
          VALUES ('admin', '$2b$10$Jw3D4OQEy6WSvfwWzCnWK.PJBvVHXqLbMQYpiiaB9xO/eWq2ZK1QG', 'admin@example.com', 'admin')
          ON CONFLICT (username) DO NOTHING;
        `);
        console.log('Initial admin user created or already exists');
      } catch (err) {
        console.log('Error creating initial data:', err.message);
      }
      
      await client.end();
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();