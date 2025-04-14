import { useState } from 'react';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'destructive';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
  visible: boolean;
}

type ToastFunction = (props: ToastProps) => void;

interface UseToastReturn {
  toasts: Toast[];
  toast: ToastFunction;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast: ToastFunction = ({ 
    title, 
    description, 
    variant = 'default', 
    duration = 3000 
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
      visible: true,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => 
        prev.map(t => {
          if (t.id === id) {
            return { ...t, visible: false };
          }
          return t;
        })
      );
      
      // Remove from state after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300); // Animation duration
      
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => 
      prev.map(t => {
        if (t.id === id) {
          return { ...t, visible: false };
        }
        return t;
      })
    );
    
    // Remove from state after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // Animation duration
  };

  return {
    toasts,
    toast,
    removeToast,
  };
}