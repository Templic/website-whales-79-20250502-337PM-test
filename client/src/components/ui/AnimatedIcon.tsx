/**
 * AnimatedIcon.tsx
 * 
 * A component for displaying icons with subtle animations
 * Used in navigation elements to provide visual interest.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedIconProps {
  icon: React.ReactNode;
  color?: string;
  size?: number;
  className?: string;
  hoverEffect?: 'pulse' | 'spin' | 'bounce' | 'glow' | 'none';
  animationDuration?: number;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  color = '#ffffff',
  size = 24,
  className = '',
  hoverEffect = 'pulse',
  animationDuration = 2
}) => {
  // Define animation variants based on hover effect
  const variants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    spin: {
      rotate: [0, 360],
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: "linear"
      }
    },
    bounce: {
      y: [0, -5, 0],
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    glow: {
      filter: ["drop-shadow(0 0 2px rgba(255,255,255,0.2))", "drop-shadow(0 0 8px rgba(255,255,255,0.6))", "drop-shadow(0 0 2px rgba(255,255,255,0.2))"],
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    none: {}
  };

  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      whileHover={hoverEffect !== 'none' ? hoverEffect : undefined}
      variants={variants}
      style={{
        color,
        width: size,
        height: size
      }}
    >
      {icon}
    </motion.div>
  );
};

export default AnimatedIcon;