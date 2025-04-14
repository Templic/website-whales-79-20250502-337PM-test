import React, { useState } from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, X, MessageCircle, Star, User, Sparkles } from 'lucide-react';
import { useAgents, Agent } from '@/contexts/AgentContext';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface AIAgentMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAgentMenu({ isOpen, onClose }: AIAgentMenuProps) {
  const { agents, activateAgent, getAgentsForPage } = useAgents();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const availableAgents = getAgentsForPage(location);
  
  // Filter agents based on search and category
  const filteredAgents = availableAgents.filter(agent => {
    const matchesSearch = searchTerm === '' || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories
  const categories = ['all', ...new Set(availableAgents.map(agent => agent.category))];

  const handleSelectAgent = (agent: Agent) => {
    activateAgent(agent.id);
    onClose();
  };

  // Group agents by category for the "All" tab
  const agentsByCategory = filteredAgents.reduce<Record<string, Agent[]>>((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = [];
    }
    acc[agent.category].push(agent);
    return acc;
  }, {});

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="cosmic-glass-panel max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="text-xl cosmic-gradient-text">AI Agents</DrawerTitle>
          <DrawerDescription>
            Select an AI assistant to help with your cosmic journey
          </DrawerDescription>
          
          <div className="relative mt-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-white/5 border-white/10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DrawerHeader>
        
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="mx-6 mb-2 grid w-auto max-w-[400px]" style={{ 
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
          
          <ScrollArea className="h-[50vh] px-6">
            <TabsContent value="all" className="mt-0">
              {Object.entries(agentsByCategory).length > 0 ? (
                Object.entries(agentsByCategory).map(([category, agents]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-medium text-white/70 mb-3 capitalize">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {agents.map(agent => (
                        <AgentCard 
                          key={agent.id}
                          agent={agent}
                          onSelect={() => handleSelectAgent(agent)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-white/60">No agents found for your search</p>
                </div>
              )}
            </TabsContent>
            
            {categories.filter(c => c !== 'all').map(category => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAgents
                    .filter(agent => agent.category === category)
                    .map(agent => (
                      <AgentCard 
                        key={agent.id}
                        agent={agent}
                        onSelect={() => handleSelectAgent(agent)}
                      />
                    ))
                  }
                </div>
                {filteredAgents.filter(agent => agent.category === category).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-white/60">No agents found for your search</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
        
        <DrawerFooter className="flex flex-row justify-end space-x-2">
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface AgentCardProps {
  agent: Agent;
  onSelect: () => void;
}

function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (
    <Card className="cosmic-card overflow-hidden transition-all hover:scale-[1.01] cursor-pointer border-white/10 backdrop-blur-sm" onClick={onSelect}>
      <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
        <Avatar className="h-10 w-10 cosmic-avatar">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback className="bg-cosmic-primary text-white">
            {agent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-white">{agent.name}</h3>
          <Badge variant="outline" className="capitalize mt-1">
            {agent.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-white/70">{agent.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="secondary" className="w-full cosmic-button gap-2">
          <MessageCircle className="h-4 w-4" />
          Chat with Agent
        </Button>
      </CardFooter>
    </Card>
  );
}