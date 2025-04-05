
import { useEffect } from "react";

export default function FrequencyGuidePage() {
  useEffect(() => {
    document.title = "Frequency Guide - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Frequency Guide</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Understanding Sound Frequencies</h2>
        <p className="text-lg mb-4">
          Sound frequencies are measured in Hertz (Hz) and each frequency range has unique properties
          and effects on human consciousness and wellbeing.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Common Frequency Ranges</h2>
        <ul className="space-y-4">
          <li>
            <h3 className="text-xl font-medium">432 Hz - Earth Frequency</h3>
            <p>Known as the natural frequency of the universe</p>
          </li>
          <li>
            <h3 className="text-xl font-medium">528 Hz - Transformation</h3>
            <p>Associated with DNA repair and transformation</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
