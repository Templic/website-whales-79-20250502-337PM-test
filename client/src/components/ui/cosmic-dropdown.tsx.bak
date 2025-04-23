/**
 * cosmic-dropdown.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';
import CosmicButton from './cosmic-button';

const dropdownVariants = cva(
  'rounded-md shadow-lg absolute z-50 overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 border border-gray-700',
        cosmic: 'bg-gray-900/95 border border-cosmic-primary/50 backdrop-blur-sm',
        nebula: 'bg-gradient-to-b from-cosmic-primary/10 to-cosmic-accent/10 border border-white/10 backdrop-blur-md',
        minimal: 'bg-gray-800/90 backdrop-blur-sm'
      },
      size: {
        sm: 'min-w-[120px]',
        md: 'min-w-[160px]',
        lg: 'min-w-[200px]',
        xl: 'min-w-[240px]',
        full: 'w-full'
      },
      position: {
        'bottom-left': 'top-full left-0 mt-1',
        'bottom-right': 'top-full right-0 mt-1',
        'bottom-center': 'top-full left-1/2 -translate-x-1/2 mt-1',
        'top-left': 'bottom-full left-0 mb-1',
        'top-right': 'bottom-full right-0 mb-1',
        'top-center': 'bottom-full left-1/2 -translate-x-1/2 mb-1',
        'left-top': 'right-full top-0 mr-1',
        'left-bottom': 'right-full bottom-0 mr-1',
        'left-center': 'right-full top-1/2 -translate-y-1/2 mr-1',
        'right-top': 'left-full top-0 ml-1',
        'right-bottom': 'left-full bottom-0 ml-1',
        'right-center': 'left-full top-1/2 -translate-y-1/2 ml-1'
      },
      animation: {
        none: 'opacity-0 scale-95 group-data-[state=open]:opacity-100 group-data-[state=open]:scale-100',
        fade: 'opacity-0 group-data-[state=open]:opacity-100',
        zoom: 'opacity-0 scale-95 group-data-[state=open]:opacity-100 group-data-[state=open]:scale-100',
        slide: 'opacity-0 translate-y-2 group-data-[state=open]:opacity-100 group-data-[state=open]:translate-y-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      position: 'bottom-left',
      animation: 'zoom'
    }
  }
);

const dropdownItemVariants = cva(
  'flex items-center px-4 py-2 text-sm w-full text-left transition-colors duration-150 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'text-white hover:bg-gray-700',
        cosmic: 'text-white hover:bg-cosmic-primary/20',
        nebula: 'text-white hover:bg-white/10',
        minimal: 'text-white hover:bg-gray-700/50'
      },
      active: {
        true: '',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      active: false
    },
    compoundVariants: [
      {
        variant: 'default',
        active: true,
        className: 'bg-gray-700'
      },
      {
        variant: 'cosmic',
        active: true,
        className: 'bg-cosmic-primary/20 text-cosmic-primary'
      },
      {
        variant: 'nebula',
        active: true,
        className: 'bg-white/10 text-cosmic-highlight'
      },
      {
        variant: 'minimal',
        active: true,
        className: 'bg-gray-700/50 font-medium'
      }
    ]
  }
);

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export interface CosmicDropdownProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownVariants> {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  buttonVariant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'cosmic';
  buttonSize?: 'sm' | 'lg' | 'icon' | 'default';
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  showArrow?: boolean;
  closeOnSelect?: boolean;
  showDividers?: boolean;
  defaultOpen?: boolean;
}

const CosmicDropdown: React.FC<CosmicDropdownProps> = ({
  className,
  variant,
  size,
  position,
  animation,
  items,
  trigger,
  buttonVariant = 'default',
  buttonSize = 'default',
  buttonText,
  buttonIcon,
  showArrow = true,
  closeOnSelect = true,
  showDividers = false,
  defaultOpen = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    }
    
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div 
      className={cn('relative inline-block text-left group', isOpen && 'data-[state=open]')}
      ref={dropdownRef}
      {...props}
    >
      {trigger ? (
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <CosmicButton
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleToggle}
          className="flex items-center"
        >
          {buttonIcon && <span className="mr-2">{buttonIcon}</span>}
          {buttonText || 'Menu'}
          {showArrow && (
            <ChevronDown 
              className={cn(
                "ml-2 h-4 w-4 transition-transform duration-200",
                isOpen && "transform rotate-180"
              )} 
            />
          )}
        </CosmicButton>
      )}
      
      <div
        className={cn(
          dropdownVariants({ variant, size, position, animation }),
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
          className
        )}
      >
        <div className="py-1">
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.divider ? (
                <div className="h-px bg-gray-600/50 my-1" />
              ) : (
                <button
                  className={cn(
                    dropdownItemVariants({ variant, active: false }),
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </button>
              )}
              {showDividers && index < items.length - 1 && !item.divider && !items[index + 1].divider && (
                <div className="h-px bg-gray-600/30 mx-3" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CosmicDropdown;