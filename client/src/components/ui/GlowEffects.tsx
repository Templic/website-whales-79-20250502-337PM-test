/**
 * GlowEffects.tsx
 * 
 * A component for defining SVG filters for various glow effects
 * used throughout the cosmic theme.
 */

import React from 'react';

interface GlowEffectsProps {
  idPrefix?: string;
}

const GlowEffects: React.FC<GlowEffectsProps> = ({ idPrefix = 'glow' }) => {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* Cyan glow effect - used for buttons and highlights */}
        <filter id={`${idPrefix}-cyan`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="0 0 0 0 0.023  0 0 0 0 0.713  0 0 0 0 0.831  0 0 0 1 0" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="screen" />
        </filter>
        
        {/* Green glow effect - used for merkaba shapes */}
        <filter id={`${idPrefix}-green`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="0 0 0 0 0.062  0 0 0 0 0.929  0 0 0 0 0.702  0 0 0 1 0" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="screen" />
        </filter>
        
        {/* Purple glow effect - used for contrast with cyan */}
        <filter id={`${idPrefix}-purple`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="0.576 0 0 0 0  0 0.2 0 0 0  0 0 0.933 0 0  0 0 0 1 0" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="screen" />
        </filter>
        
        {/* White glow effect - used for text highlights */}
        <filter id={`${idPrefix}-white`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" result="glow" />
          <feBlend in="SourceGraphic" in2="glow" mode="screen" />
        </filter>
        
        {/* Cosmic dust effect - subtle starfield glow */}
        <filter id={`${idPrefix}-cosmic-dust`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.4  0 0 0 0 0.9  0 0 0 0.05 0" result="colorNoise" />
          <feBlend in="SourceGraphic" in2="colorNoise" mode="screen" />
        </filter>
        
        {/* Ethereal glow for login button */}
        <filter id={`${idPrefix}-ethereal`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="
            0.3 0 0 0 0
            0 0.3 0 0 0
            0 0 1 0 0
            0 0 0 0.7 0
          " result="glow1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
          <feColorMatrix in="blur2" type="matrix" values="
            1 0 0 0 0
            0 0.2 0 0 0
            0 0 0.2 0 0
            0 0 0 1 0
          " result="glow2" />
          <feMerge>
            <feMergeNode in="glow1" />
            <feMergeNode in="glow2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Neon effect specifically for the header border */}
        <filter id={`${idPrefix}-neon-border`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="
            0 0 0 0 0
            0 1 0 0 0.9
            0 0 1 0 0.9
            0 0 0 5 0
          " result="neon" />
          <feBlend in="SourceGraphic" in2="neon" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
};

export default GlowEffects;