import React, { useState } from 'react';
import { useAgents, Agent } from '@/contexts/AgentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageSquare, Check, MessagesSquare, Bot, Users, Brain, HelpCircle } from 'lucide-react';
import { Link } from 'wouter';
import AIChatInterface from '@/components/ai/AIChatInterface';
import { SectionHeading } from '@/components/ui/section-heading';
import { PageTransition } from '@/components/ui/page-transition';
import { useToast } from '@/hooks/use-toast';

export function AIChatPage() {
  const { agents, activeAgent, activateAgent, deactivateAgent } = useAgents();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Agent categories
  const categories = [
    { id: 'all', name: 'All Agents', icon: <Users className="h-4 w-4" /> },
    { id: 'general', name: 'General', icon: <Bot className="h-4 w-4" /> },
    { id: 'shopping', name: 'Shopping', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'music', name: 'Music', icon: <MessagesSquare className="h-4 w-4" /> },
    { id: 'education', name: 'Education', icon: <Brain className="h-4 w-4" /> }
  ];
  
  // Filter agents by category
  const filteredAgents = selectedCategory === 'all' 
    ? agents 
    : agents.filter(agent => agent.category === selectedCategory);
  
  // Select an agent
  const handleSelectAgent = (agent: Agent) => {
    activateAgent(agent.id);
    toast({
      title: `${agent.name} activated`,
      description: `You are now chatting with ${agent.name}`,
    });
  };
  
  return (
    <PageTransition>
      <div className="container max-w-6xl py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-white/60 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          
          <SectionHeading
            title="Cosmic AI Assistants"
            description="Chat with our specialized AI guides to enhance your cosmic journey."
            align="left"
            titleClassName="text-4xl"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  AI Agents
                </CardTitle>
                <CardDescription>
                  Select an AI guide to assist your journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid grid-cols-5 mb-4">
                    {categories.map(category => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id} 
                        className="flex items-center gap-1"
                      >
                        {category.icon}
                        <span className="hidden sm:inline-block">{category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <div className="space-y-2">
                    {filteredAgents.map(agent => (
                      <div 
                        key={agent.id}
                        className={`p-3 rounded flex items-center gap-3 transition-colors cursor-pointer
                          ${activeAgent?.id === agent.id 
                            ? 'bg-purple-600/30 border border-purple-500'
                            : 'hover:bg-white/5 border border-white/10'
                          }`}
                        onClick={() => handleSelectAgent(agent)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback className="bg-purple-900 text-white">
                            {agent.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{agent.name}</h3>
                            {activeAgent?.id === agent.id && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-sm text-white/60 truncate">{agent.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Agent Information */}
            {activeAgent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-purple-400" />
                    About {activeAgent.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Capabilities</h4>
                      <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                        {activeAgent.capabilities.map((capability, index) => (
                          <li key={index}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Personality</h4>
                      <div className="text-sm text-white/70 space-y-2">
                        <div>
                          <span className="text-white/90">Tone:</span> {activeAgent.personality.tone}
                        </div>
                        <div>
                          <span className="text-white/90">Style:</span> {activeAgent.personality.style}
                        </div>
                        <div>
                          <span className="text-white/90">Traits:</span> {activeAgent.personality.traits.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Chat Interface */}
          <div className="lg:col-span-2 flex flex-col h-[80vh] lg:h-auto">
            {activeAgent ? (
              <div className="flex-1 h-full">
                <AIChatInterface />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full border border-dashed border-white/20 rounded-lg p-8 text-center">
                <div className="max-w-md space-y-4">
                  <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-medium">Select an AI Guide</h3>
                  <p className="text-white/60">
                    Choose one of our cosmic AI guides from the left panel to begin a conversation. Each guide has unique knowledge and capabilities.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default AIChatPage;