"use client"

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sample album data
const albums = [
  {
    id: 1,
    title: "Cosmic Healing Frequencies",
    description: "A journey through the chakras with healing frequencies",
    image: "/images/products/cosmic-frequency-album.png",
    year: "2023",
  },
  {
    id: 2,
    title: "Ethereal Meditation Ambient",
    description: "Ambient soundscapes for deep meditation",
    image: "/images/products/sacred-geometry.jpg",
    year: "2023",
  },
  {
    id: 3,
    title: "Astral Projection Suite",
    description: "Guided journey for astral exploration",
    image: "/images/products/crystal-bowl.jpg",
    year: "2023",
  },
  {
    id: 4,
    title: "Chakra Alignment Series",
    description: "Seven frequencies for chakra balancing",
    image: "/images/products/meditation-cushion.jpg",
    year: "2023",
  },
  {
    id: 5,
    title: "Quantum Resonance Field",
    description: "Harmonic frequencies aligned with universal constants",
    image: "/images/products/cosmic-frequency-album.png",
    year: "2022",
  },
  {
    id: 6,
    title: "Sacred Geometry Harmonics",
    description: "Sound frequencies based on sacred geometry patterns",
    image: "/images/products/sacred-geometry.jpg",
    year: "2022",
  },
  {
    id: 7,
    title: "Crystal Bowl Attunement",
    description: "Pure crystal bowl resonance for energy clearing",
    image: "/images/products/crystal-bowl.jpg",
    year: "2021",
  },
];

interface AlbumShowcaseProps {
  customAlbums?: Array<{
    id: number;
    title: string;
    description: string;
    image: string;
    year: string;
  }>;
  className?: string;
}

export function AlbumShowcase({ customAlbums, className }: AlbumShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayAlbums = customAlbums || albums;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === displayAlbums.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? displayAlbums.length - 1 : prevIndex - 1));
  };

  return (
    <div className={cn("relative w-full overflow-hidden py-10", className)}>
      <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="h-12 w-12 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="sr-only">Previous album</span>
        </Button>
      </div>

      <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="h-12 w-12 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Next album</span>
        </Button>
      </div>

      <div className="relative mx-auto flex max-w-5xl items-center justify-center">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayAlbums.map((album, index) => {
            // Calculate position relative to current index
            const position = (index - currentIndex + displayAlbums.length) % displayAlbums.length;

            return (
              <div
                key={album.id}
                className={cn(
                  "transition-all duration-500 ease-in-out",
                  position === 0
                    ? "z-20 scale-100 opacity-100 md:col-span-1"
                    : position === 1 || position === displayAlbums.length - 1
                      ? "z-10 scale-90 opacity-70"
                      : "scale-80 opacity-40",
                )}
              >
                <div className="overflow-hidden rounded-xl bg-black/20 p-4 backdrop-blur-sm">
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <img
                      src={album.image}
                      alt={album.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 space-y-2 text-center">
                    <h3 className="text-lg font-bold text-white">{album.title}</h3>
                    <p className="text-sm text-white/70">{album.description}</p>
                    <p className="text-xs text-white/50">{album.year}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}