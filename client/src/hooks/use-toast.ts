// Simple toast implementation for auth notifications
// This is a minimal implementation to avoid full shadcn dependencies

import React, { useState } from 'react';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Create a singleton toast service for direct imports
let toastSingleton: ReturnType<typeof createToastService>;

// Factory function to create the toast service
function createToastService() {
  // State will be maintained in this closure
  let toasts: Toast[] = [];
  let listeners: Function[] = [];

  const notifyListeners = () => {
    listeners.forEach(listener => listener(toasts));
  };

  return {
    addListener(listener: Function) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    },
    getToasts() {
      return [...toasts];
    },
    toast(options: ToastOptions) {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant || 'default',
        duration: options.duration || 5000,
      };

      toasts = [...toasts, newToast];
      notifyListeners();

      // Auto dismiss after duration
      setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id);
        notifyListeners();
      }, newToast.duration);

      return id;
    },
    dismiss(id: string) {
      toasts = toasts.filter(t => t.id !== id);
      notifyListeners();
    }
  };
}

// Initialize the singleton if it doesn't exist
if (!toastSingleton) {
  toastSingleton = createToastService();
}

// Export the direct toast function for use in components
export const toast = (options: ToastOptions) => toastSingleton.toast(options);

// Hook for components that need to display toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>(toastSingleton.getToasts());

  // Subscribe to toast changes
  React.useEffect(() => {
    const cleanup = toastSingleton.addListener((updatedToasts: Toast[]) => {
      setToasts([...updatedToasts]);
    });
    return cleanup;
  }, []);

  return {
    toast: toastSingleton.toast,
    dismiss: toastSingleton.dismiss,
    toasts,
  };
};