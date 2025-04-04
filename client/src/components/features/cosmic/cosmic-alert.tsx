/**
 * cosmic-alert.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface CosmicAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'cosmic';
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const CosmicAlert: React.FC<CosmicAlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  className,
  dismissible = false,
  onDismiss,
}) => {
  // Base alert styles
  const baseStyles = 'relative p-4 rounded-lg backdrop-blur-sm border';
  
  // Variant styles
  const variantStyles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    cosmic: 'bg-cosmic-primary/10 border-cosmic-primary/30 text-cosmic-primary'
  };
  
  // Title styles
  const titleStyles = 'font-orbitron font-medium text-base mb-1';
  
  // Content styles
  const contentStyles = 'text-sm opacity-90';
  
  // Compose the final className
  const alertClassName = cn(
    baseStyles,
    variantStyles[variant],
    'cosmic-animate',
    className
  );
  
  // Effect to add 'in' class after mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const element = document.getElementById(`cosmic-alert-${title?.replace(/\s+/g, '-').toLowerCase() || 'alert'}`);
      if (element) {
        element.classList.add('in');
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, [title]);
  
  return (
    <div 
      id={`cosmic-alert-${title?.replace(/\s+/g, '-').toLowerCase() || 'alert'}`}
      className={alertClassName}
      role="alert"
    >
      {dismissible && (
        <button
          type="button"
          className="absolute top-2 right-2 p-1 rounded-full opacity-70 hover:opacity-100"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
      
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0 mr-3">
            {icon}
          </div>
        )}
        
        <div className="flex-1">
          {title && <div className={titleStyles}>{title}</div>}
          <div className={contentStyles}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default CosmicAlert;