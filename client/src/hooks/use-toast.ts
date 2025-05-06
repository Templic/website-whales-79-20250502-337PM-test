/**
 * Toast hook for displaying notifications
 */

import { useState, useCallback } from 'react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
  toasts: Toast[];
}

// Simple toast implementation
export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts((prevToasts) => [...prevToasts, { id, title, description, variant, duration }]);

      if (duration !== Infinity) {
        setTimeout(() => {
          setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
        }, duration);
      }
      
      // Log to console for now since we haven't set up the UI
      console.log(`Toast [${variant}]: ${title}${description ? ` - ${description}` : ''}`);
      
      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}

export default useToast;