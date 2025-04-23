import { MerchandiseStorytelling, ProductCreationProcess } from "@/components/merchandise-storytelling"
import { CosmicText } from "@/components/cosmic-text"
import { CosmicBackground } from "@/components/cosmic-background"

// Sample data for merchandise products
const sampleProducts = [
  {
    id: "product-1",
    name: "Crystal Frequency Pendant",
    price: 89.99,
    image: "/placeholder.svg?height=500&width=500",
    description: "Handcrafted pendant with embedded quartz crystal tuned to 528 Hz frequency",
    colors: ["#9333EA", "#4F46E5", "#0EA5E9"],
    sizes: ["Small", "Medium", "Large"],
    inStock: true,
    hasStory: true,
  },
  {
    id: "product-2",
    name: "Cosmic Consciousness Meditation Cushion",
    price: 129.99,
    image: "/placeholder.svg?height=500&width=500",
    description: "Ergonomic meditation cushion with sacred geometry patterns and memory foam core",
    colors: ["#1E293B", "#334155", "#475569"],
    sizes: ["Standard", "Large"],
    inStock: true,
    hasStory: true,
  },
  {
    id: "product-3",
    name: "Harmonic Resonance Sound Bowl",
    price: 249.99,
    image: "/placeholder.svg?height=500&width=500",
    description: "Hand-hammered Tibetan singing bowl tuned to the heart chakra frequency",
    colors: ["#B45309", "#92400E", "#78350F"],
    inStock: true,
    hasStory: true,
  },
  {
    id: "product-4",
    name: "Quantum Field Harmonizer",
    price: 399.99,
    image: "/placeholder.svg?height=500&width=500",
    description: "Advanced device that generates scalar waves to harmonize your living space",
    inStock: false,
    hasStory: true,
  },
  {
    id: "product-5",
    name: "Cosmic Alignment T-Shirt",
    price: 39.99,
    image: "/placeholder.svg?height=500&width=500",
    description: "Organic cotton t-shirt with sacred geometry design printed with consciousness-infused inks",
    colors: ["#000000", "#1E293B", "#7E22CE"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    inStock: true,
    hasStory: true,
  },
  {
    id: "product-6",
    name: "Astral Projection Eye Mask",
    price: 59.99,
    image: "/placeholder.svg?height=500&width=500",
    description: "Light-blocking eye mask with embedded neodymium magnets to stimulate the pineal gland",
    colors: ["#000000", "#7E22CE"],
    inStock: true,
    hasStory: true,
  },
]

// Sample data for merchandise stories
const sampleStories = [
  {
    id: "story-1",
    title: "The Crystal Frequency Pendant",
    description: "A journey from Himalayan quartz to frequency-infused wearable art",
    image: "/placeholder.svg?height=600&width=800",
    productId: "product-1",
    storyContent: [
      {
        heading: "Sacred Origins",
        text: "Each Crystal Frequency Pendant begins its journey in the high altitudes of the Himalayan mountains, where we source only the purest quartz crystals from ethical, small-scale miners who have worked these mountains for generations.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Frequency Infusion",
        text: "The raw crystals are carefully selected for clarity and energetic potential, then undergo a 7-day process of frequency infusion. Using custom-built sound chambers, each crystal is exposed to the 528 Hz 'Miracle' frequency—known for its healing and transformative properties—for 8 hours daily.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Artisanal Crafting",
        text: "Our master jewelers, trained in both traditional metalsmithing and sacred geometry, handcraft each pendant setting from recycled sterling silver. The design incorporates the Fibonacci spiral to amplify the crystal's energetic output and create a harmonious field around the wearer.",
        image: "/placeholder.svg?height=400&width=600",
      },
    ],
  },
  {
    id: "story-2",
    title: "The Cosmic Consciousness Meditation Cushion",
    description: "From ancient wisdom to modern ergonomics",
    image: "/placeholder.svg?height=600&width=800",
    productId: "product-2",
    storyContent: [
      {
        heading: "Ancient Wisdom",
        text: "Our meditation cushions are designed based on ancient Zen traditions, where the proper posture was considered essential for reaching higher states of consciousness. We've studied historical texts and consulted with meditation masters to understand the ideal sitting position for spinal alignment and energy flow.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Sacred Geometry Patterns",
        text: "Each cushion is adorned with hand-printed sacred geometry patterns that serve as visual meditation tools. These patterns—including the Flower of Life, Sri Yantra, and Metatron's Cube—have been used for millennia to represent cosmic consciousness and facilitate spiritual awakening.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Sustainable Materials",
        text: "We use only organic buckwheat hulls and GOTS-certified organic cotton, grown without pesticides or harmful chemicals. The memory foam core is made from plant-based materials rather than petroleum products, ensuring your meditation practice remains in harmony with the earth.",
        image: "/placeholder.svg?height=400&width=600",
      },
    ],
  },
  {
    id: "story-3",
    title: "The Harmonic Resonance Sound Bowl",
    description: "From Himalayan metals to heart-opening sound therapy",
    image: "/placeholder.svg?height=600&width=800",
    productId: "product-3",
    storyContent: [
      {
        heading: "Seven Sacred Metals",
        text: "Each Harmonic Resonance Sound Bowl contains seven sacred metals—gold, silver, copper, iron, tin, lead, and mercury (in safe, bound form)—corresponding to the seven classical planets in ancient cosmology. These metals are sourced ethically and combined in precise proportions according to ancient Tibetan metallurgical traditions.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Hand-Hammering Process",
        text: "Our master craftspeople in Nepal hand-hammer each bowl for over 30 hours, working in rhythm with specific mantras that infuse the bowl with intention. This traditional process creates the bowl's unique harmonic overtones that cannot be replicated by machine manufacturing.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Heart Chakra Tuning",
        text: "The finished bowls are precisely tuned to the frequency of 639 Hz, which corresponds to the heart chakra. This frequency promotes love, compassion, and interpersonal harmony. Each bowl undergoes acoustic testing to ensure it produces this exact frequency as its fundamental tone, with harmonious overtones that balance all seven chakras.",
        image: "/placeholder.svg?height=400&width=600",
      },
    ],
  },
  {
    id: "story-4",
    title: "The Quantum Field Harmonizer",
    description: "From theoretical physics to practical consciousness technology",
    image: "/placeholder.svg?height=600&width=800",
    productId: "product-4",
    storyContent: [
      {
        heading: "Quantum Research",
        text: "The Quantum Field Harmonizer was developed over seven years of research in collaboration with quantum physicists and consciousness researchers. It applies principles from quantum field theory to generate scalar waves that help organize the zero-point energy field in your living space.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Sacred Geometry Architecture",
        text: "The device's internal components are arranged according to the principles of sacred geometry, specifically the Flower of Life pattern. This arrangement creates a coherent energy field that extends approximately 30 feet in all directions, harmonizing the quantum fluctuations within this sphere.",
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        heading: "Consciousness-Responsive Technology",
        text: "Unlike ordinary electronic devices, the Quantum Field Harmonizer contains a special quartz crystal core that responds to human consciousness and intention. Users can program their specific intentions into the device through a simple meditation process, allowing the harmonizer to amplify these intentions within the quantum field.",
        image: "/placeholder.svg?height=400&width=600",
      },
    ],
  },
]

// Sample data for creation process
const creationProcessSteps = [
  {
    title: "Cosmic Inspiration",
    description:
      "Each product begins as a vision received during deep meditation states. Our designers connect with higher consciousness to channel designs that serve specific spiritual purposes and energy functions.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "Sacred Material Selection",
    description:
      "We source only the highest quality materials with minimal environmental impact. Each material is selected not only for its physical properties but also for its energetic resonance with the product's intended purpose.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "Conscious Crafting",
    description:
      "Our artisans work in a specially designed space with purified energy fields. They maintain specific states of consciousness while crafting, infusing each product with intention and positive energy.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "Frequency Infusion",
    description:
      "Every product undergoes a 24-hour process of sound bath treatment with specific healing frequencies. This process imprints the frequency patterns into the molecular structure of the materials.",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "Energy Testing",
    description:
      "Before reaching you, each item is tested by our team of energy sensitives and intuitives who ensure the product carries the intended energetic signature and is free from discordant energies.",
    image: "/placeholder.svg?height=400&width=600",
  },
]

export default function MerchandisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/90 to-indigo-950 relative">
      <CosmicBackground />

      {/* Header */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <CosmicText variant="title" glowColor="rgba(139, 92, 246, 0.5)">
              Cosmic Creations
            </CosmicText>
            <CosmicText variant="body" className="mt-4 text-white/80 max-w-xl mx-auto" delay={0.5}>
              Explore our collection of consciousness tools, frequency-infused jewelry, and sacred objects designed to
              enhance your spiritual journey.
            </CosmicText>
          </div>
        </div>
      </section>

      {/* Merchandise Storytelling */}
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <MerchandiseStorytelling
            products={sampleProducts}
            stories={sampleStories}
            onAddToCart={(productId) => console.log("Add to cart:", productId)}
          />
        </div>
      </section>

      {/* Creation Process */}
      <section className="py-8 md:py-12 bg-black/30 backdrop-blur-sm">
        <div className="container px-4 md:px-6">
          <ProductCreationProcess steps={creationProcessSteps} />
        </div>
      </section>
    </div>
  )
}

