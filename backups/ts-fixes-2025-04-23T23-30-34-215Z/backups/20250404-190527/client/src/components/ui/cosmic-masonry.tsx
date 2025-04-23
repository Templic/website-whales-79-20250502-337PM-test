import React, { useEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define the main container variants
const masonryContainerVariants = cva(
  'grid grid-cols-1 gap-4 w-full',
  {
    variants: {
      variant: {
        default: 'gap-4',
        cosmic: 'gap-6',
        nebula: 'gap-8',
        minimal: 'gap-2',
      },
      columns: {
        auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
      },
      responsive: {
        true: '',
        false: '',
      },
      animated: {
        true: 'transition-all duration-500',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      columns: 'auto',
      responsive: true,
      animated: false,
    },
  }
);

// Define the item variants
const masonryItemVariants = cva(
  'break-inside-avoid',
  {
    variants: {
      variant: {
        default: 'p-0',
        cosmic: 'bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-white/10',
        nebula: 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20',
        minimal: 'bg-gray-900/50 rounded p-2',
      },
      size: {
        auto: '',
        sm: 'max-w-xs',
        md: 'max-w-sm',
        lg: 'max-w-md',
        xl: 'max-w-lg',
        full: 'w-full',
      },
      animated: {
        true: 'transition-all duration-300 hover:transform hover:scale-[1.02] hover:z-10',
        false: '',
      },
      hoverable: {
        true: 'hover:shadow-lg hover:shadow-cosmic-primary/10',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'auto',
      animated: false,
      hoverable: false,
    },
  }
);

// Define properties for the main component
export interface CosmicMasonryProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof masonryContainerVariants> {
  autoLayout?: boolean;
  itemGap?: number;
  maintainOrder?: boolean;
  children: React.ReactNode;
}

// Define properties for the item component
export interface CosmicMasonryItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof masonryItemVariants> {
  aspectRatio?: number;
  span?: number;
  children: React.ReactNode;
}

// The main masonry component
export const CosmicMasonry = React.forwardRef<HTMLDivElement, CosmicMasonryProps>(
  ({ 
    variant, 
    columns = 'auto',
    responsive = true,
    animated = false,
    autoLayout = true,
    itemGap,
    maintainOrder = false,
    className, 
    children,
    ...props 
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState('grid');

    useEffect(() => {
      // Only use masonry layout if the browser supports it and autoLayout is true
      if (typeof CSS !== 'undefined' && CSS.supports('grid-template-rows', 'masonry') && autoLayout) {
        setLayout('masonry');
      } else {
        setLayout('grid');
      }
    }, [autoLayout]);

    // Check if we need to use CSS Grid or the masonry layout
    const gridStyle = layout === 'masonry' 
      ? { 
          display: 'grid', 
          gridTemplateColumns: responsive ? undefined : `repeat(${columns === 'auto' ? 'auto-fill' : columns}, minmax(250px, 1fr))`,
          gridAutoRows: '10px',
          gridGap: itemGap ? `${itemGap}px` : undefined,
        } 
      : {};

    return (
      <div
        ref={ref || containerRef}
        className={cn(
          masonryContainerVariants({ 
            variant, 
            columns: responsive ? columns : undefined,
            responsive, 
            animated 
          }),
          className
        )}
        style={gridStyle}
        data-layout={layout}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CosmicMasonry.displayName = 'CosmicMasonry';

// The masonry item component
export const CosmicMasonryItem = React.forwardRef<HTMLDivElement, CosmicMasonryItemProps>(
  ({ 
    variant, 
    size,
    animated,
    hoverable,
    aspectRatio,
    span,
    className, 
    children,
    style,
    ...props 
  }, ref) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | null>(null);
    const containerRef = (ref || itemRef) as React.RefObject<HTMLDivElement>;

    useEffect(() => {
      if (containerRef.current && containerRef.current.parentElement?.dataset.layout === 'masonry') {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            // Calculate grid row span based on element height
            const newHeight = entry.contentRect.height;
            setHeight(newHeight);
          }
        });

        resizeObserver.observe(containerRef.current);
        return () => {
          if (containerRef.current) {
            resizeObserver.unobserve(containerRef.current);
          }
        };
      }
    }, [containerRef]);

    // Calculate grid-row-end based on the height of the element
    const gridStyle = height !== null && containerRef.current?.parentElement?.dataset.layout === 'masonry'
      ? {
          ...style,
          gridRowEnd: span ? `span ${span}` : `span ${Math.ceil(height / 10)}`,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        }
      : {
          ...style,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        };

    return (
      <div
        ref={containerRef}
        className={cn(
          masonryItemVariants({ variant, size, animated, hoverable }),
          className
        )}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CosmicMasonryItem.displayName = 'CosmicMasonryItem';