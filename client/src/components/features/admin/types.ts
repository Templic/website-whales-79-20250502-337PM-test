/**
 * Admin feature type definitions
 * 
 * This file contains common types used across admin components.
 */

/**
 * FormatAction represents a formatting action that can be applied to content
 */
export interface FormatAction {
  type: string;
  value?: string | boolean | number;
}

/**
 * EditorSaveData represents the data returned when saving content
 */
export interface EditorSaveData {
  text?: string;
  html?: string;
  imageUrl?: string;
  imageFile?: File;
  meta?: Record<string, unknown>;
}