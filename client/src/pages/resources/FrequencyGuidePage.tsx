
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function FrequencyGuidePage() {
  useEffect(() => {
    document.title = "Frequency Guide - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">🔊 Frequency Guide</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <p className="text-lg mb-6">
            A detailed breakdown of sound frequencies and their unique impacts on the body, mind, and energy field. 
            Frequencies are commonly used in healing practices and music therapy to promote balance and well-being.
          </p>
          
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Solfeggio Frequencies</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="font-bold mr-2">396 Hz –</span> 
                  <span>Releases fear and guilt</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">417 Hz –</span> 
                  <span>Clears negativity and helps with change</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">528 Hz –</span> 
                  <span>The "Love Frequency," promotes healing and DNA repair</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">639 Hz –</span> 
                  <span>Enhances relationships and communication</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">741 Hz –</span> 
                  <span>Detoxifies cells and awakens intuition</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">852 Hz –</span> 
                  <span>Raises awareness and spiritual connection</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <p className="text-md italic">
            These frequencies are part of the Solfeggio scale, a set of sacred tones used in ancient 
            Gregorian chants and believed to have profound healing effects.
          </p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-xl">
            <img 
              src="/images/resources/frequency-guide.png" 
              alt="Frequency Guide Chart" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">How to Use Frequencies for Healing</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Sound Immersion</h3>
              <p>
                Listen to specific frequencies through headphones or speakers. 
                Many meditation tracks and healing music are tuned to these specific Hz levels.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Vibrational Therapy</h3>
              <p>
                Use tuning forks, singing bowls, or other instruments calibrated to specific 
                frequencies to introduce these vibrations directly to the body.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Toning & Vocals</h3>
              <p>
                Practice vocal toning by singing or humming at specific frequencies to 
                resonate within your body and create healing vibrations.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Music Composition</h3>
              <p>
                For musicians, consider composing or tuning instruments to healing frequencies 
                rather than the standard A=440Hz.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <div className="text-center mb-10">
        <p className="text-lg max-w-2xl mx-auto">
          Incorporate these frequencies into your daily practices for a more balanced energy field 
          and enhanced well-being. Many of our meditation tracks and sound healing products are 
          calibrated to these specific frequencies.
        </p>
      </div>
    </div>
  );
}
