import { Album, Track } from "@shared/schema";
import { z } from "zod";

// Extended schema to add UI-specific fields
export const ExtendedTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  albumId: z.number().nullable().optional(),
  duration: z.string().nullable().optional(),
  audioUrl: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().nullable().optional(),
  // UI-specific fields
  frequency: z.string().optional(),
  coverArt: z.string().optional(),
  year: z.number().optional(),
  description: z.string().optional()
});

export const ExtendedAlbumSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  releaseDate: z.date().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().nullable().optional(),
  // UI-specific fields
  coverArt: z.string().optional(),
  trackCount: z.number().optional()
});

export type ExtendedTrack = z.infer<typeof ExtendedTrackSchema>;
export type ExtendedAlbum = z.infer<typeof ExtendedAlbumSchema>;

export const cosmicAlbums: ExtendedAlbum[] = [
  {
    id: 1,
    title: "Cosmic Healing Frequencies",
    description: "A journey through the chakras with healing frequencies designed to activate and balance your energy centers.",
    coverArt: "/images/cosmic-music/cosmic-healing-album.svg",
    coverImage: "/images/cosmic-music/cosmic-healing-album.svg",
    releaseDate: new Date("2024-01-15"),
    artist: "Dale the Whale",
    trackCount: 7,
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 2,
    title: "Ethereal Meditation",
    description: "Ambient soundscapes for deep meditation and spiritual connection.",
    coverArt: "/images/cosmic-music/ethereal-meditation-album.svg",
    coverImage: "/images/cosmic-music/ethereal-meditation-album.svg",
    releaseDate: new Date("2023-09-22"),
    artist: "Dale the Whale",
    trackCount: 5,
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 3,
    title: "Quantum Resonance",
    description: "Harmonic frequencies aligned with universal constants for multidimensional healing.",
    coverArt: "/images/cosmic-music/quantum-resonance-album.svg",
    coverImage: "/images/cosmic-music/quantum-resonance-album.svg",
    releaseDate: new Date("2023-05-10"),
    artist: "Dale the Whale",
    trackCount: 6,
    createdAt: new Date(),
    updatedAt: null
  }
];

export const cosmicTracks: ExtendedTrack[] = [
  {
    id: 1,
    title: "Solar Plexus Activation",
    frequency: "528 Hz",
    duration: "15:32",
    coverArt: "/images/cosmic-music/solar-plexus-activation.svg",
    year: 2024,
    artist: "Dale the Whale",
    description: "Activates the solar plexus chakra to enhance personal power and manifestation abilities.",
    albumId: 1,
    audioUrl: "solar-plexus-activation.mp3",
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 2,
    title: "Heart Chakra Resonance",
    frequency: "639 Hz",
    duration: "18:45",
    coverArt: "/images/cosmic-music/heart-chakra-resonance.svg",
    year: 2024,
    artist: "Dale the Whale",
    description: "Opens the heart chakra to promote love, compassion and healing of relationships.",
    albumId: 1,
    audioUrl: "heart-chakra-resonance.mp3",
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 3,
    title: "Third Eye Awakening",
    frequency: "852 Hz",
    duration: "20:18",
    coverArt: "/images/cosmic-music/third-eye-awakening.svg",
    year: 2023,
    artist: "Dale the Whale",
    description: "Activates the third eye to enhance intuition, vision, and spiritual awareness.",
    albumId: 2,
    audioUrl: "third-eye-awakening.mp3",
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 4,
    title: "Root Chakra Grounding",
    frequency: "396 Hz",
    duration: "22:10",
    coverArt: "/images/cosmic-music/root-chakra-grounding.svg",
    year: 2023,
    artist: "Dale the Whale",
    description: "Grounds and stabilizes the root chakra to promote security and connection to Earth.",
    albumId: 2,
    audioUrl: "root-chakra-grounding.mp3",
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 5,
    title: "Crown Connection",
    frequency: "963 Hz",
    duration: "17:33",
    coverArt: "/images/cosmic-music/crown-connection.svg",
    year: 2022,
    artist: "Dale the Whale",
    description: "Connects the crown chakra to cosmic consciousness and universal wisdom.",
    albumId: 3,
    audioUrl: "crown-connection.mp3",
    createdAt: new Date(),
    updatedAt: null
  },
  {
    id: 6,
    title: "Throat Chakra Expression",
    frequency: "741 Hz",
    duration: "19:27",
    coverArt: "/images/cosmic-music/throat-chakra-expression.svg",
    year: 2022,
    artist: "Dale the Whale",
    description: "Opens the throat chakra to enhance authentic expression and truth-speaking.",
    albumId: 3,
    audioUrl: "throat-chakra-expression.mp3",
    createdAt: new Date(),
    updatedAt: null
  }
];