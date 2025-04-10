import React from 'react';

/**
 * CSS styles for sacred geometry components
 */
export const SacredGeometryCss: React.FC = () => (
  <style>{`
    .sacred-geometry-glow {
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
    }
    
    .text-container {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Mobile text optimizations */
    @media (max-width: 640px) {
      .sacred-geometry-content h3 {
        font-size: 1rem !important;
        margin-bottom: 0.25rem !important;
      }
      
      .sacred-geometry-content p {
        font-size: 0.75rem !important;
        line-height: 1.2 !important;
      }
      
      .sacred-geometry-content {
        padding: 0.75rem !important;
      }
    }
    
    /* Tablet text optimizations */
    @media (min-width: 641px) and (max-width: 1024px) {
      .sacred-geometry-content h3 {
        font-size: 1.1rem !important;
        margin-bottom: 0.35rem !important;
      }
      
      .sacred-geometry-content p {
        font-size: 0.85rem !important;
        line-height: 1.3 !important;
      }
      
      .sacred-geometry-content {
        padding: 1rem !important;
      }
    }
  `}</style>
);

export default SacredGeometryCss;