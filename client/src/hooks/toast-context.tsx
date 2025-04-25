import React, { createContext, useContext } from 'react';
import { useToast, Toast, ToastVariant } from './use-toast';
import { ToastContainer } from '@/components/ui/toast';

type ToastContextType = {
  toasts: Toast[];
  toast: (options: { title?: string; description?: string; variant?: 'default' | 'destructive' | 'success'; duration?: number }) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast, dismiss, toasts } = useToast();

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export { ToastContext };