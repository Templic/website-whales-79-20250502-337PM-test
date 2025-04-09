import { Product, ProductCategory } from '@shared/schema';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverArt: string;
  audioSrc: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverArt: string;
  category: string;
  mood?: string;
  frequency?: number;
  chakra?: string;
  tracks: Track[];
  image?: string;
  duration?: string;
}

export const playlists: Playlist[] = [
  {
    id: "playlist-1",
    title: "Chakra Alignment Series",
    description: "A complete journey through all seven chakras to balance your energy",
    coverArt: "/images/products/sacred-geometry.jpg", 
    category: "meditation",
    mood: "balancing",
    image: "/images/products/sacred-geometry.jpg", 
    tracks: [
      {
        id: "track-1",
        title: "Root Chakra Grounding",
        artist: "Cosmic Harmony",
        duration: "10:30",
        coverArt: "/images/products/chakra-root.jpg", 
        audioSrc: "/audio/root-chakra.mp3",
      },
      {
        id: "track-2",
        title: "Sacral Creativity Flow",
        artist: "Cosmic Harmony",
        duration: "9:45",
        coverArt: "/images/products/chakra-sacral.jpg", 
        audioSrc: "/audio/sacral-chakra.mp3",
      },
      {
        id: "track-3",
        title: "Solar Plexus Empowerment",
        artist: "Cosmic Harmony",
        duration: "8:21",
        coverArt: "/images/products/chakra-solar-plexus.jpg", 
        audioSrc: "/audio/solar-plexus.mp3",
      },
      {
        id: "track-4",
        title: "Heart Chakra Opening",
        artist: "Cosmic Harmony",
        duration: "12:15",
        coverArt: "/images/products/chakra-heart.jpg", 
        audioSrc: "/audio/heart-chakra.mp3",
      },
      {
        id: "track-5",
        title: "Throat Chakra Expression",
        artist: "Cosmic Harmony",
        duration: "7:42",
        coverArt: "/images/products/chakra-throat.jpg", 
        audioSrc: "/audio/throat-chakra.mp3",
      },
      {
        id: "track-6",
        title: "Third Eye Awakening",
        artist: "Cosmic Harmony",
        duration: "11:11",
        coverArt: "/images/products/chakra-third-eye.jpg", 
        audioSrc: "/audio/third-eye.mp3",
      },
      {
        id: "track-7",
        title: "Crown Connection",
        artist: "Cosmic Harmony",
        duration: "14:22",
        coverArt: "/images/products/chakra-crown.jpg", 
        audioSrc: "/audio/crown-chakra.mp3",
      },
    ],
  },
  {
    id: "playlist-2",
    title: "Quantum Healing Frequencies",
    description: "Precise frequencies based on quantum physics principles for deep cellular healing",
    coverArt: "/images/products/cosmic-frequency-album.png", 
    category: "healing",
    mood: "restorative",
    frequency: 528,
    image: "/images/products/cosmic-frequency-album.png", 
    tracks: [
      {
        id: "track-8",
        title: "DNA Repair",
        artist: "Cosmic Harmony",
        duration: "20:33",
        coverArt: "/images/products/quantum-healing-1.jpg", 
        audioSrc: "/audio/dna-repair.mp3",
      },
      {
        id: "track-9",
        title: "Cellular Regeneration",
        artist: "Cosmic Harmony",
        duration: "18:47",
        coverArt: "/images/products/quantum-healing-2.jpg", 
        audioSrc: "/audio/cellular-regeneration.mp3",
      },
      {
        id: "track-10",
        title: "Quantum Field Harmonizer",
        artist: "Cosmic Harmony",
        duration: "15:21",
        coverArt: "/images/products/quantum-healing-3.jpg", 
        audioSrc: "/audio/quantum-field.mp3",
      },
      {
        id: "track-11",
        title: "Mitochondrial Activation",
        artist: "Cosmic Harmony",
        duration: "12:15",
        coverArt: "/images/products/quantum-healing-4.jpg", 
        audioSrc: "/audio/mitochondrial.mp3",
      },
    ],
  },
  {
    id: "playlist-3",
    title: "Cosmic Sleep Journey",
    description: "Ambient soundscapes designed to induce deep delta wave sleep patterns",
    coverArt: "https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg", 
    category: "sleep",
    mood: "relaxing",
    frequency: 432,
    image: "https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg", 
    tracks: [
      {
        id: "track-12",
        title: "Theta Gateway",
        artist: "Cosmic Harmony",
        duration: "45:00",
        coverArt: "/images/products/sleep-journey-1.jpg", 
        audioSrc: "/audio/theta-gateway.mp3",
      },
      {
        id: "track-13",
        title: "Delta Dreamscape",
        artist: "Cosmic Harmony",
        duration: "60:00",
        coverArt: "/images/products/sleep-journey-2.jpg", 
        audioSrc: "/audio/delta-dreamscape.mp3",
      },
      {
        id: "track-14",
        title: "Nocturnal Neural Reset",
        artist: "Cosmic Harmony",
        duration: "90:00",
        coverArt: "/images/products/sleep-journey-3.jpg", 
        audioSrc: "/audio/neural-reset.mp3",
      },
    ],
  },
  {
    id: "playlist-4",
    title: "Astral Projection Suite",
    description: "Carefully crafted frequencies to facilitate out-of-body experiences",
    coverArt: "https://i.etsystatic.com/54804470/r/il/af4a91/6479493312/il_1588xN.6479493312_hlw5.jpg", 
    category: "astral",
    mood: "transcendent",
    image: "https://i.etsystatic.com/54804470/r/il/af4a91/6479493312/il_1588xN.6479493312_hlw5.jpg", 
    tracks: [
      {
        id: "track-15",
        title: "Vibrational Tuning",
        artist: "Cosmic Harmony",
        duration: "15:30",
        coverArt: "/images/products/astral-projection-1.jpg", 
        audioSrc: "/audio/vibrational-tuning.mp3",
      },
      {
        id: "track-16",
        title: "Silver Cord Activation",
        artist: "Cosmic Harmony",
        duration: "22:15",
        coverArt: "/images/products/astral-projection-2.jpg", 
        audioSrc: "/audio/silver-cord.mp3",
      },
      {
        id: "track-17",
        title: "Etheric Separation",
        artist: "Cosmic Harmony",
        duration: "30:00",
        coverArt: "/images/products/astral-projection-3.jpg", 
        audioSrc: "/audio/etheric-separation.mp3",
      },
      {
        id: "track-18",
        title: "Astral Guide",
        artist: "Cosmic Harmony",
        duration: "45:00",
        coverArt: "/images/products/astral-projection-4.jpg", 
        audioSrc: "/audio/astral-guide.mp3",
      },
    ],
  },
  {
    id: "playlist-5",
    title: "Sacred Geometry Harmonics",
    description: "Sound frequencies based on the mathematical ratios of sacred geometry",
    coverArt: "https://i.etsystatic.com/54804470/r/il/5eb74f/6431467064/il_1588xN.6431467064_g3jp.jpg", 
    category: "geometry",
    mood: "enlightening",
    image: "https://i.etsystatic.com/54804470/r/il/5eb74f/6431467064/il_1588xN.6431467064_g3jp.jpg", 
    tracks: [
      {
        id: "track-19",
        title: "Fibonacci Sequence",
        artist: "Cosmic Harmony",
        duration: "13:21",
        coverArt: "/images/products/sacred-geometry-1.jpg", 
        audioSrc: "/audio/fibonacci.mp3",
      },
      {
        id: "track-20",
        title: "Golden Ratio",
        artist: "Cosmic Harmony",
        duration: "17:08",
        coverArt: "/images/products/sacred-geometry-2.jpg", 
        audioSrc: "/audio/golden-ratio.mp3",
      },
      {
        id: "track-21",
        title: "Metatron's Cube",
        artist: "Cosmic Harmony",
        duration: "19:19",
        coverArt: "/images/products/sacred-geometry-3.jpg", 
        audioSrc: "/audio/metatron.mp3",
      },
      {
        id: "track-22",
        title: "Flower of Life",
        artist: "Cosmic Harmony",
        duration: "21:00",
        coverArt: "/images/products/sacred-geometry-4.jpg", 
        audioSrc: "/audio/flower-of-life.mp3",
      },
    ],
  },
  {
    id: "playlist-simple-1",
    title: "Ethereal Meditation Ambient",
    description: "Ambient soundscapes for deep meditation",
    category: "meditation",
    image: "https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg",
    coverArt: "https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg",
    duration: "45:00",
    tracks: []
  },
  {
    id: "playlist-simple-2",
    title: "Astral Projection Suite",
    description: "Binaural beats for astral travel and lucid dreaming",
    category: "astral",
    image: "https://i.etsystatic.com/54804470/r/il/af4a91/6479493312/il_1588xN.6479493312_hlw5.jpg",
    coverArt: "https://i.etsystatic.com/54804470/r/il/af4a91/6479493312/il_1588xN.6479493312_hlw5.jpg",
    duration: "30:00",
    tracks: []
  },
  {
    id: "playlist-simple-3",
    title: "Chakra Alignment Series",
    description: "Frequency-tuned meditation for chakra balancing",
    category: "healing",
    image: "https://i.etsystatic.com/54804470/r/il/5eb74f/6431467064/il_1588xN.6431467064_g3jp.jpg",
    coverArt: "https://i.etsystatic.com/54804470/r/il/5eb74f/6431467064/il_1588xN.6431467064_g3jp.jpg",
    duration: "60:00",
    tracks: []
  },
  {
    id: "playlist-simple-4",
    title: "Cosmic Harmony Meditation",
    description: "Sacred geometry sound healing",
    category: "meditation",
    image: "https://i.etsystatic.com/54804470/r/il/aba795/6453363387/il_1588xN.6453363387_iosd.jpg",
    coverArt: "https://i.etsystatic.com/54804470/r/il/aba795/6453363387/il_1588xN.6453363387_iosd.jpg",
    duration: "40:00",
    tracks: []
  },
  {
    id: "playlist-simple-5",
    title: "Delta Wave Sleep Journey",
    description: "Deep sleep frequency entrainment",
    category: "sleep",
    image: "https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg",
    coverArt: "https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg",
    duration: "60:00",
    tracks: []
  },
  {
    id: "playlist-simple-6",
    title: "Quantum Resonance Field",
    description: "Harmonic frequencies aligned with universal constants",
    category: "healing",
    image: "https://i.etsystatic.com/54804470/r/il/5eb74f/6431467064/il_1588xN.6431467064_g3jp.jpg",
    coverArt: "https://i.etsystatic.com/54804470/r/il/5eb74f/6431467064/il_1588xN.6431467064_g3jp.jpg",
    duration: "55:00",
    tracks: []
  },
];

export const defaultProducts: Product[] = [
  {
    id: 1,
    name: "Orca Sunrise Cove Digital Art",
    slug: "orca-sunrise-cove",
    description: "Dale The Whale's signature digital art piece capturing the serene beauty of orcas at sunrise.",
    shortDescription: "Signature digital art print",
    price: "45.00",
    images: ["https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg"],
    inventory: 100,
    featured: true,
    categoryId: 1
  },
  {
    id: 2,
    name: "Divine Cosmic Digital Art",
    slug: "divine-cosmic-art",
    description: "A mesmerizing digital art piece featuring cosmic themes and sacred geometry.",
    shortDescription: "Cosmic themed digital art",
    price: "45.00",
    images: ["https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg"],
    inventory: 100,
    featured: true,
    categoryId: 1
  },
  {
    id: 3,
    name: "Cosmic Healing Vinyl",
    slug: "cosmic-healing-vinyl",
    description: "Limited edition vinyl featuring Dale's cosmic healing frequencies.",
    shortDescription: "Limited edition vinyl",
    price: "30.00",
    images: ["/images/cosmic-journeys.jpg"],
    inventory: 50,
    featured: true,
    categoryId: 2
  },
  {
    id: 4,
    name: "Meditation Guide Bundle",
    slug: "meditation-guide-bundle",
    description: "Complete meditation guide bundle with frequency attunement tracks.",
    shortDescription: "Digital meditation bundle",
    price: "25.00",
    images: ["/images/oceanic-collection.jpg"],
    inventory: 200,
    featured: false,
    categoryId: 2
  }
];

export const productCategories: ProductCategory[] = [
  {
    id: 1,
    name: "Digital Art",
    slug: "digital-art",
    description: "Digital art prints and collections"
  },
  {
    id: 2,
    name: "Music & Meditation",
    slug: "music-meditation",
    description: "Music releases and meditation guides"
  }
];