import React, { useId } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';

interface HexagramMerkabaProps {
  color?: string;
  glowColor?: string;
  size?: number;
  opacity?: number;
  rotationSpeed?: number;
  rotationDirection?: 'clockwise' | 'counterclockwise';
}

export const HexagramMerkaba: React.FC<HexagramMerkabaProps> = ({
  color = "#10edb3",                   // Bright neon green
  glowColor = "rgba(16, 237, 179, 0.8)", // Same color with transparency
  size = 96,
  opacity = 1,
  rotationSpeed = 60,                  // Seconds per full rotation
  rotationDirection = 'clockwise'
}) => {
  const filterId = useId();
  const pulseValue = useMotionValue(0.7);
  
  // Create pulse animation for glow intensity
  React.useEffect(() => {
    const animation = animate(pulseValue, [0.7, 0.9, 0.7], {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    });
    
    return () => animation.stop();
  }, []);
  
  // Determine rotation direction
  const rotateAnimate = rotationDirection === 'clockwise' ? 360 : -360;
  
  return (
    <motion.div 
      animate={{ rotate: rotateAnimate }}
      transition={{ duration: rotationSpeed, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size, opacity }}
    >
      <svg 
        width="100%"
        height="100%" 
        viewBox="0 0 120 120"
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
        
        {/* Star of David (Hexagram) */}
        <g filter={`url(#${filterId})`}>
          {/* Upward-pointing triangle */}
          <path
            d="M60,10 L85,55 L60,100 L35,55 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          
          {/* Downward-pointing triangle */}
          <path
            d="M35,30 L85,30 L110,75 L85,120 L35,120 L10,75 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            transform="translate(60, 75) rotate(180) translate(-60, -75)"
          />
          
          {/* Internal connecting lines */}
          <line x1="60" y1="10" x2="60" y2="100" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
          <line x1="35" y1="55" x2="85" y2="55" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
          
          {/* Inner circles */}
          <circle cx="60" cy="55" r="8" fill="none" stroke={color} strokeWidth="0.8" />
          <circle cx="60" cy="55" r="4" fill="none" stroke={color} strokeWidth="0.8" />
          
          {/* Connection points */}
          <circle cx="60" cy="10" r="2" fill={color} fillOpacity="0.9" />
          <circle cx="85" cy="55" r="2" fill={color} fillOpacity="0.9" />
          <circle cx="60" cy="100" r="2" fill={color} fillOpacity="0.9" />
          <circle cx="35" cy="55" r="2" fill={color} fillOpacity="0.9" />
        </g>
      </svg>
    </motion.div>
  );
};

export default HexagramMerkaba;