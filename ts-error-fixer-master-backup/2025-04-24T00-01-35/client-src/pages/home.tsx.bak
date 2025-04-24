import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container py-8 space-y-8">
      {/* Hero Section */}
      <section className="relative rounded-lg overflow-hidden bg-gradient-to-r from-cyan-500 via-pink-500 to-orange-500 p-1">
        <div className="bg-background rounded-lg p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-500 to-pink-500 bg-clip-text text-transparent mb-4">
                Feels So Good
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                The latest single from Dale The Whale & AC3-2085
              </p>
              <a 
                href="https://open.spotify.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Listen Now
              </a>
            </div>
            <div>
              <img 
                src="/album.jpg" 
                alt="Feels So Good Album Cover" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Latest Releases</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Feels So Good</h3>
              <p className="text-muted-foreground mb-4">Single • 2024</p>
              <a href="#" className="text-primary hover:underline">Listen Now</a>
            </CardContent>
          </Card>
          {/* Add more cards for other releases */}
        </div>
      </section>
    </div>
  );
}
