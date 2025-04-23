import React from "react";

import { useEffect, useState } from 'react';

interface Spotlight {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export function SpotlightEffect() {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);

  useEffect(() => {
    const generateSpotlights = () => {
      const count = 4; // Number of spotlights
      const newSpotlights = [];
      
      for (let i = 0; i < count; i++) {
        newSpotlights.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 150 + Math.random() * 100,
          opacity: 0.1 + Math.random() * 0.2
        });
      }
      
      setSpotlights(newSpotlights);
    };

    generateSpotlights();
    const interval = setInterval(generateSpotlights, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {spotlights.map((spotlight, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            left: `${spotlight.x}%`,
            top: `${spotlight.y}%`,
            width: `${spotlight.size}px`,
            height: `${spotlight.size}px`,
            background: `radial-gradient(circle, rgba(0,235,214,${spotlight.opacity}) 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
