/**
 * Modal.tsx
 * 
 * Component Type: feature/admin
 * A simple modal component for editing content.
 */

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ title, onClose, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Close modal with Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="w-full max-w-md rounded-lg bg-gradient-to-b from-[#030110] to-[#0c0235] border border-[#00ebd6]/20 shadow-[0_0_15px_rgba(0,235,214,0.2)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#00ebd6]/20">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="icon" 
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;