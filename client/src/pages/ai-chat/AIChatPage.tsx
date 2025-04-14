import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Info, Bot, Star, Filter, Settings } from 'lucide-react';
import { useAgents, Agent } from '@/contexts/AgentContext';
import { AIChatInterface } from '@/components/ai/AIChatInterface';
import { cn } from '@/lib/utils';

export function AIChatPage() {
  const { agents, activateAgent, activeAgent, deactivateAgent } = useAgents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get unique categories
  const categories = ['all', ...new Set(agents.map(agent => agent.category))];
  
  // Filter agents based on search and category
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = searchTerm === '' || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group agents by category for the "All" tab
  const agentsByCategory = filteredAgents.reduce<Record<string, Agent[]>>((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = [];
    }
    acc[agent.category].push(agent);
    return acc;
  }, {});
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <div className="lg:col-span-4">
          <Card className="h-full cosmic-glass-card">
            <CardHeader>
              <CardTitle className="text-2xl cosmic-gradient-text flex items-center gap-2">
                <Bot className="h-6 w-6" />
                AI Assistants
              </CardTitle>
              <CardDescription>
                Select an AI assistant to help with your cosmic journey
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-white/5 border-white/10"
                />
              </div>
            </CardHeader>
            <div className="px-6 pb-2">
              <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="w-full grid" style={{ 
                  gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)` 
                }}>
                  {categories.map(category => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="capitalize"
                    >
                      {category === 'all' ? 'All' : category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)] px-6 pb-6">
                {selectedCategory === 'all' ? (
                  Object.entries(agentsByCategory).map(([category, agents]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-medium text-white/70 mb-3 capitalize">{category}</h3>
                      <div className="space-y-3">
                        {agents.map(agent => (
                          <AgentCard 
                            key={agent.id}
                            agent={agent}
                            isActive={activeAgent?.id === agent.id}
                            onSelect={() => activateAgent(agent.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mt-6 space-y-3">
                    {filteredAgents
                      .filter(agent => agent.category === selectedCategory)
                      .map(agent => (
                        <AgentCard 
                          key={agent.id}
                          agent={agent}
                          isActive={activeAgent?.id === agent.id}
                          onSelect={() => activateAgent(agent.id)}
                        />
                      ))
                    }
                  </div>
                )}
                
                {filteredAgents.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-white/60">No agents found for your search</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Area */}
        <div className="lg:col-span-8">
          {activeAgent ? (
            <div className="h-full">
              <AIChatInterface />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Card className="w-full max-w-md cosmic-glass-card text-center p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-900/50 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-indigo-400" />
                  </div>
                  <CardTitle>Select an Agent</CardTitle>
                  <CardDescription>
                    Choose an AI assistant from the list to begin a conversation
                  </CardDescription>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  onSelect: () => void;
}

function AgentCard({ agent, isActive, onSelect }: AgentCardProps) {
  return (
    <div 
      className={cn(
        "rounded-lg p-3 transition-all cursor-pointer",
        isActive 
          ? "bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/50" 
          : "bg-white/5 hover:bg-white/10 border border-white/10"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 cosmic-avatar mt-0.5">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback className="bg-cosmic-primary text-white">
            {agent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{agent.name}</h3>
            <Badge variant="outline" className="capitalize">
              {agent.category}
            </Badge>
          </div>
          <p className="text-sm text-white/70 mt-1">{agent.description}</p>
          <div className="mt-2">
            <Button 
              variant={isActive ? "secondary" : "outline"}
              size="sm" 
              className={cn(
                "w-full gap-2",
                isActive && "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {isActive ? "Continue Chat" : "Start Chat"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPage;