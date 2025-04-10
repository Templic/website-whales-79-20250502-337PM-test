/**
 * EditButton.tsx
 * 
 * Component Type: feature/admin
 * A button component that allows administrators to initiate content editing.
 * This button is only visible to users with 'admin' or 'super_admin' roles.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import "./admin.css";

interface EditButtonProps {
  contentId: string | number;
  onEdit?: (contentId: string | number) => void;
  className?: string;
  variant?: string;
  size?: string;
  text?: string;
  iconOnly?: boolean;
}

/**
 * EditButton component for admin editing functionality
 */
export const EditButton: React.FC<EditButtonProps> = ({
  contentId,
  onEdit,
  className = "",
  variant = "ghost",
  size = "sm",
  text = "Edit",
  iconOnly = true,
}) => {
  // Check if user is authenticated and has admin/super_admin role
  const { user } = useAuth();
  
  // Only render for admin users
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }
  
  // Handle click event
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onEdit) {
      onEdit(contentId);
    }
  };
  
  return (
    <Button
      variant={variant as any}
      size={size as any}
      className={className}
      onClick={handleClick}
    >
      <Edit className={`h-4 w-4 ${!iconOnly ? "mr-2" : ""}`} />
      {!iconOnly && <span>{text}</span>}
    </Button>
  );
};

export default EditButton;