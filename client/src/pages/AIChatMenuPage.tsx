import React, { useState } from 'react';
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
} from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';
import OceanicPortal from '@/components/chat/OceanicPortal';

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
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
          <p className="text-muted-foreground max-w-xl">
            Connect with our cosmic AI assistant to explore music, find information, and get answers to your questions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Chat area */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Chat Interface</CardTitle>
                    <CardDescription>
                      Choose your preferred chat experience
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={chatMode === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChatMode('custom')}
                      className="flex-1 sm:flex-none"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Basic
                    </Button>
                    <Button
                      variant={chatMode === 'embed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChatMode('embed')}
                      className="flex-1 sm:flex-none"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Taskade
                    </Button>
                    <Button
                      variant={chatMode === 'portal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChatMode('portal')}
                      className="flex-1 sm:flex-none"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Oceanic
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[600px] p-0 overflow-hidden">
                <div className="w-full h-full">
                  {chatMode === 'custom' ? (
                    <div className="p-4 h-full">
                      <ChatInterface />
                    </div>
                  ) : chatMode === 'embed' ? (
                    <div className="h-full">
                      <TaskadeEmbed chatOnly={true} />
                    </div>
                  ) : (
                    <div className="h-full">
                      <OceanicPortal />
                    </div>
                  )}
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
    </div>
  );
};

export default AIChatMenuPage;