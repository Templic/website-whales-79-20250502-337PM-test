import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Music, Waves, Zap, Heart, VolumeX, Sparkles } from "lucide-react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import SacredGeometry from "@/components/cosmic/SacredGeometry";

export default function SoundHealingPage() {
  const pageTopRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    document.title = "Sound Healing - Dale Loves Whales";
    // Scroll to top of page when component mounts
    pageTopRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-indigo-950 to-violet-950 text-white relative overflow-hidden" ref={pageTopRef}>
      {/* Cosmic Background */}
      <CosmicBackground opacity={0.5} color="blue" nebulaEffect={true} />
      
      {/* Sacred geometry elements throughout the page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - multiple layers */}
        <div className="absolute top-40 left-5 opacity-15 hidden md:block">
          <SacredGeometry type="vesica-piscis" size={120} animate={true} color="rgba(100, 150, 255, 0.5)" />
          <div className="absolute -left-10 -top-10">
            <SacredGeometry type="flower-of-life" size={60} animate={true} color="rgba(120, 170, 255, 0.4)" />
          </div>
        </div>
        <div className="absolute bottom-40 left-5 opacity-15 hidden md:block">
          <SacredGeometry type="sri-yantra" size={120} animate={true} color="rgba(140, 90, 255, 0.5)" />
          <div className="absolute -left-5 bottom-20">
            <SacredGeometry type="seed-of-life" size={40} animate={true} color="rgba(160, 120, 255, 0.4)" />
          </div>
        </div>
        
        {/* Right margin sacred geometry - multiple layers */}
        <div className="absolute top-40 right-5 opacity-15 hidden md:block">
          <SacredGeometry type="hexagon" size={120} animate={true} color="rgba(90, 140, 255, 0.5)" />
          <div className="absolute right-10 top-20">
            <SacredGeometry type="torus" size={50} animate={true} color="rgba(100, 180, 255, 0.4)" />
          </div>
        </div>
        <div className="absolute bottom-40 right-5 opacity-15 hidden md:block">
          <SacredGeometry type="metatron-cube" size={120} animate={true} color="rgba(110, 90, 255, 0.5)" />
          <div className="absolute right-5 bottom-30">
            <SacredGeometry type="tree-of-life" size={50} animate={true} color="rgba(120, 100, 255, 0.4)" />
          </div>
        </div>
        
        {/* Center floating sacred geometries */}
        <div className="absolute left-1/2 top-1/4 transform -translate-x-1/2 opacity-10">
          <SacredGeometry type="merkaba" size={200} animate={true} color="rgba(130, 100, 255, 0.15)" />
        </div>
        <div className="absolute left-1/4 top-2/3 transform -translate-x-1/2 opacity-8">
          <SacredGeometry type="fibonacci-spiral" size={150} animate={true} color="rgba(80, 130, 255, 0.15)" rotationSpeed={0.2} />
        </div>
        <div className="absolute right-1/4 top-1/3 transform translate-x-1/2 opacity-8">
          <SacredGeometry type="icosahedron" size={100} animate={true} color="rgba(150, 110, 255, 0.15)" rotationSpeed={0.15} />
        </div>
      </div>
      <div className="max-w-5xl mx-auto py-16 px-4 relative z-10">
        {/* Header */}
        <div className="relative">
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <header className="text-center relative mb-14">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-900/30 rounded-full">
              <Music className="h-10 w-10 text-blue-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
            Sound Healing
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mb-6"></div>
          <p className="text-lg text-blue-100/90 max-w-2xl mx-auto">
            An ancient therapeutic practice that uses sound waves and specific frequencies 
            to improve physical and emotional health, balance energy, and elevate consciousness.
          </p>
        </header>
        
        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/20 shadow-lg mb-8 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
              <CardContent className="p-8 relative">
                <h2 className="text-2xl font-semibold mb-5 flex items-center text-blue-200">
                  <Waves className="h-6 w-6 mr-3 text-blue-400" />
                  The Science Behind Sound Healing
                </h2>
                <ul className="space-y-4">
                  <li className="pl-4 border-l-2 border-blue-500">
                    <span className="font-bold text-blue-300 block">Entrainment</span> 
                    <span className="text-blue-100/80">The process where brain waves synchronize with external sound frequencies</span>
                  </li>
                  <li className="pl-4 border-l-2 border-indigo-500">
                    <span className="font-bold text-indigo-300 block">Resonance</span> 
                    <span className="text-blue-100/80">When sound vibrations match and amplify the natural frequencies of body tissues</span>
                  </li>
                  <li className="pl-4 border-l-2 border-violet-500">
                    <span className="font-bold text-violet-300 block">Binaural Beats</span> 
                    <span className="text-blue-100/80">When slightly different frequencies in each ear create a third frequency in the brain</span>
                  </li>
                  <li className="pl-4 border-l-2 border-purple-500">
                    <span className="font-bold text-purple-300 block">Cymatics</span> 
                    <span className="text-blue-100/80">The study of visible sound wave patterns and their effects on physical matter</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-lg backdrop-blur-sm mb-8">
              <p className="text-blue-100/90 italic">
                Sound healing is not just a spiritual practice; it has scientific basis in physics, neuroscience, 
                and psychology, with growing research supporting its effectiveness.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="relative w-full">
              {/* Decorative elements */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(30,64,175,0.3)]">
                <img 
                  src="/images/resources/sound-healing.png" 
                  alt="Sound Healing Instruments" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex gap-2">
                    <Badge className="bg-blue-700 hover:bg-blue-600 text-white border-none">Healing</Badge>
                    <Badge className="bg-indigo-700 hover:bg-indigo-600 text-white border-none">Vibration</Badge>
                    <Badge className="bg-violet-700 hover:bg-violet-600 text-white border-none">Harmony</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sound Healing Instruments */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300 flex items-center justify-center">
            <Waves className="h-7 w-7 mr-3 text-blue-400" />
            <span>Common Sound Healing Instruments</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/20 backdrop-blur-sm overflow-hidden group hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-blue-200">Singing Bowls</h3>
                  <Badge variant="outline" className="border-blue-500 text-blue-300 group-hover:bg-blue-900/30">Tibetan & Crystal</Badge>
                </div>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-blue-500 to-transparent"></div>
                <p className="text-blue-100/80">
                  Metal or crystal bowls that produce rich harmonic overtones when struck or rubbed. 
                  Different sizes produce different notes that correspond to specific chakras.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border border-indigo-700/20 backdrop-blur-sm overflow-hidden group hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-indigo-200">Tuning Forks</h3>
                  <Badge variant="outline" className="border-indigo-500 text-indigo-300 group-hover:bg-indigo-900/30">Precise</Badge>
                </div>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                <p className="text-blue-100/80">
                  Two-pronged metal instruments that produce specific frequencies. Often used 
                  for targeted healing by placing directly on or near the body.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-700/20 backdrop-blur-sm overflow-hidden group hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-violet-200">Gongs</h3>
                  <Badge variant="outline" className="border-violet-500 text-violet-300 group-hover:bg-violet-900/30">Powerful</Badge>
                </div>
                <div className="mb-4 h-0.5 w-16 bg-gradient-to-r from-violet-500 to-transparent"></div>
                <p className="text-blue-100/80">
                  Large metal discs that create deep, resonant sounds. Used in sound baths to 
                  facilitate profound states of relaxation and transformation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-700/20 backdrop-blur-sm rounded-2xl p-10 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl font-semibold mb-8 text-center flex items-center justify-center">
            <Zap className="h-7 w-7 mr-3 text-yellow-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">Sound Healing Benefits</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-700/30">
              <h3 className="text-xl font-medium mb-4 text-blue-300 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Physical Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Reduces stress and anxiety</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Lowers blood pressure</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Improves sleep quality</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Alleviates pain</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Boosts immune function</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-700/30">
              <h3 className="text-xl font-medium mb-4 text-indigo-300 flex items-center">
                <VolumeX className="h-5 w-5 mr-2" />
                Mental & Emotional Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Clears emotional blockages</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Enhances mental clarity</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Elevates mood and reduces depression</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Increases focus and concentration</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 mr-2"></div>
                  <span className="text-blue-100/90">Promotes deep relaxation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Experiencing Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">
            Experiencing Sound Healing
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-800/20 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-4 text-blue-200">Sound Baths</h3>
                <p className="text-blue-100/80">
                  Group experiences where participants lie down while a practitioner plays various instruments, 
                  creating immersive sound waves that wash over participants.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-800/20 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-4 text-indigo-200">Digital Sound Healing</h3>
                <p className="text-blue-100/80">
                  Recorded tracks designed with specific frequencies for various healing purposes. 
                  These can be used at home with headphones or speakers for a convenient practice.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-800/20 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-medium mb-4 text-violet-200">Private Sessions</h3>
                <p className="text-blue-100/80">
                  One-on-one experiences with a sound healer who can customize the session to 
                  address your specific physical, emotional, or energetic needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Frequency Visualization Section */}
        <section className="mb-16 relative">
          <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-10 hidden lg:block">
            <SacredGeometry type="fibonacci-spiral" size={180} animate={true} color="rgba(100, 150, 255, 0.4)" />
          </div>
          <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 opacity-10 hidden lg:block">
            <SacredGeometry type="flower-of-life" size={180} animate={true} color="rgba(140, 120, 255, 0.4)" />
          </div>
          
          <h2 className="text-3xl font-semibold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 flex items-center justify-center">
            <Sparkles className="h-7 w-7 mr-3 text-blue-400" />
            <span>Frequency Visualization</span>
          </h2>
          
          <div className="bg-gradient-to-br from-blue-900/20 to-violet-900/20 border border-indigo-700/20 backdrop-blur-sm rounded-2xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <SacredGeometry type="wave-circle" size={600} animate={true} color="rgba(255, 255, 255, 0.8)" />
            </div>
            <div className="relative z-10 grid md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-900/30 rounded-xl border border-blue-800/30 backdrop-blur-sm">
                <h3 className="text-blue-300 font-medium mb-2">432 Hz</h3>
                <p className="text-blue-100/80 text-sm">Natural frequency that resonates with the universe</p>
                <div className="mt-3 h-24 flex items-center justify-center">
                  <SacredGeometry type="wave-pattern" size={100} animate={true} color="rgba(59, 130, 246, 0.6)" />
                </div>
              </div>
              <div className="p-4 bg-indigo-900/30 rounded-xl border border-indigo-800/30 backdrop-blur-sm">
                <h3 className="text-indigo-300 font-medium mb-2">528 Hz</h3>
                <p className="text-blue-100/80 text-sm">The "Miracle Tone" - repairs DNA and brings transformation</p>
                <div className="mt-3 h-24 flex items-center justify-center">
                  <SacredGeometry type="sacred-spiral" size={100} animate={true} color="rgba(99, 102, 241, 0.6)" />
                </div>
              </div>
              <div className="p-4 bg-violet-900/30 rounded-xl border border-violet-800/30 backdrop-blur-sm">
                <h3 className="text-violet-300 font-medium mb-2">639 Hz</h3>
                <p className="text-blue-100/80 text-sm">Enhances communication and harmonizes relationships</p>
                <div className="mt-3 h-24 flex items-center justify-center">
                  <SacredGeometry type="harmony-pattern" size={100} animate={true} color="rgba(139, 92, 246, 0.6)" />
                </div>
              </div>
              <div className="p-4 bg-purple-900/30 rounded-xl border border-purple-800/30 backdrop-blur-sm">
                <h3 className="text-purple-300 font-medium mb-2">852 Hz</h3>
                <p className="text-blue-100/80 text-sm">Awakens intuition and returns spiritual order</p>
                <div className="mt-3 h-24 flex items-center justify-center">
                  <SacredGeometry type="merkaba" size={100} animate={true} color="rgba(168, 85, 247, 0.6)" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center p-8 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-2xl border border-blue-700/20 backdrop-blur-sm relative">
          <div className="absolute -top-5 -left-5 w-20 h-20 bg-blue-500/30 rounded-full blur-xl"></div>
          <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-indigo-500/30 rounded-full blur-xl"></div>
          
          {/* Sacred geometry behind CTA text */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <SacredGeometry type="dodecahedron" size={300} animate={true} color="rgba(255, 255, 255, 0.8)" rotationSpeed={0.1} />
          </div>
          
          <p className="text-xl max-w-3xl mx-auto mb-8 text-blue-100 relative z-10">
            Our music incorporates sound healing principles and specific frequencies to enhance your 
            well-being. Explore our tracks to experience the healing power of sound in your daily life.
          </p>
          
          <div className="relative z-10">
            <Link href="/music-release">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none shadow-lg shadow-blue-900/30 text-white px-8 py-6">
                <Music className="mr-2 h-5 w-5" />
                Experience Our Healing Music
              </Button>
            </Link>
          </div>
          
          {/* Animated sacred geometry circles */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-30 pointer-events-none flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDuration: '2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" style={{ animationDuration: '2.5s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}