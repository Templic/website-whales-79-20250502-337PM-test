/**
 * cosmic-accordion.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState, createContext, useContext } from 'react';
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

// Define variants for the accordion container
const accordionContainerVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: 'divide-y divide-gray-700',
        separated: 'space-y-2',
        bordered: 'border border-gray-700 rounded-lg overflow-hidden divide-y divide-gray-700',
        cosmic: 'divide-y divide-cosmic-primary/30',
        cosmicBordered: 'border border-cosmic-primary/30 rounded-lg overflow-hidden divide-y divide-cosmic-primary/30'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Define variants for the accordion items
const accordionItemVariants = cva(
  '',
  {
    variants: {
      variant: {
        default: '',
        separated: 'border border-gray-700 rounded-lg overflow-hidden',
        cosmic: '',
        cosmicSeparated: 'border border-cosmic-primary/30 rounded-lg overflow-hidden'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

// Define variants for the trigger button
const accordionTriggerVariants = cva(
  'flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:opacity-80 focus:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-transparent px-4',
        cosmic: 'bg-gray-900/50 px-4',
        frosted: 'bg-gray-800/30 backdrop-blur-sm px-4',
        gradient: 'bg-gradient-to-r from-gray-900/50 to-gray-800/30 px-4',
        cosmicGradient: 'bg-gradient-to-r from-cosmic-primary/10 to-cosmic-accent/5 px-4'
      },
      iconPosition: {
        right: 'flex-row',
        left: 'flex-row-reverse'
      }
    },
    defaultVariants: {
      variant: 'default',
      iconPosition: 'right'
    }
  }
);

// Define variants for the content section
const accordionContentVariants = cva(
  'overflow-hidden text-sm transition-all',
  {
    variants: {
      variant: {
        default: 'bg-transparent px-4',
        indented: 'bg-transparent px-8',
        cosmic: 'bg-cosmic-primary/5 px-4',
        frosted: 'bg-gray-800/20 backdrop-blur-sm px-4'
      },
      animation: {
        default: 'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        slide: 'data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down',
        fade: 'data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in'
      }
    },
    defaultVariants: {
      variant: 'default',
      animation: 'default'
    }
  }
);

// Context for handling accordion state
type AccordionContextValue = {
  value: string | null;
  onValueChange: (value: string) => void;
  allowMultiple: boolean;
  expanded: Record<string, boolean>;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface CosmicAccordionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionContainerVariants> {
  defaultValue?: string;
  allowMultiple?: boolean;
  children: React.ReactNode;
}

const CosmicAccordion: React.FC<CosmicAccordionProps> = ({
  className,
  variant,
  defaultValue,
  allowMultiple = false,
  children,
  ...props
}) => {
  const [value, setValue] = useState<string | null>(defaultValue || null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleValueChange = (itemValue: string) => {
    if (allowMultiple) {
      setExpanded(prev => ({
        ...prev,
        [itemValue]: !prev[itemValue]
      }));
    } else {
      setValue(value === itemValue ? null : itemValue);
    }
  };

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, allowMultiple, expanded }}>
      <div className={cn(accordionContainerVariants({ variant }), className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};
CosmicAccordion.displayName = 'CosmicAccordion';

export interface CosmicAccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionItemVariants> {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const CosmicAccordionItem: React.FC<CosmicAccordionItemProps> = ({
  className,
  variant,
  value,
  children,
  disabled = false,
  ...props
}) => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('CosmicAccordionItem must be used within a CosmicAccordion');
  }

  const isExpanded = context.allowMultiple
    ? context.expanded[value] || false
    : context.value === value;

  return (
    <div
      className={cn(accordionItemVariants({ variant }), disabled && 'opacity-50 cursor-not-allowed', className)}
      data-state={isExpanded ? 'open' : 'closed'}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isExpanded,
            accordionValue: value,
            disabled
          });
        }
        return child;
      })}
    </div>
  );
};
CosmicAccordionItem.displayName = 'CosmicAccordionItem';

export interface CosmicAccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accordionTriggerVariants> {
  children: React.ReactNode;
  isExpanded?: boolean;
  accordionValue?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const CosmicAccordionTrigger: React.FC<CosmicAccordionTriggerProps> = ({
  className,
  variant,
  iconPosition,
  children,
  isExpanded,
  accordionValue,
  disabled,
  icon,
  ...props
}) => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('CosmicAccordionTrigger must be used within a CosmicAccordionItem');
  }

  const handleClick = () => {
    if (!disabled && accordionValue) {
      context.onValueChange(accordionValue);
    }
  };

  const defaultIcon = (
    <ChevronDown
      className={cn(
        'h-4 w-4 shrink-0 transition-transform duration-200',
        isExpanded ? 'rotate-180' : 'rotate-0'
      )}
    />
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        accordionTriggerVariants({ variant, iconPosition }),
        className
      )}
      aria-expanded={isExpanded}
      {...props}
    >
      {children}
      {icon || defaultIcon}
    </button>
  );
};
CosmicAccordionTrigger.displayName = 'CosmicAccordionTrigger';

export interface CosmicAccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionContentVariants> {
  children: React.ReactNode;
  isExpanded?: boolean;
}

const CosmicAccordionContent: React.FC<CosmicAccordionContentProps> = ({
  className,
  variant,
  animation,
  children,
  isExpanded,
  ...props
}) => {
  if (isExpanded === undefined) {
    const context = useContext(AccordionContext);
    if (!context) {
      throw new Error('CosmicAccordionContent must be used within a CosmicAccordionItem');
    }
  }

  return (
    <div
      className={cn(accordionContentVariants({ variant, animation }), className)}
      data-state={isExpanded ? 'open' : 'closed'}
      style={{
        height: isExpanded ? 'auto' : 0,
        opacity: isExpanded ? 1 : 0,
        paddingTop: isExpanded ? '0.5rem' : 0,
        paddingBottom: isExpanded ? '1rem' : 0,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
CosmicAccordionContent.displayName = 'CosmicAccordionContent';

export {
  CosmicAccordion,
  CosmicAccordionItem,
  CosmicAccordionTrigger,
  CosmicAccordionContent
};