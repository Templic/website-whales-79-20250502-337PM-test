/**
 * NewEditMenu.tsx
 * 
 * Component Type: feature/admin
 * A simplified version of the EditMenu component with integrated types.
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Heading1, 
  Link, 
  Type, 
  Palette, 
  Undo, 
  Redo 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./admin.css";

// Define FormatAction directly in this component to avoid import issues
interface FormatAction {
  type: string;
  value?: string | boolean | number;
}

interface EditMenuProps {
  contentId: string | number;
  position?: "top" | "bottom" | "left" | "right";
  isOpen: boolean;
  onClose: () => void;
  onFormatApply?: (format: FormatAction) => void;
}

/**
 * EditMenu component
 */
const NewEditMenu: React.FC<EditMenuProps> = ({
  contentId,
  position = "top",
  isOpen,
  onClose,
  onFormatApply
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle format button click
  const handleFormatClick = (formatType: string, value?: string | boolean | number) => {
    const format: FormatAction = { type: formatType };
    if (value !== undefined) {
      format.value = value;
    }
    
    // Update active formats
    setActiveFormats(prev => ({
      ...prev,
      [formatType]: value !== undefined ? value : !prev[formatType]
    }));
    
    // Notify parent component
    if (onFormatApply) {
      onFormatApply(format);
    }
  };
  
  // Get position classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full mb-2";
      case "bottom":
        return "top-full mt-2";
      case "left":
        return "right-full mr-2";
      case "right":
        return "left-full ml-2";
      default:
        return "bottom-full mb-2";
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      ref={menuRef}
      className={`absolute z-50 bg-[#0a0a0a] border rounded-md p-1 shadow-lg ${getPositionClasses()}`}
    >
      <div className="flex flex-wrap items-center gap-1 edit-menu">
        <TooltipProvider>
          {/* Text Style Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.bold ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("bold")}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.italic ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("italic")}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.underline ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("underline")}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Text Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.align === "left" ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("align", "left")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.align === "center" ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("align", "center")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.align === "right" ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("align", "right")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.list === "unordered" ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("list", "unordered")}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.list === "ordered" ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("list", "ordered")}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Headers */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeFormats.heading ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8"
              >
                <Heading1 className="h-4 w-4 mr-1" />
                {activeFormats.heading ? `H${activeFormats.heading}` : "Heading"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <DropdownMenuItem 
                  key={level}
                  onClick={() => handleFormatClick("heading", level)}
                >
                  H{level}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFormats.link ? "default" : "ghost"}
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("link")}
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Link</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Font Size */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-8"
              >
                <Type className="h-4 w-4 mr-1" />
                Size
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-col gap-1">
                {["xs", "sm", "md", "lg", "xl", "2xl"].map((size) => (
                  <Button
                    key={size}
                    variant={activeFormats.fontSize === size ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleFormatClick("fontSize", size)}
                  >
                    {size.toUpperCase()}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-8 w-8"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-4 gap-1">
                {[
                  "default", "primary", "secondary", "accent", 
                  "info", "success", "warning", "danger",
                ].map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="sm"
                    className={`h-6 w-6 rounded-full border-2 bg-${color}`}
                    onClick={() => handleFormatClick("color", color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("undo")}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 h-8 w-8"
                onClick={() => handleFormatClick("redo")}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default NewEditMenu;