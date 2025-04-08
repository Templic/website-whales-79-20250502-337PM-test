import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Music, Headphones, Heart, MoonStar, Star, Sparkles } from "lucide-react";

export default function ResourcesPage() {
  useEffect(() => {
    document.title = "Cosmic Resources - Dale Loves Whales";
  }, []);

  const resources = [
    {
      title: "Frequency Guide",
      icon: <Headphones className="h-8 w-8 mb-4 text-cyan-500" />,
      description: "A detailed breakdown of sound frequencies and their unique impacts on the body, mind, and energy field.",
      path: "/resources/frequency-guide",
      gradient: "from-cyan-600 to-blue-800",
      hoverGradient: "from-cyan-500 to-blue-700",
      textColor: "text-white"
    },
    {
      title: "Sacred Geometry",
      icon: <MoonStar className="h-8 w-8 mb-4 text-purple-300" />,
      description: "Explore the universal patterns found in nature and the cosmos that serve as building blocks of creation.",
      path: "/resources/sacred-geometry",
      gradient: "from-purple-600 to-indigo-900",
      hoverGradient: "from-purple-500 to-indigo-800",
      textColor: "text-white"
    },
    {
      title: "Sound Healing",
      icon: <Music className="h-8 w-8 mb-4 text-blue-300" />,
      description: "Learn about the ancient therapeutic practice that uses sound waves to improve health and elevate consciousness.",
      path: "/resources/sound-healing",
      gradient: "from-blue-600 to-indigo-900",
      hoverGradient: "from-blue-500 to-indigo-800",
      textColor: "text-white"
    },
    {
      title: "Meditation Techniques",
      icon: <Heart className="h-8 w-8 mb-4 text-pink-300" />,
      description: "Discover powerful practices for developing mindfulness, inner peace, and spiritual connection.",
      path: "/resources/meditation",
      gradient: "from-pink-600 to-purple-900",
      hoverGradient: "from-pink-500 to-purple-800",
      textColor: "text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 text-white">
      <div className="relative overflow-hidden">
        {/* Animated stars background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute h-1 w-1 bg-white rounded-full top-[10%] left-[25%] animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[15%] left-[45%] animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[25%] left-[85%] animate-pulse" style={{ animationDuration: '2.5s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[40%] left-[15%] animate-pulse" style={{ animationDuration: '5s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[50%] left-[35%] animate-pulse" style={{ animationDuration: '4.5s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[60%] left-[65%] animate-pulse" style={{ animationDuration: '3.5s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[75%] left-[75%] animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute h-1 w-1 bg-white rounded-full top-[85%] left-[25%] animate-pulse" style={{ animationDuration: '2s' }}></div>
          <div className="absolute h-2 w-2 bg-blue-400 rounded-full top-[30%] left-[50%] animate-pulse" style={{ animationDuration: '7s' }}></div>
          <div className="absolute h-2 w-2 bg-purple-400 rounded-full top-[70%] left-[50%] animate-pulse" style={{ animationDuration: '8s' }}></div>
        </div>
        
        <div className="max-w-6xl mx-auto py-16 px-4 relative z-10">
          <header className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-10 w-10 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Cosmic Resources
            </h1>
            <p className="text-xl max-w-2xl mx-auto text-blue-100/90">
              Explore our collection of educational resources on sound frequencies, sacred geometry, 
              meditation techniques, and sound healing to enhance your cosmic journey.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {resources.map((resource, index) => (
              <Link key={index} href={resource.path}>
                <Card 
                  className={`overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] 
                  bg-gradient-to-br ${resource.gradient} hover:bg-gradient-to-br hover:${resource.hoverGradient} 
                  border-none h-full cursor-pointer transform hover:-translate-y-1`}
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col h-full">
                      <div className="mb-4 p-3 bg-white/10 rounded-full w-fit">
                        {resource.icon}
                      </div>
                      <h2 className={`text-2xl font-semibold mb-3 ${resource.textColor}`}>{resource.title}</h2>
                      <p className="mb-6 flex-grow text-blue-100/90">{resource.description}</p>
                      <div className="mt-auto pt-2 border-t border-white/20">
                        <div className="flex items-center group">
                          <span className="font-medium">Explore</span>
                          <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-md rounded-2xl p-10 mb-16 border border-slate-700/50 shadow-[0_0_20px_rgba(30,64,175,0.2)]">
            <div className="absolute -top-4 -right-4">
              <Star className="h-8 w-8 text-yellow-400 animate-pulse" style={{ animationDuration: '4s' }} />
            </div>
            <h2 className="text-3xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
              Why These Resources Matter
            </h2>
            <p className="text-lg mb-8 text-blue-100/90">
              These resources are carefully curated to complement our music and cosmic experiences. 
              By understanding the science and spirituality behind frequencies, sacred geometry, sound healing, 
              and meditation, you can enhance your connection to our music and more deeply benefit from its effects.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl shadow-lg border border-indigo-800/30 transform transition hover:scale-105">
                <h3 className="font-semibold text-xl mb-3 text-cyan-300">Enhanced Listening</h3>
                <p className="text-blue-100/80">Understand the frequencies and principles behind our music</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl shadow-lg border border-indigo-800/30 transform transition hover:scale-105">
                <h3 className="font-semibold text-xl mb-3 text-indigo-300">Personal Growth</h3>
                <p className="text-blue-100/80">Apply these teachings to your daily spiritual practice</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl shadow-lg border border-indigo-800/30 transform transition hover:scale-105">
                <h3 className="font-semibold text-xl mb-3 text-purple-300">Community Connection</h3>
                <p className="text-blue-100/80">Share a common language with our cosmic community</p>
              </div>
            </div>
          </div>
          
          <div className="text-center relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="h-20 w-1 bg-gradient-to-b from-transparent to-blue-500/30"></div>
            </div>
            <p className="text-xl max-w-3xl mx-auto mb-8 text-blue-100/90">
              Our resources are regularly updated with the latest research and spiritual insights. 
              Check back often for new content and deeper explorations.
            </p>
            <Link href="/music-release">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-700 hover:from-cyan-600 hover:to-blue-800 text-white border-none px-8 py-6 text-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]">
                Experience Our Music
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}