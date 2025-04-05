/**
 * CosmicCollectible.tsx
 * 
 * Component Type: cosmic
 * Migrated from imported components.
 */
import React, { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Disc } from "lucide-react"
import { cn } from "../../../lib/utils"
import { CosmicCard } from "./CosmicCard"
import { Button } from "../../../components/ui/button"

interface CollectibleAttribute {
  name: string
  value: string
}

interface CollectibleProps {
  id: string
  name: string
  description: string
  image: string
  rarity: "common" | "rare" | "epic" | "legendary"
  acquired: boolean
  tokenId?: string
  attributes?: CollectibleAttribute[]
  onClaim?: (id: string) => void
  className?: string
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
  className,
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
      className={cn("perspective-1000", className)}
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
              <img src={image || "/placeholder.jpg"} alt={name} className="h-full w-full object-cover" />

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
                      <Sparkles className="h-4 w-4" />
                      Collected
                    </span>
                  </div>
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="font-bold text-white text-lg">{name}</h3>
                <p className="text-white/80 text-sm line-clamp-1">{description}</p>
              </div>

              {/* Flip hint */}
              {isHovering && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-full h-10 w-10 flex items-center justify-center">
                  <motion.div
                    animate={{ rotateY: [0, 180] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                  >
                    <Disc className="h-5 w-5 text-white" />
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
              <h3 className="text-lg font-bold mb-2" style={{ color: rarityConfig[rarity].color }}>
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
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  handleClaim()
                }}
                disabled={claimState === "loading"}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {claimState === "loading"
                  ? "Claiming..."
                  : claimState === "success"
                    ? "Claimed!"
                    : claimState === "error"
                      ? "Try Again"
                      : "Claim Collectible"}
              </Button>
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
  className,
}: {
  collectibles: CollectibleProps[]
  onClaim?: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6", className)}>
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
  className,
}: {
  isConnected?: boolean
  address?: string
  onConnect?: () => void
  onDisconnect?: () => void
  className?: string
}) {
  return (
    <div className={cn("p-4 bg-black/30 backdrop-blur-md rounded-xl border border-white/10", className)}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-white text-lg font-bold mb-1">Cosmic Collectibles</h3>
          <p className="text-white/70 text-sm">Connect your wallet to claim and view your digital collectibles</p>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-white/80 font-mono text-sm">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDisconnect}
              className="border-white/10 text-white hover:bg-white/10"
            >
              <Disc className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            onClick={onConnect} 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            <Disc className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  )
}