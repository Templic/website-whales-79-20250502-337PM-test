import React, { useRef, useState, useEffect } from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  className = "",
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate the percentage for positioning
  const percentage = ((value[0] - min) / (max - min)) * 100;
  
  // Handle click on track
  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percent = offsetX / rect.width;
    
    const newValue = Math.round((min + percent * (max - min)) / step) * step;
    onValueChange([Math.max(min, Math.min(max, newValue))]);
  };
  
  // Handle thumb drag
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      
      const newValue = Math.round((min + percent * (max - min)) / step) * step;
      onValueChange([Math.max(min, Math.min(max, newValue))]);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, step, onValueChange]);
  
  return (
    <div className={`relative h-5 flex items-center ${className}`}>
      <div
        ref={trackRef}
        className="h-2 w-full rounded-full bg-white/10 cursor-pointer"
        onClick={handleTrackClick}
      >
        <div
          className="absolute h-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        ref={thumbRef}
        className="absolute h-5 w-5 rounded-full bg-white shadow-lg cursor-grab hover:scale-110 transition-transform active:cursor-grabbing"
        style={{ left: `calc(${percentage}% - 10px)` }}
        onMouseDown={() => setIsDragging(true)}
      />
    </div>
  );
}