/**
 * AnimatedIcon.tsx
 * 
 * A wrapper component that adds subtle rotation animation to icons
 * as seen in the navigation items in the header.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  hoverScale?: number;
  animationDuration?: number;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  color = 'currentColor',
  className = '',
  hoverScale = 1.1,
  animationDuration = 20
}) => {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color }}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: animationDuration, 
        repeat: Infinity, 
        ease: "linear" 
      }}
      whileHover={{ scale: hoverScale }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedIcon;