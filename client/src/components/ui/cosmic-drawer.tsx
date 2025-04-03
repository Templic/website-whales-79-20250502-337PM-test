import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface CosmicDrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  backdrop?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  title?: string;
}

const CosmicDrawer: React.FC<CosmicDrawerProps> = ({
  children,
  isOpen,
  onClose,
  position = 'right',
  size = 'md',
  className,
  backdrop = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  title,
}) => {
  const [mounted, setMounted] = useState(false);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (isOpen && closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeOnEsc, onClose]);
  
  // Handle portal mounting
  useEffect(() => {
    setMounted(true);
    
    // Prevent body scroll when drawer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Size classes
  const sizeClasses = {
    left: {
      sm: 'w-64',
      md: 'w-80',
      lg: 'w-96',
      xl: 'w-1/3',
      full: 'w-full',
    },
    right: {
      sm: 'w-64',
      md: 'w-80',
      lg: 'w-96',
      xl: 'w-1/3',
      full: 'w-full',
    },
    top: {
      sm: 'h-1/4',
      md: 'h-1/3',
      lg: 'h-1/2',
      xl: 'h-2/3',
      full: 'h-full',
    },
    bottom: {
      sm: 'h-1/4',
      md: 'h-1/3',
      lg: 'h-1/2',
      xl: 'h-2/3',
      full: 'h-full',
    },
  };
  
  // Position transform classes
  const transformClasses = {
    left: {
      base: 'fixed top-0 left-0 h-full transform -translate-x-full',
      open: 'translate-x-0',
    },
    right: {
      base: 'fixed top-0 right-0 h-full transform translate-x-full',
      open: 'translate-x-0',
    },
    top: {
      base: 'fixed top-0 left-0 w-full transform -translate-y-full',
      open: 'translate-y-0',
    },
    bottom: {
      base: 'fixed bottom-0 left-0 w-full transform translate-y-full',
      open: 'translate-y-0',
    },
  };
  
  // Content styles
  const drawerClasses = cn(
    'cosmic-glass z-50 transition-transform duration-300 ease-in-out',
    transformClasses[position].base,
    isOpen ? transformClasses[position].open : '',
    sizeClasses[position][size],
    'flex flex-col',
    className
  );
  
  if (!mounted) {
    return null;
  }
  
  return createPortal(
    <>
      {/* Backdrop */}
      {backdrop && isOpen && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeOnBackdropClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}
      
      {/* Drawer */}
      <div className={drawerClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {title && (
            <h2 className="text-lg font-orbitron text-cosmic-primary">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
};

export default CosmicDrawer;