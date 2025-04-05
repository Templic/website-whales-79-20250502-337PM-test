
import { useEffect } from "react";

export default function FAQPage() {
  useEffect(() => {
    document.title = "FAQ - Dale Loves Whales";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-2">What is cosmic music?</h2>
          <p className="text-lg">
            Cosmic music is a unique blend of frequencies and rhythms designed to elevate consciousness
            and create transformative experiences.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">How can I collaborate?</h2>
          <p className="text-lg">
            Visit our Collaboration page to learn about opportunities for artistic partnerships
            and community involvement.
          </p>
        </section>
      </div>
    </div>
  );
}
