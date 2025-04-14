import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
  toast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const toast = (newToast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, ...newToast }]);
  };
  
  // Remove a toast after 5 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toasts]);
  
  // Get variant-specific styles
  const getVariantStyles = (variant: Toast['variant'] = 'default') => {
    switch (variant) {
      case 'success':
        return 'bg-green-800/80 border-green-500/50';
      case 'error':
        return 'bg-red-800/80 border-red-500/50';
      case 'warning':
        return 'bg-amber-800/80 border-amber-500/50';
      default:
        return 'bg-purple-900/80 border-purple-500/50';
    }
  };
  
  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full sm:w-auto max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className={`p-4 rounded-lg border backdrop-blur-sm shadow-lg ${getVariantStyles(toast.variant)}`}
            >
              <h3 className="font-medium">{toast.title}</h3>
              {toast.description && (
                <p className="text-sm opacity-80 mt-1">{toast.description}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}