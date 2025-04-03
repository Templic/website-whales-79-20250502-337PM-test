import React from 'react';
import { cn } from '../../lib/utils';

export interface CosmicBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'cosmic';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  pill?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const CosmicBadge: React.FC<CosmicBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  glow = false,
  pill = false,
  className,
  icon,
}) => {
  // Base badge styles
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors';
  
  // Size styles
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  // Variant styles
  const variantStyles = {
    default: 'bg-gray-800/70 text-gray-200',
    primary: 'bg-cosmic-primary/20 text-cosmic-primary border border-cosmic-primary/30',
    secondary: 'bg-cosmic-secondary/20 text-cosmic-secondary border border-cosmic-secondary/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    cosmic: 'bg-gradient-to-r from-cosmic-primary/20 to-cosmic-secondary/20 text-white border border-cosmic-primary/30'
  };
  
  // Pill styles
  const pillStyles = pill ? 'rounded-full' : 'rounded-md';
  
  // Glow effect
  const glowStyles = glow ? (
    variant === 'cosmic' 
      ? 'animate-pulse-glow shadow-cosmic-primary/30'
      : `shadow-${variant}-500/30 animate-pulse-glow`
  ) : '';
  
  // Compose the final className
  const badgeClassName = cn(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    pillStyles,
    glowStyles,
    className
  );
  
  return (
    <span className={badgeClassName}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default CosmicBadge;