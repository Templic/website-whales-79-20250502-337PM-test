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
        
        {/* Perfect Venn Diagram with two circular circles and small overlap */}
        <div className="relative h-[46rem] md:h-[32rem] mx-auto max-w-6xl">
          {/* Dark background container */}
          <div className="absolute inset-0 bg-indigo-950/80 rounded-3xl shadow-inner"></div>
          
          {/* Container for Venn diagram with proper horizontal spacing */}
          <div className="relative h-full flex items-center justify-center pt-8 px-4">
            
            {/* Perfectly round circles in a row for desktop */}
            <div className="relative flex flex-col md:flex-row items-center justify-center w-full">
              
              {/* Perfect Circle 1: Shop Together */}
              <div className="relative w-[80%] md:w-[400px] aspect-square rounded-full 
                           bg-indigo-800/60 backdrop-blur-md border border-indigo-500/30
                           flex flex-col items-center justify-center z-10 mb-12 md:mb-0 md:mr-[-40px]
                           shadow-lg shadow-indigo-900/40">
                
                {/* Content container with perfect spacing */}
                <div className="flex flex-col items-center justify-center w-full h-full px-8 py-6">
                  {/* Icon in small circle at top */}
                  <div className="w-14 h-14 rounded-full bg-indigo-700/80 flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-purple-200" />
                  </div>
                  
                  {/* Title with proper spacing */}
                  <h3 className="text-2xl font-bold text-white cosmic-text-glow mb-3">
                    Shop Together
                  </h3>
                  
                  {/* Description text with proper width & spacing */}
                  <p className="text-center text-gray-200 text-sm leading-relaxed mb-6 max-w-[260px]">
                    Browse and shop with friends in real-time, share product recommendations,
                    and make collective purchasing decisions
                  </p>
                  
                  {/* Button with proper styling */}
                  <Button 
                    variant="outline" 
                    className="bg-indigo-700/40 border-indigo-400/40 text-white
                              hover:bg-indigo-600/60 shadow cosmic-hover-glow"
                    onClick={onStartSession}
                    size="default"
                  >
                    <Users className="h-4 w-4 mr-2" /> Start Session
                  </Button>
                </div>
              </div>
              
              {/* Perfect Circle 2: Co-Design Studio */}
              <div className="relative w-[80%] md:w-[400px] aspect-square rounded-full 
                           bg-purple-800/60 backdrop-blur-md border border-purple-500/30
                           flex flex-col items-center justify-center z-20 md:ml-[-40px] -mt-20 md:mt-0
                           shadow-lg shadow-purple-900/40">
                
                {/* Content container with perfect spacing */}
                <div className="flex flex-col items-center justify-center w-full h-full px-8 py-6">
                  {/* Icon in small circle at top */}
                  <div className="w-14 h-14 rounded-full bg-purple-700/80 flex items-center justify-center mb-4">
                    <Sparkles className="h-7 w-7 text-purple-200" />
                  </div>
                  
                  {/* Title with proper spacing */}
                  <h3 className="text-2xl font-bold text-white cosmic-text-glow mb-3">
                    Co-Design Studio
                  </h3>
                  
                  {/* Description text with proper width & spacing */}
                  <p className="text-center text-gray-200 text-sm leading-relaxed mb-6 max-w-[260px]">
                    Create and customize your own cosmic products with our interactive design
                    tools, collaborate with others on design ideas
                  </p>
                  
                  {/* Button with proper styling */}
                  <Button 
                    variant="outline" 
                    className="bg-purple-700/40 border-purple-400/40 text-white
                              hover:bg-purple-600/60 shadow cosmic-hover-glow"
                    onClick={onCreateDesign}
                    size="default"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Create Design
                  </Button>
                </div>
              </div>
              
              {/* Small overlap glow effect in the intersection */}
              <div className="absolute top-1/2 left-1/2 md:left-[calc(50%-20px)] transform -translate-x-1/2 -translate-y-1/2
                           w-16 h-16 rounded-full bg-indigo-500/20 filter blur-sm z-30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShoppingVenn;