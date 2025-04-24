/**
 * cosmic-modal.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { X } from 'lucide-react';

const modalOverlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
  {
    variants: {
      overlay: {
        dark: 'bg-black/70',
        blur: 'bg-black/50 backdrop-blur-sm',
        cosmic: 'bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-sm',
        nebula: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cosmic-primary/20 via-gray-900/40 to-black/70 backdrop-blur-sm'
      },
      animation: {
        fade: 'opacity-0 data-[state=open]:opacity-100',
        zoom: 'opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100',
        slide: 'opacity-0 translate-y-4 data-[state=open]:opacity-100 data-[state=open]:translate-y-0'
      }
    },
    defaultVariants: {
      overlay: 'blur',
      animation: 'fade'
    }
  }
);

const modalContainerVariants = cva(
  'relative z-50 max-h-[85vh] overflow-auto transition-all duration-300 focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 border border-gray-700 text-white',
        cosmic: 'bg-gray-900 border border-cosmic-primary text-white',
        glow: 'bg-gray-900 border border-cosmic-highlight text-white shadow-glow',
        frosted: 'bg-gray-900/90 backdrop-blur-md border border-white/20 text-white',
        nebula: 'bg-gradient-to-br from-gray-900 to-gray-950 border border-cosmic-accent/30 text-white'
      },
      size: {
        xs: 'w-full max-w-xs',
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-xl',
        '2xl': 'w-full max-w-2xl',
        full: 'w-[95vw] h-[85vh]'
      },
      position: {
        center: 'mx-auto',
        top: 'mx-auto mt-16',
        bottom: 'mx-auto mb-16'
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      position: 'center',
      rounded: 'lg'
    }
  }
);

export interface CosmicModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalContainerVariants>,
    VariantProps<typeof modalOverlayVariants> {
  isOpen: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
}

const CosmicModal: React.FC<CosmicModalProps> = ({
  className,
  variant,
  size,
  position,
  rounded,
  overlay,
  animation,
  isOpen,
  onClose,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
  ...props
}) => {
  const [modalState, setModalState] = useState<'open' | 'closed'>('closed');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle animation states
    if (isOpen) {
      setModalState('open');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      setModalState('closed');
      document.body.style.overflow = ''; // Restore scrolling
    }

    // Handle escape key press
    const handleEscKey = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen && closeOnEsc) {
      window.addEventListener('keydown', handleEscKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Handle clicks outside the modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen && modalState === 'closed') {
    return null;
  }

  return (
    <div
      className={cn(modalOverlayVariants({ overlay, animation }))}
      data-state={modalState}
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={cn(modalContainerVariants({ variant, size, position, rounded }), className)}
        data-state={modalState}
        {...props}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-cosmic-primary transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

export default CosmicModal;