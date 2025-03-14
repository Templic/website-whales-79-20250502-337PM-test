import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SiSpotify, SiSoundcloud, SiBandcamp } from "react-icons/si";

export default function CollaborationPage() {
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Collaboration - Dale Loves Whales";
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Support Dale's Cosmic Journey</h1>
        <p className="text-xl max-w-2xl mx-auto">Join us in creating otherworldly musical experiences that transcend the boundaries of space and time.</p>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
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

        <div className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
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

      <section className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-6">Find Our Music</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="https://spotify.com/daleloveswhales" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
          >
            <SiSpotify className="text-3xl mr-2" />
            <span>Spotify</span>
          </a>
          <a 
            href="https://soundcloud.com/daleloveswhales" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
          >
            <SiSoundcloud className="text-3xl mr-2" />
            <span>SoundCloud</span>
          </a>
          <a 
            href="https://daleloveswhales.bandcamp.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
          >
            <SiBandcamp className="text-3xl mr-2" />
            <span>Bandcamp</span>
          </a>
        </div>
      </section>

      <section className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm text-center">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">Contact for Business Inquiries</h2>
        <p className="mb-4">For sponsorships, licensing, and other business opportunities:</p>
        <p className="text-[#00ebd6] text-lg">business@daleloveswhales.com</p>
      </section>
    </div>
  );
}