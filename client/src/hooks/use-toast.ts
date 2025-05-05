/**
 * use-toast.ts
 * 
 * Toast notification hook for displaying message notifications across the app.
 */

import { useState } from 'react';

interface Toast {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Standalone toast function for direct imports
export const toast = (props: Toast) => {
  const id = Math.random().toString(36).substring(2, 9);
  
  // For now, just show a console message
  console.log(`Toast: ${props.title} - ${props.description || ''}`);
  
  // Simulate removal after duration
  setTimeout(() => {
    // This would remove the toast in a real implementation
  }, props.duration || 5000);
  
  return id;
};

export function useToast() {
  // In a real implementation, this would manage a queue of toasts
  // This is a simplified version for compatibility
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (props: Toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...props, id };
    
    // In a real implementation, this would add to state and trigger UI
    setToasts((prev) => [...prev, newToast]);
    
    // For now, just show a console message
    console.log(`Toast: ${props.title} - ${props.description || ''}`);
    
    // Simulate removal after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, props.duration || 5000);
    
    return id;
  };

  return {
    toast: showToast, // Named as toast in the return object for compatibility
    toasts,
    dismiss: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
  };
}

export default useToast;