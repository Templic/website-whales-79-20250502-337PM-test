/**
 * cosmic-avatar.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full overflow-hidden border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-gray-700 border-gray-600',
        cosmic: 'bg-gray-900 border-cosmic-primary',
        glow: 'bg-gray-900 border-cosmic-highlight shadow-glow',
        nebula: 'bg-gradient-to-r from-cosmic-primary to-cosmic-accent border-transparent'
      },
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-20 h-20 text-xl'
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        rotate: 'animate-spin-slow',
        cosmic: 'cosmic-avatar-animate'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      animation: 'none'
    }
  }
);

const initialsVariants = cva(
  'flex items-center justify-center w-full h-full text-center font-medium',
  {
    variants: {
      variant: {
        default: 'text-white',
        cosmic: 'text-cosmic-primary',
        glow: 'text-cosmic-highlight',
        nebula: 'text-white'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface CosmicAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  initials?: string;
  status?: 'online' | 'offline' | 'away' | 'busy' | 'cosmic';
}

const CosmicAvatar: React.FC<CosmicAvatarProps> = ({
  className,
  variant,
  size,
  animation,
  src,
  alt = '',
  initials,
  status,
  ...props
}) => {
  // Function to get background color class for initials
  const getInitialsBg = () => {
    const colors = [
      'bg-cosmic-primary/20',
      'bg-cosmic-secondary/20',
      'bg-cosmic-accent/20',
      'bg-cosmic-highlight/20',
      'bg-purple-500/20',
      'bg-blue-500/20',
      'bg-cyan-500/20'
    ];
    
    if (!initials) return colors[0];
    
    // Use the first letter of initials to get a consistent color
    const charCode = initials.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Status indicator classes
  const getStatusClass = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'cosmic':
        return 'bg-gradient-to-r from-cosmic-primary to-cosmic-accent';
      default:
        return '';
    }
  };

  return (
    <div 
      className={cn(
        avatarVariants({ variant, size, animation }),
        status && 'relative',
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            // If image fails to load, show initials instead
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : initials ? (
        <div className={cn(initialsVariants({ variant }), getInitialsBg())}>
          {initials.substring(0, 2).toUpperCase()}
        </div>
      ) : (
        <div className={cn(initialsVariants({ variant }), 'bg-gray-800')}>
          <svg className="w-3/5 h-3/5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>
      )}
      
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-gray-900',
          getStatusClass(),
          size === 'xs' ? 'w-2 h-2' :
          size === 'sm' ? 'w-2.5 h-2.5' :
          size === 'md' ? 'w-3 h-3' :
          size === 'lg' ? 'w-3.5 h-3.5' :
          'w-4 h-4'
        )} />
      )}
    </div>
  );
};

export default CosmicAvatar;