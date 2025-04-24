import React from "react";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import StarBackground from "@/components/cosmic/StarBackground";
import { Hexagon, Boxes, Building, Sparkles, Shapes } from "lucide-react";

export default function SacredGeometryPage() {
  useEffect(() => {
    document.title = "Sacred Geometry - Dale Loves Whales";
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050f28] text-[#e8e6e3]">
      {/* Cosmic Background */}
      <div className="absolute inset-0 z-0">
        <StarBackground starCount={80} colorScheme="purple" opacity={0.4} />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto py-16 px-4">
        {/* Header with cosmic styling */}
        <div className="relative mb-16">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-14 -right-14 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="text-center cosmic-slide-up">
            <div className="inline-flex justify-center items-center mb-6 p-4 rounded-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-purple-500/20">
              <Shapes className="h-10 w-10 text-purple-400 cosmic-rotate" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
              Sacred Geometry
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-6"></div>
            <p className="text-lg text-indigo-100/90 max-w-2xl mx-auto">
              Sacred Geometry explores the universal patterns found in nature and the cosmos. 
              These shapes are seen as the building blocks of creation and are used in spiritual 
              and meditative practices for alignment and insight.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 mb-16 cosmic-fade-in">
          <div>
            <Card className="cosmic-glow-box bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-purple-500/20 shadow-lg mb-6 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              <CardContent className="p-8 relative">
                <h2 className="text-2xl font-semibold mb-5 flex items-center text-indigo-200">
                  <Hexagon className="h-6 w-6 mr-3 text-purple-400" />
                  Key Forms
                </h2>
                <ul className="space-y-4 staggered-fade-in">
                  <li className="pl-4 border-l-2 border-indigo-500/70 hover:border-purple-400 transition-colors duration-300">
                    <span className="font-bold text-purple-300 block">Flower of Life</span> 
                    <span className="text-indigo-100/80">A pattern of overlapping circles symbolizing creation and unity</span>
                  </li>
                  <li className="pl-4 border-l-2 border-purple-500/70 hover:border-purple-400 transition-colors duration-300">
                    <span className="font-bold text-purple-300 block">Metatron's Cube</span> 
                    <span className="text-indigo-100/80">Contains all 5 Platonic solids; represents the balance of the cosmos</span>
                  </li>
                  <li className="pl-4 border-l-2 border-indigo-500/70 hover:border-purple-400 transition-colors duration-300">
                    <span className="font-bold text-purple-300 block">Golden Ratio (Φ)</span> 
                    <span className="text-indigo-100/80">Found in everything from nautilus shells to the Parthenon</span>
                  </li>
                  <li className="pl-4 border-l-2 border-purple-500/70 hover:border-purple-400 transition-colors duration-300">
                    <span className="font-bold text-purple-300 block">Sri Yantra</span> 
                    <span className="text-indigo-100/80">A complex symbol used in Hindu and Tantric meditation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 rounded-lg backdrop-blur-sm mb-8">
              <p className="text-indigo-100/90 italic">
                These forms are believed to encode the fundamental laws of the universe and can help 
                deepen one's spiritual awareness when meditated upon or used in visualizations.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="relative w-full cosmic-float">
              {/* Decorative elements */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative h-[450px] w-full rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(124,58,237,0.2)]">
                <img 
                  src="/images/resources/sacred-geometry.png" 
                  alt="Sacred Geometry Patterns" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300 flex items-center justify-center">
            <Sparkles className="h-7 w-7 mr-3 text-purple-400" />
            <span>Applications of Sacred Geometry</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 staggered-fade-in">
            <Card className="cosmic-hover bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-indigo-200 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-indigo-400" />
                    Meditation
                  </h3>
                </div>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  Using geometric forms as focal points for meditation helps connect the conscious 
                  mind with universal patterns, enhancing spiritual awareness.
                </p>
              </CardContent>
            </Card>
            
            <Card className="cosmic-hover bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-purple-500/20 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-violet-500"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-purple-200 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-purple-400" />
                    Architecture
                  </h3>
                </div>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-purple-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  From ancient temples to modern buildings, sacred geometry principles create 
                  harmonious spaces that resonate with cosmic energy patterns.
                </p>
              </CardContent>
            </Card>
            
            <Card className="cosmic-hover bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-violet-200 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-violet-400" />
                    Healing Arts
                  </h3>
                </div>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-violet-500 to-transparent"></div>
                <p className="text-indigo-100/80">
                  Many energy healing modalities incorporate sacred geometry to balance chakras 
                  and energy systems, promoting physical and emotional well-being.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-8 rounded-2xl shadow-inner mb-16 border border-indigo-500/20 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-2xl font-semibold mb-6 text-center flex items-center justify-center">
            <Boxes className="h-6 w-6 mr-3 text-purple-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">The Platonic Solids</span>
          </h2>
          <p className="mb-6 text-center text-indigo-100/90 relative z-10">
            These five three-dimensional forms are considered the building blocks of physical reality:
          </p>
          <ul className="grid md:grid-cols-5 gap-4 text-center relative z-10 staggered-fade-in">
            <li className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <span className="font-bold block text-purple-300 mb-1">Tetrahedron</span>
              <span className="text-indigo-100/80">Element: Fire</span>
            </li>
            <li className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <span className="font-bold block text-purple-300 mb-1">Hexahedron</span>
              <span className="text-indigo-100/80">Element: Earth</span>
            </li>
            <li className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <span className="font-bold block text-purple-300 mb-1">Octahedron</span>
              <span className="text-indigo-100/80">Element: Air</span>
            </li>
            <li className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <span className="font-bold block text-purple-300 mb-1">Icosahedron</span>
              <span className="text-indigo-100/80">Element: Water</span>
            </li>
            <li className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <span className="font-bold block text-purple-300 mb-1">Dodecahedron</span>
              <span className="text-indigo-100/80">Element: Ether</span>
            </li>
          </ul>
        </div>
        
        <div className="text-center p-8 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl border border-indigo-500/20 backdrop-blur-sm mb-10 relative cosmic-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <p className="text-lg max-w-2xl mx-auto relative z-10">
            Explore how these universal patterns influence your consciousness and harmony. 
            Our products and music incorporate sacred geometric principles to enhance your 
            cosmic connection and spiritual journey.
          </p>
        </div>
      </div>
    </div>
  );
}
