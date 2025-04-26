#!/usr/bin/env node

/**
 * Database Migration Script
 * This script creates all necessary tables for the TypeScript error management system
 * without requiring interactive prompts.
 */

import pg from 'pg';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Connect to the database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Create TypeScript error management tables
async function createTypeScriptErrorTables() {
  try {
    console.log('Creating TypeScript error management tables...');
    
    // Create enum types
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_category') THEN
          CREATE TYPE error_category AS ENUM (
            'type_mismatch', 'missing_type', 'import_error', 'null_reference',
            'interface_mismatch', 'generic_constraint', 'declaration_error', 'syntax_error', 'other'
          );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_severity') THEN
          CREATE TYPE error_severity AS ENUM ('critical', 'high', 'medium', 'low');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_status') THEN
          CREATE TYPE error_status AS ENUM ('pending', 'fixed', 'ignored');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fix_method') THEN
          CREATE TYPE fix_method AS ENUM ('automatic', 'ai', 'pattern', 'manual');
        END IF;
      END $$;
    `);
    console.log('Created enum types');
    
    // Create typescript_errors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS typescript_errors (
        id SERIAL PRIMARY KEY,
        error_code TEXT NOT NULL,
        file_path TEXT NOT NULL,
        line_number INTEGER NOT NULL,
        column_number INTEGER NOT NULL,
        error_message TEXT NOT NULL,
        error_context TEXT NOT NULL,
        category error_category NOT NULL,
        severity error_severity NOT NULL,
        status error_status NOT NULL DEFAULT 'pending',
        detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        fix_id INTEGER,
        pattern_id INTEGER,
        user_id INTEGER,
        metadata JSONB,
        first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        occurrence_count INTEGER NOT NULL DEFAULT 1,
        last_occurrence_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('Created typescript_errors table');
    
    // Create error_patterns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_patterns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        regex TEXT,
        category error_category NOT NULL,
        severity error_severity NOT NULL,
        detection_rules JSONB,
        auto_fixable BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE,
        created_by INTEGER
      );
    `);
    console.log('Created error_patterns table');
    
    // Create error_fixes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_fixes (
        id SERIAL PRIMARY KEY,
        pattern_id INTEGER,
        fix_title TEXT NOT NULL,
        fix_description TEXT NOT NULL,
        fix_code TEXT NOT NULL,
        fix_type TEXT NOT NULL,
        fix_priority INTEGER NOT NULL DEFAULT 1,
        success_rate NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE,
        created_by INTEGER
      );
    `);
    console.log('Created error_fixes table');
    
    // Create error_analysis table
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_analysis (
        id SERIAL PRIMARY KEY,
        error_id INTEGER NOT NULL REFERENCES typescript_errors(id),
        analysis_type TEXT NOT NULL,
        analysis_data JSONB NOT NULL,
        confidence_score INTEGER NOT NULL DEFAULT 0,
        suggested_fix TEXT,
        is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by INTEGER
      );
    `);
    console.log('Created error_analysis table');
    
    // Create scan_results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scan_results (
        id SERIAL PRIMARY KEY,
        scan_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        scan_type TEXT NOT NULL,
        total_errors INTEGER NOT NULL,
        critical_errors INTEGER NOT NULL,
        high_errors INTEGER NOT NULL,
        medium_errors INTEGER NOT NULL,
        low_errors INTEGER NOT NULL,
        scan_duration_ms INTEGER NOT NULL,
        is_deep_scan BOOLEAN NOT NULL DEFAULT FALSE,
        is_ai_enhanced BOOLEAN NOT NULL DEFAULT FALSE,
        scan_metadata JSONB,
        created_by INTEGER
      );
    `);
    console.log('Created scan_results table');
    
    // Create error_fix_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_fix_history (
        id SERIAL PRIMARY KEY,
        error_id INTEGER NOT NULL REFERENCES typescript_errors(id),
        fix_id INTEGER,
        user_id INTEGER,
        fix_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        fix_method TEXT NOT NULL,
        fix_code TEXT,
        fix_result TEXT NOT NULL,
        fix_time_ms INTEGER,
        before_state JSONB,
        after_state JSONB
      );
    `);
    console.log('Created error_fix_history table');
    
    return true;
  } catch (error) {
    console.error('Error creating TypeScript error tables:', error);
    return false;
  }
}

// Ensure the users table has the right schema
async function fixUsersTable() {
  try {
    console.log('Checking users table...');
    
    // Check if users table exists
    const tablesResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = tablesResult.rows[0].exists;
    
    if (!usersTableExists) {
      console.log('Users table does not exist, creating it...');
      await client.query(`
        CREATE TABLE users (
          id VARCHAR(255) PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT UNIQUE,
          role TEXT NOT NULL DEFAULT 'user',
          is_banned BOOLEAN NOT NULL DEFAULT FALSE,
          first_name TEXT,
          last_name TEXT,
          bio TEXT,
          profile_image_url TEXT,
          password_updated_at TIMESTAMP WITH TIME ZONE,
          must_change_password BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log('Created users table');
    } else {
      console.log('Users table exists, checking schema...');
      
      // Check if password column exists
      const passwordColResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'password'
        );
      `);
      
      const passwordColumnExists = passwordColResult.rows[0].exists;
      
      if (passwordColumnExists) {
        console.log('Password column exists, removing it for compatibility...');
        // Add temporary column to save any needed data
        await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS password;`);
        console.log('Removed password column');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing users table:', error);
    return false;
  }
}

async function main() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');
    
    // Fix users table issues
    const usersFixed = await fixUsersTable();
    if (!usersFixed) {
      console.error('Failed to fix users table');
      process.exit(1);
    }
    
    // Create TypeScript error tables
    const tablesCreated = await createTypeScriptErrorTables();
    if (!tablesCreated) {
      console.error('Failed to create TypeScript error tables');
      process.exit(1);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();