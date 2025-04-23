/**
 * seasonal-offers.tsx
 * 
 * Component Type: shop
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */import React from "react";

/**
 * seasonal-offers.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, ShoppingCart, Gift, Sparkles, Calendar, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SeasonalOffer {
  id: number
  title: string
  description: string
  image: string
  discount: string
  endDate: string
  slug: string
  badge?: string
  badgeColor?: string
  stock?: number
  totalStock?: number
}

interface SeasonalOffersProps {
  title?: string
  description?: string
}

export function SeasonalOffers({
  title = "Limited Time Offers",
  description = "Exclusive seasonal merchandise and special discounts",
}: SeasonalOffersProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number }>(
    {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
  )

  // Mock data for seasonal offers
  const offers: SeasonalOffer[] = [
    {
      id: 1,
      title: "Summer Solstice Collection",
      description: "Limited edition apparel celebrating the summer solstice with solar-inspired designs",
      image: "/placeholder.svg?height=400&width=600",
      discount: "20% OFF",
      endDate: "2024-06-21T23:59:59Z",
      slug: "summer-solstice-collection",
      badge: "New Release",
      badgeColor: "bg-yellow-500",
      stock: 45,
      totalStock: 100,
    },
    {
      id: 2,
      title: "Cosmic Bundle",
      description: "Complete album collection with exclusive merchandise at a special price",
      image: "/placeholder.svg?height=400&width=600",
      discount: "30% OFF",
      endDate: "2024-05-15T23:59:59Z",
      slug: "cosmic-bundle",
      badge: "Best Value",
      badgeColor: "bg-green-500",
      stock: 18,
      totalStock: 50,
    },
    {
      id: 3,
      title: "Chakra Crystal Set",
      description: "Limited edition crystal set aligned with the frequencies from the Cosmic Healing album",
      image: "/placeholder.svg?height=400&width=600",
      discount: "15% OFF",
      endDate: "2024-05-30T23:59:59Z",
      slug: "chakra-crystal-set",
      badge: "Almost Gone",
      badgeColor: "bg-red-500",
      stock: 7,
      totalStock: 30,
    },
  ]

  // Calculate time remaining for the first offer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const endDate = new Date(offers[0].endDate)
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [offers])

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-white/70">{description}</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm text-white">First Offer Ends In</p>
              <div className="flex items-center gap-1 text-lg font-bold text-white">
                <span>{timeRemaining.days}d</span>
                <span>:</span>
                <span>{timeRemaining.hours.toString().padStart(2, "0")}h</span>
                <span>:</span>
                <span>{timeRemaining.minutes.toString().padStart(2, "0")}m</span>
                <span>:</span>
                <span>{timeRemaining.seconds.toString().padStart(2, "0")}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Link href={`/merchandise/${offer.slug}`} key={offer.id} className="group">
              <div className="rounded-xl overflow-hidden bg-black/40 transition-all hover:bg-purple-900/20 h-full flex flex-col">
                <div className="relative">
                  <div className="absolute top-0 left-0 z-10 m-2">
                    <div className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {offer.discount}
                    </div>
                  </div>

                  {offer.badge && (
                    <div className="absolute top-0 right-0 z-10 m-2">
                      <div className={cn("text-white text-xs font-bold px-2 py-1 rounded-full", offer.badgeColor)}>
                        {offer.badge}
                      </div>
                    </div>
                  )}

                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={offer.image || "/placeholder.svg"}
                      alt={offer.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <div className="p-4 w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Shop Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">{offer.title}</h3>
                  <p className="text-sm text-white/70 mt-1 mb-3 flex-1">{offer.description}</p>

                  <div className="space-y-3">
                    {offer.stock !== undefined && offer.totalStock !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Available Stock</span>
                          <span className={cn("font-medium", offer.stock < 10 ? "text-red-400" : "text-white")}>
                            {offer.stock} left
                          </span>
                        </div>
                        <Progress value={(offer.stock / offer.totalStock) * 100} className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-white/60">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Ends {new Date(offer.endDate).toLocaleDateString()}</span>
                      </div>

                      {offer.stock !== undefined && offer.stock < 10 && (
                        <div className="flex items-center gap-1 text-red-400 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Low stock</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Join Our VIP List</h3>
                <p className="text-white/70">Get early access to limited editions and exclusive offers</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Sign Up for VIP Access
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}



/**
 * Original SeasonalOffers component merged from: client/src/components/common/seasonal-offers.tsx
 * Merge date: 2025-04-05
 */
function SeasonalOffersOriginal({
  title = "Limited Time Offers",
  description = "Exclusive seasonal merchandise and special discounts",
}: SeasonalOffersProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number }>(
    {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
  )

  // Mock data for seasonal offers
  const offers: SeasonalOffer[] = [
    {
      id: 1,
      title: "Summer Solstice Collection",
      description: "Limited edition apparel celebrating the summer solstice with solar-inspired designs",
      image: "/placeholder.svg?height=400&width=600",
      discount: "20% OFF",
      endDate: "2024-06-21T23:59:59Z",
      slug: "summer-solstice-collection",
      badge: "New Release",
      badgeColor: "bg-yellow-500",
      stock: 45,
      totalStock: 100,
    },
    {
      id: 2,
      title: "Cosmic Bundle",
      description: "Complete album collection with exclusive merchandise at a special price",
      image: "/placeholder.svg?height=400&width=600",
      discount: "30% OFF",
      endDate: "2024-05-15T23:59:59Z",
      slug: "cosmic-bundle",
      badge: "Best Value",
      badgeColor: "bg-green-500",
      stock: 18,
      totalStock: 50,
    },
    {
      id: 3,
      title: "Chakra Crystal Set",
      description: "Limited edition crystal set aligned with the frequencies from the Cosmic Healing album",
      image: "/placeholder.svg?height=400&width=600",
      discount: "15% OFF",
      endDate: "2024-05-30T23:59:59Z",
      slug: "chakra-crystal-set",
      badge: "Almost Gone",
      badgeColor: "bg-red-500",
      stock: 7,
      totalStock: 30,
    },
  ]

  // Calculate time remaining for the first offer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const endDate = new Date(offers[0].endDate)
      const diff = endDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [offers])

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-white/70">{description}</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-purple-400" />
            <div>
              <p className="text-sm text-white">First Offer Ends In</p>
              <div className="flex items-center gap-1 text-lg font-bold text-white">
                <span>{timeRemaining.days}d</span>
                <span>:</span>
                <span>{timeRemaining.hours.toString().padStart(2, "0")}h</span>
                <span>:</span>
                <span>{timeRemaining.minutes.toString().padStart(2, "0")}m</span>
                <span>:</span>
                <span>{timeRemaining.seconds.toString().padStart(2, "0")}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Link href={`/merchandise/${offer.slug}`} key={offer.id} className="group">
              <div className="rounded-xl overflow-hidden bg-black/40 transition-all hover:bg-purple-900/20 h-full flex flex-col">
                <div className="relative">
                  <div className="absolute top-0 left-0 z-10 m-2">
                    <div className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {offer.discount}
                    </div>
                  </div>

                  {offer.badge && (
                    <div className="absolute top-0 right-0 z-10 m-2">
                      <div className={cn("text-white text-xs font-bold px-2 py-1 rounded-full", offer.badgeColor)}>
                        {offer.badge}
                      </div>
                    </div>
                  )}

                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={offer.image || "/placeholder.svg"}
                      alt={offer.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <div className="p-4 w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Shop Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">{offer.title}</h3>
                  <p className="text-sm text-white/70 mt-1 mb-3 flex-1">{offer.description}</p>

                  <div className="space-y-3">
                    {offer.stock !== undefined && offer.totalStock !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">Available Stock</span>
                          <span className={cn("font-medium", offer.stock < 10 ? "text-red-400" : "text-white")}>
                            {offer.stock} left
                          </span>
                        </div>
                        <Progress value={(offer.stock / offer.totalStock) * 100} className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-white/60">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Ends {new Date(offer.endDate).toLocaleDateString()}</span>
                      </div>

                      {offer.stock !== undefined && offer.stock < 10 && (
                        <div className="flex items-center gap-1 text-red-400 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Low stock</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Join Our VIP List</h3>
                <p className="text-white/70">Get early access to limited editions and exclusive offers</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Sign Up for VIP Access
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

