import React, { useState, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Image,
  Maximize2, 
  Mic,
  Minimize2, 
  Upload,
  UploadCloud,
  X 
} from 'lucide-react';
import SacredGeometry from '@/components/cosmic/SacredGeometry';
import TaskadeEmbed from './TaskadeEmbed';

interface OceanicPortalProps {
  isWidget?: boolean;
  onClose?: () => void;
}

const OceanicPortal: React.FC<OceanicPortalProps> = ({ isWidget = false, onClose }) => {
  const { reducedMotion } = useAccessibility();
  
  // Visual state
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedMediaTools, setExpandedMediaTools] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Interactive elements
  const [hoverStar, setHoverStar] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle upload button click
  const handleUploadClick = () => {
    setExpandedMediaTools(false);
    setUploadDialogOpen(true);
  };
  
  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-purple-900 to-blue-900 overflow-hidden">
        {/* Animated bubbles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`bubble-${i}`}
              className="absolute rounded-full bg-cyan-300"
              initial={{ 
                x: `${Math.random() * 100}%`, 
                y: '100%', 
                opacity: 0.3 + Math.random() * 0.4,
                scale: 0.2 + Math.random() * 0.8 
              }}
              animate={{ 
                y: '-10%', 
                x: `${Math.random() * 100}%`,
                opacity: 0 
              }}
              transition={{ 
                duration: 10 + Math.random() * 20, 
                repeat: Infinity, 
                ease: 'linear',
                delay: Math.random() * 10 
              }}
              style={{
                width: `${10 + Math.random() * 20}px`,
                height: `${10 + Math.random() * 20}px`,
              }}
            />
          ))}
        </div>

        {/* Animated glowing whale silhouette */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-48 opacity-10"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            repeatType: 'reverse',
            ease: 'easeInOut' 
          }}
        >
          <div className="relative w-full h-full">
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-24">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-cyan-400 rounded-full filter blur-xl opacity-50" />
                <div className="absolute inset-0 opacity-80" style={{ 
                  clipPath: "path('M10,20 C15,10 25,15 30,5 C40,15 60,5 70,15 C80,5 85,15 90,10 C95,20 90,25 85,30 C80,25 70,30 60,25 C50,30 40,25 30,30 C25,25 15,30 10,20 Z')" 
                }} />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="relative w-96 h-96">
            <SacredGeometry 
              type="pentagon-star" 
              size={300}
              className="absolute inset-0 text-cyan-300 animate-spin-slow" 
            />
            <SacredGeometry 
              type="flower-of-life"
              size={250} 
              className="absolute inset-0 top-6 left-6 text-indigo-300 animate-pulse-slow" 
            />
          </div>
        </div>
      </div>
      
      {/* Main chat interface */}
      <motion.div
        className={`relative z-10 flex flex-col h-full bg-transparent ${
          isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black/95' : ''
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.5 }}
      >
        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-3 border-b border-cyan-500/30 bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div onClick={() => setHoverStar(!hoverStar)}>
                <SacredGeometry 
                  type="pentagon-star" 
                  size={24}
                  lineWidth={2}
                  className={`cursor-pointer transition-colors duration-300 ${hoverStar ? "text-cyan-300" : "text-cyan-600"}`}
                />
              </div>
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
              <SacredGeometry type="vesica-piscis" className="text-cyan-300 mr-2" size={16} />
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