import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, Sparkles, Plus } from "lucide-react";

interface EnhancedShoppingVennProps {
  onStartSession?: () => void;
  onCreateDesign?: () => void;
}

const EnhancedShoppingVenn: React.FC<EnhancedShoppingVennProps> = ({
  onStartSession,
  onCreateDesign
}) => {
  return (
    <div className="relative py-16 w-full max-w-6xl mx-auto cosmic-slide-up in">
      {/* Octagon background with proper clip-path polygon */}
      <div 
        className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm border border-purple-500/20 overflow-hidden"
        style={{
          clipPath: "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
          backgroundColor: "rgba(155, 135, 245, 0.05)"
        }}
      >
      </div>
      
      {/* Content container */}
      <div className="relative z-10 px-6 py-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-purple-300 mb-2 cosmic-text-glow">
            Enhanced Shopping Experience
          </h2>
          <p className="text-sm text-gray-300">
            Collaborate with friends or design your own custom products
          </p>
        </div>
        
        {/* Venn Diagram with two overlapping circles - Improved version based on screenshot */}
        <div className="relative h-[46rem] md:h-[38rem]">
          {/* Dark background container */}
          <div className="absolute inset-0 bg-indigo-950/80 rounded-3xl backdrop-blur-lg"></div>
          
          {/* Container for mobile layout (vertical) or desktop layout (horizontal) */}
          <div className="relative h-full flex flex-col md:flex-row items-center justify-center">
            {/* Shop Together Circle - Top/Left */}
            <div className="relative w-[90%] md:w-[60%] aspect-square rounded-full border border-purple-400/60 
                         z-10 md:left-[5%] md:top-[5%] flex flex-col items-center justify-center
                         bg-indigo-900/60 backdrop-blur-sm mb-16 md:mb-0 
                         shadow-lg shadow-purple-800/30">
              {/* Icon */}
              <div className="absolute top-[15%] md:top-[15%] left-1/2 transform -translate-x-1/2 h-14 w-14 rounded-full 
                         bg-indigo-800/80 flex items-center justify-center shadow-lg">
                <Users className="h-7 w-7 text-purple-200" />
              </div>
              
              {/* Title - Increased size and glow */}
              <h3 className="absolute top-[28%] md:top-[28%] left-1/2 transform -translate-x-1/2 text-2xl md:text-3xl 
                       font-bold text-white cosmic-text-glow">
                Shop Together
              </h3>
              
              {/* Description - Centered properly within circle */}
              <p className="absolute top-[40%] md:top-[40%] left-1/2 transform -translate-x-1/2 text-sm text-gray-200 
                       max-w-[280px] text-center leading-relaxed px-4">
                Browse and shop with friends in real-time, share product recommendations,
                and make collective purchasing decisions
              </p>
              
              {/* Button - Positioned properly at bottom */}
              <Button 
                variant="outline" 
                className="absolute top-[68%] md:top-[68%] left-1/2 transform -translate-x-1/2 bg-indigo-800/70 
                        border-purple-400/60 hover:bg-indigo-700/80 shadow-md shadow-purple-500/40 
                        hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 cosmic-hover-glow"
                onClick={onStartSession}
                size="lg"
              >
                <Users className="h-5 w-5 mr-2" /> Start Session
              </Button>
            </div>
            
            {/* Co-Design Studio Circle - Bottom/Right */}
            <div className="relative w-[90%] md:w-[60%] aspect-square rounded-full border border-purple-400/60 
                         -mt-52 md:mt-0 md:-ml-40 md:left-[8%] md:top-[10%] z-20 flex flex-col items-center justify-center
                         bg-violet-900/60 backdrop-blur-sm
                         shadow-lg shadow-purple-800/30">
              {/* Icon */}
              <div className="absolute top-[15%] md:top-[15%] left-1/2 transform -translate-x-1/2 h-14 w-14 rounded-full 
                          bg-indigo-800/80 flex items-center justify-center shadow-lg">
                <Sparkles className="h-7 w-7 text-purple-200" />
              </div>
              
              {/* Title - Increased size and glow */}
              <h3 className="absolute top-[28%] md:top-[28%] left-1/2 transform -translate-x-1/2 text-2xl md:text-3xl 
                       font-bold text-white cosmic-text-glow">
                Co-Design Studio
              </h3>
              
              {/* Description - Centered properly within circle */}
              <p className="absolute top-[40%] md:top-[40%] left-1/2 transform -translate-x-1/2 text-sm text-gray-200 
                       max-w-[280px] text-center leading-relaxed px-4">
                Create and customize your own cosmic products with our interactive design
                tools, collaborate with others on design ideas
              </p>
              
              {/* Button - Positioned properly at bottom */}
              <Button 
                variant="outline" 
                className="absolute top-[68%] md:top-[68%] left-1/2 transform -translate-x-1/2 bg-indigo-800/70 
                        border-purple-400/60 hover:bg-indigo-700/80 shadow-md shadow-purple-500/40 
                        hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 cosmic-hover-glow"
                onClick={onCreateDesign}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" /> Create Design
              </Button>
            </div>
            
            {/* Enhanced overlap effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 md:-translate-x-[10%] -translate-y-[30%] md:-translate-y-[10%] 
                        w-40 h-40 md:w-40 md:h-40 rounded-full bg-purple-500/20 backdrop-blur-md z-30"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 md:-translate-x-[10%] -translate-y-[30%] md:-translate-y-[10%]
                        w-6 h-6 rounded-full bg-purple-400/60 animate-pulse z-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShoppingVenn;