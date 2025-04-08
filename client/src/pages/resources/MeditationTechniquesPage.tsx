import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MeditationTechniquesPage() {
  useEffect(() => {
    document.title = "Meditation Techniques - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">🧘 Meditation Techniques</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <p className="text-lg mb-6">
            Meditation is a powerful practice for developing mindfulness, inner peace, and spiritual connection.
            There are many approaches to meditation, each with unique benefits for the mind, body, and spirit.
          </p>
          
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-lg mb-6">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Foundational Techniques</h2>
              <ul className="space-y-3">
                <li className="flex flex-col">
                  <span className="font-bold">Mindfulness Meditation</span> 
                  <span>Focuses on being present and observing thoughts without judgment</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Loving-Kindness (Metta)</span> 
                  <span>Cultivates compassion and good wishes for self and others</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Breath Awareness</span> 
                  <span>Using the breath as an anchor to maintain focus and calm the mind</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-bold">Visualization</span> 
                  <span>Creating mental images to promote healing, manifestation, or spiritual insight</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <p className="text-md italic">
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
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Advanced Meditation Practices</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Chakra Meditation</h3>
              <p>
                Focus on the seven main energy centers in the body to balance energy flow and 
                address specific physical, emotional, or spiritual issues.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Sound Bath Meditation</h3>
              <p>
                Immerse yourself in healing frequencies from singing bowls, gongs, or tuning 
                forks to facilitate deep relaxation and energetic alignment.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Third Eye Meditation</h3>
              <p>
                Focus attention on the space between the eyebrows (the third eye or ajna chakra) 
                to enhance intuition, clarity, and spiritual awareness.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">Kundalini Meditation</h3>
              <p>
                Combines breathing techniques, mantras, and specific postures to awaken dormant 
                spiritual energy at the base of the spine.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl shadow-inner mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Starting Your Practice</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-center">⏱️ Start Small</h3>
            <p>Begin with just 5-10 minutes daily. Consistency is more important than duration.</p>
          </div>
          
          <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-center">🪑 Create Space</h3>
            <p>Designate a quiet, comfortable place for your practice with minimal distractions.</p>
          </div>
          
          <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2 text-center">🧠 Be Patient</h3>
            <p>Don't judge your progress. A wandering mind is normal; simply return to your focus.</p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-lg max-w-2xl mx-auto">
          Explore our guided meditations and frequency-based sound healing tracks to enhance your 
          meditation practice and deepen your cosmic connection.
        </p>
      </div>
    </div>
  );
}