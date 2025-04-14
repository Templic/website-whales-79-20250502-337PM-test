import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import TaskadeEmbed from './TaskadeEmbed';
import { 
  MessageSquare, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2,
  Upload,
  Image,
  FileText,
  Mic,
  UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogHeader
} from '@/components/ui/dialog';
import SacredGeometry from '@/components/ui/sacred-geometry';

interface OceanicPortalProps {
  isWidget?: boolean;
  onClose?: () => void;
}

const OceanicPortal: React.FC<OceanicPortalProps> = ({ isWidget = false, onClose }) => {
  const { reducedMotion } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [expandedMediaTools, setExpandedMediaTools] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverStar, setHoverStar] = useState(false);
  const [whalePosition, setWhalePosition] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number, size: number}[]>([]);
  
  // Generate random bubbles
  useEffect(() => {
    if (!reducedMotion) {
      // Initial bubbles
      const initialBubbles = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 15 + 5
      }));
      setBubbles(initialBubbles);
      
      // Add new bubbles occasionally
      const interval = setInterval(() => {
        const newBubble = {
          id: Date.now(),
          x: Math.random() * 100,
          y: 100, // Start at bottom
          size: Math.random() * 15 + 5
        };
        setBubbles(prev => [...prev.slice(-15), newBubble]); // Keep last 15 bubbles
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [reducedMotion]);
  
  // Animate whale movement
  useEffect(() => {
    if (!reducedMotion) {
      const interval = setInterval(() => {
        setWhalePosition({
          x: Math.sin(Date.now() / 5000) * 20,
          y: Math.cos(Date.now() / 8000) * 10
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [reducedMotion]);
  
  // Handle expand/collapse animations
  const containerVariants = {
    collapsed: { 
      height: '500px',
      width: isWidget ? '350px' : '100%',
      transition: { duration: reducedMotion ? 0 : 0.5 }
    },
    expanded: { 
      height: '700px', 
      width: isWidget ? '500px' : '100%',
      transition: { duration: reducedMotion ? 0 : 0.5 }
    },
    fullscreen: {
      height: '100vh',
      width: '100vw',
      transition: { duration: reducedMotion ? 0 : 0.5 }
    }
  };
  
  // Handle media upload button click
  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };
  
  // Get container state based on expanded/fullscreen status
  const getContainerState = () => {
    if (isFullscreen) return 'fullscreen';
    return isExpanded ? 'expanded' : 'collapsed';
  };
  
  return (
    <div className="relative">
      {/* Main container */}
      <motion.div 
        ref={containerRef}
        className={`relative overflow-hidden rounded-lg shadow-2xl ${
          isFullscreen ? 'fixed top-0 left-0 z-50' : ''
        }`}
        variants={containerVariants}
        initial="collapsed"
        animate={getContainerState()}
      >
        {/* Background ocean gradient with cosmic elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 overflow-hidden">
          {/* Cosmic elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('/stars-background.png')] bg-repeat"></div>
          
          {/* Animated galaxy spiral */}
          <div className="absolute top-10 right-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: reducedMotion ? 0 : 60, repeat: Infinity, ease: "linear" }}
              className="opacity-30"
            >
              <SacredGeometry variant="spiral" size={150} color="#00ebd6" />
            </motion.div>
          </div>
          
          {/* Animated bubbles */}
          {!reducedMotion && bubbles.map(bubble => (
            <motion.div
              key={bubble.id}
              className="absolute rounded-full bg-cyan-200 opacity-40"
              initial={{ x: `${bubble.x}%`, y: '100%', width: bubble.size, height: bubble.size }}
              animate={{ y: '-20%' }}
              transition={{ duration: 15, ease: "linear" }}
              style={{ left: `${bubble.x}%` }}
            />
          ))}
          
          {/* Animated sea whale */}
          <motion.div
            className="absolute pointer-events-none"
            animate={{ 
              x: whalePosition.x, 
              y: whalePosition.y,
              rotate: whalePosition.x > 0 ? 5 : -5
            }}
            transition={{ duration: 2 }}
            style={{ bottom: '50px', right: '80px' }}
          >
            <img 
              src="/cosmic-whale.png" 
              alt="Cosmic Whale"
              className="w-32 h-auto opacity-50"
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-3 border-b border-cyan-500/30 bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="relative">
              <SacredGeometry 
                variant="star" 
                size={24} 
                color={hoverStar ? "#00ebd6" : "#0088a3"}
                onClick={() => setHoverStar(!hoverStar)}
                className="cursor-pointer transition-colors duration-300"
              />
            </div>
            <h3 className="text-lg font-semibold text-cyan-300">Oceanic Wisdom Portal</h3>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Expand/Collapse button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-800/30"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Fullscreen button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="h-8 w-8 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-800/30"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Close button */}
            {onClose && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={onClose}
                      className="h-8 w-8 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-800/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {/* Main content container */}
        <div className="relative z-10 flex flex-col h-[calc(100%-110px)]">
          {/* Taskade Agent Wrapper */}
          <div className="flex-1 overflow-hidden bg-black/30 backdrop-blur-sm p-4 border-l border-r border-cyan-500/20">
            <TaskadeEmbed chatOnly={true} />
          </div>
          
          {/* Bottom toolbar */}
          <div className="relative p-2 border-t border-cyan-500/30 bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-md flex justify-between items-center">
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-800/30"
                      onClick={() => setExpandedMediaTools(!expandedMediaTools)}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      <span>Media Tools</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload and share media</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center text-xs text-cyan-300/70">
              <SacredGeometry variant="triangle" size={16} color="#00ebd6" className="mr-2" />
              <span>Cosmic Consciousness Portal</span>
            </div>
          </div>
          
          {/* Expandable media tools panel */}
          <AnimatePresence>
            {expandedMediaTools && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3 }}
                className="absolute bottom-14 left-0 right-0 bg-blue-900/90 backdrop-blur-md border-t border-cyan-500/30 z-20"
              >
                <div className="p-4 grid grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 bg-blue-800/50 border-cyan-500/30 hover:bg-blue-700/50 text-cyan-300"
                    onClick={handleUploadClick}
                  >
                    <Image className="h-6 w-6 mb-1" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 bg-blue-800/50 border-cyan-500/30 hover:bg-blue-700/50 text-cyan-300"
                    onClick={handleUploadClick}
                  >
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-xs">Document</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 bg-blue-800/50 border-cyan-500/30 hover:bg-blue-700/50 text-cyan-300"
                    onClick={() => {}}
                  >
                    <Mic className="h-6 w-6 mb-1" />
                    <span className="text-xs">Voice</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 bg-blue-800/50 border-cyan-500/30 hover:bg-blue-700/50 text-cyan-300"
                    onClick={handleUploadClick}
                  >
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Other</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Media upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-blue-900 border-cyan-500/50 text-cyan-50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-300 flex items-center gap-2">
              <UploadCloud className="h-5 w-5" />
              Upload to Oceanic Wisdom
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500/60 transition-colors">
              <UploadCloud className="h-10 w-10 mx-auto mb-4 text-cyan-300" />
              <p className="text-cyan-200 mb-2">Drag files here or click to browse</p>
              <p className="text-xs text-cyan-400/70">
                Supporting images, documents, audio and more
              </p>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                className="hidden" 
                multiple
                accept="image/*,audio/*,video/*,application/pdf,text/plain"
              />
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setUploadDialogOpen(false)}
                className="border-cyan-500/30 text-cyan-300 hover:bg-blue-800/50"
              >
                Cancel
              </Button>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OceanicPortal;