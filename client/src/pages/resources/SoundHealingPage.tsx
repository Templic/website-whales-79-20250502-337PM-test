import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SoundHealingPage() {
  useEffect(() => {
    document.title = "Sound Healing - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">🎵 Sound Healing</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <p className="text-lg mb-6">
            Sound healing is an ancient therapeutic practice that uses sound waves and specific frequencies 
            to improve physical and emotional health, balance energy, and elevate consciousness.
          </p>
          
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">The Science Behind Sound Healing</h2>
              <ul className="space-y-3">
                <li className="flex flex-col">
                  <span className="font-bold">Entrainment</span> 
                  <span>The process where brain waves synchronize with external sound frequencies</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Resonance</span> 
                  <span>When sound vibrations match and amplify the natural frequencies of body tissues</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Binaural Beats</span> 
                  <span>When slightly different frequencies in each ear create a third frequency in the brain</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Cymatics</span> 
                  <span>The study of visible sound wave patterns and their effects on physical matter</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <p className="text-md italic">
            Sound healing is not just a spiritual practice; it has scientific basis in physics, neuroscience, 
            and psychology, with growing research supporting its effectiveness.
          </p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-xl">
            <img 
              src="/images/resources/sound-healing.png" 
              alt="Sound Healing Instruments" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Common Sound Healing Instruments</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium">Singing Bowls</h3>
                <Badge variant="outline">Tibetan & Crystal</Badge>
              </div>
              <p>
                Metal or crystal bowls that produce rich harmonic overtones when struck or rubbed. 
                Different sizes produce different notes that correspond to specific chakras.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium">Tuning Forks</h3>
                <Badge variant="outline">Precise</Badge>
              </div>
              <p>
                Two-pronged metal instruments that produce specific frequencies. Often used 
                for targeted healing by placing directly on or near the body.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium">Gongs</h3>
                <Badge variant="outline">Powerful</Badge>
              </div>
              <p>
                Large metal discs that create deep, resonant sounds. Used in sound baths to 
                facilitate profound states of relaxation and transformation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl shadow-inner mb-10">
        <h2 className="text-2xl font-semibold mb-4">Sound Healing Benefits</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-medium mb-2">Physical Benefits</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reduces stress and anxiety</li>
              <li>Lowers blood pressure</li>
              <li>Improves sleep quality</li>
              <li>Alleviates pain</li>
              <li>Boosts immune function</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">Mental & Emotional Benefits</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Clears emotional blockages</li>
              <li>Enhances mental clarity</li>
              <li>Elevates mood and reduces depression</li>
              <li>Increases focus and concentration</li>
              <li>Promotes deep relaxation</li>
            </ul>
          </div>
        </div>
      </div>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Experiencing Sound Healing</h2>
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Sound Baths</h3>
              <p>
                Group experiences where participants lie down while a practitioner plays various instruments, 
                creating immersive sound waves that wash over participants.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Digital Sound Healing</h3>
              <p>
                Recorded tracks designed with specific frequencies for various healing purposes. 
                These can be used at home with headphones or speakers for a convenient practice.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Private Sessions</h3>
              <p>
                One-on-one experiences with a sound healer who can customize the session to 
                address your specific physical, emotional, or energetic needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <div className="text-center">
        <p className="text-lg max-w-2xl mx-auto">
          Our music incorporates sound healing principles and specific frequencies to enhance your 
          well-being. Explore our tracks to experience the healing power of sound in your daily life.
        </p>
      </div>
    </div>
  );
}