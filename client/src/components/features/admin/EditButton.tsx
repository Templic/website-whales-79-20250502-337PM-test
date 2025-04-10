/**
 * EditButton.tsx
 * 
 * Component Type: feature/admin
 * A reusable edit button component that renders only for users with admin or super_admin roles.
 * This button is designed to be placed near text and image elements throughout the site.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Pencil } from "lucide-react";

export interface EditButtonProps {
  /**
   * The unique identifier for the content to be edited
   */
  contentId: string | number;
  
  /**
   * Function to call when the edit button is clicked
   */
  onEdit?: (contentId: string | number) => void;
  
  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;
  
  /**
   * Optional variant for the button styling
   * @default "ghost"
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | 
            "cosmic" | "energetic" | "ethereal" | "sunbeam" | "stardust" | "nebula" | "nova";
  
  /**
   * Optional size for the button
   * @default "sm"
   */
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  
  /**
   * Text to display alongside or instead of the icon
   */
  text?: string;
  
  /**
   * Whether to show only the icon (no text)
   * @default true
   */
  iconOnly?: boolean;
}

/**
 * EditButton component that renders only for admin and super_admin users
 */
export const EditButton = ({
  contentId,
  onEdit,
  className = "",
  variant = "ghost",
  size = "sm",
  text = "Edit",
  iconOnly = true
}: EditButtonProps) => {
  const { user } = useAuth();
  
  // Don't render the button if user is not admin or super_admin
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }
  
  // Default edit handler if none provided
  const handleEdit = () => {
    if (onEdit) {
      onEdit(contentId);
    } else {
      // Default behavior - could be replaced with a modal or navigation
      console.log(`Edit content with ID: ${contentId}`);
    }
  };
  
  return (
    <Button
      onClick={handleEdit}
      className={`edit-button ${className}`}
      variant={variant}
      size={size}
      aria-label={`Edit ${contentId}`}
    >
      <Pencil className={iconOnly ? "h-4 w-4" : "h-4 w-4 mr-2"} />
      {!iconOnly && text}
    </Button>
  );
};

export default EditButton;