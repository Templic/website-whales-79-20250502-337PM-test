/**
 * cosmic-carousel.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const carouselVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      variant: {
        default: '',
        cosmic: 'bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cosmic-primary/30',
        nebula: 'bg-gradient-to-r from-cosmic-primary/5 to-cosmic-accent/5 backdrop-blur-sm rounded-xl border border-white/10',
        minimal: 'rounded-xl'
      },
      size: {
        auto: '',
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'w-full'
      },
      height: {
        auto: '',
        sm: 'h-40',
        md: 'h-64',
        lg: 'h-80',
        xl: 'h-96',
        '2xl': 'h-[32rem]'
      },
      animation: {
        none: '',
        fade: 'transition-opacity duration-500',
        slide: 'transition-transform duration-500'
      },
      navigation: {
        none: '',
        arrows: '',
        dots: '',
        both: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'auto',
      height: 'auto',
      animation: 'slide',
      navigation: 'both'
    }
  }
);

const navButtonVariants = cva(
  'absolute top-1/2 -translate-y-1/2 flex items-center justify-center z-10 rounded-full opacity-70 hover:opacity-100 transition-opacity',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 text-white hover:bg-gray-700',
        cosmic: 'bg-cosmic-primary/30 text-white backdrop-blur-sm hover:bg-cosmic-primary/50',
        nebula: 'bg-white/10 text-white backdrop-blur-sm hover:bg-white/20',
        minimal: 'bg-black/30 text-white backdrop-blur-sm hover:bg-black/50'
      },
      size: {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
);

const dotNavVariants = cva(
  'absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-10',
  {
    variants: {
      variant: {
        default: '',
        cosmic: '',
        nebula: '',
        minimal: ''
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const dotVariants = cva(
  'rounded-full transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-gray-400 hover:bg-white',
        cosmic: 'bg-cosmic-primary/40 hover:bg-cosmic-primary',
        nebula: 'bg-white/30 hover:bg-white',
        minimal: 'bg-gray-400 hover:bg-white'
      },
      size: {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
      },
      active: {
        true: '',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      active: false
    },
    compoundVariants: [
      {
        variant: 'default',
        active: true,
        className: 'bg-white scale-125'
      },
      {
        variant: 'cosmic',
        active: true,
        className: 'bg-cosmic-primary scale-125'
      },
      {
        variant: 'nebula',
        active: true,
        className: 'bg-white scale-125'
      },
      {
        variant: 'minimal',
        active: true,
        className: 'bg-white scale-125'
      }
    ]
  }
);

export interface CarouselItem {
  id: string;
  content: React.ReactNode;
}

export interface CosmicCarouselProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof carouselVariants> {
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  arrowSize?: 'sm' | 'md' | 'lg';
  dotSize?: 'sm' | 'md' | 'lg';
  initialSlide?: number;
}

const CosmicCarousel: React.FC<CosmicCarouselProps> = ({
  className,
  variant,
  size,
  height,
  animation,
  navigation,
  items,
  autoPlay = false,
  interval = 5000,
  pauseOnHover = true,
  loop = true,
  showArrows = true,
  showDots = true,
  arrowSize = 'md',
  dotSize = 'md',
  initialSlide = 0,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine navigation type based on showArrows and showDots
  let effectiveNavigation = 'none';
  if (showArrows && showDots) effectiveNavigation = 'both';
  else if (showArrows) effectiveNavigation = 'arrows';
  else if (showDots) effectiveNavigation = 'dots';

  const goToNext = () => {
    if (currentIndex === items.length - 1) {
      if (loop) {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex === 0) {
      if (loop) {
        setCurrentIndex(items.length - 1);
      }
    } else {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Setup autoplay
  useEffect(() => {
    const startAutoPlay = () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      
      autoPlayRef.current = setInterval(() => {
        if (!isPaused) {
          goToNext();
        }
      }, interval);
    };

    if (autoPlay && items.length > 1) {
      startAutoPlay();
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, interval, currentIndex, isPaused, items.length]);

  // Handle pause on hover
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  return (
    <div
      ref={carouselRef}
      className={cn(
        carouselVariants({ 
          variant, 
          size, 
          height, 
          animation, 
          navigation: effectiveNavigation as any 
        }),
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div 
        className={cn(
          'flex h-full',
          animation === 'slide' ? 'transition-transform duration-500' : 'transition-opacity duration-500'
        )}
        style={
          animation === 'slide' 
            ? { transform: `translateX(-${currentIndex * 100}%)` } 
            : undefined
        }
      >
        {items.map((item, index) => (
          <div 
            key={item.id}
            className={cn(
              'flex-shrink-0 w-full h-full',
              animation === 'fade' && 
                (index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 absolute top-0 left-0'),
              animation === 'slide' && 'transition-transform duration-500'
            )}
          >
            {item.content}
          </div>
        ))}
      </div>

      {(showArrows || navigation === 'arrows' || navigation === 'both') && items.length > 1 && (
        <>
          <button
            className={cn(
              navButtonVariants({ variant, size: arrowSize }),
              'left-4'
            )}
            onClick={goToPrev}
            disabled={!loop && currentIndex === 0}
          >
            <ChevronLeft className={cn(
              arrowSize === 'sm' ? 'w-4 h-4' : 
              arrowSize === 'md' ? 'w-5 h-5' : 
              'w-6 h-6'
            )} />
          </button>
          
          <button
            className={cn(
              navButtonVariants({ variant, size: arrowSize }),
              'right-4'
            )}
            onClick={goToNext}
            disabled={!loop && currentIndex === items.length - 1}
          >
            <ChevronRight className={cn(
              arrowSize === 'sm' ? 'w-4 h-4' : 
              arrowSize === 'md' ? 'w-5 h-5' : 
              'w-6 h-6'
            )} />
          </button>
        </>
      )}

      {(showDots || navigation === 'dots' || navigation === 'both') && items.length > 1 && (
        <div className={cn(dotNavVariants({ variant }))}>
          {items.map((_, index) => (
            <button
              key={index}
              className={cn(
                dotVariants({ 
                  variant, 
                  size: dotSize, 
                  active: index === currentIndex 
                })
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CosmicCarousel;