/**
 * CollaborationPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */import React from "react";
import React from "react";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SiSpotify, SiSoundcloud, SiBandcamp, SiYoutube, SiInstagram } from "react-icons/si";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SacredGeometry from "@/components/ui/sacred-geometry";

const images = [
  "uploads/whale costume bike.jpg",
  "uploads/whale costume do we love.jpg",
  "uploads/whale costume joy happiness.jpg",
  "uploads/whale costume we're gonna celebrate.jpg",
  "uploads/whale costume who we are.jpg"
];

export default function CollaborationPage() {
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    document.title = "Collaboration - Dale Loves Whales";
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const handleProposalClick = () => {
    toast({
      title: "Coming Soon",
      description: "Our collaboration proposal system will be available shortly. Please check back later!",
    });
  };

  const handleDonateClick = () => {
    toast({
      title: "Thank You!",
      description: "We're setting up our donation system. Your support means the world to us!",
    });
  };

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        {/* Header with Sacred Geometry */}
        <div className="relative mb-12">
          <h1 className="text-5xl font-nebula font-bold text-[#00ebd6] mb-6 cosmic-float text-center">Collaboration</h1>
          
          {/* Sacred geometry elements in header */}
          <div className="absolute -top-14 -right-10 opacity-20 hidden md:block">
            <div className="animate-spin-very-slow" style={{ animationDuration: '30s' }}>
              <SacredGeometry variant="merkaba" size={100} animated={false} intensity="medium" />
            </div>
          </div>
          <div className="absolute -bottom-10 -left-10 opacity-20 hidden md:block">
            <div className="animate-spin-very-slow" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
              <SacredGeometry variant="octagon" size={80} animated={false} intensity="medium" />
            </div>
          </div>
          
          <div className="relative text-center mb-12 cosmic-slide-up">
            <h2 className="text-3xl font-nebula font-bold text-[#00ebd6] mb-4 cosmic-glow">Support Dale's Cosmic Journey</h2>
            <p className="text-xl max-w-2xl mx-auto">Join us in creating otherworldly musical experiences that transcend the boundaries of space and time.</p>
          </div>
        </div>

        {/* Collaboration and Support Options */}
        <section className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Musical Collaborations - Octagon Mat */}
          <div className="relative">
            {/* Octagon shape container with clip-path */}
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                 clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
            
            {/* Sacred geometry in the corner */}
            <div className="absolute -top-6 -left-6 opacity-10 hidden md:block">
              <SacredGeometry variant="octagon" size={80} animated={false} />
            </div>
            
            {/* Further reduced padding and adjusted font sizes to ensure proper fit within geometric shape */}
            <div className="relative z-10 p-4 md:p-6 mx-auto max-w-lg">
              <h2 className="text-lg md:text-xl font-bold text-[#00ebd6] mb-2 text-center">Musical Collaborations</h2>
              <p className="mb-2 text-xs md:text-sm text-center mx-auto max-w-xs">Let's create something extraordinary together. We're always open to innovative musical partnerships.</p>
              <ul className="space-y-1 list-none mb-3 max-w-xs mx-auto">
                <li className="flex items-start space-x-1">
                  <span className="text-[#fe0064] text-xs">★</span>
                  <span className="text-xs md:text-sm">Studio Recording Sessions</span>
                </li>
                <li className="flex items-start space-x-1">
                  <span className="text-[#fe0064] text-xs">★</span>
                  <span className="text-xs md:text-sm">Live Performance Features</span>
                </li>
                <li className="flex items-start space-x-1">
                  <span className="text-[#fe0064] text-xs">★</span>
                  <span className="text-xs md:text-sm">Remote Production Projects</span>
                </li>
              </ul>
              <div className="max-w-[200px] mx-auto">
                <Button
                  onClick={handleProposalClick}
                  className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] text-xs py-1.5"
                >
                  Submit Collaboration Proposal
                </Button>
              </div>
            </div>
          </div>

          {/* Support Options - Octagon Mat */}
          <div className="relative">
            {/* Octagon shape container with clip-path */}
            <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                 clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
            
            {/* Sacred geometry in the corner */}
            <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
              <SacredGeometry variant="merkaba" size={80} animated={false} />
            </div>
            
            {/* Further reduced padding and adjusted font sizes to ensure proper fit within geometric shape */}
            <div className="relative z-10 p-4 md:p-6 mx-auto max-w-lg">
              <h2 className="text-lg md:text-xl font-bold text-[#00ebd6] mb-2 text-center">Support Options</h2>
              <div className="space-y-2 mb-3 max-w-xs mx-auto">
                <div>
                  <h3 className="text-base font-semibold mb-1.5 text-center">Cosmic Patron Tiers</h3>
                  <ul className="space-y-1.5">
                    <li className="flex items-center justify-between p-1.5 bg-[rgba(48,52,54,0.5)] rounded-lg">
                      <span className="text-xs md:text-sm">Stardust Supporter</span>
                      <span className="text-[#00ebd6] text-xs md:text-sm">$5/month</span>
                    </li>
                    <li className="flex items-center justify-between p-1.5 bg-[rgba(48,52,54,0.5)] rounded-lg">
                      <span className="text-xs md:text-sm">Nebula Navigator</span>
                      <span className="text-[#00ebd6] text-xs md:text-sm">$15/month</span>
                    </li>
                    <li className="flex items-center justify-between p-1.5 bg-[rgba(48,52,54,0.5)] rounded-lg">
                      <span className="text-xs md:text-sm">Galaxy Guardian</span>
                      <span className="text-[#00ebd6] text-xs md:text-sm">$30/month</span>
                    </li>
                  </ul>
                </div>
                <div className="max-w-[200px] mx-auto">
                  <Button
                    onClick={handleDonateClick}
                    className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] text-xs py-1.5"
                  >
                    Become a Patron
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media Section - With Octagon Mat */}
        <section className="relative mb-16" id="social-media-section">
          {/* Octagon shape container with clip-path */}
          <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
               clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
          
          <div className="relative z-10 p-8">
            <div className="flex justify-center items-center mb-8 relative">
              <h2 className="text-3xl font-bold text-[#00ebd6] text-center cosmic-glow">Connect With Our Content</h2>
              {/* Sacred geometry in title */}
              <div className="absolute -top-8 right-1/4 opacity-20 hidden md:block">
                <SacredGeometry variant="star" size={40} animated={false} />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* YouTube */}
              <div className="bg-gradient-to-br from-[rgba(48,52,54,0.7)] to-[rgba(48,52,54,0.5)] p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,235,214,0.5)] group">
                <a
                  href="https://www.youtube.com/@DiamondOrca777/featured"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-600 transform transition-transform group-hover:scale-110">
                        <img 
                          src="https://yt3.googleusercontent.com/ytc/APkrFKb6t_0_wMiYVSqHTQnA1SBGQssBEOh0EpZRv3qIJw=s176-c-k-c0x00ffffff-no-rj" 
                          alt="Diamond Orca - YouTube Channel" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2">
                        <SiYoutube className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-red-500">YouTube Channel</h3>
                      <p className="text-[#00ebd6] mb-2">@DiamondOrca777</p>
                      <p className="text-sm opacity-80 mb-4">Music videos, live performances & cosmic journeys</p>
                      <div className="p-2 bg-red-600 rounded-lg text-white font-medium text-center group-hover:bg-red-700 transition-colors">
                        Visit Channel
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              {/* Instagram */}
              <div className="bg-gradient-to-br from-[rgba(48,52,54,0.7)] to-[rgba(48,52,54,0.5)] p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,235,214,0.5)] group">
                <a
                  href="https://www.instagram.com/dalethewhalemusic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-600 transform transition-transform group-hover:scale-110">
                        <img 
                          src="https://scontent-iad3-1.cdninstagram.com/v/t51.2885-19/387386455_870744077799171_6377784437707782636_n.jpg?stp=dst-jpg_s150x150&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=102&_nc_ohc=5wqwLGGviZIAX9YeqiT&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfCpj0Uzk2TIwlpyYEY5tQVt80GeCDsibmcZkVqTEuMHBA&oe=66A2C6D9&_nc_sid=8b3546" 
                          alt="Dale The Whale - Instagram Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2">
                        <SiInstagram className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-purple-500">Instagram</h3>
                      <p className="text-[#00ebd6] mb-2">@dalethewhalemusic</p>
                      <p className="text-sm opacity-80 mb-4">Behind-the-scenes, daily inspiration & tour updates</p>
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg text-white font-medium text-center group-hover:from-purple-700 group-hover:to-pink-600 transition-colors">
                        Follow Us
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              {/* Spotify Podcast */}
              <div className="bg-gradient-to-br from-[rgba(48,52,54,0.7)] to-[rgba(48,52,54,0.5)] p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,235,214,0.5)] group">
                <a
                  href="https://creators.spotify.com/pod/show/dale-ham"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-green-500 transform transition-transform group-hover:scale-110">
                        <img 
                          src="https://i.scdn.co/image/ab67656300005f1f74d5a9fd76d9a21ea0d09b5a" 
                          alt="THE IRIDESCENT DOVE - Podcast Cover" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2">
                        <SiSpotify className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-green-500">Podcast</h3>
                      <p className="text-[#00ebd6] mb-2">THE IRIDESCENT DOVE</p>
                      <p className="text-sm opacity-80 mb-4">Deep conversations, musical insights & cosmic wisdom</p>
                      <div className="p-2 bg-green-600 rounded-lg text-white font-medium text-center group-hover:bg-green-700 transition-colors">
                        Listen Now
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image Section */}
        <section className="relative mb-16 overflow-hidden">
          {/* Octagon shape container with clip-path */}
          <div className="absolute inset-0 bg-[#00ebd6]/5 backdrop-blur-sm transform transition-all 
               clip-path-octagon border-2 border-[#00ebd6]/20 z-0"></div>
               
          <div className="relative z-10 p-2">
            <div className="relative h-[600px] overflow-hidden">
              <img
                src={images[currentImageIndex]}
                alt="Collaboration"
                className="w-full h-full object-contain transition-opacity duration-1000"
              />
              
              {/* Sacred geometry elements on image corners */}
              <div className="absolute top-5 right-5 opacity-30">
                <SacredGeometry variant="octagon" size={60} animated={false} intensity="subtle" />
              </div>
              <div className="absolute bottom-5 left-5 opacity-30">
                <SacredGeometry variant="merkaba" size={60} animated={false} intensity="subtle" />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section - Octagon Mat */}
        <section className="relative mb-12">
          {/* Octagon shape container with clip-path */}
          <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
               clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
          
          {/* Sacred geometry elements */}
          <div className="absolute -top-6 -right-6 opacity-10 hidden md:block">
            <SacredGeometry variant="hexagon" size={80} animated={false} />
          </div>
          
          <div className="relative z-10 p-8 text-center">
            <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">Contact for Business Inquiries</h2>
            <p className="mb-4">For sponsorships, licensing, and other business opportunities:</p>
            <p className="text-[#00ebd6] text-lg">exampleDaleLovesWhales@example.com</p>
          </div>
        </section>
      </div>
    </>
  );
}