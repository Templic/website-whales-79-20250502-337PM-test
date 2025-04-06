import React, { useEffect, useState } from 'react';
import './cosmic-animations.css';

interface StarBackgroundProps {
  starCount?: number;
  shootingStarCount?: number;
  colorScheme?: 'default' | 'purple' | 'cyan' | 'multi';
  opacity?: number;
}

interface Star {
  id: number;
  size: number;
  x: string;
  y: string;
  delay: string;
  duration: string;
  color: string;
}

interface ShootingStar {
  id: number;
  x: string;
  y: string;
  delay: string;
  duration: string;
  distanceX: string;
  distanceY: string;
  rotation: string;
  trailWidth: string;
}

const StarBackground: React.FC<StarBackgroundProps> = ({
  starCount = 150,
  shootingStarCount = 5,
  colorScheme = 'default',
  opacity = 0.7,
}) => {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);

  useEffect(() => {
    // Generate stars
    const generatedStars: Star[] = [];
    
    // Color palette based on Feels So Good album
    const starColors = {
      default: ['#ffffff', '#f4f4f4', '#e6e6e6', '#b3b3b3'],
      purple: ['#ffffff', '#d5c5fb', '#b59df8', '#7c3aed'],
      cyan: ['#ffffff', '#b3f9f4', '#73f2ea', '#00ebd6'],
      multi: ['#ffffff', '#00ebd6', '#7c3aed', '#fb923c', '#e15554'],
    };
    
    const colors = starColors[colorScheme];

    for (let i = 0; i < starCount; i++) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomSize = (Math.random() * 2 + 1).toFixed(1);
      const randomX = `${Math.random() * 100}%`;
      const randomY = `${Math.random() * 100}%`;
      const randomDelay = `${Math.random() * 5}s`;
      const randomDuration = `${Math.random() * 2 + 3}s`;

      generatedStars.push({
        id: i,
        size: parseFloat(randomSize),
        x: randomX,
        y: randomY,
        delay: randomDelay,
        duration: randomDuration,
        color: randomColor,
      });
    }
    setStars(generatedStars);

    // Generate shooting stars
    const generatedShootingStars: ShootingStar[] = [];
    for (let i = 0; i < shootingStarCount; i++) {
      const randomX = `${Math.random() * 70}%`;
      const randomY = `${Math.random() * 70}%`;
      const randomDelay = `${Math.random() * 15 + 5}s`;
      const randomDuration = `${Math.random() * 3 + 2}s`;
      const randomDistanceX = `${Math.random() * 400 - 200}px`;
      const randomDistanceY = `${Math.random() * 400 - 100}px`;
      const randomRotation = `${Math.random() * 90 - 45}deg`;
      const randomTrailWidth = `${Math.random() * 40 + 30}px`;

      generatedShootingStars.push({
        id: i,
        x: randomX,
        y: randomY,
        delay: randomDelay,
        duration: randomDuration,
        distanceX: randomDistanceX,
        distanceY: randomDistanceY,
        rotation: randomRotation,
        trailWidth: randomTrailWidth,
      });
    }
    setShootingStars(generatedShootingStars);
  }, [starCount, shootingStarCount, colorScheme]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ opacity }}
    >
      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute twinkle"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: star.x,
            top: star.y,
            backgroundColor: star.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            '--twinkle-delay': star.delay,
            '--twinkle-duration': star.duration,
          } as React.CSSProperties}
        />
      ))}

      {/* Shooting Stars */}
      {shootingStars.map((shootingStar) => (
        <div
          key={shootingStar.id}
          className="shooting-star"
          style={{
            left: shootingStar.x,
            top: shootingStar.y,
            '--shooting-delay': shootingStar.delay,
            '--shooting-duration': shootingStar.duration,
            '--shooting-distance-x': shootingStar.distanceX,
            '--shooting-distance-y': shootingStar.distanceY,
            '--shooting-rotation': shootingStar.rotation,
            '--trail-width': shootingStar.trailWidth,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default StarBackground;