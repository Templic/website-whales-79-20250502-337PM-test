import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Define tour events data
const tourEvents = [
  { 
    id: 'oahu',
    name: 'Honolulu, Oahu', 
    date: 'August 15, 2025',
    venue: 'Waikiki Beach Shell',
    status: 'sold-out',
    coordinates: { x: 35, y: 30 },
    color: '#00ebd6' 
  },
  { 
    id: 'hawaii',
    name: 'Hilo, Big Island', 
    date: 'September 10, 2025',
    venue: 'Hilo Bay Concert Hall',
    status: 'sold-out',
    coordinates: { x: 60, y: 40 },
    color: '#fe0064' 
  },
  { 
    id: 'maui',
    name: 'Lahaina, Maui', 
    date: 'May 20, 2024',
    venue: 'Lahaina Historic Theater',
    status: 'past',
    coordinates: { x: 20, y: 25 },
    color: '#7c3aed' 
  },
  { 
    id: 'kauai',
    name: 'Hanalei, Kauai', 
    date: 'September 5, 2023',
    venue: 'Hanalei Bay Outdoor Stage',
    status: 'past',
    coordinates: { x: 10, y: 15 },
    color: '#f59e0b' 
  }
];

interface HawaiianIslandsMapProps {
  className?: string;
}

const HawaiianIslandsMap: React.FC<HawaiianIslandsMapProps> = ({ className }) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  
  const handleLocationClick = (locationId: string) => {
    setSelectedLocation(locationId);
    setIsInfoVisible(true);
  };
  
  const handleCloseInfo = () => {
    setIsInfoVisible(false);
  };
  
  const selectedEvent = tourEvents.find(event => event.id === selectedLocation);
  
  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Map container */}
      <div className="w-full h-full bg-[#173d56] rounded-lg overflow-hidden relative">
        {/* Hawaiian Islands SVG Map */}
        <svg viewBox="0 0 100 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Map outline */}
          <g fill="#2A5F7B" stroke="#3A7091" strokeWidth="0.5">
            {/* Niihau */}
            <path d="M5,19 C5,19 6,17 7,17 C8,17 9,18 9,19 C9,20 8,22 7,22 C6,22 5,21 5,19 Z" />
            
            {/* Kauai */}
            <path d="M10,12 C10,12 13,10 16,11 C19,12 20,15 19,18 C18,21 15,23 12,22 C9,21 8,18 9,15 C10,13 10,12 10,12 Z" />
            
            {/* Oahu */}
            <path d="M31,27 C31,27 35,25 39,26 C43,27 44,31 43,34 C42,37 38,39 34,38 C30,37 28,33 29,30 C30,28 31,27 31,27 Z" />
            
            {/* Molokai */}
            <path d="M44,25 C44,25 49,24 52,25 C55,26 53,29 50,30 C47,31 42,30 42,28 C42,26 44,25 44,25 Z" />
            
            {/* Lanai */}
            <path d="M46,33 C46,33 48,32 50,33 C52,34 51,37 49,38 C47,39 45,38 45,36 C45,34 46,33 46,33 Z" />
            
            {/* Maui */}
            <path d="M54,24 C54,24 59,22 64,23 C69,24 71,27 70,31 C69,35 64,38 59,37 C54,36 51,32 52,28 C53,25 54,24 54,24 Z" />
            
            {/* Hawaii (Big Island) */}
            <path d="M68,35 C68,35 74,33 80,35 C86,37 88,42 86,48 C84,54 78,56 72,54 C66,52 64,46 66,41 C67,38 68,35 68,35 Z" />
          </g>
          
          {/* Tour event location markers */}
          {tourEvents.map((event) => (
            <g 
              key={event.id}
              onClick={() => handleLocationClick(event.id)}
              className="cursor-pointer"
              transform={`translate(${event.coordinates.x}, ${event.coordinates.y})`}
            >
              {/* Pulsing circle effect */}
              <circle r="2" fill={event.color} opacity="0.2" className="animate-ping">
                <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
              </circle>
              
              {/* Main location marker */}
              <circle r="1.5" fill={event.color} stroke="#fff" strokeWidth="0.5" />
              
              {/* Location name */}
              <text 
                x="0" 
                y="4" 
                fontSize="2" 
                fill="#fff" 
                textAnchor="middle" 
                className="pointer-events-none"
              >
                {event.name.split(',')[0]}
              </text>
            </g>
          ))}
        </svg>
        
        {/* Map overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(10,30,50,0.3)]"></div>
      </div>
      
      {/* Island information popup */}
      {isInfoVisible && selectedEvent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-xs bg-black/80 backdrop-blur-md p-4 rounded-xl border border-[#ffffff20] shadow-2xl"
        >
          <button 
            onClick={handleCloseInfo}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
          
          <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: selectedEvent.color }}>
            {selectedEvent.name}
          </h3>
          
          <div className="text-white text-sm sm:text-base space-y-1">
            <p><span className="text-gray-400">Date:</span> {selectedEvent.date}</p>
            <p><span className="text-gray-400">Venue:</span> {selectedEvent.venue}</p>
            <div className="mt-3">
              {selectedEvent.status === 'sold-out' ? (
                <span className="inline-block px-3 py-1 bg-red-500/80 text-white text-xs font-bold rounded">
                  SOLD OUT
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-purple-500/80 text-white text-xs font-bold rounded">
                  PAST EVENT
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Instructions overlay */}
      <div className="absolute bottom-3 right-3 text-xs text-white/60 pointer-events-none">
        Click on island markers for details
      </div>
    </div>
  );
};

export default HawaiianIslandsMap;