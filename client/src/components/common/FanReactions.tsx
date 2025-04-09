import { FaQuoteLeft, FaQuoteRight, FaStar } from 'react-icons/fa';
import SacredGeometry from "@/components/ui/sacred-geometry";

/**
 * FanReactions Component
 * 
 * A component that displays testimonials or comments from fans, fostering a sense of community.
 */
export default function FanReactions() {
  const fanReactions = [
    { 
      comment: "Amazing performance! The cosmic vibes were unreal!",
      name: "Sarah W.",
      geometry: "pentagon" 
    },
    { 
      comment: "Dale's music takes you on a journey through space and time.",
      name: "Michael R.",
      geometry: "hexagon" 
    },
    { 
      comment: "This is the best experience I've ever had!",
      name: "Jamie T.",
      geometry: "triangle" 
    },
    { 
      comment: "Absolutely love the community!",
      name: "Alex P.",
      geometry: "octagon" 
    },
    { 
      comment: "Can't wait for the next event!",
      name: "Taylor M.",
      geometry: "heptagon" 
    },
    { 
      comment: "The cosmic ocean aesthetic speaks to my soul! Pure magic.",
      name: "Jordan K.",
      geometry: "merkaba" 
    }
  ];

  return (
    <div className="fan-reactions p-4 sm:p-6 md:p-8 rounded-xl shadow-lg relative overflow-hidden mb-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#00ebd6] mb-6 sm:mb-8 text-center">What Our Fans Say</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {fanReactions.map((reaction, index) => {
          const clipPathClass = `clip-path-${reaction.geometry}`;
          
          return (
            <div key={index} className="relative group min-h-[180px] flex">
              {/* Dynamic geometric shape container */}
              <div className={`absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                  ${clipPathClass} border-2 border-[#00ebd6]/30 z-0`}></div>
              
              <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-center w-full text-center">
                {/* Sacred geometry is now smaller and only shown on larger screens */}
                <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                  <SacredGeometry 
                    variant={reaction.geometry as any} 
                    size={60} 
                    animated={false}
                    intensity="subtle" 
                  />
                </div>
                
                {/* Simplified quote layout */}
                <div className="mb-2 text-center">
                  <FaQuoteLeft className="text-[#fe0064] text-sm inline-block mr-1" />
                  <p className="italic inline-block text-sm sm:text-base">{reaction.comment}</p>
                  <FaQuoteRight className="text-[#fe0064] text-sm inline-block ml-1" />
                </div>
                
                <div className="flex flex-col items-center justify-center mt-2 gap-1">
                  <p className="text-sm font-medium">- {reaction.name}</p>
                  <div className="flex">
                    <FaStar className="text-[#00ebd6] text-xs" />
                    <FaStar className="text-[#00ebd6] text-xs" />
                    <FaStar className="text-[#00ebd6] text-xs" />
                    <FaStar className="text-[#00ebd6] text-xs" />
                    <FaStar className="text-[#00ebd6] text-xs" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Additional padding at the bottom for the Merkaba star */}
      <div className="h-12 sm:h-16"></div>
    </div>
  );
}