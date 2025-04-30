/**
 * Theme Database Schema
 * 
 * This module defines the database schema for persistent storage of themes.
 * It includes tables for themes, theme versions, user preferences, and shared themes.
 */

import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  jsonb,
  uuid,
  primaryKey,
  integer,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Themes table - stores basic theme information
export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  userId: integer('user_id'),
  baseTheme: text('base_theme'),
  previewImageUrl: text('preview_image_url'),
  tags: text('tags').array(),
  totalDownloads: integer('total_downloads').default(0),
  isFeatured: boolean('is_featured').default(false),
  isArchived: boolean('is_archived').default(false),
});

// Theme relations
export const themesRelations = relations(themes, ({ many }) => ({
  versions: many(themeVersions),
  shared: many(sharedThemes),
}));

// Theme versions table - stores versioned theme data
export const themeVersions = pgTable('theme_versions', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').notNull().references(() => themes.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  tokens: jsonb('tokens').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  changeNotes: text('change_notes'),
  publishedAt: timestamp('published_at'),
  isActive: boolean('is_active').default(true).notNull(),
});

// Theme versions relations
export const themeVersionsRelations = relations(themeVersions, ({ one }) => ({
  theme: one(themes, {
    fields: [themeVersions.themeId],
    references: [themes.id],
  }),
}));

// User theme preferences table - stores user-specific theme preferences
export const userThemePreferences = pgTable('user_theme_preferences', {
  userId: integer('user_id').notNull(),
  themeId: integer('theme_id').references(() => themes.id, { onDelete: 'set null' }),
  themeMode: text('theme_mode').default('light').notNull(),
  themeContrast: text('theme_contrast').default('default').notNull(),
  themeMotion: text('theme_motion').default('normal').notNull(),
  customSettings: jsonb('custom_settings'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  
  // Primary key on user ID (one preference set per user)
  primaryKey: primaryKey({ columns: [userThemePreferences.userId] }),
});

// User theme preferences relations
export const userThemePreferencesRelations = relations(userThemePreferences, ({ one }) => ({
  theme: one(themes, {
    fields: [userThemePreferences.themeId],
    references: [themes.id],
  }),
}));

// Shared themes table - for sharing themes between users
export const sharedThemes = pgTable('shared_themes', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').notNull().references(() => themes.id, { onDelete: 'cascade' }),
  sharedBy: integer('shared_by').notNull(),
  sharedWith: integer('shared_with'),
  sharedEmail: text('shared_email'),
  shareCode: uuid('share_code').defaultRandom().notNull(),
  accessLevel: text('access_level').default('view').notNull(), // view, edit, admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  lastAccessed: timestamp('last_accessed'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
});

// Shared themes relations
export const sharedThemesRelations = relations(sharedThemes, ({ one }) => ({
  theme: one(themes, {
    fields: [sharedThemes.themeId],
    references: [themes.id],
  }),
}));

// Theme analytics table - tracks theme usage and popularity
export const themeAnalytics = pgTable('theme_analytics', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').notNull().references(() => themes.id, { onDelete: 'cascade' }),
  views: integer('views').default(0),
  downloads: integer('downloads').default(0),
  favorites: integer('favorites').default(0),
  usageCount: integer('usage_count').default(0),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Theme analytics relations
export const themeAnalyticsRelations = relations(themeAnalytics, ({ one }) => ({
  theme: one(themes, {
    fields: [themeAnalytics.themeId],
    references: [themes.id],
  }),
}));

// Theme feedback table - stores user feedback on themes
export const themeFeedback = pgTable('theme_feedback', {
  id: serial('id').primaryKey(),
  themeId: integer('theme_id').notNull().references(() => themes.id, { onDelete: 'cascade' }),
  userId: integer('user_id'),
  rating: integer('rating'),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  helpfulCount: integer('helpful_count').default(0),
});

// Theme feedback relations
export const themeFeedbackRelations = relations(themeFeedback, ({ one }) => ({
  theme: one(themes, {
    fields: [themeFeedback.themeId],
    references: [themes.id],
  }),
}));

// Theme templates table - predefined theme templates
export const themeTemplates = pgTable('theme_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  tokens: jsonb('tokens').notNull(),
  category: text('category'),
  tags: text('tags').array(),
  previewImageUrl: text('preview_image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
});

// Insert schemas for validation with Zod
export const insertThemeSchema = createInsertSchema(themes, {
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  previewImageUrl: z.string().url().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, totalDownloads: true });

export const insertThemeVersionSchema = createInsertSchema(themeVersions, {
  tokens: z.record(z.any()),
  changeNotes: z.string().optional(),
}).omit({ id: true, createdAt: true, isActive: true });

export const insertUserThemePreferencesSchema = createInsertSchema(userThemePreferences, {
  themeMode: z.enum(['light', 'dark', 'system', 'blackout']),
  themeContrast: z.enum(['default', 'low', 'high', 'maximum']),
  themeMotion: z.enum(['normal', 'reduced', 'none']),
  customSettings: z.record(z.any()).optional(),
}).omit({ lastUpdated: true });

export const insertSharedThemeSchema = createInsertSchema(sharedThemes, {
  accessLevel: z.enum(['view', 'edit', 'admin']),
  sharedEmail: z.string().email().optional(),
  expiresAt: z.date().optional(),
}).omit({ id: true, createdAt: true, shareCode: true, lastAccessed: true, isRevoked: true });

export const insertThemeFeedbackSchema = createInsertSchema(themeFeedback, {
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  isPublic: z.boolean().default(true),
}).omit({ id: true, createdAt: true, helpfulCount: true });

// Types
export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;

export type ThemeVersion = typeof themeVersions.$inferSelect;
export type InsertThemeVersion = z.infer<typeof insertThemeVersionSchema>;

export type UserThemePreference = typeof userThemePreferences.$inferSelect;
export type InsertUserThemePreference = z.infer<typeof insertUserThemePreferencesSchema>;

export type SharedTheme = typeof sharedThemes.$inferSelect;
export type InsertSharedTheme = z.infer<typeof insertSharedThemeSchema>;

export type ThemeAnalytic = typeof themeAnalytics.$inferSelect;
export type ThemeFeedback = typeof themeFeedback.$inferSelect;
export type InsertThemeFeedback = z.infer<typeof insertThemeFeedbackSchema>;

export type ThemeTemplate = typeof themeTemplates.$inferSelect;