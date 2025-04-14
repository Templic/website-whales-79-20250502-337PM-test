import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAgents, Agent } from '@/contexts/AgentContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import AIChatInterface from '@/components/ai/AIChatInterface';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  MessageSquare, 
  Book, 
  ShoppingCart, 
  Music, 
  Settings, 
  Info, 
  Star, 
  HelpCircle,
  Sparkles,
  Brain,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AIChatPage() {
  const { agents, activeAgent, activateAgent, deactivateAgent } = useAgents();
  const { reducedMotion } = useAccessibility();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Filter agents by category
  const filteredAgents = selectedCategory === 'all' 
    ? agents 
    : agents.filter(agent => agent.category === selectedCategory);
  
  // Handle agent activation
  const handleSelectAgent = (agent: Agent) => {
    activateAgent(agent.id);
    toast({
      title: `${agent.name} activated`,
      description: `You are now chatting with ${agent.name}`,
    });
  };
  
  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Agents', icon: <Bot className="h-4 w-4" /> },
    { id: 'general', name: 'General Help', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'shopping', name: 'Shopping', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'music', name: 'Music', icon: <Music className="h-4 w-4" /> },
    { id: 'education', name: 'Learning', icon: <Book className="h-4 w-4" /> },
  ];
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold mb-4">AI Cosmic Assistants</h1>
            <p className="text-white/70 max-w-2xl mx-auto">
              Connect with our specialized AI guides to enhance your cosmic journey. Each assistant has unique knowledge and abilities to help you explore different aspects of the platform.
            </p>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Agent Selection */}
            <div className="lg:col-span-5">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Assistants
                  </CardTitle>
                  <CardDescription>
                    Select an assistant to begin a conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Categories */}
                  <div className="px-4">
                    <TabsList className="w-full mb-4">
                      {categories.map(category => (
                        <TabsTrigger 
                          key={category.id} 
                          value={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={selectedCategory === category.id ? 'bg-white/10' : ''}
                        >
                          <div className="flex items-center gap-1.5">
                            {category.icon}
                            <span>{category.name}</span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  
                  {/* Agent List */}
                  <div className="space-y-1 max-h-[500px] overflow-y-auto p-4">
                    {filteredAgents.map(agent => (
                      <Button
                        key={agent.id}
                        variant="ghost"
                        onClick={() => handleSelectAgent(agent)}
                        className={`w-full justify-start p-3 ${
                          activeAgent?.id === agent.id 
                            ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-400/20' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={agent.avatar} alt={agent.name} />
                            <AvatarFallback className="bg-purple-900 text-white">
                              {agent.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{agent.name}</span>
                              {activeAgent?.id === agent.id && (
                                <span className="bg-green-600/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full">Active</span>
                              )}
                            </div>
                            <p className="text-xs text-white/60 line-clamp-1">
                              {agent.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                    
                    {filteredAgents.length === 0 && (
                      <div className="text-center py-8 text-white/50">
                        <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>No assistants found in this category</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-white/10 pt-4 flex justify-between">
                  <div className="text-xs text-white/60 flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1" />
                    More assistants coming soon
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Preferences
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Chat Interface */}
            <div className="lg:col-span-7">
              {activeAgent ? (
                <AIChatInterface />
              ) : (
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Begin Your Cosmic Conversation
                    </CardTitle>
                    <CardDescription>
                      Select an assistant from the left to start chatting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-96 text-center px-8">
                    <Brain className="h-16 w-16 text-white/20 mb-6" />
                    <h3 className="text-xl font-medium mb-2">Choose Your Guide</h3>
                    <p className="text-white/60 max-w-md mb-6">
                      Our AI assistants are specialized to help with different aspects of your cosmic journey. Select one to begin a conversation.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md">
                      {categories.slice(1).map(category => (
                        <Button
                          key={category.id}
                          variant="outline"
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex flex-col h-24 gap-2"
                        >
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                            {category.icon}
                          </div>
                          <span className="text-xs">{category.name}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          {/* Info Section */}
          <div className="mt-12">
            <Separator className="mb-8 bg-white/10" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    AI Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Cosmic Knowledge</h4>
                      <p className="text-xs text-white/70">
                        Specialized information about cosmic frequencies, consciousness, and healing sounds.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Voice Interaction</h4>
                      <p className="text-xs text-white/70">
                        Enable voice feedback for hands-free interaction with your assistant.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Star className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Personalized Guidance</h4>
                      <p className="text-xs text-white/70">
                        Get recommendations tailored to your needs and preferences.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5" />
                    Privacy First
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/70 space-y-3">
                  <p>
                    Your conversations are not stored permanently and are only used to provide assistance during your current session.
                  </p>
                  <p>
                    We prioritize data minimization and transparency in all our AI interactions.
                  </p>
                  <Button variant="link" className="text-purple-400 p-0 h-auto text-xs">
                    Read our AI Ethics Statement
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="h-5 w-5" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-white/70">
                    If you need assistance with the AI features or have suggestions for improvements, we're here to help.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full text-xs">
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full text-xs">
                      FAQs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}