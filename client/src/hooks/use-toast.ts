import { useState } from 'react';

type ToastType = 'default' | 'success' | 'destructive';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

interface UseToastReturn {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };
};