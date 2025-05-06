/**
 * SacredGeometry.tsx
 * 
 * A component for rendering various sacred geometry patterns
 * Used for background decoration in the cosmic theme
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface SacredGeometryProps {
  type: 'flower-of-life' | 'sri-yantra' | 'metatron-cube' | 'merkaba' | 'hexagon' | 'pentagon-star';
  color?: string;
  size?: number;
  opacity?: number;
  animated?: boolean;
  animationDuration?: number;
  className?: string;
  [key: string]: any;
}

const SacredGeometry: React.FC<SacredGeometryProps> = ({
  type,
  color = 'rgba(255, 255, 255, 0.8)',
  size = 100,
  opacity = 1,
  animated = false,
  animationDuration = 60,
  className = '',
  ...props
}) => {
  // Convert type to viewBox and path information
  const getGeometryData = (type: string) => {
    switch (type) {
      case 'flower-of-life':
        return {
          viewBox: '0 0 100 100',
          paths: [
            'M50,15 A35,35 0 1,1 49.999,15',
            'M27,28 A35,35 0 1,1 26.999,28',
            'M73,28 A35,35 0 1,1 72.999,28',
            'M50,85 A35,35 0 1,1 49.999,85',
            'M27,72 A35,35 0 1,1 26.999,72',
            'M73,72 A35,35 0 1,1 72.999,72',
            'M15,50 A35,35 0 1,1 14.999,50',
            'M85,50 A35,35 0 1,1 84.999,50',
          ]
        };
      case 'sri-yantra':
        return {
          viewBox: '0 0 100 100',
          paths: [
            'M50,10 L90,80 L10,80 Z',
            'M50,20 L80,75 L20,75 Z',
            'M50,30 L70,70 L30,70 Z',
            'M50,40 L60,65 L40,65 Z',
            'M50,50 L55,60 L45,60 Z',
          ]
        };
      case 'merkaba':
        return {
          viewBox: '0 0 100 100',
          paths: [
            'M50,10 L90,60 L10,60 Z', // Upward facing tetrahedron
            'M50,90 L10,40 L90,40 Z', // Downward facing tetrahedron
          ]
        };
      case 'hexagon':
        return {
          viewBox: '0 0 100 100',
          paths: [
            'M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z',
          ]
        };
      case 'pentagon-star':
        return {
          viewBox: '0 0 100 100',
          paths: [
            'M50,10 L20,90 L90,40 L10,40 L80,90 Z',
          ]
        };
      case 'metatron-cube':
        return {
          viewBox: '0 0 100 100',
          paths: [
            // Outer hexagon
            'M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z',
            // Inner hexagram
            'M50,20 L70,35 L70,65 L50,80 L30,65 L30,35 Z',
            // Connecting lines
            'M50,10 L50,90', 
            'M15,30 L85,70',
            'M15,70 L85,30',
            'M30,35 L70,65',
            'M30,65 L70,35',
          ]
        };
      default:
        return {
          viewBox: '0 0 100 100',
          paths: ['M25,25 L75,25 L75,75 L25,75 Z']
        };
    }
  };

  const { viewBox, paths } = getGeometryData(type);

  // Animation variants
  const rotationVariant = {
    animate: {
      rotate: 360,
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  // Calculate stroke width based on size
  const strokeWidth = size / 100;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animated ? { rotate: 0 } : undefined}
      animate={animated ? 'animate' : undefined}
      variants={animated ? rotationVariant : undefined}
      style={{ opacity }}
      {...props}
    >
      {paths.map((path, index) => (
        <motion.path
          key={index}
          d={path}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          initial={animated ? { opacity: 0.7 } : undefined}
          animate={animated ? { opacity: [0.7, 1, 0.7] } : undefined}
          transition={animated ? {
            duration: animationDuration / 2,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * (animationDuration / 10),
          } : undefined}
        />
      ))}
    </motion.svg>
  );
};

export default SacredGeometry;