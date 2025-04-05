/**
 * StarBackground.tsx
 * 
 * A dynamic starfield background component that creates a cosmic ambiance.
 * Features randomly sized and positioned stars with subtle twinkling animation.
 */
import React, { useEffect, useState } from 'react';

interface StarProps {
  size: number;
  top: string;
  left: string;
  opacity: number;
  delay: number;
}

interface StarBackgroundProps {
  starCount?: number;
  minSize?: number;
  maxSize?: number;
}

const Star: React.FC<StarProps> = ({ size, top, left, opacity, delay }) => {
  return (
    <div
      className="absolute rounded-full bg-white animate-twinkle"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top,
        left,
        opacity,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

const StarBackground: React.FC<StarBackgroundProps> = ({ 
  starCount = 100,
  minSize = 1,
  maxSize = 3,
}) => {
  const [stars, setStars] = useState<StarProps[]>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: starCount }).map(() => {
      return {
        size: Math.random() * (maxSize - minSize) + minSize,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: Math.random() * 0.7 + 0.3, // Between 0.3 and 1.0
        delay: Math.random() * 5, // Random delay for twinkling effect
      };
    });

    setStars(generatedStars);
  }, [starCount, minSize, maxSize]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <Star key={index} {...star} />
      ))}
    </div>
  );
};

export default StarBackground;