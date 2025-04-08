import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Music, Headphones, Heart, MoonStar } from "lucide-react";

export default function ResourcesPage() {
  useEffect(() => {
    document.title = "Resources - Dale Loves Whales";
  }, []);

  const resources = [
    {
      title: "Frequency Guide",
      icon: <Headphones className="h-6 w-6 mb-4 text-cyan-500" />,
      description: "A detailed breakdown of sound frequencies and their unique impacts on the body, mind, and energy field.",
      path: "/resources/frequency-guide",
      gradient: "from-cyan-500/20 to-indigo-500/20",
      textColor: "text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "Sacred Geometry",
      icon: <MoonStar className="h-6 w-6 mb-4 text-purple-500" />,
      description: "Explore the universal patterns found in nature and the cosmos that serve as building blocks of creation.",
      path: "/resources/sacred-geometry",
      gradient: "from-purple-500/20 to-indigo-500/20",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Sound Healing",
      icon: <Music className="h-6 w-6 mb-4 text-blue-500" />,
      description: "Learn about the ancient therapeutic practice that uses sound waves to improve health and elevate consciousness.",
      path: "/resources/sound-healing",
      gradient: "from-blue-500/20 to-indigo-500/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Meditation Techniques",
      icon: <Heart className="h-6 w-6 mb-4 text-pink-500" />,
      description: "Discover powerful practices for developing mindfulness, inner peace, and spiritual connection.",
      path: "/resources/meditation",
      gradient: "from-pink-500/20 to-red-500/20",
      textColor: "text-pink-600 dark:text-pink-400"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Cosmic Resources</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Explore our collection of educational resources on sound frequencies, sacred geometry, 
          meditation techniques, and sound healing to enhance your cosmic journey.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {resources.map((resource, index) => (
          <Card 
            key={index} 
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg bg-gradient-to-br ${resource.gradient} border-white/20`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                {resource.icon}
                <h2 className={`text-2xl font-semibold mb-2 ${resource.textColor}`}>{resource.title}</h2>
                <p className="mb-6 flex-grow">{resource.description}</p>
                <div className="mt-auto">
                  <Link href={resource.path}>
                    <Button variant="outline" className="group">
                      Explore
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-center">Why These Resources Matter</h2>
        <p className="text-lg mb-6">
          These resources are carefully curated to complement our music and cosmic experiences. 
          By understanding the science and spirituality behind frequencies, sacred geometry, sound healing, 
          and meditation, you can enhance your connection to our music and more deeply benefit from its effects.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Enhanced Listening</h3>
            <p className="text-sm">Understand the frequencies and principles behind our music</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Personal Growth</h3>
            <p className="text-sm">Apply these teachings to your daily spiritual practice</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Community Connection</h3>
            <p className="text-sm">Share a common language with our cosmic community</p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-lg max-w-2xl mx-auto mb-6">
          Our resources are regularly updated with the latest research and spiritual insights. 
          Check back often for new content and deeper explorations.
        </p>
        <Link href="/music-release">
          <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            Experience Our Music
          </Button>
        </Link>
      </div>
    </div>
  );
}