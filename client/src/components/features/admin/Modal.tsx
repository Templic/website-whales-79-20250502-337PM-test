/**
 * Modal.tsx
 * 
 * Component Type: feature/admin
 * A reusable modal component for admin interfaces.
 */

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Modal component
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  onClose,
  children,
  size = "md"
}) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    
    // Prevent scrolling on the body while modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "visible";
    };
  }, [onClose]);
  
  // Determine modal size
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "max-w-md";
      case "md":
        return "max-w-2xl";
      case "lg":
        return "max-w-4xl";
      case "xl":
        return "max-w-6xl";
      case "full":
        return "max-w-full mx-4";
      default:
        return "max-w-2xl";
    }
  };
  
  // Stop propagation of clicks inside the modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative bg-[#0a0a0a] rounded-lg shadow-lg w-full ${getSizeClass()} overflow-hidden`}
        onClick={handleContentClick}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#00ebd6]/20">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            className="p-1 rounded-full hover:bg-[#112233] transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;