import React from 'react';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';

interface HeaderControlsProps {
  className?: string;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button 
        onClick={() => window.history.back()}
        className="
          p-1.5 rounded-full 
          bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] 
          text-[rgba(255,255,255,0.7)] hover:text-white 
          transition-colors
        "
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      
      <button 
        onClick={() => window.history.forward()}
        className="
          p-1.5 rounded-full 
          bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] 
          text-[rgba(255,255,255,0.7)] hover:text-white 
          transition-colors
        "
        aria-label="Go forward"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
      
      <button 
        onClick={() => window.location.reload()}
        className="
          p-1.5 rounded-full 
          bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] 
          text-[rgba(255,255,255,0.7)] hover:text-white 
          transition-colors
        "
        aria-label="Reload page"
      >
        <RotateCw className="h-4 w-4" />
      </button>
    </div>
  );
};

export default HeaderControls;