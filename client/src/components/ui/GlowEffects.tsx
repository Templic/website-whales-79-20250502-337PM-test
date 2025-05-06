/**
 * GlowEffects.tsx
 * 
 * A utility component that provides reusable SVG filters for glowing effects 
 * throughout the application.
 */

import React from 'react';

interface GlowEffectsProps {
  // Optional ID prefix to avoid conflicts if multiple instances are used
  idPrefix?: string;
}

export const GlowEffects: React.FC<GlowEffectsProps> = ({ idPrefix = 'glow' }) => {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', top: 0, left: 0 }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Cyan glow filter for borders and highlights */}
        <filter id={`${idPrefix}-cyan`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feFlood floodColor="#06e0e0" floodOpacity="0.7" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
        
        {/* Green merkaba glow filter */}
        <filter id={`${idPrefix}-merkaba`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feFlood floodColor="#10edb3" floodOpacity="0.8" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
        
        {/* Purple accent glow */}
        <filter id={`${idPrefix}-purple`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feFlood floodColor="#9333ea" floodOpacity="0.7" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
        
        {/* Text shadow glow */}
        <filter id={`${idPrefix}-text`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feFlood floodColor="#ffffff" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
        
        {/* Header bottom border glow */}
        <filter id={`${idPrefix}-border-bottom`} x="-10%" y="-10%" width="120%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feFlood floodColor="#06e0e0" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>
    </svg>
  );
};

export default GlowEffects;