// A simple toast UI component, lightweight version of shadcn/ui toast

import * as React from 'react';
import type { Toast, ToastVariant } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export function ToastComponent({ toast, onDismiss }: ToastProps) {
  const getVariantStyle = (variant: ToastVariant = 'default') => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 text-white';
      case 'success':
        return 'bg-green-600 text-white';
      case 'default':
      default:
        return 'bg-slate-800 text-white';
    }
  };

  return (
    <div
      className={`${getVariantStyle(toast.variant)} rounded-md p-4 shadow-lg max-w-md transition-all`}
      data-state={'open'}
      role="alert"
    >
      <div className="flex justify-between">
        {toast.title && <div className="font-semibold">{toast.title}</div>}
        <button
          className="ml-4 opacity-70 hover:opacity-100"
          onClick={() => onDismiss(toast.id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {toast.description && <div className="mt-1">{toast.description}</div>}
    </div>
  );
}

export function ToastContainer({ 
  toasts, 
  onDismiss 
}: { 
  toasts: Toast[]; 
  onDismiss: (id: string) => void 
}) {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}