import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import './cosmic-animations.css';
import SacredGeometry from './SacredGeometry';
import CosmicShape, { CosmicShapeGroup } from './CosmicShapesFixed';

interface GeometricContainerProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'cosmic' | 'minimal';
  className?: string;
  style?: React.CSSProperties;
  backgroundVariant?: 'none' | 'nebula' | 'grid' | 'glow';
  geometryVariant?: 
    'flower-of-life' | 
    'metatron-cube' | 
    'merkaba' | 
    'pentagon-star' | 
    'hexagon' | 
    'sri-yantra' | 
    'shapes-trio' | 
    'cosmic-corners';
  animateGeometry?: boolean;
  color?: string;
  glowColor?: string;
  glowIntensity?: 'light' | 'medium' | 'strong';
}

const GeometricContainer: React.FC<GeometricContainerProps> = ({
  children,
  variant = 'primary',
  className = '',
  style = {},
  backgroundVariant = 'nebula',
  geometryVariant = 'flower-of-life',
  animateGeometry = true,
  color,
  glowColor,
  glowIntensity = 'medium',
}) => {
  // Define color palettes from the Feels So Good album
  const colors = {
    primary: { main: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)' },
    secondary: { main: '#00ebd6', glow: 'rgba(0, 235, 214, 0.4)' },
    accent: { main: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)' },
    cosmic: { main: '#e15554', glow: 'rgba(225, 85, 84, 0.4)' },
    minimal: { main: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)' },
  };
  
  // Set colors based on variant or props
  const mainColor = color || colors[variant].main;
  const mainGlowColor = glowColor || colors[variant].glow;
  
  // Adjust glow intensity
  const glowIntensityMap = {
    light: '0.3',
    medium: '0.5',
    strong: '0.7',
  };
  
  const intensityValue = glowIntensityMap[glowIntensity];
  const adjustedGlowColor = mainGlowColor.replace(/[\d\.]+\)$/, `${intensityValue})`);
  
  // Set container background classes based on variant
  const containerBackgroundClass = cn(
    'relative overflow-hidden rounded-lg',
    backgroundVariant === 'nebula' && 'cosmic-nebula',
    backgroundVariant === 'grid' && 'cosmic-grid',
    backgroundVariant === 'glow' && 'cosmic-glow-purple',
    variant === 'primary' && 'border border-[#7c3aed]/30 bg-[#0a0a14]/60 backdrop-blur-md',
    variant === 'secondary' && 'border border-[#00ebd6]/30 bg-[#0a0a14]/60 backdrop-blur-md',
    variant === 'accent' && 'border border-[#fb923c]/30 bg-[#0a0a14]/60 backdrop-blur-md',
    variant === 'cosmic' && 'border border-[#e15554]/30 bg-[#0a0a14]/60 backdrop-blur-md',
    variant === 'minimal' && 'border border-white/10 bg-[#0a0a14]/40 backdrop-blur-sm',
    className
  );

  // Render the appropriate sacred geometry based on the variant
  const renderGeometry = () => {
    switch (geometryVariant) {
      case 'flower-of-life':
      case 'metatron-cube':
      case 'merkaba':
      case 'pentagon-star':
      case 'hexagon':
      case 'sri-yantra':
        return (
          <div className="absolute -z-10 opacity-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <SacredGeometry
              type={geometryVariant}
              color={mainColor}
              glowColor={adjustedGlowColor}
              size={300}
              animate={animateGeometry}
              animationDuration={60}
            />
          </div>
        );
      
      case 'shapes-trio':
        return (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <CosmicShapeGroup
              shapes={[
                {
                  type: 'circle',
                  size: 120,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.03,
                  animate: animateGeometry,
                  animationDuration: 70,
                  position: { top: '-20px', left: '-20px' }
                },
                {
                  type: 'polygon',
                  sides: 6,
                  size: 100,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.02,
                  animate: animateGeometry,
                  animationDuration: 80,
                  position: { bottom: '-30px', right: '-30px' }
                },
                {
                  type: 'ellipse',
                  size: 150,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.01,
                  animate: animateGeometry,
                  animationDuration: 90,
                  position: { bottom: '30%', left: '50%', transform: 'translateX(-50%)' }
                }
              ]}
            />
          </div>
        );
      
      case 'cosmic-corners':
        return (
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <CosmicShapeGroup
              shapes={[
                // Top left
                {
                  type: 'polygon',
                  sides: 3,
                  size: 60,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.03,
                  animate: animateGeometry,
                  animationDuration: 60,
                  position: { top: '10px', left: '10px' }
                },
                // Top right
                {
                  type: 'circle',
                  size: 80,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.02,
                  animate: animateGeometry,
                  animationDuration: 70,
                  position: { top: '5px', right: '5px' }
                },
                // Bottom left
                {
                  type: 'starburst',
                  points: 5,
                  size: 70,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.02,
                  animate: animateGeometry,
                  animationDuration: 80,
                  position: { bottom: '10px', left: '10px' }
                },
                // Bottom right
                {
                  type: 'polygon',
                  sides: 6,
                  size: 60,
                  color: mainColor,
                  glowColor: adjustedGlowColor,
                  fillOpacity: 0.03,
                  animate: animateGeometry,
                  animationDuration: 65,
                  position: { bottom: '5px', right: '5px' }
                },
              ]}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={containerBackgroundClass} style={style}>
      {renderGeometry()}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GeometricContainer;