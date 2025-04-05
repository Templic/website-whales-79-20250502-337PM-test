import { FaQuoteLeft, FaQuoteRight, FaStar } from 'react-icons/fa';

/**
 * FanReactions Component
 * 
 * A component that displays testimonials or comments from fans, fostering a sense of community.
 */
export default function FanReactions() {
  const fanReactions = [
    { 
      comment: "Amazing performance! The cosmic vibes were unreal!",
      name: "Sarah W." 
    },
    { 
      comment: "Dale's music takes you on a journey through space and time.",
      name: "Michael R." 
    },
    { 
      comment: "This is the best experience I've ever had!",
      name: "Jamie T." 
    },
    { 
      comment: "Absolutely love the community!",
      name: "Alex P." 
    },
    { 
      comment: "Can't wait for the next event!",
      name: "Taylor M." 
    }
  ];

  return (
    <div className="fan-reactions bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
      <h2 className="text-3xl font-bold text-[#00ebd6] mb-6">What Our Fans Say</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fanReactions.map((reaction, index) => (
          <div key={index} className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <div className="flex items-start mb-2">
              <FaQuoteLeft className="text-[#fe0064] mr-2 flex-shrink-0 mt-1" />
              <p className="italic">{reaction.comment}</p>
              <FaQuoteRight className="text-[#fe0064] ml-2 flex-shrink-0 mt-1" />
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm">- {reaction.name}</p>
              <div className="flex">
                <FaStar className="text-[#00ebd6]" />
                <FaStar className="text-[#00ebd6]" />
                <FaStar className="text-[#00ebd6]" />
                <FaStar className="text-[#00ebd6]" />
                <FaStar className="text-[#00ebd6]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}