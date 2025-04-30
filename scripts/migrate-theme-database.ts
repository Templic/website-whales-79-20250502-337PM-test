/**
 * Theme Database Migration Script
 * 
 * This script creates the database schema for the theme system.
 * Run with: npm run db:migrate:theme
 */

import { db } from '../shared/theme/db';
import * as schema from '../shared/theme/schema';
import { baseTokens } from '../shared/theme/tokens';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting theme database migration...');
  
  try {
    // Create schema using drizzle-kit introspection
    // This is normally done with drizzle-kit, but we're doing it manually here
    
    // Create themes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS themes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        user_id INTEGER,
        base_theme TEXT,
        preview_image_url TEXT,
        tags TEXT[],
        total_downloads INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
    console.log('Created themes table');
    
    // Create theme_versions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS theme_versions (
        id SERIAL PRIMARY KEY,
        theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        version TEXT NOT NULL,
        tokens JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        change_notes TEXT,
        published_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    console.log('Created theme_versions table');
    
    // Create user_theme_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_theme_preferences (
        user_id INTEGER NOT NULL PRIMARY KEY,
        theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
        theme_mode TEXT NOT NULL DEFAULT 'light',
        theme_contrast TEXT NOT NULL DEFAULT 'default',
        theme_motion TEXT NOT NULL DEFAULT 'normal',
        custom_settings JSONB,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created user_theme_preferences table');
    
    // Create shared_themes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS shared_themes (
        id SERIAL PRIMARY KEY,
        theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        shared_by INTEGER NOT NULL,
        shared_with INTEGER,
        shared_email TEXT,
        share_code UUID NOT NULL DEFAULT gen_random_uuid(),
        access_level TEXT NOT NULL DEFAULT 'view',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP,
        last_accessed TIMESTAMP,
        is_revoked BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
    console.log('Created shared_themes table');
    
    // Create theme_analytics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS theme_analytics (
        id SERIAL PRIMARY KEY,
        theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        views INTEGER NOT NULL DEFAULT 0,
        downloads INTEGER NOT NULL DEFAULT 0,
        favorites INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created theme_analytics table');
    
    // Create theme_feedback table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS theme_feedback (
        id SERIAL PRIMARY KEY,
        theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
        user_id INTEGER,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        helpful_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    console.log('Created theme_feedback table');
    
    // Create theme_templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS theme_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        tokens JSONB NOT NULL,
        category TEXT,
        tags TEXT[],
        preview_image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_public BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
    console.log('Created theme_templates table');
    
    // Create default templates
    await createDefaultTemplates();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Create default theme templates
 */
async function createDefaultTemplates() {
  console.log('Creating default theme templates...');
  
  // Check if templates already exist
  const existingTemplates = await db.select({
    count: db.fn.count(),
  })
  .from(schema.themeTemplates);
  
  if (parseInt(existingTemplates[0].count.toString()) > 0) {
    console.log('Templates already exist, skipping default templates creation');
    return;
  }
  
  // Define default templates
  const defaultTemplates = [
    {
      name: 'Default Light',
      description: 'The default light theme',
      tokens: baseTokens,
      category: 'base',
      tags: ['light', 'default'],
      isPublic: true,
    },
    {
      name: 'Default Dark',
      description: 'The default dark theme',
      tokens: {
        ...baseTokens,
        colors: {
          ...baseTokens.colors,
          background: '#1A1A1A',
          foreground: '#F3F3F3',
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          muted: '#374151',
          'muted-foreground': '#9CA3AF',
          border: '#2D2D2D',
          'primary-foreground': '#FFFFFF',
          'secondary-foreground': '#FFFFFF',
        },
        shadows: {
          ...baseTokens.shadows,
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.6)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        },
      },
      category: 'base',
      tags: ['dark', 'default'],
      isPublic: true,
    },
    {
      name: 'Blue Ocean',
      description: 'A calming blue theme inspired by the ocean',
      tokens: {
        ...baseTokens,
        colors: {
          ...baseTokens.colors,
          primary: '#2563EB',
          secondary: '#0EA5E9',
          accent: '#06B6D4',
          background: '#F0F9FF',
          foreground: '#1E3A8A',
          muted: '#BFDBFE',
          'muted-foreground': '#1E40AF',
          border: '#93C5FD',
        },
      },
      category: 'nature',
      tags: ['blue', 'ocean', 'calm'],
      isPublic: true,
    },
    {
      name: 'Forest Green',
      description: 'A refreshing green theme inspired by forests',
      tokens: {
        ...baseTokens,
        colors: {
          ...baseTokens.colors,
          primary: '#059669',
          secondary: '#10B981',
          accent: '#34D399',
          background: '#ECFDF5',
          foreground: '#064E3B',
          muted: '#A7F3D0',
          'muted-foreground': '#065F46',
          border: '#6EE7B7',
        },
      },
      category: 'nature',
      tags: ['green', 'forest', 'natural'],
      isPublic: true,
    },
    {
      name: 'Sunset Orange',
      description: 'A warm theme inspired by sunset colors',
      tokens: {
        ...baseTokens,
        colors: {
          ...baseTokens.colors,
          primary: '#F97316',
          secondary: '#FB923C',
          accent: '#FDBA74',
          background: '#FFF7ED',
          foreground: '#7C2D12',
          muted: '#FED7AA',
          'muted-foreground': '#9A3412',
          border: '#FFEDD5',
        },
      },
      category: 'nature',
      tags: ['orange', 'sunset', 'warm'],
      isPublic: true,
    },
    {
      name: 'Corporate Blue',
      description: 'A professional blue theme for business applications',
      tokens: {
        ...baseTokens,
        colors: {
          ...baseTokens.colors,
          primary: '#1E40AF',
          secondary: '#3B82F6',
          accent: '#60A5FA',
          background: '#F8FAFC',
          foreground: '#0F172A',
          muted: '#E2E8F0',
          'muted-foreground': '#334155',
          border: '#CBD5E1',
        },
        borderRadius: {
          ...baseTokens.borderRadius,
          DEFAULT: '0.25rem',
          lg: '0.5rem',
          xl: '0.75rem',
        },
      },
      category: 'business',
      tags: ['corporate', 'professional', 'business'],
      isPublic: true,
    },
    {
      name: 'High Contrast',
      description: 'A high contrast theme for accessibility',
      tokens: {
        ...baseTokens,
        colors: {
          ...baseTokens.colors,
          primary: '#0000EE',
          secondary: '#6600CC',
          accent: '#00AA00',
          background: '#FFFFFF',
          foreground: '#000000',
          muted: '#EEEEEE',
          'muted-foreground': '#333333',
          border: '#666666',
          success: '#008000',
          warning: '#FF8C00',
          error: '#FF0000',
          info: '#0000FF',
        },
      },
      category: 'accessibility',
      tags: ['high-contrast', 'accessible', 'a11y'],
      isPublic: true,
    },
  ];
  
  // Insert default templates
  for (const template of defaultTemplates) {
    await db.insert(schema.themeTemplates).values({
      name: template.name,
      description: template.description,
      tokens: template.tokens as any,
      category: template.category,
      tags: template.tags,
      isPublic: template.isPublic,
    });
  }
  
  console.log(`Created ${defaultTemplates.length} default templates`);
}

// Run migration
migrate().catch(console.error);