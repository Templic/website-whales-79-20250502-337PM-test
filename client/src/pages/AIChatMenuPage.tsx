import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import ChatInterface from '@/components/chat/ChatInterface';
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageSquare, Settings, Info, RefreshCcw, Code } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const AIChatMenuPage: React.FC = () => {
  // Get chat context for settings
  const {
    widgetPosition,
    setWidgetPosition,
    isWidgetVisible,
    showWidget,
    hideWidget,
    autoOpenOnNewPage,
    setAutoOpenOnNewPage,
    highContrastChat,
    setHighContrastChat,
    chatFontSize,
    setChatFontSize,
    clearChat
  } = useChat();
  
  // Get accessibility context to coordinate settings
  const { reducedMotion } = useAccessibility();

  // State to toggle between custom implementation and direct embed
  const [chatMode, setChatMode] = useState<'custom' | 'embed'>('custom');
  
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Taskade AI Assistant
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Get instant help and information about our music, events, and more through our Taskade AI assistant.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main chat area */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Chat with Taskade AI</CardTitle>
                  <CardDescription>
                    Ask anything about our music, events, products, or services
                  </CardDescription>
                </div>
                
                {/* Toggle between chat implementations */}
                <div className="flex items-center space-x-2 bg-black/30 p-2 rounded-md border border-[#00ebd6]/20">
                  <Button 
                    variant={chatMode === 'custom' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChatMode('custom')}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Custom UI</span>
                  </Button>
                  <Button 
                    variant={chatMode === 'embed' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setChatMode('embed')}
                    className="flex items-center gap-1"
                  >
                    <Code className="h-4 w-4" />
                    <span>Embedded</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[600px]">
              {chatMode === 'custom' ? (
                <ChatInterface />
              ) : (
                <TaskadeEmbed chatOnly={true} />
              )}
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
              <Card>
                <CardHeader>
                  <CardTitle>Chat Settings</CardTitle>
                  <CardDescription>
                    Customize how the AI assistant works for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Widget Visibility */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="widget-visibility" className="font-medium">
                        Show Chat Widget
                      </Label>
                      <Switch 
                        id="widget-visibility" 
                        checked={isWidgetVisible}
                        onCheckedChange={(checked) => checked ? showWidget() : hideWidget()}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Show or hide the floating chat button on all pages
                    </p>
                  </div>
                  
                  {/* Widget Position */}
                  <div className="space-y-2">
                    <Label className="font-medium">Widget Position</Label>
                    <RadioGroup 
                      value={widgetPosition} 
                      onValueChange={(value) => setWidgetPosition(value as any)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bottom-right" id="bottom-right" />
                        <Label htmlFor="bottom-right">Bottom Right</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bottom-left" id="bottom-left" />
                        <Label htmlFor="bottom-left">Bottom Left</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="top-right" id="top-right" />
                        <Label htmlFor="top-right">Top Right</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="top-left" id="top-left" />
                        <Label htmlFor="top-left">Top Left</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Auto Open */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-open" className="font-medium">
                        Auto-Open on Page Load
                      </Label>
                      <Switch 
                        id="auto-open" 
                        checked={autoOpenOnNewPage}
                        onCheckedChange={setAutoOpenOnNewPage}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatically open the chat when you visit a new page
                    </p>
                  </div>
                  
                  {/* Accessibility Settings */}
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium">Accessibility Options</h3>
                    
                    {/* High Contrast */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="high-contrast" className="font-medium">
                          High Contrast Chat
                        </Label>
                        <Switch 
                          id="high-contrast" 
                          checked={highContrastChat}
                          onCheckedChange={setHighContrastChat}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use high contrast colors for better readability
                      </p>
                    </div>
                    
                    {/* Font Size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="font-size" className="font-medium">
                          Chat Font Size: {chatFontSize}%
                        </Label>
                      </div>
                      <Slider
                        id="font-size"
                        min={75}
                        max={150}
                        step={5}
                        value={[chatFontSize]}
                        onValueChange={(values) => setChatFontSize(values[0])}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  {/* Clear Chat History */}
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={clearChat}
                      className="w-full"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Clear Chat History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* About Tab */}
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About Taskade AI</CardTitle>
                  <CardDescription>
                    Learn how our AI assistant can help you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Our Taskade AI Assistant is designed to provide you with instant help and information
                    about our music, upcoming events, and anything else you'd like to know about the site.
                  </p>
                  
                  <h3 className="text-lg font-medium mt-4">What can it do?</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Answer questions about our music and albums</li>
                    <li>Provide details about upcoming tour dates and events</li>
                    <li>Help navigate the site and find specific content</li>
                    <li>Offer suggestions for music based on your preferences</li>
                    <li>Assist with purchases and merchandise information</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium mt-4">Privacy Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Your conversations with the Taskade AI Assistant are stored locally in your browser
                    to provide continuity in your interactions. This data is not shared with third parties.
                    You can clear your chat history at any time using the settings tab.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AIChatMenuPage;