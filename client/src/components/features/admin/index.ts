/**
 * admin/index.ts
 * 
 * Export all admin-related components for easier importing.
 */

import { EditButton } from './EditButton';
import EditButtonDemo from './EditButtonDemo';
import AdminEditor from './AdminEditor';
import AdminEditorDemo from './AdminEditorDemo';
import NewEditMenu from './NewEditMenu';
import EditMenuDemo from './EditMenuDemo';
// Define the types directly here instead of importing
export interface FormatAction {
  type: string;
  value?: string | boolean | number;
}

export interface EditorSaveData {
  text?: string;
  html?: string;
  imageUrl?: string;
  imageFile?: File;
  meta?: Record<string, any>;
}

export {
  EditButton,
  EditButtonDemo,
  AdminEditor,
  AdminEditorDemo,
  NewEditMenu as EditMenu,
  EditMenuDemo
};