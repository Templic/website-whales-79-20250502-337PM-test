import React, { useRef, useEffect } from 'react';

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

export function ScrollArea({ className = "", children }: ScrollAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Add classNames for styling
  const scrollAreaClasses = `overflow-auto ${className}`;
  
  // Custom scrollbar styles are applied via CSS in the global stylesheet
  
  return (
    <div ref={scrollAreaRef} className={scrollAreaClasses}>
      {children}
    </div>
  );
}