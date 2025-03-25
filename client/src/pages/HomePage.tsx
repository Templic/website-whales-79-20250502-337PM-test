import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UsersRound, BarChart3 } from "lucide-react";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    document.title = "Home - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      {/* Temporary Admin Access (FOR TESTING ONLY - REMOVE BEFORE DEPLOYMENT) */}
      <div className="fixed top-16 left-0 right-0 z-50 flex justify-center">
        <div className="flex gap-2 bg-black/75 p-2 rounded-md">
          <Link href="/admin">
            <Button variant="default" className="bg-amber-50r0 hover:bg-amber-600 text-black">
              <UsersRound className="w-4 h-4 mr-2" />
              Admin Portal (Test Only)
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="default" className="bg-violet-500 hover:bg-violet-600 text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics Dashboard (Test Only)
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero min-h-[90vh] relative flex items-center justify-center text-center text-white"
        style={{
          background: `linear-gradient(rgba(48, 52, 54, 0.7), rgba(10, 50, 92, 0.8)),
            url(https://onlyinhawaii.org/wp-content/uploads/2011/03/Rainbow-Falls.jpg)
            no-repeat center center / cover`
        }}>
        <div className="hero-content relative z-10 max-w-[800px] p-8">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] mb-4 text-shadow shadow-[#fe0064]">
            Ride the Cosmic Wave
          </h1>
          <p className="text-[clamp(1rem,2.5vw,1.5rem)] mb-8">
            Immerse yourself in the sonic universe of Dale Loves Whales. Experience the vibe, explore the depths.
          </p>
          <p className="text-[clamp(1rem,2.5vw,1.5rem)] mb-8">
            Immerse yourself in the sonic universe of Dale Loves Whales. Experience the vibe, explore the depths.
          </p>
          <Link href="/music"
            className="cta-button bg-[#00ebd6] text-[#303436] px-8 py-3 text-xl rounded-[50px] border-none
              cursor-pointer transition-colors duration-300 hover:bg-[#fe0064] hover:text-white
              shadow-[0_0_15px_#00ebd6] hover:shadow-[0_0_20px_#fe0064] inline-block">
            Explore Music
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="p-16 max-w-[1200px] mx-auto">
        {/* About Section */}
        <section className="section mb-16 bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-[#00ebd6] text-4xl mb-4 inline-block border-b-2 border-[#fe0064]">
            Ideal Activity
          </h2>
          <p className="text-xl max-w-[900px] mx-auto leading-relaxed">
            Dale Loves Whales blends cosmic rhythms with tropical soul. Dive deep into his musical journey that bridges the stars with the ocean's depths.
          </p>
        </section>

        {/* Services Section */}
        <section className="section mb-16 bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
          <h2 className="text-[#00ebd6] text-4xl mb-4 inline-block border-b-2 border-[#fe0064]">
            Cosmic Sound Vibes
          </h2>
          <p className="text-xl max-w-[900px] mx-auto leading-relaxed">
            From live performances to collaborative projects, Dale brings a unique sound experience infused with retro-futuristic beats, fluid tropical notes, and immersive visuals.
          </p>
        </section>
      </main>
    </div>
  );
}