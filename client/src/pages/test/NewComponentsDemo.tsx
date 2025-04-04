import { AccessibilityControls } from "../../components/common/AccessibilityControls"
import { AlbumShowcase } from "../../components/common/AlbumShowcase"
import { CosmicCollectible, CosmicCollectiblesGrid, CosmicWalletConnect } from "../../components/features/cosmic/CosmicCollectible"
import { Link } from "wouter"

// Mock collectible data for demonstration
const mockCollectibles = [
  {
    id: "1",
    name: "Cosmic Journey",
    description: "A rare digital collectible representing your cosmic journey",
    image: "/placeholder.jpg",
    rarity: "rare" as const,
    acquired: false,
    attributes: [
      { name: "Element", value: "Water" },
      { name: "Chakra", value: "Crown" },
      { name: "Frequency", value: "528 Hz" },
      { name: "Energy", value: "High" }
    ]
  },
  {
    id: "2",
    name: "Sacred Geometry",
    description: "The geometric patterns of the universe",
    image: "/placeholder.jpg",
    rarity: "epic" as const,
    acquired: true,
    tokenId: "0x123456789abcdef",
    attributes: [
      { name: "Pattern", value: "Flower of Life" },
      { name: "Dimension", value: "5D" }
    ]
  },
  {
    id: "3",
    name: "Celestial Sound",
    description: "The music of the spheres captured in digital form",
    image: "/placeholder.jpg",
    rarity: "legendary" as const,
    acquired: false,
    attributes: [
      { name: "Harmonic", value: "432 Hz" },
      { name: "Origin", value: "Pleiades" }
    ]
  },
  {
    id: "4",
    name: "Astral Projection",
    description: "A common collectible for beginning explorers",
    image: "/placeholder.jpg",
    rarity: "common" as const,
    acquired: false
  }
]

// Mock albums for showcase
const mockAlbums = [
  {
    id: 1,
    title: "Cosmic Healing Frequencies",
    description: "A journey through the chakras with healing frequencies",
    image: "/proxy-image(47).jpg",
    year: "2023",
  },
  {
    id: 2,
    title: "Ethereal Meditation",
    description: "Ambient soundscapes for deep meditation",
    image: "/proxy-image(48).jpg",
    year: "2022",
  },
  {
    id: 3,
    title: "Astral Projection",
    description: "Binaural beats for astral travel and lucid dreaming",
    image: "/proxy-image(49).jpg",
    year: "2021",
  },
  {
    id: 4,
    title: "Quantum Resonance",
    description: "Harmonic frequencies aligned with universal constants",
    image: "/proxy-image(47).jpg",
    year: "2020",
  },
]

// Mock claim function
const handleClaim = async (id: string) => {
  console.log(`Claiming collectible with ID: ${id}`)
  // Simulate async operation
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, 2000)
  })
}

export function NewComponentsDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white">
      <header className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">New Components Demo</h1>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            Back to Home
          </Link>
        </div>
        <p className="max-w-2xl text-white/70 mb-8">
          This page demonstrates new components imported from the v0 package, including the Accessibility Controls,
          Album Showcase, and Cosmic Collectibles.
        </p>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-16">
        {/* Accessibility Controls */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2">Accessibility Controls</h2>
          <p className="text-white/70 mb-4">
            The Accessibility Controls component adds a floating button in the bottom right corner that opens a panel of
            accessibility options, including text size, contrast settings, reduced motion, voice navigation, and more.
          </p>
          <div className="bg-black/20 border border-white/10 rounded-lg p-6 flex justify-center">
            <p className="text-center text-white/60">
              Look for the settings icon in the bottom-right corner of the screen to access the Accessibility Controls.
            </p>
          </div>
          <AccessibilityControls />
        </section>

        {/* Album Showcase */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2">Album Showcase</h2>
          <p className="text-white/70 mb-4">
            The Album Showcase component displays a carousel of albums with smooth transitions and interactivity.
          </p>
          <AlbumShowcase albums={mockAlbums} />
        </section>

        {/* Cosmic Collectibles */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2">Cosmic Collectibles</h2>
          <p className="text-white/70 mb-8">
            The Cosmic Collectible components demonstrate interactive digital collectibles with rarity tiers, flip
            animations, and minting functionality.
          </p>

          <div className="space-y-12">
            {/* Wallet Connect */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Wallet Connection</h3>
              <CosmicWalletConnect 
                onConnect={() => console.log("Connect wallet")} 
                onDisconnect={() => console.log("Disconnect wallet")} 
              />
            </div>

            {/* Connected Wallet Example */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Connected Wallet Example</h3>
              <CosmicWalletConnect 
                isConnected={true} 
                address="0x1234567890abcdefghijklmnopqrstuvwxyz" 
                onConnect={() => console.log("Connect wallet")} 
                onDisconnect={() => console.log("Disconnect wallet")} 
              />
            </div>

            {/* Single Collectible */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Single Collectible (click to flip)</h3>
              <div className="max-w-xs mx-auto">
                <CosmicCollectible 
                  {...mockCollectibles[2]} 
                  onClaim={handleClaim} 
                />
              </div>
            </div>

            {/* Collectibles Grid */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Collectibles Grid</h3>
              <CosmicCollectiblesGrid 
                collectibles={mockCollectibles} 
                onClaim={handleClaim} 
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}