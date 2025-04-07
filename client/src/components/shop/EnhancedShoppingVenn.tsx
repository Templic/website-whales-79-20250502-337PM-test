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
        
        {/* Venn Diagram - Desktop horizontal layout, Mobile vertical layout */}
        <div className="relative h-[60rem] sm:h-[40rem] md:h-[32rem]">
          {/* First Circle - Shop Together */}
          <div className="
            absolute h-[60%] sm:h-[90%] aspect-square rounded-full border border-purple-400/30 
            bg-indigo-900/10 backdrop-blur-sm flex flex-col items-center justify-center
            
            top-[0%] left-1/2 transform -translate-x-1/2 
            sm:left-[5%] md:left-[15%] sm:top-[5%] sm:transform-none
            z-20
          ">
            <div className="h-12 w-12 rounded-full bg-indigo-900/40 flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-purple-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Shop Together</h3>
            <p className="text-sm text-gray-300 max-w-[200px] text-center mb-6">
              Browse and shop with friends in real-time, share product recommendations,
              and make collective purchasing decisions
            </p>
            <Button 
              variant="outline" 
              className="bg-indigo-900/40 border-purple-400/30 hover:bg-indigo-800/60"
              onClick={onStartSession}
            >
              <Users className="h-4 w-4 mr-2" /> Start Session
            </Button>
          </div>
          
          {/* Second Circle - Co-Design Studio */}
          <div className="
            absolute h-[60%] sm:h-[90%] aspect-square rounded-full border border-purple-400/30 
            bg-indigo-900/10 backdrop-blur-sm flex flex-col items-center justify-center
            
            top-[45%] left-1/2 transform -translate-x-1/2
            sm:left-auto sm:right-[5%] md:right-[15%] sm:top-[5%] sm:transform-none
            z-10
          ">
            <div className="h-12 w-12 rounded-full bg-indigo-900/40 flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-purple-300" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Co-Design Studio</h3>
            <p className="text-sm text-gray-300 max-w-[200px] text-center mb-6">
              Create and customize your own cosmic products with our interactive design
              tools, collaborate with others on design ideas
            </p>
            <Button 
              variant="outline" 
              className="bg-indigo-900/40 border-purple-400/30 hover:bg-indigo-800/60"
              onClick={onCreateDesign}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Design
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShoppingVenn;