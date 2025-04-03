import React from 'react';
import { Link } from 'wouter';
import { cn } from '../../lib/utils';

export interface CosmicLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'glow' | 'nav' | 'nav-active' | 'footer';
  underline?: boolean;
  external?: boolean;
  onClick?: () => void;
}

const CosmicLink: React.FC<CosmicLinkProps> = ({
  href,
  children,
  className,
  variant = 'default',
  underline = false,
  external = false,
  onClick,
}) => {
  // Basic styles for all links
  const baseStyles = 'transition-all duration-300 outline-none focus:ring-2 focus:ring-cosmic-primary/30';

  // Variant-specific styles
  const variantStyles = {
    default: 'text-cosmic-primary hover:text-cosmic-primary-light',
    subtle: 'text-cosmic-text-light hover:text-cosmic-primary',
    glow: 'text-cosmic-primary hover:text-cosmic-primary-light hover:drop-shadow-glow',
    nav: 'text-cosmic-text hover:text-cosmic-primary',
    'nav-active': 'text-cosmic-primary font-medium',
    footer: 'text-cosmic-text-light hover:text-cosmic-primary text-sm',
  };

  // Underline styles
  const underlineStyles = underline
    ? 'underline hover:no-underline'
    : 'no-underline hover:underline';

  // External link attributes
  const externalAttrs = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  // Compose the final className
  const linkClassName = cn(
    baseStyles,
    variantStyles[variant],
    underlineStyles,
    className
  );

  // Render either an anchor tag for external links or a wouter Link for internal navigation
  return external ? (
    <a
      href={href}
      className={linkClassName}
      onClick={onClick}
      {...externalAttrs}
    >
      {children}
    </a>
  ) : (
    <Link href={href}>
      <a className={linkClassName} onClick={onClick}>
        {children}
      </a>
    </Link>
  );
};

export default CosmicLink;