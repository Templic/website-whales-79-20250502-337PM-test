/**
 * CollaborationPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SiSpotify, SiSoundcloud, SiBandcamp } from "react-icons/si";
import { SpotlightEffect } from "@/components/SpotlightEffect";

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
        <h1 className="text-5xl font-nebula font-bold text-[#00ebd6] mb-6 cosmic-float">Collaboration</h1>
        <section className="text-center mb-12 cosmic-slide-up">
          <h2 className="text-3xl font-nebula font-bold text-[#00ebd6] mb-4 cosmic-glow">Support Dale's Cosmic Journey</h2>
          <p className="text-xl max-w-2xl mx-auto">Join us in creating otherworldly musical experiences that transcend the boundaries of space and time.</p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="cosmic-glow-box p-8 rounded-xl cosmic-slide-up">
            <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Musical Collaborations</h2>
            <p className="mb-6">Let's create something extraordinary together. We're always open to innovative musical partnerships.</p>
            <ul className="space-y-4 list-none mb-8">
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Studio Recording Sessions</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Live Performance Features</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-[#fe0064]">★</span>
                <span>Remote Production Projects</span>
              </li>
            </ul>
            <Button
              onClick={handleProposalClick}
              className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
            >
              Submit Collaboration Proposal
            </Button>
          </div>

          <div className="cosmic-glow-box p-8 rounded-xl shadow-lg backdrop-blur-sm cosmic-slide-up">
            <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Support Options</h2>
            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">Cosmic Patron Tiers</h3>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between p-3 bg-[rgba(48,52,54,0.5)] rounded-lg">
                    <span>Stardust Supporter</span>
                    <span className="text-[#00ebd6]">$5/month</span>
                  </li>
                  <li className="flex items-center justify-between p-3 bg-[rgba(48,52,54,0.5)] rounded-lg">
                    <span>Nebula Navigator</span>
                    <span className="text-[#00ebd6]">$15/month</span>
                  </li>
                  <li className="flex items-center justify-between p-3 bg-[rgba(48,52,54,0.5)] rounded-lg">
                    <span>Galaxy Guardian</span>
                    <span className="text-[#00ebd6]">$30/month</span>
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleDonateClick}
                className="w-full bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
              >
                Become a Patron
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Find Our Content</h2>
          <div className="grid grid-cols-1 gap-6">
            <a
              href="https://www.youtube.com/@DiamondOrca777/featured"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
            >
              <div className="flex items-center space-x-4 w-full">
                <img 
                  src="https://yt3.ggpht.com/ytc/APkrFKaqca-xQS5mwY_U6LWpBds93aWgUZqOA4x-5g=s88-c-k-c0x00ffffff-no-rj" 
                  alt="YouTube Profile" 
                  className="w-12 h-12 rounded-full"
                />
                <span className="flex flex-col flex-grow">
                  <span className="font-semibold">Dale's YouTube:</span>
                  <span>@DiamondOrca777</span>
                </span>
                <img src="/icons8-youtube-48.png" alt="YouTube" className="w-8 h-8" />
              </div>
            </a>
            <a
              href="https://www.instagram.com/dalethewhalemusic"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
            >
              <div className="flex items-center space-x-4 w-full">
                <img 
                  src="/images/dale-profile.jpg"
                  alt="Instagram Profile" 
                  className="w-12 h-12 rounded-full"
                />
                <span className="flex flex-col flex-grow">
                  <span className="font-semibold">Dale's Instagram:</span>
                  <span>@dalethewhalemusic</span>
                </span>
                <img src="/icons8-instagram-48.png" alt="Instagram" className="w-8 h-8" />
              </div>
            </a>
            <a
              href="https://creators.spotify.com/pod/show/dale-ham"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
            >
              <div className="flex items-center space-x-4 w-full">
                <img 
                  src="/images/podcast-cover.jpg" 
                  alt="Podcast Cover" 
                  className="w-12 h-12 rounded-lg"
                />
                <span className="flex flex-col flex-grow">
                  <span className="font-semibold">THE IRIDESCENT DOVE Podcast:</span>
                  <span>Ham</span>
                </span>
                <img src="/icons8-spotify-48.png" alt="Spotify" className="w-8 h-8" />
              </div>
            </a>
          </div>
        </section>

        <section className="mb-12 relative h-[600px] overflow-hidden bg-[rgba(10,50,92,0.6)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={images[currentImageIndex]}
              alt="Collaboration"
              className="max-w-full max-h-full object-contain transition-opacity duration-1000"
            />
          </div>
        </section>

        <section className="cosmic-glow-box p-8 rounded-xl shadow-lg backdrop-blur-sm text-center">
          <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">Contact for Business Inquiries</h2>
          <p className="mb-4">For sponsorships, licensing, and other business opportunities:</p>
          <p className="text-[#00ebd6] text-lg">business@daleloveswhales.com</p>
        </section>
      </div>
    </>
  );
}