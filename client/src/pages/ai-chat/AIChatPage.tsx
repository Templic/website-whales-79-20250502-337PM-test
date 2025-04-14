import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAgents } from '@/contexts/AgentContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AIChatInterface from '@/components/ai/AIChatInterface';

export default function AIChatPage() {
  const { agents, activateAgent, activeAgent } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = React.useState<string | null>(null);

  // Handle agent selection
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    activateAgent(agentId);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Assistants</h1>
            <p className="text-lg text-white/70 mb-6">
              Connect with specialized AI guides for help with different aspects of your cosmic journey
            </p>
          </div>

          {/* Show current active chat if any */}
          {activeAgent && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Current Conversation</h2>
              <AIChatInterface />
            </div>
          )}

          {/* Grid of available agents */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card 
                key={agent.id}
                className={`border border-white/10 backdrop-blur overflow-hidden hover:border-white/20 transition-all ${
                  agent.id === selectedAgentId ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-background' : ''
                } ${agent.status !== 'available' ? 'opacity-60' : ''}`}
              >
                <CardHeader className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/10">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="bg-purple-900 text-white">
                        {agent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{agent.name}</CardTitle>
                      <CardDescription className="text-white/60">
                        {agent.category}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-white/70 mb-4">
                    {agent.description}
                  </p>
                  <h3 className="text-sm font-medium mb-2">Specialties:</h3>
                  <ul className="space-y-1 text-sm text-white/60 mb-4">
                    {agent.capabilities.map((capability, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-purple-400 mr-2">•</span>
                        <span>{capability}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="border-t border-white/10 bg-black/20">
                  <Button 
                    onClick={() => handleSelectAgent(agent.id)}
                    disabled={agent.status !== 'available'}
                    variant="default"
                    className="w-full"
                  >
                    {agent.status === 'available' ? (
                      'Chat Now'
                    ) : agent.status === 'busy' ? (
                      'Currently Busy'
                    ) : (
                      'Offline'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* How AI works section */}
          <div className="mt-16 bg-black/20 rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">How Our AI Assistants Work</h2>
            <p className="text-white/70 mb-6">
              Our AI assistants are designed to help you navigate your cosmic journey, each specializing in different aspects of the experience.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-md border border-white/10 bg-black/20">
                <h3 className="font-medium mb-2">Privacy First</h3>
                <p className="text-sm text-white/60">
                  We prioritize your privacy. Conversations with our AI assistants are not stored permanently and are only used to provide you with the best possible assistance.
                </p>
              </div>
              
              <div className="p-4 rounded-md border border-white/10 bg-black/20">
                <h3 className="font-medium mb-2">Accessibility</h3>
                <p className="text-sm text-white/60">
                  Our AI assistants support text-to-speech and are designed to be accessible to everyone. You can enable these features in your accessibility settings.
                </p>
              </div>
              
              <div className="p-4 rounded-md border border-white/10 bg-black/20">
                <h3 className="font-medium mb-2">Specialized Knowledge</h3>
                <p className="text-sm text-white/60">
                  Each assistant has been trained on specific areas of expertise to provide you with the most relevant and helpful information.
                </p>
              </div>
              
              <div className="p-4 rounded-md border border-white/10 bg-black/20">
                <h3 className="font-medium mb-2">Continuous Improvement</h3>
                <p className="text-sm text-white/60">
                  Our AI assistants learn from interactions to provide better assistance. Your feedback helps us improve the experience for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}