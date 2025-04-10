/**
 * EditButton.tsx
 * 
 * Component Type: feature/admin
 * A button component that allows administrators to initiate content editing.
 * This button is only visible to users with 'admin' or 'super_admin' roles.
 */

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Edit, PenTool } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import EditMenu from "./NewEditMenu";
import { FormatAction, EditButtonProps } from "@/types/admin";
import "./admin.css";

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
  showFormatMenu = false,
  menuPosition = "top",
  onFormatApply,
}) => {
  // Check if user is authenticated and has admin/super_admin role
  const { user } = useAuth();
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Only render for admin users
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }
  
  // Handle click event
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showFormatMenu) {
      setFormatMenuOpen(prev => !prev);
    } else if (onEdit) {
      onEdit(contentId);
    }
  };
  
  // Handle format application
  const handleFormatApply = (format: FormatAction) => {
    if (onFormatApply) {
      onFormatApply(format);
    }
  };
  
  // Close format menu
  const closeFormatMenu = () => {
    setFormatMenuOpen(false);
  };
  
  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        variant={variant as any}
        size={size as any}
        className={className}
        onClick={handleClick}
      >
        {showFormatMenu ? (
          <PenTool className={`h-4 w-4 ${!iconOnly ? "mr-2" : ""}`} />
        ) : (
          <Edit className={`h-4 w-4 ${!iconOnly ? "mr-2" : ""}`} />
        )}
        {!iconOnly && <span>{text}</span>}
      </Button>
      
      {showFormatMenu && formatMenuOpen && (
        <EditMenu
          contentId={contentId}
          position={menuPosition}
          isOpen={formatMenuOpen}
          onClose={closeFormatMenu}
          onFormatApply={handleFormatApply}
        />
      )}
    </div>
  );
};

export default EditButton;