/**
 * admin.ts
 * 
 * Contains centralized type definitions for the admin features
 * and components.
 */

/**
 * Represents a formatting action used in text editors
 */
export interface FormatAction {
  type: string;
  value?: string | boolean | number;
}

/**
 * Props for the EditMenu components
 */
export interface EditMenuProps {
  contentId: string | number;
  position?: "top" | "bottom" | "left" | "right";
  isOpen: boolean;
  onClose: () => void;
  onFormatApply?: (format: FormatAction) => void;
}

/**
 * Props for the EditButton component
 */
export interface EditButtonProps {
  contentId: string | number;
  onEdit?: (contentId: string | number) => void;
  className?: string;
  variant?: string;
  size?: string;
  text?: string;
  iconOnly?: boolean;
  showFormatMenu?: boolean;
  menuPosition?: "top" | "bottom" | "left" | "right";
  onFormatApply?: (format: FormatAction) => void;
}