/**
 * upcoming-ceremonies-grid.tsx
 * 
 * Component Type: community
 * Migrated from: lovable components
 * Migration Date: 2025-04-05
 */
import React from "react";

/**
 * upcoming-ceremonies-grid.tsx
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
import { Calendar, Clock, MapPin, Users, Star, ArrowRight } from "lucide-react"
import { CosmicCard } from "@/components/features/cosmic/CosmicCard"
import { CosmicText } from "@/components/features/cosmic/CosmicText"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Ceremony {
  id: string
  title: string
  date: string
  time: string
  location: string
  facilitator: string
  description: string
  imageSrc: string
  category: string
  price: string
  capacity: number
  spotsLeft: number
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels"
  tags: string[]
}

interface UpcomingCeremoniesGridProps {
  ceremonies?: Ceremony[]
  title?: string
  subtitle?: string
}

export function UpcomingCeremoniesGrid({
  ceremonies = [
    {
      id: "ceremony-1",
      title: "Full Moon Sound Bath",
      date: "April 15, 2025",
      time: "8:00 PM - 10:00 PM",
      location: "Cosmic Temple, Los Angeles",
      facilitator: "Luna Starlight",
      description: "Immerse yourself in the healing vibrations of crystal singing bowls, gongs, and chimes during this powerful full moon ceremony. The full moon amplifies the effects of sound healing, helping to release what no longer serves you and manifest your intentions with greater clarity.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Sound Healing",
      price: "$45",
      capacity: 30,
      spotsLeft: 12,
      duration: "2 hours",
      level: "All Levels",
      tags: ["Full Moon", "Sound Bath", "Meditation", "Healing"]
    },
    {
      id: "ceremony-2",
      title: "Cacao & Breathwork Journey",
      date: "April 22, 2025",
      time: "7:00 PM - 9:30 PM",
      location: "Ethereal Garden, San Francisco",
      facilitator: "Orion Phoenix",
      description: "Begin with a sacred cacao ceremony to open your heart, followed by a guided breathwork journey to access expanded states of consciousness. This powerful combination creates a deep healing experience that connects you with your inner wisdom and the universal life force.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Breathwork",
      price: "$55",
      capacity: 25,
      spotsLeft: 8,
      duration: "2.5 hours",
      level: "All Levels",
      tags: ["Cacao", "Breathwork", "Heart Opening", "Transformation"]
    },
    {
      id: "ceremony-3",
      title: "Quantum Sound Healing",
      date: "May 5, 2025",
      time: "6:30 PM - 8:30 PM",
      location: "Harmonic Space, New York",
      facilitator: "Nova Frequency",
      description: "Experience the cutting-edge of sound healing with this quantum approach that combines binaural beats, solfeggio frequencies, and vocal toning. This ceremony works with the quantum field to reorganize your energy and create coherence between your heart and brain.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Sound Healing",
      price: "$60",
      capacity: 20,
      spotsLeft: 5,
      duration: "2 hours",
      level: "Intermediate",
      tags: ["Quantum", "Binaural", "Solfeggio", "Coherence"]
    },
    {
      id: "ceremony-4",
      title: "Shamanic Drum Journey",
      date: "May 12, 2025",
      time: "7:00 PM - 9:00 PM",
      location: "Spirit Grove, Austin",
      facilitator: "Wolf Thunder",
      description: "The rhythmic beating of the drum will guide you into a trance state where you can connect with spirit guides, power animals, and receive insights from non-ordinary reality. This ancient shamanic practice helps you access deep wisdom and healing.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Shamanic",
      price: "$50",
      capacity: 15,
      spotsLeft: 3,
      duration: "2 hours",
      level: "All Levels",
      tags: ["Shamanic", "Drum", "Journey", "Spirit Guides"]
    }
  ],
  title = "Upcoming Ceremonies",
  subtitle = "Join our transformative sound healing events and cosmic gatherings",
}: UpcomingCeremoniesGridProps) {
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [filter, setFilter] = useState<string | null>(null)

  // Get unique categories for filtering
  const categories = Array.from(new Set(ceremonies.map(ceremony => ceremony.category)))

  // Filter ceremonies by category
  const filteredCeremonies = filter 
    ? ceremonies.filter(ceremony => ceremony.category === filter)
    : ceremonies

  // Open ceremony details dialog
  const openCeremonyDetails = (ceremony: Ceremony) => {
    setSelectedCeremony(ceremony)
    setActiveTab("details")
  }

  // Close ceremony details dialog
  const closeCeremonyDetails = () => {
    setSelectedCeremony(null)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CosmicText variant="subtitle" className="text-white mb-2">
          {title}
        </CosmicText>
        <p className="text-white/70 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(null)}
          className="rounded-full"
        >
          All Ceremonies
        </Button>
        
        {categories.map(category => (
          <Button
            key={category}
            variant={filter === category ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(category)}
            className="rounded-full"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Cosmic Grid Connector */}
      <div className="relative py-6">
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-purple-500/80 via-indigo-500/50 to-purple-500/80"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {filteredCeremonies.map((ceremony, index) => (
            <motion.div\
              key={ceremony.id}  index) => (
            <motion.div
              key={ceremony.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}
            >
              {/* Connection to center line */}
              <div className="hidden md:block absolute top-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500/80 to-transparent right-0 transform -translate-y-1/2">
                {index % 2 === 0 && (
                  <>
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500"></div>
                  </>
                )}
              </div>
              <div className="hidden md:block absolute top-1/2 w-8 h-0.5 bg-gradient-to-l from-purple-500/80 to-transparent left-0 transform -translate-y-1/2">
                {index % 2 === 1 && (
                  <>
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500"></div>
                  </>
                )}
              </div>
              
              <CosmicCard className="p-0 overflow-hidden h-full flex flex-col">
                <div className="relative h-48">
                  <Image
                    src={ceremony.imageSrc || "/placeholder.svg"}
                    alt={ceremony.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <Badge variant="secondary" className="bg-purple-500/80 hover:bg-purple-500/90 text-white border-none">
                      {ceremony.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-medium text-lg mb-2">{ceremony.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs">{ceremony.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs">{ceremony.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs truncate">{ceremony.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs">{ceremony.spotsLeft} spots left</span>
                    </div>
                  </div>
                  
                  <p className="text-white/60 text-sm line-clamp-3 mb-4">
                    {ceremony.description}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-white font-medium">{ceremony.price}</div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                      onClick={() => openCeremonyDetails(ceremony)}
                    >
                      View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CosmicCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ceremony Details Dialog */}
      <Dialog open={!!selectedCeremony} onOpenChange={() => closeCeremonyDetails()}>
        <DialogContent className="bg-black/90 border border-purple-500/30 backdrop-blur-lg max-w-3xl">
          {selectedCeremony && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-white">
                  {selectedCeremony.title}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {selectedCeremony.category} • {selectedCeremony.date} • {selectedCeremony.time}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="bg-black/50 border border-white/10">
                  <TabsTrigger value="details" className="data-[state=active]:bg-purple-900/50">Details</TabsTrigger>
                  <TabsTrigger value="location" className="data-[state=active]:bg-purple-900/50">Location</TabsTrigger>
                  <TabsTrigger value="facilitator" className="data-[state=active]:bg-purple-900/50">Facilitator</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                        <Image
                          src={selectedCeremony.imageSrc || "/placeholder.svg"}
                          alt={selectedCeremony.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {selectedCeremony.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="bg-black/50 text-white/80">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-2">Description</h4>
                        <p className="text-white/70 text-sm">{selectedCeremony.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Duration</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.duration}</p>
                        </div>
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Experience Level</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.level}</p>
                        </div>
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Capacity</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.capacity} people</p>
                        </div>
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Spots Left</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.spotsLeft} available</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-medium mb-2">What to Bring</h4>
                        <ul className="text-white/70 text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Yoga mat or blanket
                          </li>
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Water bottle
                          </li>
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Journal and pen
                          </li>
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Comfortable clothing
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="location" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Venue</h4>
                      <p className="text-white/70 text-sm mb-2">{selectedCeremony.location}</p>
                      <div className="relative h-60 rounded-lg overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=400&width=800"
                          alt="Location map"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-2">Directions</h4>
                      <p className="text-white/70 text-sm">
                        Detailed directions will be sent to you after registration. The venue is easily accessible by public transportation and has parking available nearby.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="facilitator" className="pt-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <div className="relative h-48 w-48 mx-auto rounded-full overflow-hidden border-2 border-purple-500/50">
                        <Image
                          src="/placeholder.svg?height=200&width=200"
                          alt={selectedCeremony.facilitator}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="md:w-2/3 space-y-4">
                      <div>
                        <h4 className="text-white font-medium text-lg">{selectedCeremony.facilitator}</h4>
                        <p className="text-purple-400">Ceremony Facilitator</p>
                      </div>
                      
                      <p className="text-white/70 text-sm">
                        With over 10 years of experience in sound healing and energy work, {selectedCeremony.facilitator} brings a unique blend of ancient wisdom and modern techniques to create transformative ceremonial experiences. Their approach is heart-centered, intuitive, and deeply respectful of the sacred traditions they draw from.
                      </p>
                      
                      <div>
                        <h4 className="text-white font-medium mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-black/50 text-white/80">Sound Healing</Badge>
                          <Badge variant="outline" className="bg-black/50 text-white/80">Energy Work</Badge>
                          <Badge variant="outline" className="bg-black/50 text-white/80">Breathwork</Badge>
                          <Badge variant="outline" className="bg-black/50 text-white/80">Meditation</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                <div className="text-xl font-medium text-white">{selectedCeremony.price}</div>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                  Register Now
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}



/**
 * Original UpcomingCeremoniesGrid component merged from: client/src/components/common/upcoming-ceremonies-grid.tsx
 * Merge date: 2025-04-05
 */
function UpcomingCeremoniesGridOriginal({
  ceremonies = [
    {
      id: "ceremony-1",
      title: "Full Moon Sound Bath",
      date: "April 15, 2025",
      time: "8:00 PM - 10:00 PM",
      location: "Cosmic Temple, Los Angeles",
      facilitator: "Luna Starlight",
      description: "Immerse yourself in the healing vibrations of crystal singing bowls, gongs, and chimes during this powerful full moon ceremony. The full moon amplifies the effects of sound healing, helping to release what no longer serves you and manifest your intentions with greater clarity.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Sound Healing",
      price: "$45",
      capacity: 30,
      spotsLeft: 12,
      duration: "2 hours",
      level: "All Levels",
      tags: ["Full Moon", "Sound Bath", "Meditation", "Healing"]
    },
    {
      id: "ceremony-2",
      title: "Cacao & Breathwork Journey",
      date: "April 22, 2025",
      time: "7:00 PM - 9:30 PM",
      location: "Ethereal Garden, San Francisco",
      facilitator: "Orion Phoenix",
      description: "Begin with a sacred cacao ceremony to open your heart, followed by a guided breathwork journey to access expanded states of consciousness. This powerful combination creates a deep healing experience that connects you with your inner wisdom and the universal life force.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Breathwork",
      price: "$55",
      capacity: 25,
      spotsLeft: 8,
      duration: "2.5 hours",
      level: "All Levels",
      tags: ["Cacao", "Breathwork", "Heart Opening", "Transformation"]
    },
    {
      id: "ceremony-3",
      title: "Quantum Sound Healing",
      date: "May 5, 2025",
      time: "6:30 PM - 8:30 PM",
      location: "Harmonic Space, New York",
      facilitator: "Nova Frequency",
      description: "Experience the cutting-edge of sound healing with this quantum approach that combines binaural beats, solfeggio frequencies, and vocal toning. This ceremony works with the quantum field to reorganize your energy and create coherence between your heart and brain.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Sound Healing",
      price: "$60",
      capacity: 20,
      spotsLeft: 5,
      duration: "2 hours",
      level: "Intermediate",
      tags: ["Quantum", "Binaural", "Solfeggio", "Coherence"]
    },
    {
      id: "ceremony-4",
      title: "Shamanic Drum Journey",
      date: "May 12, 2025",
      time: "7:00 PM - 9:00 PM",
      location: "Spirit Grove, Austin",
      facilitator: "Wolf Thunder",
      description: "The rhythmic beating of the drum will guide you into a trance state where you can connect with spirit guides, power animals, and receive insights from non-ordinary reality. This ancient shamanic practice helps you access deep wisdom and healing.",
      imageSrc: "/placeholder.svg?height=400&width=600",
      category: "Shamanic",
      price: "$50",
      capacity: 15,
      spotsLeft: 3,
      duration: "2 hours",
      level: "All Levels",
      tags: ["Shamanic", "Drum", "Journey", "Spirit Guides"]
    }
  ],
  title = "Upcoming Ceremonies",
  subtitle = "Join our transformative sound healing events and cosmic gatherings",
}: UpcomingCeremoniesGridProps) {
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [filter, setFilter] = useState<string | null>(null)

  // Get unique categories for filtering
  const categories = Array.from(new Set(ceremonies.map(ceremony => ceremony.category)))

  // Filter ceremonies by category
  const filteredCeremonies = filter 
    ? ceremonies.filter(ceremony => ceremony.category === filter)
    : ceremonies

  // Open ceremony details dialog
  const openCeremonyDetails = (ceremony: Ceremony) => {
    setSelectedCeremony(ceremony)
    setActiveTab("details")
  }

  // Close ceremony details dialog
  const closeCeremonyDetails = () => {
    setSelectedCeremony(null)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <CosmicText variant="subtitle" className="text-white mb-2">
          {title}
        </CosmicText>
        <p className="text-white/70 max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(null)}
          className="rounded-full"
        >
          All Ceremonies
        </Button>
        
        {categories.map(category => (
          <Button
            key={category}
            variant={filter === category ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(category)}
            className="rounded-full"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Cosmic Grid Connector */}
      <div className="relative py-6">
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-purple-500/80 via-indigo-500/50 to-purple-500/80"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {filteredCeremonies.map((ceremony, index) => (
            <motion.div\
              key={ceremony.id}  index) => (
            <motion.div
              key={ceremony.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}
            >
              {/* Connection to center line */}
              <div className="hidden md:block absolute top-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500/80 to-transparent right-0 transform -translate-y-1/2">
                {index % 2 === 0 && (
                  <>
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500"></div>
                  </>
                )}
              </div>
              <div className="hidden md:block absolute top-1/2 w-8 h-0.5 bg-gradient-to-l from-purple-500/80 to-transparent left-0 transform -translate-y-1/2">
                {index % 2 === 1 && (
                  <>
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500"></div>
                  </>
                )}
              </div>
              
              <CosmicCard className="p-0 overflow-hidden h-full flex flex-col">
                <div className="relative h-48">
                  <Image
                    src={ceremony.imageSrc || "/placeholder.svg"}
                    alt={ceremony.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <Badge variant="secondary" className="bg-purple-500/80 hover:bg-purple-500/90 text-white border-none">
                      {ceremony.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-white font-medium text-lg mb-2">{ceremony.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs">{ceremony.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs">{ceremony.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs truncate">{ceremony.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-white/70 text-xs">{ceremony.spotsLeft} spots left</span>
                    </div>
                  </div>
                  
                  <p className="text-white/60 text-sm line-clamp-3 mb-4">
                    {ceremony.description}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-white font-medium">{ceremony.price}</div>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                      onClick={() => openCeremonyDetails(ceremony)}
                    >
                      View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CosmicCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ceremony Details Dialog */}
      <Dialog open={!!selectedCeremony} onOpenChange={() => closeCeremonyDetails()}>
        <DialogContent className="bg-black/90 border border-purple-500/30 backdrop-blur-lg max-w-3xl">
          {selectedCeremony && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-white">
                  {selectedCeremony.title}
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  {selectedCeremony.category} • {selectedCeremony.date} • {selectedCeremony.time}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="bg-black/50 border border-white/10">
                  <TabsTrigger value="details" className="data-[state=active]:bg-purple-900/50">Details</TabsTrigger>
                  <TabsTrigger value="location" className="data-[state=active]:bg-purple-900/50">Location</TabsTrigger>
                  <TabsTrigger value="facilitator" className="data-[state=active]:bg-purple-900/50">Facilitator</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                        <Image
                          src={selectedCeremony.imageSrc || "/placeholder.svg"}
                          alt={selectedCeremony.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {selectedCeremony.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="bg-black/50 text-white/80">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-2">Description</h4>
                        <p className="text-white/70 text-sm">{selectedCeremony.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Duration</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.duration}</p>
                        </div>
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Experience Level</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.level}</p>
                        </div>
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Capacity</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.capacity} people</p>
                        </div>
                        <div>
                          <h4 className="text-white/90 text-sm font-medium mb-1">Spots Left</h4>
                          <p className="text-white/70 text-sm">{selectedCeremony.spotsLeft} available</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-medium mb-2">What to Bring</h4>
                        <ul className="text-white/70 text-sm space-y-1">
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Yoga mat or blanket
                          </li>
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Water bottle
                          </li>
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Journal and pen
                          </li>
                          <li className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-purple-400" /> Comfortable clothing
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="location" className="pt-4">
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Venue</h4>
                      <p className="text-white/70 text-sm mb-2">{selectedCeremony.location}</p>
                      <div className="relative h-60 rounded-lg overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=400&width=800"
                          alt="Location map"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-2">Directions</h4>
                      <p className="text-white/70 text-sm">
                        Detailed directions will be sent to you after registration. The venue is easily accessible by public transportation and has parking available nearby.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="facilitator" className="pt-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <div className="relative h-48 w-48 mx-auto rounded-full overflow-hidden border-2 border-purple-500/50">
                        <Image
                          src="/placeholder.svg?height=200&width=200"
                          alt={selectedCeremony.facilitator}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="md:w-2/3 space-y-4">
                      <div>
                        <h4 className="text-white font-medium text-lg">{selectedCeremony.facilitator}</h4>
                        <p className="text-purple-400">Ceremony Facilitator</p>
                      </div>
                      
                      <p className="text-white/70 text-sm">
                        With over 10 years of experience in sound healing and energy work, {selectedCeremony.facilitator} brings a unique blend of ancient wisdom and modern techniques to create transformative ceremonial experiences. Their approach is heart-centered, intuitive, and deeply respectful of the sacred traditions they draw from.
                      </p>
                      
                      <div>
                        <h4 className="text-white font-medium mb-2">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-black/50 text-white/80">Sound Healing</Badge>
                          <Badge variant="outline" className="bg-black/50 text-white/80">Energy Work</Badge>
                          <Badge variant="outline" className="bg-black/50 text-white/80">Breathwork</Badge>
                          <Badge variant="outline" className="bg-black/50 text-white/80">Meditation</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                <div className="text-xl font-medium text-white">{selectedCeremony.price}</div>
                <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                  Register Now
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

