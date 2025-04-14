import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const { reducedMotion } = useAccessibility();
  
  // If reduced motion is enabled, don't animate
  if (reducedMotion) {
    return <>{children}</>;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}