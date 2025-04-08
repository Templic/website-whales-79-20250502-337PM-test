
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function SacredGeometryPage() {
  useEffect(() => {
    document.title = "Sacred Geometry - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">🔷 Sacred Geometry</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <p className="text-lg mb-6">
            Sacred Geometry explores the universal patterns found in nature and the cosmos. 
            These shapes are seen as the building blocks of creation and are used in spiritual 
            and meditative practices for alignment and insight.
          </p>
          
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Key Forms</h2>
              <ul className="space-y-3">
                <li className="flex flex-col">
                  <span className="font-bold">Flower of Life</span> 
                  <span>A pattern of overlapping circles symbolizing creation and unity</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Metatron's Cube</span> 
                  <span>Contains all 5 Platonic solids; represents the balance of the cosmos</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Golden Ratio (Φ)</span> 
                  <span>Found in everything from nautilus shells to the Parthenon</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Sri Yantra</span> 
                  <span>A complex symbol used in Hindu and Tantric meditation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <p className="text-md italic">
            These forms are believed to encode the fundamental laws of the universe and can help 
            deepen one's spiritual awareness when meditated upon or used in visualizations.
          </p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-xl">
            <img 
              src="/images/resources/sacred-geometry.png" 
              alt="Sacred Geometry Patterns" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Applications of Sacred Geometry</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Meditation</h3>
              <p>
                Using geometric forms as focal points for meditation helps connect the conscious 
                mind with universal patterns, enhancing spiritual awareness.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Architecture</h3>
              <p>
                From ancient temples to modern buildings, sacred geometry principles create 
                harmonious spaces that resonate with cosmic energy patterns.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Healing Arts</h3>
              <p>
                Many energy healing modalities incorporate sacred geometry to balance chakras 
                and energy systems, promoting physical and emotional well-being.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl shadow-inner mb-10">
        <h2 className="text-2xl font-semibold mb-4">The Platonic Solids</h2>
        <p className="mb-4">
          These five three-dimensional forms are considered the building blocks of physical reality:
        </p>
        <ul className="grid md:grid-cols-5 gap-4 text-center">
          <li className="p-3 bg-white dark:bg-slate-700 rounded shadow">
            <span className="font-bold block">Tetrahedron</span>
            <span>Element: Fire</span>
          </li>
          <li className="p-3 bg-white dark:bg-slate-700 rounded shadow">
            <span className="font-bold block">Hexahedron</span>
            <span>Element: Earth</span>
          </li>
          <li className="p-3 bg-white dark:bg-slate-700 rounded shadow">
            <span className="font-bold block">Octahedron</span>
            <span>Element: Air</span>
          </li>
          <li className="p-3 bg-white dark:bg-slate-700 rounded shadow">
            <span className="font-bold block">Icosahedron</span>
            <span>Element: Water</span>
          </li>
          <li className="p-3 bg-white dark:bg-slate-700 rounded shadow">
            <span className="font-bold block">Dodecahedron</span>
            <span>Element: Ether</span>
          </li>
        </ul>
      </div>
      
      <div className="text-center">
        <p className="text-lg max-w-2xl mx-auto">
          Explore how these universal patterns influence your consciousness and harmony. 
          Our products and music incorporate sacred geometric principles to enhance your 
          cosmic connection and spiritual journey.
        </p>
      </div>
    </div>
  );
}
