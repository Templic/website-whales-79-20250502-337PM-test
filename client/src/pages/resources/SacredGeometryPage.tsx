
import { useEffect } from "react";

export default function SacredGeometryPage() {
  useEffect(() => {
    document.title = "Sacred Geometry - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Sacred Geometry</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">The Language of Creation</h2>
        <p className="text-lg mb-4">
          Sacred geometry is the foundational patterns that create everything in existence.
          These patterns are found throughout nature and form the basis of music, light, and consciousness.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Patterns</h2>
        <ul className="space-y-4">
          <li>
            <h3 className="text-xl font-medium">The Flower of Life</h3>
            <p>The fundamental pattern of creation</p>
          </li>
          <li>
            <h3 className="text-xl font-medium">The Merkaba</h3>
            <p>The geometric vehicle of light</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
