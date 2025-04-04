import React, { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
}

interface StarBackgroundProps {
  className?: string;
  starCount?: number;
}

const StarBackground: React.FC<StarBackgroundProps> = ({ 
  className = "",
  starCount = 100 
}) => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mounted, setMounted] = useState(false);

  // Generate stars only on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newStars: Star[] = [];
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.7 + 0.3,
          animationDuration: Math.random() * 5 + 3
        });
      }
      
      setStars(newStars);
      setMounted(true);
    }
  }, [starCount]);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[-1] overflow-hidden ${className}`}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;