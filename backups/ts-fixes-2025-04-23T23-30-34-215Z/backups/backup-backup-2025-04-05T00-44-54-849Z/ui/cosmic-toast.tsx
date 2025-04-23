/**
 * cosmic-toast.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useEffect, useState, FC } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the toast position variants
const positionVariants = cva(
  'fixed z-50 flex items-center justify-between transition-all duration-300 ease-in-out',
  {
    variants: {
      position: {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      },
    },
    defaultVariants: {
      position: 'top-right',
    },
  }
);

// Define the toast variants for the container
const toastVariants = cva(
  'max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'bg-gray-800/80 border-gray-700',
        success: 'bg-green-900/80 border-green-700',
        warning: 'bg-amber-900/80 border-amber-700',
        error: 'bg-red-900/80 border-red-700',
        info: 'bg-blue-900/80 border-blue-700',
        cosmic: 'bg-cosmic-900/80 border-cosmic-700 shadow-cosmic shadow-cosmic-primary/30',
      },
      animation: {
        none: '',
        fade: 'animate-fadeIn',
        slide: 'animate-slideInRight',
        bounce: 'animate-bounce',
        glow: 'animate-pulse shadow-glow shadow-cosmic-primary/40',
      },
    },
    defaultVariants: {
      variant: 'default',
      animation: 'fade',
    },
  }
);

// The ToastIcon component is used to display the appropriate icon based on the toast type
const ToastIcon: FC<{ variant: string }> = ({ variant }) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-400" />;
    case 'cosmic':
      return (
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-spin blur-sm opacity-70"></div>
          <Info className="relative w-5 h-5 text-white" />
        </div>
      );
    default:
      return <Info className="w-5 h-5 text-gray-400" />;
  }
};

export type CosmicToastProps = {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  message: string;
  duration?: number; // in milliseconds
  showProgress?: boolean;
  showIcon?: boolean;
  className?: string;
} & VariantProps<typeof toastVariants> & VariantProps<typeof positionVariants>;

export const CosmicToast: FC<CosmicToastProps> = ({
  open = true,
  onClose,
  title,
  message,
  duration = 5000,
  variant = 'default',
  position = 'top-right',
  animation = 'fade',
  showProgress = true,
  showIcon = true,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(open);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setIsVisible(open);
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);

      // Handle progress bar
      if (showProgress) {
        const interval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev - (100 / (duration / 100));
            return newProgress < 0 ? 0 : newProgress;
          });
        }, 100);

        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      }

      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose, showProgress]);

  if (!isVisible) return null;

  return (
    <div className={positionVariants({ position })}>
      <div
        className={cn(
          toastVariants({ variant, animation }),
          'w-full min-w-[300px]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {showIcon && variant && (
            <div className="flex-shrink-0 pt-0.5">
              <ToastIcon variant={variant as string} />
            </div>
          )}
          
          <div className="flex-1">
            {title && (
              <h3 className="font-medium text-white">
                {title}
              </h3>
            )}
            <p className={cn("text-sm", title ? "text-gray-300 mt-1" : "text-white")}>
              {message}
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {showProgress && progress > 0 && (
          <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
            <div
              className={cn(
                "h-1 rounded-full",
                variant === 'success' ? 'bg-green-500' :
                variant === 'warning' ? 'bg-amber-500' :
                variant === 'error' ? 'bg-red-500' :
                variant === 'info' ? 'bg-blue-500' :
                variant === 'cosmic' ? 'bg-gradient-to-r from-purple-500 to-blue-500' :
                'bg-gray-400'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Manager Component
interface ToastManagerProps {
  autoClose?: boolean;
  position?: VariantProps<typeof positionVariants>['position'];
}

interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: VariantProps<typeof toastVariants>['variant'];
  animation?: VariantProps<typeof toastVariants>['animation'];
  duration?: number;
}

// This will track our toasts globally
let toasts: Toast[] = [];
let listeners: Function[] = [];

// Helper for generating unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Add a new toast
export const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = generateId();
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  listeners.forEach(listener => listener(toasts));
  return id;
};

// Remove a toast by ID
export const removeToast = (id: string) => {
  toasts = toasts.filter(toast => toast.id !== id);
  listeners.forEach(listener => listener(toasts));
};

// Clear all toasts
export const clearToasts = () => {
  toasts = [];
  listeners.forEach(listener => listener(toasts));
};

// Toast Manager Context
export const ToastManager: FC<ToastManagerProps> = ({ 
  autoClose = true,
  position = 'top-right'
}) => {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    // Subscribe to toast updates
    const onToastsChange = (updatedToasts: Toast[]) => {
      setCurrentToasts([...updatedToasts]);
    };
    
    listeners.push(onToastsChange);
    
    return () => {
      listeners = listeners.filter(listener => listener !== onToastsChange);
    };
  }, []);

  return (
    <>
      {currentToasts.map(toast => (
        <CosmicToast
          key={toast.id}
          open={true}
          position={position}
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          animation={toast.animation}
          duration={toast.duration || (autoClose ? 5000 : 0)}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

// Utility functions for specific toast types
export const showSuccessToast = (message: string, title?: string, duration = 5000) => 
  addToast({ message, title, variant: 'success', duration });

export const showErrorToast = (message: string, title?: string, duration = 5000) => 
  addToast({ message, title, variant: 'error', duration });

export const showWarningToast = (message: string, title?: string, duration = 5000) => 
  addToast({ message, title, variant: 'warning', duration });

export const showInfoToast = (message: string, title?: string, duration = 5000) => 
  addToast({ message, title, variant: 'info', duration });

export const showCosmicToast = (message: string, title?: string, duration = 5000) => 
  addToast({ message, title, variant: 'cosmic', animation: 'glow', duration });