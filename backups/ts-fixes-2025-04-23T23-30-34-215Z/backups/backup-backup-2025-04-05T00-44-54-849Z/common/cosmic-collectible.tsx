/**
 * cosmic-collectible.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * cosmic-collectible.tsx
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
import { motion } from "framer-motion"
import { CosmicCard } from "@/components/cosmic-card"
import { CosmicButton } from "@/components/cosmic-button"
import { CosmicIcon } from "@/components/cosmic-icons"

interface CollectibleProps {
  id: string
  name: string
  description: string
  image: string
  rarity: "common" | "rare" | "epic" | "legendary"
  acquired: boolean
  tokenId?: string
  attributes?: {
    name: string
    value: string
  }[]
  onClaim?: (id: string) => void
}

export function CosmicCollectible({
  id,
  name,
  description,
  image,
  rarity,
  acquired,
  tokenId,
  attributes = [],
  onClaim,
}: CollectibleProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [claimState, setClaimState] = useState<"idle" | "loading" | "success" | "error">("idle")

  // Rarity colors
  const rarityConfig = {
    common: {
      color: "#a1a1aa",
      glow: "rgba(161, 161, 170, 0.5)",
      label: "Common",
    },
    rare: {
      color: "#60a5fa",
      glow: "rgba(96, 165, 250, 0.5)",
      label: "Rare",
    },
    epic: {
      color: "#c084fc",
      glow: "rgba(192, 132, 252, 0.5)",
      label: "Epic",
    },
    legendary: {
      color: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.5)",
      label: "Legendary",
    },
  }

  const handleClaim = async () => {
    if (!onClaim || claimState === "loading" || acquired) return

    setClaimState("loading")

    try {
      await onClaim(id)
      setClaimState("success")
    } catch (error) {
      console.error("Error claiming collectible:", error)
      setClaimState("error")
    }
  }

  return (
    <div
      className="perspective-1000"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <motion.div
        className="relative w-full aspect-square cursor-pointer preserve-3d transition-transform duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <div className="absolute inset-0 backface-hidden">
          <CosmicCard glowColor={rarityConfig[rarity].glow} className="h-full p-0 overflow-hidden">
            {/* Image */}
            <div className="relative w-full aspect-square">
              <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />

              {/* Rarity badge */}
              <div
                className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md border"
                style={{
                  backgroundColor: `${rarityConfig[rarity].color}20`,
                  borderColor: `${rarityConfig[rarity].color}50`,
                  color: rarityConfig[rarity].color,
                }}
              >
                {rarityConfig[rarity].label}
              </div>

              {/* Acquired overlay */}
              {acquired && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
                    <span className="text-white font-medium flex items-center gap-1">
                      <CosmicIcon name="sparkles" size={16} />
                      Collected
                    </span>
                  </div>
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="font-orbitron text-white text-lg font-bold">{name}</h3>
                <p className="text-white/80 text-sm line-clamp-1">{description}</p>
              </div>

              {/* Flip hint */}
              {isHovering && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-full h-10 w-10 flex items-center justify-center">
                  <motion.div
                    animate={{ rotateY: [0, 180] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                  >
                    <CosmicIcon name="disc" size={20} className="text-white" />
                  </motion.div>
                </div>
              )}
            </div>
          </CosmicCard>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <CosmicCard glowColor={rarityConfig[rarity].glow} className="h-full p-4 flex flex-col">
            <div className="flex-1">
              <h3 className="font-orbitron text-lg font-bold mb-2" style={{ color: rarityConfig[rarity].color }}>
                {name}
              </h3>

              <p className="text-white/80 text-sm mb-4">{description}</p>

              {/* Attributes */}
              {attributes.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-white/90 text-xs uppercase tracking-wider">Attributes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {attributes.map((attr, index) => (
                      <div key={index} className="bg-white/5 rounded-md p-2 border border-white/10">
                        <div className="text-white/60 text-xs">{attr.name}</div>
                        <div className="text-white font-medium text-sm">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Token ID */}
              {tokenId && (
                <div className="bg-white/5 rounded-md p-2 border border-white/10 mb-4">
                  <div className="text-white/60 text-xs">Token ID</div>
                  <div className="text-white font-mono text-sm truncate">{tokenId}</div>
                </div>
              )}
            </div>

            {/* Claim button */}
            {!acquired && onClaim && (
              <CosmicButton
                variant="primary"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClaim()
                }}
                disabled={claimState === "loading"}
                glowColor={rarityConfig[rarity].glow}
                icon={<CosmicIcon name="sparkles" size={16} />}
              >
                {claimState === "loading"
                  ? "Claiming..."
                  : claimState === "success"
                    ? "Claimed!"
                    : claimState === "error"
                      ? "Try Again"
                      : "Claim Collectible"}
              </CosmicButton>
            )}
          </CosmicCard>
        </div>
      </motion.div>
    </div>
  )
}

// Collection grid component
export function CosmicCollectiblesGrid({
  collectibles,
  onClaim,
}: {
  collectibles: CollectibleProps[]
  onClaim?: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {collectibles.map((collectible) => (
        <CosmicCollectible key={collectible.id} {...collectible} onClaim={onClaim} />
      ))}
    </div>
  )
}

// Wallet connection component
export function CosmicWalletConnect({
  isConnected = false,
  address = "",
  onConnect,
  onDisconnect,
}: {
  isConnected?: boolean
  address?: string
  onConnect?: () => void
  onDisconnect?: () => void
}) {
  return (
    <CosmicCard className="p-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-white text-lg font-bold mb-1">Cosmic Collectibles</h3>
          <p className="text-white/70 text-sm">Connect your wallet to claim and view your digital collectibles</p>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/80 font-mono text-sm">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </span>
            </div>
            <CosmicButton
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              icon={<CosmicIcon name="orbit" size={16} />}
            >
              Disconnect
            </CosmicButton>
          </div>
        ) : (
          <CosmicButton variant="primary" onClick={onConnect} icon={<CosmicIcon name="orbit" size={16} />}>
            Connect Wallet
          </CosmicButton>
        )}
      </div>
    </CosmicCard>
  )
}

