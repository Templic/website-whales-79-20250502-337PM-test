import React from "react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, Wind, Zap, Star } from "lucide-react";
import StarBackground from "@/components/cosmic/StarBackground";

export default function MeditationTechniquesPage() {
  useEffect(() => {
    document.title = "Meditation Techniques - Dale Loves Whales";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-violet-950 to-purple-950 text-white relative overflow-hidden">
      <StarBackground />
      <div className="max-w-4xl mx-auto py-16 px-4 relative z-10">
        <header className="text-center relative mb-14">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-900/30 rounded-full">
              <Brain className="h-10 w-10 text-indigo-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-300">
            Meditation Techniques
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-violet-500 mx-auto mb-6"></div>
          <p className="text-lg text-indigo-100/90 max-w-2xl mx-auto">
            Explore various meditation techniques to cultivate mindfulness, inner peace, and cosmic connection.
          </p>
        </header>
      
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <p className="text-lg mb-6 text-indigo-100/90">
              Meditation is a powerful practice for developing mindfulness, inner peace, and spiritual connection.
              There are many approaches to meditation, each with unique benefits for the mind, body, and spirit.
            </p>
            
            <Card className="cosmic-hover bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border border-indigo-500/20 backdrop-blur-sm shadow-lg mb-6 overflow-hidden">
              <CardContent className="pt-6 p-6">
                <h2 className="text-2xl font-semibold mb-4 text-indigo-300 flex items-center">
                  <Wind className="h-6 w-6 mr-3 text-indigo-400" />
                  Foundational Techniques
                </h2>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                <ul className="space-y-3">
                  <li className="flex flex-col pl-4 border-l-2 border-indigo-500">
                    <span className="font-bold text-indigo-200">Mindfulness Meditation</span> 
                    <span className="text-indigo-100/80">Focuses on being present and observing thoughts without judgment</span>
                  </li>
                  <li className="flex flex-col pl-4 border-l-2 border-violet-500">
                    <span className="font-bold text-violet-200">Loving-Kindness (Metta)</span> 
                    <span className="text-indigo-100/80">Cultivates compassion and good wishes for self and others</span>
                  </li>
                  <li className="flex flex-col pl-4 border-l-2 border-purple-500">
                    <span className="font-bold text-purple-200">Breath Awareness</span> 
                    <span className="text-indigo-100/80">Using the breath as an anchor to maintain focus and calm the mind</span>
                  </li>
                  <li className="flex flex-col pl-4 border-l-2 border-blue-500">
                    <span className="font-bold text-blue-200">Visualization</span> 
                    <span className="text-indigo-100/80">Creating mental images to promote healing, manifestation, or spiritual insight</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <p className="text-md italic text-indigo-100/90 bg-indigo-500/10 p-4 rounded-lg backdrop-blur-sm">
              Regular meditation practice has been scientifically proven to reduce stress, improve emotional regulation, 
              enhance concentration, and promote overall well-being.
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-xl">
              <img 
                src="/images/resources/meditation.png" 
                alt="Person Meditating With Cosmic Energy" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        <section className="mb-14">
          <h2 className="text-3xl font-semibold mb-8 text-center flex items-center justify-center">
            <Sparkles className="h-7 w-7 mr-3 text-violet-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-violet-300">Advanced Meditation Practices</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border border-indigo-700/20 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-3 text-indigo-300">Chakra Meditation</h3>
                <div className="mb-4 h-0.5 w-12 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  Focus on the seven main energy centers in the body to balance energy flow and 
                  address specific physical, emotional, or spiritual issues.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-700/20 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-3 text-violet-300">Sound Bath Meditation</h3>
                <div className="mb-4 h-0.5 w-12 bg-gradient-to-r from-violet-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  Immerse yourself in healing frequencies from singing bowls, gongs, or tuning 
                  forks to facilitate deep relaxation and energetic alignment.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700/20 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-3 text-purple-300">Third Eye Meditation</h3>
                <div className="mb-4 h-0.5 w-12 bg-gradient-to-r from-purple-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  Focus attention on the space between the eyebrows (the third eye or ajna chakra) 
                  to enhance intuition, clarity, and spiritual awareness.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/20 backdrop-blur-sm shadow-lg overflow-hidden hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-3 text-blue-300">Kundalini Meditation</h3>
                <div className="mb-4 h-0.5 w-12 bg-gradient-to-r from-blue-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  Combines breathing techniques, mantras, and specific postures to awaken dormant 
                  spiritual energy at the base of the spine.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="mb-10 bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border border-indigo-600/20 backdrop-blur-sm p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center flex items-center justify-center">
            <Star className="h-6 w-6 mr-2 text-indigo-300" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-violet-300">Starting Your Practice</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-indigo-900/40 border border-indigo-500/20 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold mb-2 text-center text-indigo-300 flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center bg-indigo-800/50 rounded-full mr-2">
                  <span className="text-indigo-200">1</span>
                </div>
                Start Small
              </h3>
              <p className="text-indigo-100/80">Begin with just 5-10 minutes daily. Consistency is more important than duration.</p>
            </div>
            
            <div className="bg-violet-900/40 border border-violet-500/20 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold mb-2 text-center text-violet-300 flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center bg-violet-800/50 rounded-full mr-2">
                  <span className="text-violet-200">2</span>
                </div>
                Create Space
              </h3>
              <p className="text-indigo-100/80">Designate a quiet, comfortable place for your practice with minimal distractions.</p>
            </div>
            
            <div className="bg-purple-900/40 border border-purple-500/20 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold mb-2 text-center text-purple-300 flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-800/50 rounded-full mr-2">
                  <span className="text-purple-200">3</span>
                </div>
                Be Patient
              </h3>
              <p className="text-indigo-100/80">Don't judge your progress. A wandering mind is normal; simply return to your focus.</p>
            </div>
          </div>
        </section>
        
        <div className="text-center mb-6 relative">
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <p className="text-lg max-w-2xl mx-auto bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-violet-200 font-medium relative z-10">
            Explore our guided meditations and frequency-based sound healing tracks to enhance your 
            meditation practice and deepen your cosmic connection.
          </p>
        </div>
      </div>
    </div>
  );
}