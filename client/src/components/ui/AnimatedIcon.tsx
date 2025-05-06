import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  children: React.ReactNode;
  color?: string;
  rotationSpeed?: number;
  className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  color = "currentColor",
  rotationSpeed = 20,
  className = ""
}) => {
  return (
    <motion.div
      className={className}
      style={{ color }}
      animate={{ rotate: 360 }}
      transition={{ 
        duration: rotationSpeed, 
        repeat: Infinity, 
        ease: "linear"
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedIcon;