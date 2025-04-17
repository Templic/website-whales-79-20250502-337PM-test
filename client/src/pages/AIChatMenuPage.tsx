import React, { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Info,
  MessageSquare,
  LayoutDashboard,
  RefreshCcw,
  Layers,
  Star,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/components/chat/ChatInterface';
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';
import OceanicPortal from '@/components/chat/OceanicPortal';
import { CosmicHeading } from '@/components/features/cosmic/CosmicHeading';
import SacredGeometry from '@/components/cosmic/SacredGeometry';

const AIChatMenuPage: React.FC = () => {
  // Chat mode state (custom/embed/portal)
  const [chatMode, setChatMode] = useState<'custom' | 'embed' | 'portal'>('portal');
  
  // Get chat state and settings from context
  const {
    isWidgetVisible,
    showWidget,
    hideWidget,
    widgetPosition,
    setWidgetPosition,
    autoOpenOnNewPage,
    setAutoOpenOnNewPage,
    highContrastChat,
    setHighContrastChat,
    chatFontSize,
    setChatFontSize,
    clearChat,
  } = useChat();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12 relative">
          {/* Sacred geometry background decorations */}
          <div className="absolute top-0 -left-40 opacity-20 hidden lg:block">
            <SacredGeometry type="flower-of-life" size={180} color="#6366f1" animate />
          </div>
          <div className="absolute top-20 -right-40 opacity-20 hidden lg:block">
            <SacredGeometry type="metatron-cube" size={160} color="#8b5cf6" animate />
          </div>
          
          {/* Cosmic animated avatar */}
          <motion.div 
            className="relative inline-block mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 opacity-40 blur-xl" />
            <div className="relative p-4 rounded-full bg-gradient-to-br from-indigo-500/80 via-purple-500/80 to-blue-500/80 backdrop-blur-sm border border-white/20">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -right-1 -bottom-1 p-1.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
          </motion.div>
          
          {/* Cosmic title */}
          <CosmicHeading level={1} align="center" glow withAccent className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-400 to-indigo-500">
            Cosmic AI Assistant
          </CosmicHeading>
          
          <motion.p 
            className="text-muted-foreground max-w-xl text-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Connect with our cosmic AI assistant to explore music, discover cosmic connections, 
            and get insights into the universal rhythm of sound.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Chat area */}
          <div className="md:col-span-2">
            <Card className="h-full overflow-hidden border-purple-400/20 bg-black/40 backdrop-blur-md shadow-lg">
              <CardHeader className="pb-0 bg-gradient-to-r from-indigo-900/50 via-purple-800/50 to-blue-900/50 border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CosmicHeading level={3} glow className="tracking-wide">
                      Cosmic Portal
                    </CosmicHeading>
                    <CardDescription>
                      Choose your connection to the cosmic AI
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatMode('custom')}
                      className={`flex-1 sm:flex-none ${chatMode === 'custom' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40' : 'hover:bg-indigo-500/10 hover:text-indigo-200'}`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Basic
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatMode('embed')}
                      className={`flex-1 sm:flex-none ${chatMode === 'embed' ? 'bg-violet-500/20 text-violet-200 border border-violet-500/40' : 'hover:bg-violet-500/10 hover:text-violet-200'}`}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Taskade
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChatMode('portal')}
                      className={`flex-1 sm:flex-none ${chatMode === 'portal' ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40' : 'hover:bg-blue-500/10 hover:text-blue-200'}`}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Oceanic
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative h-[600px] p-0 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -bottom-24 -left-24 opacity-10 z-0 rotate-12">
                  <SacredGeometry type="pentagon-star" size={200} color="#a78bfa" animate />
                </div>
                <div className="absolute -top-20 -right-20 opacity-10 z-0 -rotate-12">
                  <SacredGeometry type="hexagon" size={180} color="#93c5fd" animate />
                </div>
                
                <div className="w-full h-full relative z-10">
                  {chatMode === 'custom' ? (
                    <div className="p-4 h-full bg-gradient-to-b from-indigo-950/30 to-purple-950/10">
                      <ChatInterface />
                    </div>
                  ) : chatMode === 'embed' ? (
                    <div className="h-full bg-gradient-to-b from-violet-950/30 to-indigo-950/10">
                      <TaskadeEmbed chatOnly={true} />
                    </div>
                  ) : (
                    <div className="h-full">
                      <OceanicPortal />
                    </div>
                  )}
                </div>
                
                {/* Star field */}
                <div className="absolute inset-0 pointer-events-none z-5">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={`star-${i}`}
                      className="absolute w-1 h-1 rounded-full bg-white"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5 + 0.2
                      }}
                      animate={{
                        opacity: [0.2, 0.8, 0.2],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2 + Math.random() * 3,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Settings area */}
          <div>
            <Tabs defaultValue="settings">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="settings" className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="about" className="flex-1">
                  <Info className="h-4 w-4 mr-2" />
                  About
                </TabsTrigger>
              </TabsList>
              
              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card className="overflow-hidden border-purple-400/20 bg-black/40 backdrop-blur-md">
                  <CardHeader className="relative bg-gradient-to-r from-indigo-900/50 via-purple-800/50 to-blue-900/50 border-b border-white/10">
                    <div className="absolute -top-8 -right-8 opacity-20">
                      <SacredGeometry type="vesica-piscis" size={100} color="#a78bfa" animate />
                    </div>
                    <CosmicHeading level={3} glow className="tracking-wide">
                      Cosmic Configuration
                    </CosmicHeading>
                    <CardDescription>
                      Customize your cosmic AI connection
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 pt-6 relative">
                    <div className="absolute -bottom-20 -left-20 opacity-10 -rotate-12 z-0">
                      <SacredGeometry type="hexagon" size={160} color="#818cf8" animate />
                    </div>
                    
                    {/* Widget Visibility */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10 relative z-10"
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor="widget-visibility" className="font-medium text-indigo-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-indigo-500/20">
                              <MessageSquare className="h-4 w-4 text-indigo-300" />
                            </div>
                            Cosmic Widget Visibility
                          </div>
                        </Label>
                        <Switch 
                          id="widget-visibility" 
                          checked={isWidgetVisible}
                          onCheckedChange={(checked) => checked ? showWidget() : hideWidget()}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                      <p className="text-sm text-indigo-200/70 mt-2 ml-9">
                        Show or hide the cosmic portal button throughout your journey
                      </p>
                    </motion.div>
                    
                    {/* Widget Position */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-violet-500/5 p-4 rounded-lg border border-violet-500/10 relative z-10"
                    >
                      <Label className="font-medium text-violet-100 flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-full bg-violet-500/20">
                          <Layers className="h-4 w-4 text-violet-300" />
                        </div>
                        Cosmic Portal Position
                      </Label>
                      <RadioGroup 
                        value={widgetPosition} 
                        onValueChange={(value) => setWidgetPosition(value as any)}
                        className="grid grid-cols-2 gap-3 ml-9"
                      >
                        <div className="flex items-center space-x-2 bg-violet-500/10 p-2 rounded-md">
                          <RadioGroupItem value="bottom-right" id="bottom-right" className="text-violet-600" />
                          <Label htmlFor="bottom-right" className="text-violet-200">Bottom Right</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-violet-500/10 p-2 rounded-md">
                          <RadioGroupItem value="bottom-left" id="bottom-left" className="text-violet-600" />
                          <Label htmlFor="bottom-left" className="text-violet-200">Bottom Left</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-violet-500/10 p-2 rounded-md">
                          <RadioGroupItem value="top-right" id="top-right" className="text-violet-600" />
                          <Label htmlFor="top-right" className="text-violet-200">Top Right</Label>
                        </div>
                        <div className="flex items-center space-x-2 bg-violet-500/10 p-2 rounded-md">
                          <RadioGroupItem value="top-left" id="top-left" className="text-violet-600" />
                          <Label htmlFor="top-left" className="text-violet-200">Top Left</Label>
                        </div>
                      </RadioGroup>
                    </motion.div>
                    
                    {/* Auto Open */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10 relative z-10"
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-open" className="font-medium text-blue-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-blue-500/20">
                              <Sparkles className="h-4 w-4 text-blue-300" />
                            </div>
                            Auto-Open Cosmic Portal
                          </div>
                        </Label>
                        <Switch 
                          id="auto-open" 
                          checked={autoOpenOnNewPage}
                          onCheckedChange={setAutoOpenOnNewPage}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                      <p className="text-sm text-blue-200/70 mt-2 ml-9">
                        Automatically open the cosmic portal when you enter a new dimension
                      </p>
                    </motion.div>
                    
                    {/* Accessibility Settings */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="pt-2 relative z-10"
                    >
                      <h3 className="text-lg font-medium mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-cyan-500/20">
                          <HelpCircle className="h-4 w-4 text-cyan-300" />
                        </div>
                        Cosmic Accessibility
                      </h3>
                      
                      {/* High Contrast */}
                      <div className="bg-cyan-500/5 p-4 rounded-lg border border-cyan-500/10 mb-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="high-contrast" className="font-medium text-cyan-100">
                            High Contrast Experience
                          </Label>
                          <Switch 
                            id="high-contrast" 
                            checked={highContrastChat}
                            onCheckedChange={setHighContrastChat}
                            className="data-[state=checked]:bg-cyan-600"
                          />
                        </div>
                        <p className="text-sm text-cyan-200/70 mt-2">
                          Enhance cosmic readability with high contrast colors
                        </p>
                      </div>
                      
                      {/* Font Size */}
                      <div className="bg-cyan-500/5 p-4 rounded-lg border border-cyan-500/10">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="font-size" className="font-medium text-cyan-100">
                            Cosmic Text Scale: {chatFontSize}%
                          </Label>
                        </div>
                        <Slider
                          id="font-size"
                          min={75}
                          max={150}
                          step={5}
                          value={[chatFontSize]}
                          onValueChange={(values) => {
                            if (values.length > 0 && typeof values[0] === 'number') {
                              setChatFontSize(values[0]);
                            }
                          }}
                          className="mt-4"
                        />
                      </div>
                    </motion.div>
                    
                    {/* Clear Chat History */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="pt-2 relative z-10"
                    >
                      <Button 
                        variant="outline" 
                        onClick={clearChat}
                        className="w-full bg-gradient-to-r from-indigo-900/50 via-purple-800/50 to-blue-900/50 border-purple-500/30 hover:bg-gradient-to-r hover:from-indigo-800/50 hover:via-purple-700/50 hover:to-blue-800/50 text-indigo-100"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reset Cosmic Memory
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* About Tab */}
              <TabsContent value="about">
                <Card className="overflow-hidden border-purple-400/20 bg-black/40 backdrop-blur-md">
                  <CardHeader className="relative bg-gradient-to-r from-indigo-900/50 via-purple-800/50 to-blue-900/50 border-b border-white/10">
                    <div className="absolute -top-12 -right-12 opacity-20">
                      <SacredGeometry type="flower-of-life" size={120} color="#a78bfa" animate />
                    </div>
                    <CosmicHeading level={3} glow className="tracking-wide">
                      Cosmic AI Guide
                    </CosmicHeading>
                    <CardDescription>
                      Explore the cosmic capabilities of your AI companion
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 relative pt-6">
                    <div className="absolute -bottom-32 -left-32 opacity-5 rotate-45">
                      <SacredGeometry type="golden-spiral" size={240} color="#8b5cf6" animate />
                    </div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10"
                    >
                      <p className="text-indigo-100">
                        Our Cosmic AI Assistant transcends ordinary help tools, providing a gateway to both practical information
                        and deeper cosmic connections throughout your musical journey.
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <h3 className="text-lg font-medium mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Cosmic Capabilities
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3 rounded-lg border border-indigo-500/10 flex items-start gap-3">
                          <div className="mt-1 p-1.5 rounded-full bg-indigo-500/20">
                            <Star className="h-4 w-4 text-indigo-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-indigo-200">Musical Exploration</h4>
                            <p className="text-xs text-indigo-200/70">Answer questions about our cosmic music collections and sonic journeys</p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3 rounded-lg border border-indigo-500/10 flex items-start gap-3">
                          <div className="mt-1 p-1.5 rounded-full bg-purple-500/20">
                            <MessageSquare className="h-4 w-4 text-purple-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-purple-200">Event Guidance</h4>
                            <p className="text-xs text-purple-200/70">Provide details about cosmic gatherings and celestial performances</p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3 rounded-lg border border-indigo-500/10 flex items-start gap-3">
                          <div className="mt-1 p-1.5 rounded-full bg-blue-500/20">
                            <HelpCircle className="h-4 w-4 text-blue-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-200">Cosmic Navigation</h4>
                            <p className="text-xs text-blue-200/70">Help navigate the site and find your path through the stars</p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-3 rounded-lg border border-indigo-500/10 flex items-start gap-3">
                          <div className="mt-1 p-1.5 rounded-full bg-cyan-500/20">
                            <Sparkles className="h-4 w-4 text-cyan-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-cyan-200">Sonic Recommendations</h4>
                            <p className="text-xs text-cyan-200/70">Offer personalized musical journeys based on your cosmic vibrations</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="pt-2"
                    >
                      <h3 className="text-lg font-medium mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Privacy Assurance</h3>
                      <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/10">
                        <p className="text-sm text-purple-100/90">
                          Your cosmic conversations are stored locally in your browser to maintain continuity in your journey.
                          This ethereal data remains private and is not shared with any third-party entities across the universe.
                          You can clear your astral chat history at any time using the settings tab.
                        </p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatMenuPage;