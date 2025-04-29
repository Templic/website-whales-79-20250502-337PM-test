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
        
        {/* Venn Diagram with two partially overlapping circles */}
        <div className="relative h-[44rem] md:h-[34rem]">
          {/* Container for mobile layout (vertical) or desktop layout (horizontal) */}
          <div className="relative h-full flex flex-col md:flex-row items-center justify-center">
            {/* Left/Top Circle - Shop Together */}
            <div className="relative w-[82%] md:w-[48%] aspect-square rounded-full border border-purple-400/40 
                         md:left-[8%] z-10 flex flex-col items-center justify-center
                         bg-gradient-to-b from-indigo-900/30 to-purple-900/30 backdrop-blur-sm mb-12 md:mb-0 
                         shadow-lg shadow-purple-800/20">
              {/* Center the content properly in the circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="h-12 w-12 rounded-full bg-indigo-800/60 flex items-center justify-center mb-3 shadow-md">
                  <Users className="h-6 w-6 text-purple-200" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 cosmic-text-glow">Shop Together</h3>
                <p className="text-sm text-gray-200 max-w-[240px] text-center mb-6 leading-relaxed">
                  Browse and shop with friends in real-time, share product recommendations,
                  and make collective purchasing decisions
                </p>
                <Button 
                  variant="outline" 
                  className="bg-indigo-800/50 border-purple-400/40 hover:bg-indigo-700/70 shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 cosmic-hover-glow"
                  onClick={onStartSession}
                  size="lg"
                >
                  <Users className="h-4 w-4 mr-2" /> Start Session
                </Button>
              </div>
            </div>
            
            {/* Right/Bottom Circle - Co-Design Studio */}
            <div className="relative w-[82%] md:w-[48%] aspect-square rounded-full border border-purple-400/40 
                         md:right-[8%] -mt-32 md:mt-0 z-0 flex flex-col items-center justify-center
                         bg-gradient-to-b from-violet-900/30 to-indigo-900/30 backdrop-blur-sm
                         shadow-lg shadow-purple-800/20">
              {/* Center the content properly in the circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="h-12 w-12 rounded-full bg-indigo-800/60 flex items-center justify-center mb-3 shadow-md">
                  <Sparkles className="h-6 w-6 text-purple-200" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 cosmic-text-glow">Co-Design Studio</h3>
                <p className="text-sm text-gray-200 max-w-[240px] text-center mb-6 leading-relaxed">
                  Create and customize your own cosmic products with our interactive design
                  tools, collaborate with others on design ideas
                </p>
                <Button 
                  variant="outline" 
                  className="bg-indigo-800/50 border-purple-400/40 hover:bg-indigo-700/70 shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 cosmic-hover-glow"
                  onClick={onCreateDesign}
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Design
                </Button>
              </div>
            </div>
            
            {/* Decorative elements to enhance the Venn overlap */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-40 md:h-40 rounded-full bg-purple-500/10 backdrop-blur-md filter z-20 hidden md:block"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-400/50 animate-pulse filter blur-sm z-30 hidden md:block"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShoppingVenn;