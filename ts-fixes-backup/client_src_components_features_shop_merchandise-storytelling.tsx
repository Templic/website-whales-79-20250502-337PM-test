/**
 * merchandise-storytelling.tsx
 * 
 * Component Type: shop
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */import React from "react";
import React from "react";

/**
 * merchandise-storytelling.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { CosmicCard } from "@/components/features/cosmic/CosmicCard"
import { CosmicButton } from "@/components/features/cosmic/CosmicButton"
import { CosmicHeading } from "@/components/features/cosmic/CosmicHeading"
import { CosmicIcon } from "@/components/features/cosmic/CosmicIcon"
import { CosmicReveal, CosmicParallax } from "@/components/features/cosmic/CosmicInteractiveEffects"
import { cn } from "@/lib/utils"

interface MerchandiseStory {
  id: string
  title: string
  description: string
  image: string
  productId: string
  storyContent: {
    heading: string
    text: string
    image?: string
  }[]
}

interface MerchandiseProduct {
  id: string
  name: string
  price: number
  image: string
  description: string
  colors?: string[]
  sizes?: string[]
  inStock: boolean
  hasStory?: boolean
}

interface MerchandiseStorytellingProps {
  products: MerchandiseProduct[]
  stories: MerchandiseStory[]
  onAddToCart?: (productId: string) => void
}

export function MerchandiseStorytelling({ products, stories, onAddToCart }: MerchandiseStorytellingProps) {
  const [activeStory, setActiveStory] = useState<MerchandiseStory | null>(null)
  const [activeStoryStep, setActiveStoryStep] = useState(0)

  // Find products with stories
  const productsWithStories = products.filter((product) => stories.some((story) => story.productId === product.id))

  // Open story for a product
  const openStory = (productId: string) => {
    const story = stories.find((s) => s.productId === productId)
    if (story) {
      setActiveStory(story)
      setActiveStoryStep(0)
    }
  }

  // Close story modal
  const closeStory = () => {
    setActiveStory(null)
    setActiveStoryStep(0)
  }

  // Navigate through story
  const nextStoryStep = () => {
    if (!activeStory) return
    if (activeStoryStep < activeStory.storyContent.length - 1) {
      setActiveStoryStep((prev) => prev + 1)
    }
  }

  const prevStoryStep = () => {
    if (!activeStory) return
    if (activeStoryStep > 0) {
      setActiveStoryStep((prev) => prev - 1)
    }
  }

  return (
    <div>
      <CosmicHeading level={2} withAccent className="mb-6">
        The Story Behind Our Cosmic Creations
      </CosmicHeading>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsWithStories.map((product, index) => (
          <CosmicReveal key={product.id} delay={index * 0.1}>
            <CosmicCard className="p-0 overflow-hidden h-full">
              <div className="relative aspect-square">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform hover:scale-105 duration-500"
                />

                {/* Story badge */}
                <div className="absolute top-3 right-3 bg-purple-500/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white">
                  Story Available
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <CosmicButton
                    variant="primary"
                    size="sm"
                    onClick={() => openStory(product.id)}
                    icon={<CosmicIcon name="sparkles" size={16} />}
                  >
                    Discover Story
                  </CosmicButton>

                  <CosmicButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onAddToCart && onAddToCart(product.id)}
                    icon={<CosmicIcon name="shopping-cart" size={16} />}
                  >
                    ${product.price}
                  </CosmicButton>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-white text-lg">{product.name}</h3>
                <p className="text-white/70 text-sm mt-1">{product.description}</p>

                {/* Product attributes */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {product.colors.map((color) => (
                        <div
                          key={color}
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="text-xs text-white/60">{product.sizes.join(", ")}</div>
                  )}
                </div>
              </div>
            </CosmicCard>
          </CosmicReveal>
        ))}
      </div>

      {/* Story Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-black/90 border border-purple-500/20"
            >
              {/* Story header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-white/10">
                <h2 className="font-orbitron text-xl text-white">{activeStory.title}</h2>
                <button
                  onClick={closeStory}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <CosmicIcon name="x" size={16} />
                </button>
              </div>

              {/* Story content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStoryStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Story text */}
                      <div>
                        <CosmicHeading level={3} className="mb-4">
                          {activeStory.storyContent[activeStoryStep].heading}
                        </CosmicHeading>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-white/80">{activeStory.storyContent[activeStoryStep].text}</p>
                        </div>
                      </div>

                      {/* Story image */}
                      {activeStory.storyContent[activeStoryStep].image && (
                        <div className="relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={activeStory.storyContent[activeStoryStep].image || ""}
                            alt={activeStory.storyContent[activeStoryStep].heading}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <CosmicButton
                    variant="outline"
                    onClick={prevStoryStep}
                    disabled={activeStoryStep === 0}
                    icon={<CosmicIcon name="arrow-left" size={16} />}
                  >
                    Previous
                  </CosmicButton>

                  <div className="flex items-center gap-2">
                    {activeStory.storyContent.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveStoryStep(index)}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          activeStoryStep === index ? "w-6 bg-purple-500" : "w-2 bg-white/20",
                        )}
                      />
                    ))}
                  </div>

                  {activeStoryStep === activeStory.storyContent.length - 1 ? (
                    <CosmicButton
                      variant="primary"
                      onClick={() => {
                        onAddToCart && onAddToCart(activeStory.productId)
                        closeStory()
                      }}
                      icon={<CosmicIcon name="shopping-cart" size={16} />}
                    >
                      Add to Cart
                    </CosmicButton>
                  ) : (
                    <CosmicButton
                      variant="primary"
                      onClick={nextStoryStep}
                      icon={<CosmicIcon name="arrow-right" size={16} />}
                    >
                      Continue
                    </CosmicButton>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured story section */}
      <div className="mt-16">
        <CosmicHeading level={3} className="mb-6">
          Featured Creation Story
        </CosmicHeading>

        {stories.length > 0 && (
          <CosmicCard className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <CosmicParallax speed={0.2}>
                <div className="relative h-full min-h-[300px]">
                  <Image
                    src={stories[0].image || "/placeholder.svg"}
                    alt={stories[0].title}
                    fill
                    className="object-cover"
                  />
                </div>
              </CosmicParallax>

              <div className="p-6 flex flex-col justify-center">
                <CosmicHeading level={3} className="mb-2">
                  {stories[0].title}
                </CosmicHeading>
                <p className="text-white/80 mb-4">{stories[0].description}</p>
                <CosmicButton
                  variant="primary"
                  onClick={() => openStory(stories[0].productId)}
                  icon={<CosmicIcon name="sparkles" size={16} />}
                >
                  Discover the Full Story
                </CosmicButton>
              </div>
            </div>
          </CosmicCard>
        )}
      </div>
    </div>
  )
}

// Product creation process component
export function ProductCreationProcess({ steps }: { steps: { title: string; description: string; image: string }[] }) {
  return (
    <div className="my-16">
      <CosmicHeading level={2} withAccent align="center" className="mb-12">
        Our Cosmic Creation Process
      </CosmicHeading>

      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-purple-500/80 via-indigo-500/50 to-transparent -translate-x-1/2 z-0" />

        {steps.map((step, index) => (
          <CosmicReveal key={index} direction={index % 2 === 0 ? "left" : "right"}>
            <div
              className={cn("grid md:grid-cols-2 gap-6 mb-16 relative z-10", index % 2 === 0 ? "md:text-right" : "")}
            >
              {/* Step content */}
              <div className={cn("flex flex-col justify-center", index % 2 === 1 && "md:order-2")}>
                <CosmicHeading level={3} className="mb-2" align={index % 2 === 0 ? "left" : "right"}>
                  {step.title}
                </CosmicHeading>
                <p className={cn("text-white/80", index % 2 === 0 ? "md:text-right" : "md:text-left")}>
                  {step.description}
                </p>
              </div>

              {/* Step image */}
              <div className={cn("relative aspect-video rounded-xl overflow-hidden", index % 2 === 1 && "md:order-1")}>
                <Image src={step.image || "/placeholder.svg"} alt={step.title} fill className="object-cover" />

                {/* Step number */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                  {index + 1}
                </div>
              </div>
            </div>
          </CosmicReveal>
        ))}
      </div>
    </div>
  )
}



/**
 * Original MerchandiseStorytelling component merged from: client/src/components/common/merchandise-storytelling.tsx
 * Merge date: 2025-04-05
 */
function MerchandiseStorytellingOriginal({ products, stories, onAddToCart }: MerchandiseStorytellingProps) {
  const [activeStory, setActiveStory] = useState<MerchandiseStory | null>(null)
  const [activeStoryStep, setActiveStoryStep] = useState(0)

  // Find products with stories
  const productsWithStories = products.filter((product) => stories.some((story) => story.productId === product.id))

  // Open story for a product
  const openStory = (productId: string) => {
    const story = stories.find((s) => s.productId === productId)
    if (story) {
      setActiveStory(story)
      setActiveStoryStep(0)
    }
  }

  // Close story modal
  const closeStory = () => {
    setActiveStory(null)
    setActiveStoryStep(0)
  }

  // Navigate through story
  const nextStoryStep = () => {
    if (!activeStory) return
    if (activeStoryStep < activeStory.storyContent.length - 1) {
      setActiveStoryStep((prev) => prev + 1)
    }
  }

  const prevStoryStep = () => {
    if (!activeStory) return
    if (activeStoryStep > 0) {
      setActiveStoryStep((prev) => prev - 1)
    }
  }

  return (
    <div>
      <CosmicHeading level={2} withAccent className="mb-6">
        The Story Behind Our Cosmic Creations
      </CosmicHeading>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsWithStories.map((product, index) => (
          <CosmicReveal key={product.id} delay={index * 0.1}>
            <CosmicCard className="p-0 overflow-hidden h-full">
              <div className="relative aspect-square">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform hover:scale-105 duration-500"
                />

                {/* Story badge */}
                <div className="absolute top-3 right-3 bg-purple-500/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white">
                  Story Available
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <CosmicButton
                    variant="primary"
                    size="sm"
                    onClick={() => openStory(product.id)}
                    icon={<CosmicIcon name="sparkles" size={16} />}
                  >
                    Discover Story
                  </CosmicButton>

                  <CosmicButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onAddToCart && onAddToCart(product.id)}
                    icon={<CosmicIcon name="shopping-cart" size={16} />}
                  >
                    ${product.price}
                  </CosmicButton>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-white text-lg">{product.name}</h3>
                <p className="text-white/70 text-sm mt-1">{product.description}</p>

                {/* Product attributes */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1">
                      {product.colors.map((color) => (
                        <div
                          key={color}
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="text-xs text-white/60">{product.sizes.join(", ")}</div>
                  )}
                </div>
              </div>
            </CosmicCard>
          </CosmicReveal>
        ))}
      </div>

      {/* Story Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-black/90 border border-purple-500/20"
            >
              {/* Story header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-white/10">
                <h2 className="font-orbitron text-xl text-white">{activeStory.title}</h2>
                <button
                  onClick={closeStory}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <CosmicIcon name="x" size={16} />
                </button>
              </div>

              {/* Story content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStoryStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Story text */}
                      <div>
                        <CosmicHeading level={3} className="mb-4">
                          {activeStory.storyContent[activeStoryStep].heading}
                        </CosmicHeading>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-white/80">{activeStory.storyContent[activeStoryStep].text}</p>
                        </div>
                      </div>

                      {/* Story image */}
                      {activeStory.storyContent[activeStoryStep].image && (
                        <div className="relative aspect-square rounded-lg overflow-hidden">
                          <Image
                            src={activeStory.storyContent[activeStoryStep].image || ""}
                            alt={activeStory.storyContent[activeStoryStep].heading}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  <CosmicButton
                    variant="outline"
                    onClick={prevStoryStep}
                    disabled={activeStoryStep === 0}
                    icon={<CosmicIcon name="arrow-left" size={16} />}
                  >
                    Previous
                  </CosmicButton>

                  <div className="flex items-center gap-2">
                    {activeStory.storyContent.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveStoryStep(index)}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          activeStoryStep === index ? "w-6 bg-purple-500" : "w-2 bg-white/20",
                        )}
                      />
                    ))}
                  </div>

                  {activeStoryStep === activeStory.storyContent.length - 1 ? (
                    <CosmicButton
                      variant="primary"
                      onClick={() => {
                        onAddToCart && onAddToCart(activeStory.productId)
                        closeStory()
                      }}
                      icon={<CosmicIcon name="shopping-cart" size={16} />}
                    >
                      Add to Cart
                    </CosmicButton>
                  ) : (
                    <CosmicButton
                      variant="primary"
                      onClick={nextStoryStep}
                      icon={<CosmicIcon name="arrow-right" size={16} />}
                    >
                      Continue
                    </CosmicButton>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured story section */}
      <div className="mt-16">
        <CosmicHeading level={3} className="mb-6">
          Featured Creation Story
        </CosmicHeading>

        {stories.length > 0 && (
          <CosmicCard className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <CosmicParallax speed={0.2}>
                <div className="relative h-full min-h-[300px]">
                  <Image
                    src={stories[0].image || "/placeholder.svg"}
                    alt={stories[0].title}
                    fill
                    className="object-cover"
                  />
                </div>
              </CosmicParallax>

              <div className="p-6 flex flex-col justify-center">
                <CosmicHeading level={3} className="mb-2">
                  {stories[0].title}
                </CosmicHeading>
                <p className="text-white/80 mb-4">{stories[0].description}</p>
                <CosmicButton
                  variant="primary"
                  onClick={() => openStory(stories[0].productId)}
                  icon={<CosmicIcon name="sparkles" size={16} />}
                >
                  Discover the Full Story
                </CosmicButton>
              </div>
            </div>
          </CosmicCard>
        )}
      </div>
    </div>
  )
}

// Product creation process component
export function ProductCreationProcess({ steps }: { steps: { title: string; description: string; image: string }[] }) {
  return (
    <div className="my-16">
      <CosmicHeading level={2} withAccent align="center" className="mb-12">
        Our Cosmic Creation Process
      </CosmicHeading>

      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-purple-500/80 via-indigo-500/50 to-transparent -translate-x-1/2 z-0" />

        {steps.map((step, index) => (
          <CosmicReveal key={index} direction={index % 2 === 0 ? "left" : "right"}>
            <div
              className={cn("grid md:grid-cols-2 gap-6 mb-16 relative z-10", index % 2 === 0 ? "md:text-right" : "")}
            >
              {/* Step content */}
              <div className={cn("flex flex-col justify-center", index % 2 === 1 && "md:order-2")}>
                <CosmicHeading level={3} className="mb-2" align={index % 2 === 0 ? "left" : "right"}>
                  {step.title}
                </CosmicHeading>
                <p className={cn("text-white/80", index % 2 === 0 ? "md:text-right" : "md:text-left")}>
                  {step.description}
                </p>
              </div>

              {/* Step image */}
              <div className={cn("relative aspect-video rounded-xl overflow-hidden", index % 2 === 1 && "md:order-1")}>
                <Image src={step.image || "/placeholder.svg"} alt={step.title} fill className="object-cover" />

                {/* Step number */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20">
                  {index + 1}
                </div>
              </div>
            </div>
          </CosmicReveal>
        ))}
      </div>
    </div>
  )
}

